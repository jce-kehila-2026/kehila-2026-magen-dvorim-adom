
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./VolunteerDashboard.css";
import { useLanguage } from "../../contexts/LanguageContext";


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
  const { language, setLanguage } = useLanguage();
  const isHebrew = language === "he";

  const t = {
  dashboard: isHebrew ? "דשבורד" : "Dashboard",
  myCases: isHebrew ? "המקרים שלי" : "My Cases",
  profile: isHebrew ? "פרופיל" : "Profile",
  logout: isHebrew ? "התנתק" : "Logout",

  welcome: isHebrew ? "ברוך הבא" : "Welcome back,",
  volunteer: isHebrew ? "מתנדב" : "Volunteer",

  loading: isHebrew ? "טוען..." : "Loading your dashboard...",

  noCase: isHebrew
    ? "אין מקרה משובץ לך כרגע"
    : "No assigned case at the moment",

  noCaseDesc: isHebrew
    ? "תקבל עדכון כאשר יוקצה לך מקרה"
    : "You'll be notified by a coordinator when you're assigned to a case.",

  activeCase: isHebrew
    ? "יש לך מקרה פעיל"
    : "You have an active case",

  unknownLocation: isHebrew
    ? "מיקום לא ידוע"
    : "Unknown location",

  complexity: isHebrew ? "מורכבות" : "Complexity",

  notSpecified: isHebrew ? "לא צוין" : "Not specified",

  tapHint: isHebrew
    ? "לחץ לצפייה במקרה"
    : "Tap to view your case →",

  completedCases: isHebrew ? "מקרים שהושלמו" : "Completed Cases",
  viewHistory: isHebrew ? "צפה בהיסטוריה" : "View history",

  yourArea: isHebrew ? "האזור שלך" : "Your Area",

  notSet: isHebrew ? "לא הוגדר" : "Not set",
};

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const volunteerArea =
    userProfile?.city ||
    userProfile?.area ||
    userProfile?.region ||
    t.notSet;

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
            {t.dashboard}
          </button>

          <button style={styles.navItem} onClick={() => goTo("/my-cases")}>
            {t.myCases}
          </button>

          <button style={styles.navItem} onClick={() => goTo("/profile")}>
            {t.profile}
          </button>
        </nav>

<div style={styles.bottomSection}>
  <button
    style={styles.languageButton}
    onClick={() => setLanguage(isHebrew ? "en" : "he")}
  >
    {isHebrew ? "English 🌐" : "עברית 🌐"}
  </button>

  <button style={styles.logoutButton} onClick={handleLogout}>
    {t.logout}
  </button>
</div>
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
            <h1
              style={{
                ...styles.title,
                textAlign: isHebrew ? "right" : "left",
              }}
            >

              {t.welcome}
            </h1>

            <h2
              style={{
                ...styles.bigName,
                textAlign: isHebrew ? "right" : "left",
              }}
            >
              {userProfile?.full_name || t.volunteer}
            </h2>
          </header>

          {error && <div style={styles.errorBox}>{error}</div>}
{loading ? (
  <div style={styles.loading}> {t.loading}</div>
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
        title={t.completedCases}
        value={completedCount}
        valueColor="#15803d"
        subtitle={t.viewHistory}
        onClick={onHistoryClick}
      />

      <InfoCard
        title={t.yourArea}
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

const { language } = useLanguage();
const isHebrew = language === "he";

  const hasCase = !!activeCase;



const t = {
  activeCase: isHebrew ? "יש לך מקרה פעיל" : "You have an active case",
  noCase: isHebrew ? "אין מקרה משובץ לך כרגע" : "No assigned case at the moment",
  noCaseDesc: isHebrew
    ? "תקבל עדכון כאשר יוקצה לך מקרה"
    : "You'll be notified by a coordinator when you're assigned to a case.",
  unknownLocation: isHebrew
    ? "מיקום לא ידוע"
    : "Unknown location",
  complexity: isHebrew ? "מורכבות" : "Complexity",
  notSpecified: isHebrew ? "לא צוין" : "Not specified",
  tapHint: isHebrew
    ? "לחץ לצפייה במקרה"
    : "Tap to view your case →",
};

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
      <div
  style={{
    ...styles.cardIconRow,
    flexDirection: isHebrew ? "row-reverse" : "row",
    justifyContent: isHebrew ? "flex-start" : "flex-start",
    width: "100%",
  }}
>
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
            textAlign: isHebrew ? "right" : "left",
          }}
        >
          {hasCase ? t.activeCase : t.noCase}
        </span>
      </div>

        {!hasCase && (
          <p style={{ ...styles.caseDesc, textAlign: isHebrew ? "right" : "left" }}>
            {t.noCaseDesc}
          </p>
        )}


      {hasCase && (
        <div style={styles.caseSnippet}>
          <p style={styles.caseCity}>
            {activeCase.city || t.unknownLocation}
          </p>
          <p style={styles.caseDesc}>
            {activeCase.case_complexity
              ? `${t.complexity}: ${activeCase.case_complexity.charAt(0).toUpperCase() + activeCase.case_complexity.slice(1)}`
              : `${t.complexity}: ${t.notSpecified}`}
          </p>
          <span style={styles.tapHint}>
              {t.tapHint}
            </span>
        </div>
      )}
    </div>
  );
}

// ─── Clickable stat card ──────────────────────────────────────────────────────

function ClickableCard({ title, value, valueColor, subtitle, onClick }) {
  
 const { language } = useLanguage();
  const isHebrew = language === "he";

  return (
    <div style={{ ...styles.card, cursor: "pointer" }} onClick={onClick}>
      <p style={styles.cardTitle}>{title}</p>
      <p style={{ ...styles.cardValue, color: valueColor }}>
        {value} {isHebrew ? "מקרים" : "cases"}
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
  borderRight: "1px solid #f3e9da",

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
  brandSub: { margin: "4px 0 0", color: "#6a2300", fontSize: "13px" },
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
  navItemActive: { background: "#fff1df", color: "#6a2300" },
  logoutButton: {
    marginTop: "auto",
    border: "none",
    background: "#6a2300",
    color: "white",
    borderRadius: "6px",
    padding: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  main: { padding: "28px", boxSizing: "border-box" },
  contentCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #f2e7dc",
     boxShadow: "0 16px 50px rgba(43, 22, 12, 0.06)",
    minHeight: "70vh",
  },
  header: { marginBottom: "24px" },
  title: {
  margin: 0,
  color: "#2b160c",
  fontSize: "26px",
  fontWeight: "800",
},
  
  userName: { color: "#6a2300"},
 cardGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(160px, 1fr))",
  gap: "16px",
},
card: {
  background: "#fffdf8",
  border: "1px solid #f0e5d8",
  borderRadius: "16px",
  padding: "24px",
  minHeight: "120px",  // ✅ ADD
  display: "flex",     // ✅ optional polish
  flexDirection: "column",
  justifyContent: "center",
  oxShadow: "0 10px 30px rgba(43, 22, 12, 0.05)",
},
  cardIconRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
    flexDirection: "row", // default
    width: "100%",

  },

bigName: {
  margin: "4px 0 20px",
  fontSize: "36px",
  fontWeight: "900",
  color: "#6a2300",
},

  dot: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  cardLabel: { fontSize: "20px", fontWeight: "1000", margin: 0 },
  caseSnippet: { marginTop: "4px" },
  caseCity: { margin: "0 0 4px", color: "#2b160c", fontSize: "18px", fontWeight: "900" },
  caseDesc: { margin: "0 0 10px", color: "#6b625c", fontSize: "13px", lineHeight: 1.5 },
  tapHint: { fontSize: "12px", color: "#e85d04", fontWeight: "800" },
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
  bottomSection: {
  marginTop: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
},

languageButton: {
  padding: "13px",
  borderRadius: "6px",
  border: "1px solid #eadfd2",
  background: "#fffaf4",
  color: "#2b160c",
  fontWeight: "800",
  cursor: "pointer",
},
};

export default VolunteerDashboardView;