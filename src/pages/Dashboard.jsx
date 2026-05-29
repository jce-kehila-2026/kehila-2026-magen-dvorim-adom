import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { logoutUser } from "../services/authService";
import { USER_ROLES } from "../services/userSchema";

function Dashboard({ userProfile }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  // Temporary dashboard data until case/activity services are ready
  const stats = {
    openCases: 0,
    activeVolunteers: 0,
    completedRescues: 0,
  };

  const recentActivity = [
    "No recent activity to show yet.",
  ];

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
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>🐝</div>
        <h2 style={styles.brand}>Magen Dvorim Adom</h2>

        <div style={styles.userBox}>
          <strong>{userProfile?.full_name || "User"}</strong>
          <span>{userProfile?.role || "No role"}</span>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <nav style={styles.nav}>
          <button style={styles.navItem} onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>

          {(userProfile?.role === USER_ROLES.ADMIN ||
            userProfile?.role === USER_ROLES.COORDINATOR) && (
            <>
              <button style={styles.navItem} onClick={() => navigate("/cases")}>
                Cases
              </button>

              <button
                style={styles.navItem}
                onClick={() => navigate("/volunteers")}
              >
                Volunteers
              </button>
            </>
          )}

          {userProfile?.role === USER_ROLES.ADMIN && (
            <>
              <button style={styles.navItem} onClick={() => navigate("/users")}>
                Users
              </button>

              <button style={styles.navItem} onClick={() => navigate("/reports")}>
                Reports
              </button>
            </>
          )}

          {userProfile?.role === USER_ROLES.VOLUNTEER && (
            <>
              <button
                style={styles.navItem}
                onClick={() => navigate("/my-cases")}
              >
                My Cases
              </button>

              <button
                style={styles.navItem}
                onClick={() => navigate("/availability")}
              >
                Availability
              </button>
            </>
          )}
        </nav>

        <button style={styles.logout} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>{getDashboardTitle()}</h1>
            <p style={styles.subtitle}>
              Welcome back, {userProfile?.full_name || "User"}.{" "}
              {getDashboardSubtitle()}
            </p>
          </div>
        </header>

        <section style={styles.cards}>
          <div style={styles.card}>
            <span style={styles.icon}>📋</span>
            <h3>Open Cases</h3>
            <p style={styles.number}>{stats.openCases}</p>
          </div>

          <div style={styles.card}>
            <span style={styles.icon}>🐝</span>
            <h3>Active Volunteers</h3>
            <p style={styles.number}>{stats.activeVolunteers}</p>
          </div>

          <div style={styles.card}>
            <span style={styles.icon}>✅</span>
            <h3>Completed Rescues</h3>
            <p style={styles.number}>{stats.completedRescues}</p>
          </div>
        </section>

        <section style={styles.panel}>
          <h2>Recent Activity</h2>
          <ul style={styles.list}>
            {recentActivity.map((activity, index) => (
              <li key={index}>{activity}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexWrap: "wrap",
    background: "linear-gradient(135deg, #fff7df 0%, #eef7f2 100%)",
    fontFamily: "Arial, sans-serif",
  },

  sidebar: {
    width: "260px",
    minHeight: "100vh",
    padding: "28px",
    backgroundColor: "#173b2f",
    color: "white",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },

  logo: {
    fontSize: "42px",
    marginBottom: "12px",
  },

  brand: {
    fontSize: "22px",
    marginBottom: "24px",
  },

  userBox: {
    padding: "14px",
    borderRadius: "14px",
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "14px",
  },

  errorBox: {
    padding: "12px",
    borderRadius: "12px",
    backgroundColor: "#fde8e8",
    color: "#b42318",
    fontSize: "14px",
    marginBottom: "18px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  navItem: {
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    textAlign: "left",
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "white",
    cursor: "pointer",
    fontSize: "15px",
  },

  logout: {
    marginTop: "auto",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#f6b73c",
    color: "#173b2f",
    fontWeight: "bold",
    cursor: "pointer",
  },

  main: {
    flex: 1,
    minWidth: "320px",
    padding: "40px",
    boxSizing: "border-box",
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

  list: {
    lineHeight: "2",
    color: "#4f5f58",
  },
};

export default Dashboard;