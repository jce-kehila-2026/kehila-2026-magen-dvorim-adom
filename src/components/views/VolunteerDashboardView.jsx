// Volunteer dashboard interface.
// Shows assigned cases and volunteer statistics.

import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

function VolunteerDashboardView({
  userProfile,
  stats,
  recentCases = [],
  loading,
  error,
  handleLogout,
}) {
  const navigate = useNavigate();

  const currentCase = recentCases[0];

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
          <h1 style={styles.title}>
  Welcome back,
  <span style={styles.userName}>
    {" "}
    {userProfile?.full_name || "Volunteer"}
  </span>
</h1>
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
                  title="Latest City"
                  value={currentCase?.city || "None"}
                  tone="neutral"
                />
              </div>

              <div style={styles.dashboardGrid}>
                <section style={styles.currentCard}>
                  <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>Current Assignment</h3>
                    {currentCase && (
                      <span style={styles.statusBadge}>
                        {currentCase.status || "assigned"}
                      </span>
                    )}
                  </div>

                  {!currentCase ? (
                    <p style={styles.emptyText}>
                      No active assignments right now.
                    </p>
                  ) : (
                    <>
                      <div style={styles.caseInfo}>
                        <p style={styles.caseCity}>
                          {currentCase.city || "Unknown city"}
                        </p>

                        <p style={styles.caseDescription}>
                          {currentCase.description || "No description provided."}
                        </p>

                        <div style={styles.caseDetails}>
                          <span>
                            Requester:{" "}
                            <strong>
                              {currentCase.requester_first_name || ""}{" "}
                              {currentCase.requester_last_name || ""}
                            </strong>
                          </span>

                          <span>
                            Phone:{" "}
                            <strong>
                              {currentCase.requester_phone || "Not provided"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <button
                        style={styles.primaryButton}
                        onClick={() => navigate("/my-cases")}
                      >
                        View case details
                      </button>
                    </>
                  )}
                </section>

                <section style={styles.recentCard}>
                  <h3 style={styles.sectionTitle}>Recent Assignments</h3>

                  {recentCases.length === 0 ? (
                    <p style={styles.emptyText}>
                      Your recent assignments will appear here.
                    </p>
                  ) : (
                    <div style={styles.recentList}>
                      {recentCases.slice(0, 4).map((caseItem) => (
                        <div key={caseItem.id} style={styles.recentItem}>
                          <div>
                            <strong style={styles.recentCity}>
                              {caseItem.city || "Unknown city"}
                            </strong>

                            <p style={styles.recentName}>
                              {caseItem.requester_first_name}{" "}
                              {caseItem.requester_last_name}
                            </p>
                          </div>

                          <span style={styles.recentStatus}>
                            {caseItem.status || "assigned"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
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
      : styles.neutralTone;

  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statIndicator, background: toneStyle.color }} />

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
    color: "#c05621",
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
    color: "#c2410c",
  },

  logoutButton: {
    marginTop: "auto",
    border: "none",
    background: "#ff6f0f",
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
    boxShadow: "0 16px 50px rgba(43, 22, 12, 0.05)",
  },

  header: {
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    color: "#2b160c",
    fontSize: "30px",
    fontWeight: "900",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#7a6658",
    fontSize: "14px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },

  statCard: {
    background: "#fffdf8",
    border: "1px solid #f0e5d8",
    borderRadius: "18px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  statIndicator: {
    width: "10px",
    height: "38px",
    borderRadius: "999px",
    display: "inline-block",
  },

  statTitle: {
    margin: 0,
    color: "#6b625c",
    fontSize: "13px",
    fontWeight: "800",
  },

  statValue: {
    margin: "5px 0 0",
    fontSize: "24px",
    fontWeight: "800",
  },

  orangeTone: {
    color: "#d97706",
  },

  greenTone: {
    color: "#15803d",
  },

  neutralTone: {
    color: "#6598ad",
  },

  userName: {
  color: "#ff6f0f",
},
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "18px",
  },

  currentCard: {
    background: "#fffdf8",
    border: "1px solid #f0e5d8",
    borderRadius: "20px",
    padding: "24px",
  },

  recentCard: {
    background: "#fffdf8",
    border: "1px solid #f0e5d8",
    borderRadius: "20px",
    padding: "24px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },

  sectionTitle: {
    margin: 0,
    color: "#2b160c",
    fontSize: "18px",
    fontWeight: "900",
  },

  statusBadge: {
    background: "#fff1df",
    color: "#c2410c",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "capitalize",
  },

  caseInfo: {
    marginBottom: "22px",
  },

  caseCity: {
    margin: "0 0 8px",
    color: "#2b160c",
    fontSize: "24px",
    fontWeight: "900",
  },

  caseDescription: {
    margin: "0 0 18px",
    color: "#6b625c",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  caseDetails: {
    display: "grid",
    gap: "8px",
    color: "#3d332b",
    fontSize: "14px",
  },

  primaryButton: {
    border: "none",
    background: "#c2410c",
    color: "white",
    borderRadius: "12px",
    padding: "11px 16px",
    fontWeight: "900",
    cursor: "pointer",
  },

  recentList: {
    display: "grid",
    gap: "10px",
  },

  recentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    borderTop: "1px solid #f1ebe5",
  },

  recentCity: {
    color: "#2b160c",
    fontSize: "14px",
  },

  recentName: {
    margin: "4px 0 0",
    color: "#7a6658",
    fontSize: "13px",
  },

  recentStatus: {
    background: "#f8efe5",
    color: "#9a3412",
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  },

  emptyText: {
    margin: 0,
    color: "#7a6658",
    fontSize: "14px",
    lineHeight: 1.6,
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