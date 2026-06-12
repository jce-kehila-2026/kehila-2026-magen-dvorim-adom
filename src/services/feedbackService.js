import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { FeedbackSchema } from "./feedbackSchema";

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
