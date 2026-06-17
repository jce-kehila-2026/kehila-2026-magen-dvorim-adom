// Volunteer dashboard interface.
// Shows assigned cases, recommendations, and volunteer statistics.

import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

function VolunteerDashboardView({
  userProfile,
  stats,
  loading,
  error,
  handleLogout,
}) {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />

          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{userProfile?.full_name || "Volunteer"}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          <button style={{ ...styles.navItem, ...styles.navItemActive }}>
            Dashboard
          </button>

          <button style={styles.navItem} onClick={() => navigate("/my-cases")}>
            My Cases
          </button>

          <button style={styles.navItem} onClick={() => navigate("/profile")}>
            Profile
          </button>
        </nav>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main style={styles.main}>
        <section style={styles.contentCard}>
          <header style={styles.header}>
            <h1 style={styles.title}>Volunteer Dashboard</h1>
            <p style={styles.subtitle}>
              View your assigned rescue cases and availability.
            </p>
          </header>

          {error && <div style={styles.errorBox}>{error}</div>}
          {loading && <div style={styles.loading}>Loading your dashboard...</div>}

          {!loading && !error && (
            <>
              <div style={styles.statsGrid}>
                <StatCard
                  title="Assigned Cases"
                  value={stats.openCases}
                  tone="orange"
                />

                <StatCard
                  title="Completed Cases"
                  value={stats.completedRescues}
                  tone="green"
                />

                <StatCard
                  title="Availability"
                  value={userProfile.is_available ? "Available" : "Unavailable"}
                  tone={userProfile.is_available ? "green" : "red"}
                />

                <StatCard
                  title="Location"
                  value={userProfile.city || "Not set"}
                  tone="neutral"
                />
              </div>

              <div style={styles.actionsGrid}>
                <div style={styles.actionCard}>
                  <h3 style={styles.actionTitle}>My Assigned Cases</h3>
                  <p style={styles.actionText}>
                    Review your current rescue cases and submit results when done.
                  </p>

                  <button
                    style={styles.secondaryButton}
                    onClick={() => navigate("/my-cases")}
                  >
                    View My Cases
                  </button>
                </div>

                <div style={styles.actionCard}>
                  <h3 style={styles.actionTitle}>Profile & Availability</h3>
                  <p style={styles.actionText}>
                    Update your city, availability, and personal details.
                  </p>

                  <button
                    style={styles.primaryButton}
                    onClick={() => navigate("/profile")}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value, tone }) {
  const toneStyle =
    tone === "orange"
      ? styles.orangeTone
      : tone === "green"
      ? styles.greenTone
      : tone === "red"
      ? styles.redTone
      : styles.neutralTone;

  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statDot, ...toneStyle }}>●</div>

      <div>
        <h3 style={styles.statTitle}>{title}</h3>
        <p style={{ ...styles.statValue, color: toneStyle.color }}>{value}</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    background: "#fffdf8",
    fontFamily: "Arial, sans-serif",
  },

  sidebar: {
    height: "100vh",
    position: "sticky",
    top: 0,
    padding: "28px 20px",
    background: "#fff8ef",
    borderRight: "1px solid #f0e5d8",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "36px",
  },

  logo: {
    width: "50px",
    height: "50px",
    objectFit: "contain",
  },

  brandTitle: {
    margin: 0,
    color: "#2b160c",
    fontSize: "16px",
    fontWeight: "900",
  },

  brandSub: {
    margin: "4px 0 0",
    color: "#e85d04",
    fontSize: "13px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  navItem: {
    border: "none",
    background: "transparent",
    color: "#3d332b",
    padding: "13px 16px",
    borderRadius: "14px",
    textAlign: "left",
    fontWeight: "800",
    cursor: "pointer",
  },

  navItemActive: {
    background: "#fff1df",
    color: "#e85d04",
  },

  logoutButton: {
    marginTop: "auto",
    border: "none",
    background: "#f97316",
    color: "white",
    borderRadius: "14px",
    padding: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },

  main: {
    padding: "28px",
    boxSizing: "border-box",
  },

  contentCard: {
    background: "white",
    borderRadius: "22px",
    padding: "28px",
    border: "1px solid #f2e7dc",
    boxShadow: "0 16px 50px rgba(43, 22, 12, 0.06)",
  },

  header: {
    textAlign: "center",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    color: "#f57c00",
    fontSize: "32px",
    fontWeight: "900",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#6b4f00",
    fontSize: "14px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },

  statCard: {
    background: "white",
    border: "1px solid #f0e5d8",
    borderRadius: "18px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  statDot: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },

  statTitle: {
    margin: 0,
    color: "#2b160c",
    fontSize: "14px",
    fontWeight: "900",
  },

  statValue: {
    margin: "4px 0 0",
    fontSize: "26px",
    fontWeight: "900",
  },

  orangeTone: {
    background: "#fff7e6",
    color: "#f59e0b",
  },

  greenTone: {
    background: "#ecfdf3",
    color: "#16a34a",
  },

  redTone: {
    background: "#fff1f2",
    color: "#dc2626",
  },

  neutralTone: {
    background: "#f3f4f6",
    color: "#374151",
  },

  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
    gap: "16px",
  },

  actionCard: {
    background: "#fffdf8",
    border: "1px solid #f0e5d8",
    borderRadius: "18px",
    padding: "22px",
  },

  actionTitle: {
    margin: "0 0 8px",
    color: "#2b160c",
    fontSize: "18px",
    fontWeight: "900",
  },

  actionText: {
    margin: "0 0 16px",
    color: "#6b625c",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  primaryButton: {
    border: "none",
    background: "#f97316",
    color: "white",
    borderRadius: "12px",
    padding: "10px 14px",
    fontWeight: "900",
    cursor: "pointer",
  },

  secondaryButton: {
    border: "1px solid #f3c49a",
    background: "white",
    color: "#c2410c",
    borderRadius: "12px",
    padding: "10px 14px",
    fontWeight: "900",
    cursor: "pointer",
  },

  loading: {
    padding: "20px",
    color: "#6b625c",
    textAlign: "center",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "16px",
  },
};

export default VolunteerDashboardView;