import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export async function getReportsStats() {
  const casesSnap = await getDocs(collection(db, "cases"));
  const usersSnap = await getDocs(collection(db, "users"));

  const cases = casesSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

//   console.log("CASES SNAP SIZE:", casesSnap.size);
//   console.log("CASES DATA:", cases);

  const users = usersSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const totalCases = cases.length;

  const openCases = cases.filter(
    (c) => c.status === "open"
  ).length;

  const assignedCases = cases.filter(
    (c) => c.status === "assigned"
  ).length;

  const closedCases = cases.filter(
    (c) => c.status === "closed"
  ).length;

  const urgentCases = cases.filter(
    (c) => c.urgency === "high"
  ).length;

  const volunteers = users.filter(
    (u) => u.role === "volunteer"
  ).length;

  const coordinators = users.filter(
    (u) => u.role === "coordinator"
  ).length;

  const admins = users.filter(
    (u) => u.role === "admin"
  ).length;

  const casesByCity = {};

  cases.forEach((caseItem) => {
    const city = caseItem.city || "Unknown";

    casesByCity[city] =
      (casesByCity[city] || 0) + 1;
  });

  const cityStats = Object.entries(casesByCity)
    .map(([city, count]) => ({
      city,
      count,
    }))
    .sort((a, b) => b.count - a.count);
    const availableVolunteers = users.filter(
    (u) => u.role === "volunteer" && u.is_available !== false
    ).length;

    const unavailableVolunteers = users.filter(
    (u) => u.role === "volunteer" && u.is_available === false
    ).length;

    const successfulCases = cases.filter(
  (c) =>
    c.status === "closed" &&
    (c.result === "evacuated" ||
      c.result_status === "evacuated_by_volunteer")
).length;

const successRate =
  closedCases > 0
    ? Math.round((successfulCases / closedCases) * 100)
    : 0;
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
  };
}