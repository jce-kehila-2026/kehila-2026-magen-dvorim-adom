import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
  arrayRemove,
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
    } else if (["open", "assigned"].includes(caseData.status)) {
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
  user_name = "",
  assigned_by,
  required_equipment = [],
  notes = null,
}) {
  // Look up any existing assignment(s) for this case. Previously this
  // threw "This case already has a volunteer assigned." whenever one
  // existed — which meant Reassign Volunteer could never succeed, since
  // an "assigned" case always already has exactly one assignment doc.
  // Now we treat this as "the assignment to replace" instead of a block.
  const existingForCase = await getDocs(
    query(collection(db, "assignments"), where("case_id", "==", case_id))
  );

  // Exclude this case from the "does the new volunteer already have an
  // active case" check — relevant if you're reassigning to the same
  // volunteer who's already on this case, or generally just correct
  // scoping for a reassignment.
  const activeAssignments = await getActiveUserAssignments(user_id, case_id);

  if (activeAssignments.length) {
    throw new Error("This user already has an active case.");
  }

  // Remove whatever assignment(s) previously existed for this case
  // before creating the new one — this is the step that was missing.
  for (const existingDoc of existingForCase.docs) {
    await deleteDoc(doc(db, "assignments", existingDoc.id));
  }

  const assignment = AssignmentSchema.parse({
    case_id,
    user_id,
    user_name,
    assigned_by,
    required_equipment,
    notes,
    assigned_at: new Date(),
  });

  const ref = await addDoc(collection(db, "assignments"), assignment);

  try {
    // Keep assigned_volunteer_ids on the case doc in sync — this is what
    // Firestore Security Rules check to let an assigned volunteer close
    // their own case (rules can't query the assignments collection, so
    // this denormalized array is the only way they can see who's assigned).
    // Set directly rather than arrayUnion: since only one volunteer is
    // ever assigned per case, a reassignment must drop the previous
    // volunteer's id, not just add the new one alongside it.
    await updateCaseStatus(case_id, "assigned", {
      assigned_volunteer_ids: [user_id],
    });
  } catch (error) {
    await deleteDoc(ref);
    throw error;
  }

  return ref.id;
}

// 🔹 Removes ONE volunteer from a case.
// If that was the only volunteer left, the case goes back to "open".
// 👉 Use this for the normal "Unassign Volunteer" button.
export async function removeAssignment(assignmentId, caseId) {
  const assignmentRef = doc(db, "assignments", assignmentId);
  const assignmentSnap = await getDoc(assignmentRef);
  const userId = assignmentSnap.exists() ? assignmentSnap.data().user_id : null;

  await deleteDoc(assignmentRef);

  const remainingQuery = query(
    collection(db, "assignments"),
    where("case_id", "==", caseId)
  );

  const remaining = await getDocs(remainingQuery);

  if (remaining.empty) {
    await updateCaseStatus(caseId, "open", {
      ...(userId ? { assigned_volunteer_ids: arrayRemove(userId) } : {}),
    });
  } else if (userId) {
    // Other volunteers are still assigned, so the case stays "assigned" —
    // just drop this one volunteer from the array.
    await updateDoc(doc(db, "cases", caseId), {
      assigned_volunteer_ids: arrayRemove(userId),
    });
  }
}

// 🔸 EMERGENCY RESET — removes ALL volunteers from a case (even if there's more than one)
// and forces the case back to "open" no matter what.
// 👉 Don't use this for normal unassigning — only to fix a broken/conflicted case.
export async function reopenCaseAndCleanConflicts(caseId) {
  const assignmentSnap = await getDocs(
    query(collection(db, "assignments"), where("case_id", "==", caseId))
  );

  const removed = [];

  if (!assignmentSnap.empty) {
    for (const docItem of assignmentSnap.docs) {
      const assignment = { id: docItem.id, ...docItem.data() };

      await deleteDoc(doc(db, "assignments", assignment.id));

      removed.push({
        user_id: assignment.user_id,
        assignmentId: assignment.id,
      });
    }
  }

  await updateCaseStatus(caseId, "open", {
    result_status: null,
    result_notes: null,
    closed_by: null,
    closed_at: null,
    feedback_token: null,
    feedback_submitted: false,
    assigned_volunteer_ids: [],
  });

  return removed;
}

// 🛠 ONE-TIME BACKFILL — populates assigned_volunteer_ids on every case
// that already has an assignment but predates this field's existence.
// Run this once (e.g. temporarily wire it to an admin-only button, or
// call it from the browser console while signed in as an admin) so
// volunteers already assigned before this fix can close their cases
// immediately, instead of only working for assignments made from now on.
export async function backfillAssignedVolunteerIds() {
  const [assignmentsSnap, casesSnap] = await Promise.all([
    getDocs(collection(db, "assignments")),
    getDocs(collection(db, "cases")),
  ]);

  const volunteersByCaseId = {};
  assignmentsSnap.docs.forEach((docItem) => {
    const data = docItem.data();
    if (!data?.case_id || !data?.user_id) return;
    if (!volunteersByCaseId[data.case_id]) {
      volunteersByCaseId[data.case_id] = [];
    }
    if (!volunteersByCaseId[data.case_id].includes(data.user_id)) {
      volunteersByCaseId[data.case_id].push(data.user_id);
    }
  });

  let updatedCount = 0;
  let skippedCount = 0;

  for (const caseDoc of casesSnap.docs) {
    const caseData = caseDoc.data();
    const correctIds = volunteersByCaseId[caseDoc.id] || [];
    const currentIds = caseData.assigned_volunteer_ids || [];

    const isAlreadyCorrect =
      correctIds.length === currentIds.length &&
      correctIds.every((id) => currentIds.includes(id));

    if (isAlreadyCorrect) {
      skippedCount++;
      continue;
    }

    await updateDoc(doc(db, "cases", caseDoc.id), {
      assigned_volunteer_ids: correctIds,
    });
    updatedCount++;
  }

  return { updatedCount, skippedCount };
}