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
import { geocodeCaseLocation } from "./geocodingService";

function normalizePhone(phone) {
  return phone.replace(/\D/g, "");
}

// ✅ find coordinator ID from phone
export async function getCoordinatorIdByPhone(phone) {
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
  let coordinator_id = rawData.coordinator_id;
  if (!coordinator_id) {
    const coordinator_phone = normalizePhone(rawData.coordinator_phone || "");
    coordinator_id = await getCoordinatorIdByPhone(coordinator_phone);
  }
  // ✅ prevent duplicate
  const open = await hasOpenCase(requester_phone);
  if (open) {
    throw new Error("You already have an active case.");
  }

  // ✅ prepare clean object for Zod
const dataForValidation = {
  ...rawData,
  requester_phone,
  coordinator_id,
  image_urls: rawData.image_urls || [], 
};

  delete dataForValidation.coordinator_phone; // ✅ remove invalid field

  // ✅ validate
  const parsed = CaseSchema.safeParse(dataForValidation);

  if (!parsed.success) {
    console.error(parsed.error.format()); // 🔴 VERY IMPORTANT FOR DEBUG
    throw new Error("Invalid case data");
  }

  const data = parsed.data;

let geoLocation = null;

try {
  geoLocation = await geocodeCaseLocation(data);
} catch (err) {
  console.warn(
    "Geocoding failed, case will be saved without coordinates:",
    err
  );
}

// ✅ save
const docRef = await addDoc(collection(db, "cases"), {
  ...data,
  image_urls: data.image_urls || [], // ✅ ensure saved
  ...(geoLocation || {}),
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

  return getCasesForCoordinatorById(coordinator_id);
}

export async function getCasesForCoordinatorById(coordinatorId) {
  if (!coordinatorId) {
    throw new Error("Coordinator ID is required.");
  }

  const casesSnap = await getDocs(collection(db, "cases"));
  const cases = [];

  casesSnap.forEach((docItem) => {
    const data = docItem.data();
    if (data && data.coordinator_id === coordinatorId) {
      cases.push({ id: docItem.id, ...data });
    }
  });

  return cases;
}

export async function getAllCases() {
  const casesSnap = await getDocs(collection(db, "cases"));

  return casesSnap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
}

export async function updateCaseCoordinator(caseId, coordinatorId) {
  if (!caseId) {
    throw new Error("Case ID is required.");
  }

  if (!coordinatorId) {
    throw new Error("Coordinator ID is required.");
  }

  const ref = doc(db, "cases", caseId);
  await updateDoc(ref, {
    coordinator_id: coordinatorId,
    updated_at: Timestamp.now(),
  });
}

export async function getCasesForUser(userId) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const caseSnap = await getDocs(collection(db, "cases"));
  const cases = [];

  caseSnap.forEach((docItem) => {
    const data = docItem.data();
    if (!data) return;
    if (data.coordinator_id === userId) {
      cases.push({ id: docItem.id, ...data });
    }
  });

  const assignmentSnap = await getDocs(query(collection(db, "assignments"), where("user_id", "==", userId)));
  const assignedCaseIds = assignmentSnap.docs
    .map((docItem) => docItem.data())
    .filter((assignment) => assignment?.case_id)
    .map((assignment) => assignment.case_id);

  if (assignedCaseIds.length) {
    caseSnap.forEach((docItem) => {
      if (assignedCaseIds.includes(docItem.id)) {
        const data = docItem.data();
        if (data && data.coordinator_id !== userId) {
          cases.push({ id: docItem.id, ...data });
        }
      }
    });
  }

  return cases;
}

export async function getCasesForVolunteer(volunteerId) {
  if (!volunteerId) {
    throw new Error("Volunteer ID is required.");
  }

  const assignmentSnap = await getDocs(query(collection(db, "assignments"), where("user_id", "==", volunteerId)));

  if (assignmentSnap.empty) {
    return [];
  }

  const caseIds = assignmentSnap.docs
    .map((docItem) => docItem.data())
    .filter((data) => data?.case_id)
    .map((data) => data.case_id);

  if (!caseIds.length) {
    return [];
  }

  const casesSnap = await getDocs(collection(db, "cases"));
  const cases = [];

  casesSnap.forEach((docItem) => {
    if (caseIds.includes(docItem.id)) {
      cases.push({ id: docItem.id, ...docItem.data() });
    }
  });

  return cases;
}

/**
 * Update case status
 */
const ALLOWED_STATUSES = ["open", "in_progress", "assigned", "closed"];

export async function updateCaseStatus(caseId, newStatus, extra = {}) {
  // ✅ VALIDATE STATUS
  if (!ALLOWED_STATUSES.includes(newStatus)) {
    throw new Error("Invalid status");
  }

  const ref = doc(db, "cases", caseId);

  const updateData = {
    status: newStatus,
    ...extra,
  };

  if (newStatus === "closed") {
    updateData.closed_at = Timestamp.now();
  }

  if (newStatus === "open") {
    updateData.closed_at = null;
  }

  await updateDoc(ref, updateData);
}

const ALLOWED_COMPLEXITIES = ["simple", "complex", "very_complex"];

export async function updateCaseComplexity(caseId, newComplexity) {
  if (!ALLOWED_COMPLEXITIES.includes(newComplexity)) {
    throw new Error("Invalid case complexity");
  }

  const ref = doc(db, "cases", caseId);
  await updateDoc(ref, {
    case_complexity: newComplexity,
  });
}
/**
 * Close a case and submit result
 * If one volunteer closes, it closes for everyone assigned
 */
export async function closeCase(caseData) {
  if (!caseData || !caseData.case_id) {
    throw new Error("case_id is required");
  }

  const { case_id, closed_by, closed_by_full_name, result_status, result_notes } = caseData;

  if (!closed_by || typeof closed_by !== "string") {
    throw new Error("closed_by (user id) is required");
  }

  if (!closed_by_full_name || typeof closed_by_full_name !== "string") {
    throw new Error("closed_by_full_name is required");
  }

  if (!result_status || typeof result_status !== "string") {
    throw new Error("result_status is required");
  }

  const ref = doc(db, "cases", case_id);

  try {
    await updateDoc(ref, {
      status: "closed",
      closed_by,
      closed_by_full_name,
      result_status,
      result_notes: result_notes || null,
      closed_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    return { success: true, case_id };
  } catch (error) {
    console.error("Failed to close case:", error);
    throw new Error("Failed to close case. Please try again.");
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function backfillMissingCaseLocations() {
  const casesSnap = await getDocs(collection(db, "cases"));

  let updatedCount = 0;
  let skippedCount = 0;

  for (const docItem of casesSnap.docs) {
    const caseItem = { id: docItem.id, ...docItem.data() };

    if (caseItem.location_lat && caseItem.location_lng) {
      skippedCount++;
      continue;
    }

    const geoLocation = await geocodeCaseLocation(caseItem);

    if (!geoLocation) {
      skippedCount++;
      continue;
    }

    await updateDoc(doc(db, "cases", docItem.id), {
      ...geoLocation,
      updated_at: Timestamp.now(),
    });

    updatedCount++;
    await sleep(1200);
  }

  return { updatedCount, skippedCount };
}