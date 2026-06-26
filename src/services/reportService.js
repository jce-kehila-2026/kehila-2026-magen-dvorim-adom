import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export async function getReportsStats(coordinatorId = null) {
  const casesSnap = await getDocs(collection(db, "cases"));
  const usersSnap = await getDocs(collection(db, "users"));
  const feedbackSnap = await getDocs(collection(db, "feedback"));

  const allCases = casesSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const users = usersSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const allFeedback = feedbackSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Scope everything below to a single coordinator's own cases when
  // requested. Admins call this with no coordinatorId and get the
  // org-wide view, unchanged.
  const cases = coordinatorId
    ? allCases.filter((c) => c.coordinator_id === coordinatorId)
    : allCases;

  const caseIds = new Set(cases.map((c) => c.id));

  const feedbackList = coordinatorId
    ? allFeedback.filter((f) => caseIds.has(f.case_id))
    : allFeedback;

  const totalCases = cases.length;

  const openCases = cases.filter((c) => c.status === "open").length;
  const assignedCases = cases.filter((c) => c.status === "assigned").length;
  const closedCases = cases.filter((c) => c.status === "closed").length;
  const urgentCases = cases.filter((c) => c.urgency === "high").length;

  const volunteers = users.filter((u) => u.role === "volunteer").length;
  const coordinators = users.filter((u) => u.role === "coordinator").length;
  const admins = users.filter((u) => u.role === "admin").length;

  const casesByCity = {};

  cases.forEach((caseItem) => {
    const city = caseItem.city || "Unknown";
    casesByCity[city] = (casesByCity[city] || 0) + 1;
  });

  const cityStats = Object.entries(casesByCity)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count);

  const availableVolunteers = users.filter(
    (u) => u.role === "volunteer" && u.is_available !== false
  ).length;

  const unavailableVolunteers = users.filter(
    (u) => u.role === "volunteer" && u.is_available === false
  ).length;

  // Success Rate: % of closed cases that ended with a successful rescue outcome.
  const successfulCases = cases.filter(
    (c) => c.status === "closed" && c.result_status === "evacuated_by_volunteer"
  ).length;

  const successRate =
    closedCases > 0 ? Math.round((successfulCases / closedCases) * 100) : 0;

  // ── Feedback statistics (ratings are 1–4, not 1–5) ──────────────────────
  const feedbackWithOverall = feedbackList.map((feedback) => {
    const adminRating = Number(feedback.administrative_rating) || 0;
    const evacRating = Number(feedback.evacuation_rating) || 0;
    const overallRating = Math.round((adminRating + evacRating) / 2) || 1;

    return { ...feedback, overallRating };
  });

  const totalFeedbacks = feedbackWithOverall.length;

  const averageRating =
    totalFeedbacks > 0
      ? Number(
          (
            feedbackWithOverall.reduce((sum, f) => sum + f.overallRating, 0) /
            totalFeedbacks
          ).toFixed(1)
        )
      : 0;

  const ratingBreakdown = [1, 2, 3, 4].map((star) => ({
    star,
    count: feedbackWithOverall.filter((f) => f.overallRating === star).length,
  }));

  const positiveFeedbackCount = feedbackWithOverall.filter(
    (f) => f.overallRating >= 3
  ).length;

  const negativeFeedbackCount = feedbackWithOverall.filter(
    (f) => f.overallRating <= 2
  ).length;

  const positiveFeedbackRate =
    totalFeedbacks > 0
      ? Math.round((positiveFeedbackCount / totalFeedbacks) * 100)
      : 0;

  // Response Rate: % of times a case was ever closed that received feedback.
  // Uses closure_count so a reopened-then-reclosed case is counted correctly.
  // Cases closed before this counter existed fall back to "1 if currently closed".
  const totalClosureEvents = cases.reduce((sum, c) => {
    if (typeof c.closure_count === "number" && c.closure_count > 0) {
      return sum + c.closure_count;
    }
    return sum + (c.status === "closed" ? 1 : 0);
  }, 0);

  const responseRate =
    totalClosureEvents > 0
      ? Math.min(100, Math.round((totalFeedbacks / totalClosureEvents) * 100))
      : 0;

  const getFeedbackTime = (feedback) => {
    const value = feedback.submitted_at;
    if (!value) return 0;
    const date = value.toDate ? value.toDate() : new Date(value);
    return date.getTime();
  };

  const feedbackWithCaseInfo = feedbackWithOverall.map((feedback) => {
    const relatedCase = cases.find((c) => c.id === feedback.case_id);
    return {
      ...feedback,
      closureRound: feedback.closure_round || 1,
      caseCity: relatedCase?.city || "Unknown city",
      caseRequesterName: relatedCase
        ? `${relatedCase.requester_first_name || ""} ${
            relatedCase.requester_last_name || ""
          }`.trim() || "Requester"
        : "Requester",
    };
  });

  const feedbackByCaseId = {};
  feedbackWithCaseInfo.forEach((feedback) => {
    feedbackByCaseId[feedback.case_id] = feedback;
  });

  const recentFeedbacks = [...feedbackWithCaseInfo]
    .sort((a, b) => getFeedbackTime(b) - getFeedbackTime(a))
    .slice(0, 10);

  const latestFeedback = recentFeedbacks[0] || null;

  const latestFeedbackCase = latestFeedback
    ? cases.find((c) => c.id === latestFeedback.case_id) || null
    : null;

  return {
    totalCases,
    openCases,
    assignedCases,
    closedCases,
    urgentCases,
    volunteers,
    coordinators,
    admins,
    cityStats,
    usersList: users,
    casesList: cases,
    availableVolunteers,
    unavailableVolunteers,
    successRate,
    successfulCases,

    // Feedback
    totalFeedbacks,
    averageRating,
    ratingBreakdown,
    positiveFeedbackCount,
    negativeFeedbackCount,
    positiveFeedbackRate,
    responseRate,
    latestFeedback,
    latestFeedbackCase,
    recentFeedbacks,
    feedbackByCaseId,
  };
}