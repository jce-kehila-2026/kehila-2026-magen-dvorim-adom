import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import AssignedCasesMap from "../components/AssignedCasesMap";
import CoordinatorSendForm from "./CoordinatorSendForm";
import { logoutUser } from "../services/authService";

import { getUsersByRole } from "../services/userService";
import { USER_ROLES } from "../services/userSchema";
import { useAuth } from "../contexts/AuthContext";
import { getAllCases, getCasesForCoordinatorById, backfillMissingCaseLocations  } from "../services/caseService";
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
  const [sendFormOpen, setSendFormOpen] = useState(false);


  useEffect(() => {
    if (!userProfile?.uid) return;
    const loadStats = async () => {
      try {
        if (userProfile?.role === USER_ROLES.ADMIN) {
          const [cases, volunteerUsers] = await Promise.all([
            getAllCases(),
            getUsersByRole(USER_ROLES.VOLUNTEER),
          ]);
          setAllCases(cases);
          setStats({
            openCases: cases.filter((c) => c.status !== "closed").length,
            volunteers: volunteerUsers.length,
            completedRescues: cases.filter((c) => c.status === "closed").length,
          });
        } else if (userProfile?.role === USER_ROLES.COORDINATOR) {
          const [myCases, volunteerStats] = await Promise.all([
            getCasesForCoordinatorById(userProfile.uid),
            getVolunteerAssignmentStats(userProfile.uid),
          ]);
          setAllCases(myCases);
          setStats({
            openCases: myCases.filter((c) => c.status !== "closed").length,
            volunteers: volunteerStats.assignedCases,
            completedRescues: myCases.filter((c) => c.status === "closed").length,
          });
        }
      } catch (err) {
        console.error("Dashboard stats load failed:", err);
      }
    };
    loadStats();
  }, [userProfile]);
  const handleLogout = async () => {
    try {
      setError("");
      await logoutUser();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Logout failed. Please try again.");
    }
  };

  const handleBackfillLocations = async () => {
  try {
    const result = await backfillMissingCaseLocations();

    alert(
      `Done!\nUpdated: ${result.updatedCount}\nSkipped: ${result.skippedCount}`
    );
  } catch (err) {
    console.error(err);
    alert("Failed to update old case locations.");
  }
};

  const getDashboardTitle = () => {
    switch (userProfile?.role) {
      case USER_ROLES.ADMIN:
        return "Admin Dashboard";
      case USER_ROLES.COORDINATOR:
        return "Coordinator Dashboard";
      case USER_ROLES.VOLUNTEER:
        return "Volunteer Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getDashboardSubtitle = () => {
    switch (userProfile?.role) {
      case USER_ROLES.ADMIN:
        return "Manage users, reports, and system activity.";
      case USER_ROLES.COORDINATOR:
        return "Track rescue cases and assign volunteers.";
      case USER_ROLES.VOLUNTEER:
        return "View your rescue missions and availability.";
      default:
        return "Welcome back. Here is today’s rescue overview.";
    }
  };

  return (
    <div>
      <Navbar />

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>{getDashboardTitle()}</h1>
            <p style={styles.subtitle}>
              Welcome back, {userProfile?.full_name || "User"}. {getDashboardSubtitle()}
            </p>
          </div>
        </header>

        {error && <div style={styles.errorBox}>{error}</div>}

        <section style={styles.cards}>
          <div style={styles.card}>
            <span style={styles.icon}>📋</span>
            <h3>Open Cases</h3>
            <p style={styles.number}>{stats.openCases}</p>
          </div>

          <div style={styles.card}>
            <span style={styles.icon}>🐝</span>
            <h3>{userProfile?.role === USER_ROLES.COORDINATOR ? "Assigned to Me" : "Volunteers"}</h3>
            <p style={styles.number}>{stats.volunteers}</p>
          </div>

          <div style={styles.card}>
            <span style={styles.icon}>✅</span>
            <h3>Completed Rescues</h3>
            <p style={styles.number}>{stats.completedRescues}</p>
          </div>
        </section>

        {(userProfile?.role === USER_ROLES.ADMIN || userProfile?.role === USER_ROLES.COORDINATOR) && (
          <section style={styles.panel}>
            <h2>Send Intake Form</h2>
            <p style={styles.subtitle}>
              Generate a request form for a requester, or copy the public form link to share via WhatsApp.
            </p>
            <div style={styles.sendRow}>
              <button
                onClick={() => setSendFormOpen(true)}
                style={styles.actionButton}
              >
                Open Send Form
              </button>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/submit-case`;
                  navigator.clipboard.writeText(link);
                  alert("Public request form link copied to clipboard.");
                }}
                style={{ ...styles.actionButton, background: "#1f7a5c" }}
              >
                Copy Request Form Link
              </button>
            </div>

            {sendFormOpen && (
              <div style={styles.modalOverlay} onClick={() => setSendFormOpen(false)}>
                <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <CoordinatorSendForm onClose={() => setSendFormOpen(false)} />
                </div>
              </div>
            )}
            <div style={{ marginTop: "30px" }}>
             <h2
                style={{
                  textAlign: "center",
                  color: "#173b2f",
                  marginBottom: "20px",
                }}
              >
                {userProfile?.role === USER_ROLES.ADMIN
                  ? "Cases Map"
                  : "My Cases Map"}   
              </h2>
                <AssignedCasesMap
                  cases={allCases}
                  defaultFilter={userProfile?.role === USER_ROLES.ADMIN ? "assigned" : "all"}
                />
              </div>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    padding: "40px",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
    background: "linear-gradient(135deg, #fff7df 0%, #eef7f2 100%)",
  },
  header: {
    marginBottom: "30px",
  },
  title: {
    fontSize: "42px",
    color: "#173b2f",
    margin: 0,
  },
  subtitle: {
    color: "#5f6f68",
    fontSize: "17px",
  },
  errorBox: {
    padding: "12px",
    borderRadius: "12px",
    backgroundColor: "#fde8e8",
    color: "#b42318",
    fontSize: "14px",
    marginBottom: "18px",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "28px",
  },
  card: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "22px",
    boxShadow: "0 14px 35px rgba(20,64,48,0.12)",
  },
  icon: {
    fontSize: "30px",
  },
  number: {
    fontSize: "38px",
    fontWeight: "bold",
    color: "#1f7a5c",
    margin: 0,
  },
  panel: {
    backgroundColor: "white",
    padding: "26px",
    borderRadius: "22px",
    boxShadow: "0 14px 35px rgba(20,64,48,0.12)",
  },
  sendRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    marginTop: "18px",
  },
  actionButton: {
    flex: "1 1 220px",
    padding: "14px 22px",
    borderRadius: "18px",
    border: "none",
    background: "#ff9800",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(255, 152, 0, 0.18)",
  },
  list: {
    lineHeight: "2",
    color: "#4f5f58",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.42)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    width: "100%",
    maxWidth: "560px",
    background: "white",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
  },
};

export default Dashboard;
