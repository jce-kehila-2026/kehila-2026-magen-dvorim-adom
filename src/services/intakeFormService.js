import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

function normalizePhone(phone) {
  return phone.replace(/\D/g, "");
}

// Israeli phone: 05X-XXXXXXX (10 digits starting with 05)
// International fallback: 7–15 digits
export function isValidPhone(phone) {
  const digits = normalizePhone(phone);
  const israeli = /^05\d{8}$/.test(digits);
  const international = digits.length >= 7 && digits.length <= 15;
  return israeli || international;
}

async function resolveCoordinator({ coordinator_id, coordinator_phone }) {
  if (coordinator_id) {
    const userRef = doc(db, "users", coordinator_id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    const userData = userSnap.data();
    if (userData?.role !== "coordinator" && userData?.role !== "admin") return null;

    return {
      coordinator_id,
      coordinator_phone: normalizePhone(userData.phone || coordinator_phone || ""),
    };
  }

  if (!coordinator_phone) return null;

  coordinator_phone = normalizePhone(coordinator_phone);

  const userQuery = query(
    collection(db, "users"),
    where("phone", "==", coordinator_phone),
    where("role", "in", ["coordinator", "admin"])
  );

  const userSnap = await getDocs(userQuery);
  if (userSnap.empty) return null;

  return {
    coordinator_id: userSnap.docs[0].id,
    coordinator_phone,
  };
}

async function markExpiredIfNeeded(formDoc) {
  const data = formDoc.data();
  if (data.status !== "sent") return data;

  const expires = data.expires_at?.toDate
    ? data.expires_at.toDate()
    : new Date(data.expires_at);

  if (expires < new Date()) {
    const ref = doc(db, "intakeForms", formDoc.id);
    await updateDoc(ref, { status: "expired" });
    return { ...data, status: "expired" };
  }

  return data;
}

// ─── One-time fetches (kept for backwards compat) ────────────────────────────

export async function getIntakeFormsByCoordinator(coordinator_id) {
  if (!coordinator_id) return [];

  const q = query(
    collection(db, "intakeForms"),
    where("coordinator_id", "==", coordinator_id)
  );

  const snap = await getDocs(q);
  return Promise.all(
    snap.docs.map(async (docItem) => {
      const updatedData = await markExpiredIfNeeded(docItem);
      return { id: docItem.id, ...updatedData };
    })
  );
}

export async function getAllIntakeForms() {
  const snap = await getDocs(collection(db, "intakeForms"));
  return Promise.all(
    snap.docs.map(async (docItem) => {
      const updatedData = await markExpiredIfNeeded(docItem);
      return { id: docItem.id, ...updatedData };
    })
  );
}

// ─── Realtime listeners ───────────────────────────────────────────────────────

/**
 * Subscribe to all intake forms (admin).
 * Returns an unsubscribe function.
 */


function computeStatus(docItem) {
  const data = docItem.data();
  // If already submitted or expired in DB, trust it
  if (data.status === "submitted" || data.status === "expired") {
    return { id: docItem.id, ...data };
  }
  // For "sent" forms, check expiry client-side without writing
  if (data.status === "sent") {
    const expires = data.expires_at?.toDate
      ? data.expires_at.toDate()
      : new Date(data.expires_at);
    if (expires < new Date()) {
      return { id: docItem.id, ...data, status: "expired" };
    }
  }
  return { id: docItem.id, ...data };
}

export function subscribeToAllIntakeForms(callback) {
  return onSnapshot(collection(db, "intakeForms"), (snap) => {
    callback(snap.docs.map(computeStatus));
  });
}

export function subscribeToCoordinatorIntakeForms(coordinator_id, callback) {
  if (!coordinator_id) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, "intakeForms"),
    where("coordinator_id", "==", coordinator_id)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(computeStatus));
  });
}

// ─── Validation + creation ────────────────────────────────────────────────────

export async function getValidIntakeFormForRequester({
  requester_phone,
  coordinator_phone,
  coordinator_id,
}) {
  requester_phone = normalizePhone(requester_phone);

  const coordinator = await resolveCoordinator({
    coordinator_id,
    coordinator_phone,
  });

  if (!coordinator) return null;

  const intakeQuery = query(
    collection(db, "intakeForms"),
    where("requester_phone", "==", requester_phone),
    where("coordinator_id", "==", coordinator.coordinator_id),
    where("status", "==", "sent")
  );

  const intakeSnap = await getDocs(intakeQuery);
  if (intakeSnap.empty) return null;

  const docData = intakeSnap.docs[0].data();
  if (docData.expires_at.toDate() < new Date()) return null;

  return { id: intakeSnap.docs[0].id, ...docData };
}

export async function createIntakeForm({
  requester_phone,
  coordinator_id,
}) {
  if (!isValidPhone(requester_phone)) {
    throw new Error("Invalid phone number.");
  }

  requester_phone = normalizePhone(requester_phone);

  // Resolve coordinator directly by ID (always pass coordinator_id from auth)
  const coordinator = await resolveCoordinator({ coordinator_id });
  if (!coordinator) {
    throw new Error("Coordinator not found. Make sure your account has coordinator or admin role.");
  }

  // Check for duplicate active form from this coordinator
  const dupQuery = query(
    collection(db, "intakeForms"),
    where("requester_phone", "==", requester_phone),
    where("coordinator_id", "==", coordinator.coordinator_id),
    where("status", "==", "sent")
  );
  const dupSnap = await getDocs(dupQuery);
  if (!dupSnap.empty) {
    throw new Error("An active form already exists for this phone number.");
  }

  // Check if ANY coordinator already has an active form for this phone
  const anyActiveQuery = query(
    collection(db, "intakeForms"),
    where("requester_phone", "==", requester_phone),
    where("status", "==", "sent")
  );
  const anyActiveSnap = await getDocs(anyActiveQuery);
  if (!anyActiveSnap.empty) {
    throw new Error(
      "This requester already has an active form sent by another coordinator."
    );
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setDate(now.getDate() + 30);

  await addDoc(collection(db, "intakeForms"), {
    requester_phone,
    coordinator_id: coordinator.coordinator_id,
    coordinator_phone: coordinator.coordinator_phone,
    status: "sent",
    case_id: null,
    sent_at: Timestamp.fromDate(now),
    expires_at: Timestamp.fromDate(expires),
    submitted_at: null,
  });
}

export async function markIntakeFormSubmitted(id, caseId) {
  const ref = doc(db, "intakeForms", id);
  await updateDoc(ref, {
    status: "submitted",
    case_id: caseId,
    submitted_at: Timestamp.now(),
  });
}