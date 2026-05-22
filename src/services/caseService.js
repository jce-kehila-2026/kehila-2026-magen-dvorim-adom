import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  query,
  where,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { CaseSchema } from "./caseSchema";

function normalizePhone(phone) {
  return phone.replace(/\D/g, "");
}

// ✅ find coordinator ID from phone
async function getCoordinatorIdByPhone(phone) {
  const q = query(
    collection(db, "users"),
    where("phone", "==", phone),
    where("role", "==", "coordinator")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("Coordinator not found.");
  }

  return snap.docs[0].id;
}

// ✅ prevent duplicate open cases
async function hasOpenCase(requester_phone) {
  const snap = await getDocs(collection(db, "cases"));

  for (const docItem of snap.docs) {
  const data = docItem.data();

  // ✅ PROTECT AGAINST BAD DATA
  if (!data) continue;

  if (
    data.requester_phone === requester_phone &&
    (data.status === "open" || data.status === "in_progress")
  ) {
    return true;
  }
}


  return false;
}

export async function createCase(rawData) {
  // ✅ normalize phones
  const requester_phone = normalizePhone(rawData.requester_phone);
  const coordinator_phone = normalizePhone(rawData.coordinator_phone);

  // ✅ get coordinator ID
  const coordinator_id = await getCoordinatorIdByPhone(coordinator_phone);

  // ✅ prevent duplicate
  const open = await hasOpenCase(requester_phone);
  if (open) {
    throw new Error("You already have an active case.");
  }

  // ✅ prepare clean object for Zod
  const dataForValidation = {
    ...rawData,
    requester_phone,
    coordinator_id, // ✅ REQUIRED FIX
  };

  delete dataForValidation.coordinator_phone; // ✅ remove invalid field

  // ✅ validate
  const parsed = CaseSchema.safeParse(dataForValidation);

  if (!parsed.success) {
    console.error(parsed.error.format()); // 🔴 VERY IMPORTANT FOR DEBUG
    throw new Error("Invalid case data");
  }

  const data = parsed.data;

  // ✅ save
  const docRef = await addDoc(collection(db, "cases"), {
    ...data,
    status: "open",
    result: null,
    opened_at: Timestamp.now(),
    closed_at: null,
  });

  return docRef.id;
}


/**
 * Get all cases for a coordinator (by phone)
 */
export async function getCasesForCoordinator(coordinator_phone) {
  const normalized = coordinator_phone.replace(/\D/g, "");

  // find coordinator ID
  const q = query(
    collection(db, "users"),
    where("phone", "==", normalized),
    where("role", "==", "coordinator")
  );

  const userSnap = await getDocs(q);

  if (userSnap.empty) {
    throw new Error("Coordinator not found.");
  }

  const coordinator_id = userSnap.docs[0].id;

  // get all cases
  const casesSnap = await getDocs(collection(db, "cases"));

  const cases = [];

  casesSnap.forEach((docItem) => {
    const data = docItem.data();

    if (data.coordinator_id === coordinator_id) {
      cases.push({
        id: docItem.id,
        ...data,
      });
    }
  });

  return cases;
}

/**
 * Update case status
 */
const ALLOWED_STATUSES = ["open", "in_progress", "closed"];

export async function updateCaseStatus(caseId, newStatus) {
  // ✅ VALIDATE STATUS
  if (!ALLOWED_STATUSES.includes(newStatus)) {
    throw new Error("Invalid status");
  }

  const ref = doc(db, "cases", caseId);

  const updateData = {
    status: newStatus,
  };

  if (newStatus === "closed") {
    updateData.closed_at = Timestamp.now();
  }

  if (newStatus === "open") {
    updateData.closed_at = null;
  }

  await updateDoc(ref, updateData);
}