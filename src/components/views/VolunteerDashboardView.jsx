
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./VolunteerDashboard.css";


function VolunteerDashboardView({
  userProfile,
  activeCase,
  completedCount,
  loading,
  error,
  handleLogout,
  onCaseClick,
  onHistoryClick,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const volunteerArea =
    userProfile?.city ||
    userProfile?.area ||
    userProfile?.region ||
    "Not set";

  return (
    <div className="volunteer-page" style={styles.page}>
      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />
      )}

      <aside
        className={`volunteer-sidebar ${menuOpen ? "open" : ""}`}
        style={styles.sidebar}
      >
        <div className="volunteer-brand" style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>
              {userProfile?.full_name || "Volunteer"}
            </p>
          </div>
        </div>

        <nav className="volunteer-nav" style={styles.nav}>
          <button
            style={{ ...styles.navItem, ...styles.navItemActive }}
            onClick={() => goTo("/dashboard")}
          >
            Dashboard
          </button>

          <button style={styles.navItem} onClick={() => goTo("/my-cases")}>
            My Cases
          </button>

          <button style={styles.navItem} onClick={() => goTo("/profile")}>
            Profile
          </button>
        </nav>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="volunteer-main" style={styles.main}>
        <div className="mobile-topbar">
          <button
            className="menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <img
            src={logo}
            alt="Magen Dvorim Adom"
            className="mobile-logo"
            style={{ width: "80px", height: "80px" }}
          />
        </div>

        <section className="content-card" style={styles.contentCard}>
          <header style={styles.header}>
            <h1 style={styles.title}>
              Welcome back,
            </h1>

            <h2 style={styles.bigName}>
              {userProfile?.full_name || "Volunteer"}
            </h2>
          </header>

          {error && <div style={styles.errorBox}>{error}</div>}
{loading ? (
  <div style={styles.loading}>Loading your dashboard...</div>
) : (
  <>
    {/* PRIMARY CARD */}
    <ActiveCaseCard
      activeCase={activeCase}
      onClick={() => navigate("/my-cases")}
    />

    {/* SECONDARY GRID */}
    <div className="dashboard-grid" style={styles.cardGrid}>
      <ClickableCard
        title="Completed Cases"
        value={completedCount}
        valueColor="#15803d"
        subtitle="View history"
        onClick={onHistoryClick}
      />

      <InfoCard
        title="Your Area"
        value={`${volunteerArea}`}
        valueColor="#6598ad"
      />
    </div>
  </>
)}
        </section>
      </main>
    </div>
  );
}

// ─── Active Case Card ─────────────────────────────────────────────────────────

function ActiveCaseCard({ activeCase, onClick }) {
  const hasCase = !!activeCase;

  return (
    <div
      style={{
        ...styles.card,
        padding: "28px",
        marginBottom: "20px",
        fontSize: "16px",
        cursor: hasCase ? "pointer" : "default",
        borderColor: hasCase ? "#fbbf24" : "#f0e5d8",
      }}
      onClick={hasCase ? onClick : undefined}
      title={hasCase ? "Click to view case details" : undefined}
    >
      <div style={styles.cardIconRow}>
        <span
          style={{
            ...styles.dot,
            background: hasCase ? "#d97706" : "#9ca3af",
          }}
        />
        <span
          style={{
            ...styles.cardLabel,
            color: hasCase ? "#d97706" : "#6b625c",
          }}
        >
          {hasCase
            ? "You have an active case"
            : "No assigned case at the moment"}
        </span>
      </div>

        {!hasCase && (
          <p style={{ ...styles.caseDesc, textAlign: "left" }}>
            You'll be notified by a coordinator when you're assigned to a case.
          </p>
        )}


      {hasCase && (
        <div style={styles.caseSnippet}>
          <p style={styles.caseCity}>
            {activeCase.city || "Unknown location"}
          </p>
          <p style={styles.caseDesc}>
            {activeCase.case_complexity
              ? `Complexity: ${activeCase.case_complexity.charAt(0).toUpperCase() + activeCase.case_complexity.slice(1)}`
              : "Complexity: Not specified"}
          </p>
          <span style={styles.tapHint}>
              Tap to view your case →
            </span>
        </div>
      )}
    </div>
  );
}

// ─── Clickable stat card ──────────────────────────────────────────────────────

function ClickableCard({ title, value, valueColor, subtitle, onClick }) {
  return (
    <div style={{ ...styles.card, cursor: "pointer" }} onClick={onClick}>
      <p style={styles.cardTitle}>{title}</p>
      <p style={{ ...styles.cardValue, color: valueColor }}>
        {value} cases
      </p>
      {subtitle && <p style={styles.cardSubtitle}>{subtitle} →</p>}
    </div>
  );
}

// ─── Info card ────────────────────────────────────────────────────────────────

function InfoCard({ title, value, valueColor }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardTitle}>{title}</p>
      <p style={{ ...styles.cardValue, color: valueColor }}>{value}</p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    background: "#fffdf8",

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
  logo: { width: "50px", height: "50px", objectFit: "contain" },
  brandTitle: { margin: 0, color: "#2b160c", fontSize: "16px", fontWeight: "900" },
  brandSub: { margin: "4px 0 0", color: "#ff6f0f", fontSize: "13px" },
  nav: { display: "flex", flexDirection: "column", gap: "10px" },
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
  navItemActive: { background: "#fff1df", color: "#ff6f0f" },
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
  main: { padding: "28px", boxSizing: "border-box" },
  contentCard: {
    background: "white",
    borderRadius: "22px",
    padding: "28px",
    border: "1px solid #f2e7dc",
    boxShadow: "0 16px 50px rgba(43, 22, 12, 0.05)",
    minHeight: "70vh",
  },
  header: { marginBottom: "24px" },
  title: {
  margin: 0,
  color: "#2b160c",
  fontSize: "26px",
  fontWeight: "800",
  textAlign: "left",   
},
  
  userName: { color: "#ff6f0f" },
 cardGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(160px, 1fr))",
  gap: "16px",
},
card: {
  background: "#fffdf8",
  border: "1px solid #f0e5d8",
  borderRadius: "20px",
  padding: "24px",
  minHeight: "120px",  // ✅ ADD
  display: "flex",     // ✅ optional polish
  flexDirection: "column",
  justifyContent: "center",
},
  cardIconRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

bigName: {
  margin: "4px 0 20px",
  fontSize: "36px",
  fontWeight: "900",
  color: "#ff6f0f",
  textAlign: "left",   
},

  dot: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  cardLabel: { fontSize: "14px", fontWeight: "800", margin: 0 },
  caseSnippet: { marginTop: "4px" },
  caseCity: { margin: "0 0 4px", color: "#2b160c", fontSize: "18px", fontWeight: "900" },
  caseDesc: { margin: "0 0 10px", color: "#6b625c", fontSize: "13px", lineHeight: 1.5 },
  tapHint: { fontSize: "12px", color: "#d97706", fontWeight: "800" },
  cardTitle: { margin: "0 0 8px", color: "#6b625c", fontSize: "13px", fontWeight: "800" },
  cardValue: { margin: "0 0 4px", fontSize: "28px", fontWeight: "900" },
  cardSubtitle: { margin: 0, fontSize: "12px", color: "#d97706", fontWeight: "800" },
  loading: { padding: "20px", color: "#6b625c", textAlign: "center" },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "16px",
    fontSize: "14px",
  },
};

export default VolunteerDashboardView;