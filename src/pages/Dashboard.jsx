import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import AssignedCasesMap from "../components/AssignedCasesMap";
import CoordinatorSendForm from "./CoordinatorSendForm";
import { logoutUser } from "../services/authService";

import { getUsersByRole } from "../services/userService";
import { USER_ROLES } from "../services/userSchema";
import { useAuth } from "../contexts/AuthContext";
import {
  getAllCases,
  getCasesForCoordinatorById,
} from "../services/caseService";
import { getVolunteerAssignmentStats } from "../services/assignmentService";

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

  useEffect(() => {
    if (!userProfile?.uid) return;

    const loadStats = async () => {
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
        } else {
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
        console.error(err);
      }
    };

    loadStats();
  }, [userProfile]);

  const getTitle = () => {
    if (userProfile.role === USER_ROLES.ADMIN) return "Admin Dashboard";
    if (userProfile.role === USER_ROLES.COORDINATOR) return "Coordinator Dashboard";
    return "Dashboard";
  };

  return (
    <div>
      <Navbar />

      <main style={s.main}>
        {error && <div style={s.error}>{error}</div>}

        {/* ✅ Stats */}
        <div style={s.cards}>
          <div style={s.card}>
            <div>Open Cases</div>
            <strong>{stats.openCases}</strong>
          </div>

          <div style={s.card}>
            <div>Volunteers</div>
            <strong>{stats.volunteers}</strong>
          </div>

          <div style={s.card}>
            <div>Completed</div>
            <strong>{stats.completedRescues}</strong>
          </div>
        </div>

        {/* ✅ SEND FORM INLINE */}
        {(userProfile.role === USER_ROLES.ADMIN ||
          userProfile.role === USER_ROLES.COORDINATOR) && (
          <div style={s.panel}>
            <CoordinatorSendForm />
          </div>
        )}

        {/* ✅ MAP */}
        <div style={{ marginTop: 30 }}>
          <AssignedCasesMap
            cases={allCases}
            defaultFilter={
              userProfile.role === USER_ROLES.ADMIN ? "assigned" : "all"
            }
          />
        </div>
      </main>
    </div>
  );
}

const s = {
  main: {
    padding: 30,
    background: "#f9f7ef",
    minHeight: "100vh",
  },
  title: {
    margin: 0,
  },
  subtitle: {
    color: "#666",
  },
  cards: {
    display: "flex",
    gap: 10,
    margin: "20px 0",
  },
  card: {
    flex: 1,
    background: "white",
    padding: 15,
    borderRadius: 10,
    textAlign: "center",
  },
  panel: {
    background: "white",
    padding: 20,
    borderRadius: 10,
  },
  error: {
    color: "red",
  },
};

export default Dashboard;