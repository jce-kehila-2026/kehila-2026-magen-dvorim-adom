
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

import VolunteerDashboardView from "../components/views/VolunteerDashboardView";
import { logoutUser } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

function VolunteerDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [activeCase, setActiveCase] = useState(null);   // single case object or null
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const unsubRef = useRef(null);

  useEffect(() => {
    if (!userProfile?.uid) return;

    setLoading(true);
    setError("");

    // Listen to all assignment documents for this volunteer.
    // When assignments change, re-fetch the linked cases to determine
    // which are active (not closed) and which are completed (closed).
    const assignmentsQuery = query(
      collection(db, "assignments"),
      where("user_id", "==", userProfile.uid)
    );

    unsubRef.current = onSnapshot(
      assignmentsQuery,
      async (snap) => {
        try {
          if (snap.empty) {
            setActiveCase(null);
            setCompletedCount(0);
            setLoading(false);
            return;
          }

          // Fetch all linked cases in parallel
          const casePromises = snap.docs.map((assignmentDoc) => {
            const { case_id } = assignmentDoc.data();
            if (!case_id) return Promise.resolve(null);
            return getDoc(doc(db, "cases", case_id)).then((caseSnap) => {
              if (!caseSnap.exists()) return null;
              return { id: caseSnap.id, ...caseSnap.data() };
            });
          });

          const cases = (await Promise.all(casePromises)).filter(Boolean);

          // Active = not closed (open or assigned)
          const activeCases = cases.filter((c) => c.status !== "closed");
          // Completed = closed
          const completedCases = cases.filter((c) => c.status === "closed");

          // Business rule: volunteer can only have one active case at a time.
          // Take the first one if somehow multiple exist.
          setActiveCase(activeCases.length > 0 ? activeCases[0] : null);
          setCompletedCount(completedCases.length);
          setLoading(false);
        } catch (err) {
          console.error("Failed to resolve volunteer cases:", err);
          setError("Failed to load dashboard data.");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Assignments listener error:", err);
        setError("Failed to load assignments.");
        setLoading(false);
      }
    );

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [userProfile?.uid]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed. Please try again.");
    }
  };

  const handleCaseClick = () => {
    if (activeCase?.id) {
      navigate(`/cases/${activeCase.id}`);
    }
  };

  const handleHistoryClick = () => {
    navigate("/my-cases");
  };

  if (!userProfile) return <div>Loading...</div>;

  return (
    <VolunteerDashboardView
      userProfile={userProfile}
      activeCase={activeCase}
      completedCount={completedCount}
      loading={loading}
      error={error}
      handleLogout={handleLogout}
      onCaseClick={handleCaseClick}
      onHistoryClick={handleHistoryClick}
    />
  );
}

export default VolunteerDashboard;