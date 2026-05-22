import {
  collection,
  query,
  where,
  getDocs,
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

// ✅ requester check
export async function getValidIntakeFormForRequester({
  requester_phone,
  coordinator_phone,
}) {
  requester_phone = normalizePhone(requester_phone);
  coordinator_phone = normalizePhone(coordinator_phone);

  const userQuery = query(
    collection(db, "users"),
    where("phone", "==", coordinator_phone),
    where("role", "==", "coordinator")
  );

  const userSnap = await getDocs(userQuery);
  if (userSnap.empty) return null;

  const coordinator_id = userSnap.docs[0].id;

  const intakeQuery = query(
    collection(db, "intakeForms"),
    where("requester_phone", "==", requester_phone),
    where("coordinator_id", "==", coordinator_id),
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
}) {
  requester_phone = normalizePhone(requester_phone);
  coordinator_phone = normalizePhone(coordinator_phone);

  const userQuery = query(
    collection(db, "users"),
    where("phone", "==", coordinator_phone),
    where("role", "==", "coordinator")
  );

  const userSnap = await getDocs(userQuery);
  if (userSnap.empty) {
    throw new Error("Coordinator not found.");
  }

  const coordinator_id = userSnap.docs[0].id;

  // ✅ prevent duplicates
  const dupQuery = query(
    collection(db, "intakeForms"),
    where("requester_phone", "==", requester_phone),
    where("coordinator_id", "==", coordinator_id),
    where("status", "==", "sent")
  );

  const dupSnap = await getDocs(dupQuery);
  if (!dupSnap.empty) {
    throw new Error("An active form already exists.");
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setDate(now.getDate() + 30);

  await addDoc(collection(db, "intakeForms"), {
    requester_phone,
    coordinator_id,
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
