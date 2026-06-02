import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { getVolunteerAssignmentStats } from "../services/assignmentService";

function VolunteerDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    openCases: 0,
    completedRescues: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userProfile?.uid) return;
    loadStats();
  }, [userProfile]);

  const loadStats = async () => {
    setLoading(true);
    setError("");

    try {
      const { assignedCases, completedRescues } = await getVolunteerAssignmentStats(userProfile.uid);

      setStats({
        openCases: assignedCases,
        completedRescues,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
      setError(err.message || "Unable to load dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.panel}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Welcome back, {userProfile.full_name}! 🐝</h1>
              <p style={styles.subtitle}>
                Here's an overview of your volunteer activity.
              </p>
            </div>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {loading && <div style={styles.loading}>Loading your dashboard…</div>}

          {!loading && !error && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.openCases}</div>
                <div style={styles.statLabel}>Open Cases</div>
                <p style={styles.statHint}>Currently assigned to you</p>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.completedRescues}</div>
                <div style={styles.statLabel}>Completed Rescues</div>
                <p style={styles.statHint}>Cases you were assigned to and that are closed</p>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statValue}>{userProfile.is_available ? "Yes" : "No"}</div>
                <div style={styles.statLabel}>Available</div>
                <p style={styles.statHint}>
                  <a href="/profile" style={styles.link}>Edit in Profile</a>
                </p>
              </div>

              {userProfile.city && (
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{userProfile.city}</div>
                  <div style={styles.statLabel}>Your Location</div>
                  <p style={styles.statHint}>
                    <a href="/profile" style={styles.link}>Edit in Profile</a>
                  </p>
                </div>
              )}
            </div>
          )}

          <div style={styles.actionsSection}>
            <div style={styles.actionCard}>
              <h3 style={styles.actionTitle}>📋 View My Cases</h3>
              <p style={styles.actionDesc}>
                See all your assigned cases and their details
              </p>
              <a href="/my-cases" style={styles.actionLink}>
                Go to My Cases →
              </a>
            </div>

            <div style={styles.actionCard}>
              <h3 style={styles.actionTitle}>⚙️ Manage Profile</h3>
              <p style={styles.actionDesc}>
                Update your availability, location, and settings
              </p>
              <a href="/profile" style={styles.actionLink}>
                Edit Profile →
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px 24px 48px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  panel: {
    background: "white",
    borderRadius: "28px",
    boxShadow: "0 32px 90px rgba(0,0,0,0.08)",
    padding: "32px",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    color: "#173b2f",
  },
  subtitle: {
    margin: "10px 0 0",
    color: "#4f5f58",
    fontSize: "16px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  statCard: {
    background: "linear-gradient(135deg, #eef7ee 0%, #dff4e5 100%)",
    borderRadius: "20px",
    padding: "24px",
    border: "1px solid #cfe8d6",
    textAlign: "center",
  },
  statValue: {
    fontSize: "36px",
    fontWeight: 700,
    color: "#173b2f",
    marginBottom: "8px",
  },
  statLabel: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#4f5f58",
    marginBottom: "8px",
  },
  statHint: {
    fontSize: "12px",
    color: "#7f8f7f",
    margin: 0,
  },
  actionsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginTop: "32px",
  },
  actionCard: {
    background: "#fffdf8",
    borderRadius: "20px",
    padding: "24px",
    border: "1px solid #f5e9d1",
    boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
  },
  actionTitle: {
    margin: "0 0 12px",
    fontSize: "18px",
    color: "#173b2f",
    fontWeight: 600,
  },
  actionDesc: {
    margin: "0 0 16px",
    fontSize: "14px",
    color: "#4f5f58",
    lineHeight: 1.5,
  },
  actionLink: {
    color: "#1f5a46",
    fontSize: "14px",
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
  },
  loading: {
    padding: "20px",
    color: "#5f6f68",
    textAlign: "center",
  },
  errorBox: {
    background: "#fdecea",
    border: "1px solid #f5c6cb",
    color: "#9f3a38",
    borderRadius: "14px",
    padding: "14px 16px",
    marginBottom: "24px",
  },
  link: {
    color: "#1f5a46",
    textDecoration: "none",
    fontWeight: 600,
  },
};

export default VolunteerDashboard;