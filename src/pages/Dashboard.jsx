import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import DashboardView from "../components/views/DashboardView";
import { logoutUser } from "../services/authService";
import { getAllCases, getCasesForCoordinatorById } from "../services/caseService";
import { getUsersByRole } from "../services/userService";
import { USER_ROLES } from "../services/userSchema";
import { useAuth } from "../contexts/AuthContext";
import { getVolunteerAssignmentStats } from "../services/assignmentService";
import {
  subscribeToAllIntakeForms,
  subscribeToCoordinatorIntakeForms,
} from "../services/intakeFormService";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";


function Dashboard() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    openCases: 0,
    volunteers: 0,
    completedRescues: 0,
  });
  const [allCases, setAllCases] = useState([]);
  const [intakeForms, setIntakeForms] = useState([]);
  // Map of coordinator_id → full_name for Admin view
  const [coordinatorNames, setCoordinatorNames] = useState({});

  // Keep unsubscribe ref so we can clean up on unmount or userProfile change
  const unsubscribeFormsRef = useRef(null);

  useEffect(() => {
    if (!userProfile?.uid) return;

    loadCasesAndStats();
    subscribeToForms();
    if (userProfile.role === USER_ROLES.ADMIN) {
      loadCoordinatorNames();
    }

    return () => {
      if (unsubscribeFormsRef.current) {
        unsubscribeFormsRef.current();
      }
    };
  }, [userProfile]);

  async function loadCasesAndStats() {
    try {
      if (userProfile.role === USER_ROLES.ADMIN) {
        const [cases, volunteers] = await Promise.all([
          getAllCases(),
          getUsersByRole(USER_ROLES.VOLUNTEER),
        ]);

        setAllCases(cases);
        setStats({
          openCases: cases.filter((c) => c.status !== "closed").length,
          volunteers: volunteers.length,
          completedRescues: cases.filter((c) => c.status === "closed").length,
        });
      } else if (userProfile.role === USER_ROLES.COORDINATOR) {
        const [cases, volunteerStats] = await Promise.all([
          getCasesForCoordinatorById(userProfile.uid),
          getVolunteerAssignmentStats(userProfile.uid),
        ]);

        setAllCases(cases);
        setStats({
          openCases: cases.filter((c) => c.status !== "closed").length,
          volunteers: volunteerStats.assignedCases,
          completedRescues: cases.filter((c) => c.status === "closed").length,
        });
      }
    } catch (err) {
      console.error("Dashboard stats load failed:", err);
      setError("Failed to load dashboard data.");
    }
  }

  function subscribeToForms() {
    // Tear down any previous listener before starting a new one
    if (unsubscribeFormsRef.current) {
      unsubscribeFormsRef.current();
    }

    if (userProfile.role === USER_ROLES.ADMIN) {
      unsubscribeFormsRef.current = subscribeToAllIntakeForms((forms) => {
        setIntakeForms(forms);
      });
    } else if (userProfile.role === USER_ROLES.COORDINATOR) {
      unsubscribeFormsRef.current = subscribeToCoordinatorIntakeForms(
        userProfile.uid,
        (forms) => {
          setIntakeForms(forms);
        }
      );
    }
  }


async function loadCoordinatorNames() {
  try {
    const usersRef = collection(db, "users");

    const q = query(
      usersRef,
      where("role", "in", [USER_ROLES.COORDINATOR, USER_ROLES.ADMIN]) // ✅ FIX
    );

    const snapshot = await getDocs(q);

    const nameMap = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      nameMap[doc.id] = data.full_name || data.email || doc.id;
    });

    setCoordinatorNames(nameMap);
  } catch (err) {
    console.error("Failed to load coordinator names:", err);
  }
}

  const handleLogout = async () => {
    try {
      setError("");
      await logoutUser();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed. Please try again.");
    }
  };

  return (
    <DashboardView
      userProfile={userProfile}
      stats={stats}
      allCases={allCases}
      intakeForms={intakeForms}
      coordinatorNames={coordinatorNames}
      error={error}
      onLogout={handleLogout}
    />
  );
}

export default Dashboard;