import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { FeedbackSchema } from "./feedbackSchema";

/**
 * Check whether feedback has already been submitted for a given token,
 * without submitting anything. Used to show "already submitted" right away.
 */
export async function checkFeedbackStatus(token) {
  if (!token) {
    throw new Error("Invalid feedback link");
  }

  const q = query(
    collection(db, "cases"),
    where("feedback_token", "==", token)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("Invalid or expired link");
  }

  const caseData = snap.docs[0].data();

  return {
    feedback_submitted: caseData.feedback_submitted || false,
  };
}

/**
 * Get feedback records for a batch of case IDs, keyed by case_id.
 * Used to show the actual ratings/comments in the expanded case details.
 */
export async function getFeedbackByCaseIds(caseIds = []) {
  if (!caseIds.length) return {};

  const snap = await getDocs(collection(db, "feedback"));
  const map = {};

  snap.docs.forEach((docItem) => {
    const data = docItem.data();
    if (data && caseIds.includes(data.case_id)) {
      map[data.case_id] = data;
    }
  });

  return map;
}

/**
 * Submit feedback (MAIN FUNCTION)
 */
export async function submitFeedback({ token, data }) {

  if (!token) {
    throw new Error("Invalid feedback link");
  }

  // 1. Find case by token
  const q = query(
    collection(db, "cases"),
    where("feedback_token", "==", token)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("Invalid or expired link");
  }

  const caseDoc = snap.docs[0];
  const caseData = caseDoc.data();

  // 2. Prevent duplicate submission
  if (caseData.feedback_submitted) {
    throw new Error("Feedback already submitted");
  }

  // 3. Validate input with Zod
  const parsed = FeedbackSchema.safeParse({
    ...data,
    case_id: caseDoc.id,
  });

  if (!parsed.success) {
    console.error(parsed.error.format());
    throw new Error("Invalid feedback data");
  }

  const validData = parsed.data;

  // 4. Save feedback
  await addDoc(collection(db, "feedback"), {
    ...validData,
    submitted_at: Timestamp.now(),
  });

  // 5. Mark case as submitted (LOCK)
  await updateDoc(doc(db, "cases", caseDoc.id), {
    feedback_submitted: true,
    feedback_submitted_at: Timestamp.now(),
  });

  return { success: true };
}

export function subscribeToFeedbackForCases(caseIds, callback) {
  if (!caseIds.length) { callback({}); return () => {}; }
  return onSnapshot(collection(db, "feedback"), (snap) => {
    const map = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data && caseIds.includes(data.case_id)) {
        map[data.case_id] = data;
      }
    });
    callback(map);
  });
}