import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export async function getReportsStats() {
  const casesSnap = await getDocs(collection(db, "cases"));
  const usersSnap = await getDocs(collection(db, "users"));
  const feedbackSnap = await getDocs(collection(db, "feedback"));

  const cases = casesSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const users = usersSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const feedbacks = feedbackSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const totalCases = cases.length;
  const openCases = cases.filter((c) => c.status === "open").length;
  const assignedCases = cases.filter((c) => c.status === "assigned").length;
  const closedCases = cases.filter((c) => c.status === "closed").length;

  const volunteers = users.filter((u) => u.role === "volunteer").length;
  const coordinators = users.filter((u) => u.role === "coordinator").length;
  const admins = users.filter((u) => u.role === "admin").length;

  const successfulCases = cases.filter(
    (c) =>
      c.status === "closed" &&
      (c.result === "evacuated" ||
        c.result_status === "evacuated_by_volunteer")
  ).length;

  const successRate =
    closedCases > 0 ? Math.round((successfulCases / closedCases) * 100) : 0;

  const totalFeedbacks = feedbacks.length;

  const averageRating =
    totalFeedbacks > 0
      ? (
          feedbacks.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
          totalFeedbacks
        ).toFixed(1)
      : "0.0";

  const positiveFeedbacks = feedbacks.filter(
    (item) => Number(item.rating || 0) >= 4
  ).length;

  const negativeFeedbacks = feedbacks.filter(
    (item) => Number(item.rating || 0) <= 2
  ).length;

  const positiveRate =
    totalFeedbacks > 0
      ? Math.round((positiveFeedbacks / totalFeedbacks) * 100)
      : 0;

  const latestFeedbacks = [...feedbacks]
    .sort((a, b) => {
      const getTime = (item) => {
        const value = item.created_at || item.submitted_at;
        if (!value) return 0;
        if (value.toDate) return value.toDate().getTime();
        if (value.seconds) return value.seconds * 1000;
        return new Date(value).getTime();
      };

      return getTime(b) - getTime(a);
    })
    .slice(0, 4);

  const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: feedbacks.filter((item) => Number(item.rating) === rating).length,
  }));

  const casesByCity = {};

  cases.forEach((caseItem) => {
    const city = caseItem.city || "Unknown";
    casesByCity[city] = (casesByCity[city] || 0) + 1;
  });

  const cityStats = Object.entries(casesByCity)
    .map(([city, count]) => ({
      city,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalCases,
    openCases,
    assignedCases,
    closedCases,
    successRate,
    successfulCases,

    admins,
    coordinators,
    volunteers,

    cityStats,
    usersList: users,
    casesList: cases,

    feedbacksList: feedbacks,
    latestFeedbacks,
    totalFeedbacks,
    averageRating,
    positiveFeedbacks,
    negativeFeedbacks,
    positiveRate,
    ratingBreakdown,
  };
}