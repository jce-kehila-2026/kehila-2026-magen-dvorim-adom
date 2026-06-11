import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// ✅ normalize
function normalizePhone(phone) {
  return phone.replace(/\D/g, "");
}

async function resolveCoordinator({ coordinator_id, coordinator_phone }) {
  if (coordinator_id) {
    const userRef = doc(db, "users", coordinator_id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    const userData = userSnap.data();
    if (userData?.role !== "coordinator") {
      return null;
    }

    return {
      coordinator_id,
      coordinator_phone: normalizePhone(userData.phone || coordinator_phone || ""),
    };
  }

  if (!coordinator_phone) {
    return null;
  }

  coordinator_phone = normalizePhone(coordinator_phone);

  const userQuery = query(
    collection(db, "users"),
    where("phone", "==", coordinator_phone),
    where("role", "==", "coordinator")
  );

  const userSnap = await getDocs(userQuery);

  if (userSnap.empty) {
    return null;
  }

  return {
    coordinator_id: userSnap.docs[0].id,
    coordinator_phone,
  };
}


export async function getIntakeFormsByCoordinator(coordinator_id) {
  if (!coordinator_id) return [];

  const q = query(
    collection(db, "intakeForms"),
    where("coordinator_id", "==", coordinator_id)
  );

  const snap = await getDocs(q);

  return snap.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

// ✅ requester check
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

  if (!coordinator) {
    return null;
  }

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

  return {
    id: intakeSnap.docs[0].id,
    ...docData,
  };
}

// ✅ create intake form
export async function createIntakeForm({
  requester_phone,
  coordinator_phone,
  coordinator_id,
}) {
  requester_phone = normalizePhone(requester_phone);

  const coordinator = await resolveCoordinator({
    coordinator_id,
    coordinator_phone,
  });

  if (!coordinator) {
    throw new Error("Coordinator not found.");
  }

  const dupQuery = query(
    collection(db, "intakeForms"),
    where("requester_phone", "==", requester_phone),
    where("coordinator_id", "==", coordinator.coordinator_id),
    where("status", "==", "sent")
  );

  const dupSnap = await getDocs(dupQuery);
  if (!dupSnap.empty) {
    throw new Error("An active form already exists.");
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
      "This requester already has an active form sent by another coordinator. Please coordinate before sending a new one."
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

  // ✅ TODO: send SMS here later
}

// ✅ mark as used
export async function markIntakeFormSubmitted(id, caseId) {
  const ref = doc(db, "intakeForms", id);

  await updateDoc(ref, {
    status: "submitted",
    case_id: caseId,
    submitted_at: Timestamp.now(),
  });
}
