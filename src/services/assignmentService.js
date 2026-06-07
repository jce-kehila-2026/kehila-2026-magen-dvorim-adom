import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { AssignmentSchema } from "./assignmentSchema";
import { updateCaseStatus } from "./caseService";

async function getCasesByIds(caseIds = []) {
  if (!caseIds.length) return {};

  const snap = await getDocs(collection(db, "cases"));
  const cases = {};

  snap.docs.forEach((docItem) => {
    if (caseIds.includes(docItem.id)) {
      cases[docItem.id] = docItem.data();
    }
  });

  return cases;
}

async function getActiveUserAssignments(user_id, excludeCaseId = null) {
  const snap = await getDocs(query(collection(db, "assignments"), where("user_id", "==", user_id)));

  if (snap.empty) return [];

  const assignments = [];
  const caseIds = [];

  snap.docs.forEach((docItem) => {
    const data = docItem.data();
    if (!data) return;
    if (data.case_id === excludeCaseId) return;

    assignments.push({ id: docItem.id, ...data });
    caseIds.push(data.case_id);
  });

  const cases = await getCasesByIds(caseIds);

  return assignments.filter((assignment) => {
    const caseData = cases[assignment.case_id];
    return caseData && (caseData.status === "open" || caseData.status === "assigned");
  });
}

export async function getVolunteerAssignmentStats(user_id) {
  if (!user_id) {
    throw new Error("User ID is required.");
  }

  const snap = await getDocs(query(collection(db, "assignments"), where("user_id", "==", user_id)));

  if (snap.empty) {
    return {
      assignedCases: 0,
      completedRescues: 0,
    };
  }

  const assignments = [];
  const caseIds = [];

  snap.docs.forEach((docItem) => {
    const data = docItem.data();
    if (!data || !data.case_id) return;

    assignments.push({ id: docItem.id, ...data });
    caseIds.push(data.case_id);
  });

  const cases = await getCasesByIds(caseIds);

  let assignedCases = 0;
  let completedRescues = 0;

  assignments.forEach((assignment) => {
    const caseData = cases[assignment.case_id];
    if (!caseData) return;

    if (caseData.status === "closed") {
      completedRescues += 1;
    } else if (["open", "assigned", "in_progress"].includes(caseData.status)) {
      assignedCases += 1;
    }
  });

  return {
    assignedCases,
    completedRescues,
  };
}

export async function getAssignableUsers() {
  const snap = await getDocs(collection(db, "users"));

  return snap.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

export async function getAssignmentsByCaseIds(caseIds = []) {
  if (!caseIds.length) return {};

  const snap = await getDocs(collection(db, "assignments"));
  const grouped = {};

  snap.docs.forEach((docItem) => {
    const data = docItem.data();
    if (!data || !caseIds.includes(data.case_id)) return;

    grouped[data.case_id] = grouped[data.case_id] || [];
    grouped[data.case_id].push({
      id: docItem.id,
      ...data,
    });
  });

  return grouped;
}

export async function assignUserToCase({
  case_id,
  user_id,
  assigned_by,
  required_equipment = [],
  notes = null,
}) {
  const activeAssignments = await getActiveUserAssignments(user_id);

  if (activeAssignments.length) {
    throw new Error("This user already has an active case.");
  }

  const assignment = AssignmentSchema.parse({
    case_id,
    user_id,
    assigned_by,
    required_equipment,
    notes,
    assigned_at: new Date(),
  });

  const ref = await addDoc(collection(db, "assignments"), assignment);

  try {
    await updateCaseStatus(case_id, "assigned");
  } catch (error) {
    await deleteDoc(ref);
    throw error;
  }

  return ref.id;
}

export async function removeAssignment(assignmentId, caseId) {
  await deleteDoc(doc(db, "assignments", assignmentId));

  const remainingQuery = query(
    collection(db, "assignments"),
    where("case_id", "==", caseId)
  );

  const remaining = await getDocs(remainingQuery);

  if (remaining.empty) {
    await updateCaseStatus(caseId, "open");
  }
}

export async function reopenCaseAndCleanConflicts(caseId) {
  const assignmentSnap = await getDocs(query(collection(db, "assignments"), where("case_id", "==", caseId)));
  const removed = [];

  if (!assignmentSnap.empty) {
    for (const docItem of assignmentSnap.docs) {
      const assignment = { id: docItem.id, ...docItem.data() };
      const activeAssignments = await getActiveUserAssignments(assignment.user_id, caseId);

      if (activeAssignments.length) {
        await deleteDoc(doc(db, "assignments", assignment.id));
        removed.push({ user_id: assignment.user_id, assignmentId: assignment.id });
      }
    }
  }

  await updateCaseStatus(caseId, "open", {});
  return removed;
}
