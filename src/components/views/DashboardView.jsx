// Main dashboard UI component.
// Displays role-based statistics, navigation, and dashboard content.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AssignedCasesMap from "../AssignedCasesMap";
import CoordinatorSendForm from "../../pages/CoordinatorSendForm";
import { USER_ROLES } from "../../services/userSchema";
import logo from "../../assets/logo.png";

import "./DashboardView.css";

function DashboardView({
  userProfile,
  stats,
  allCases,
  error,
  onLogout,
}) {
 const navigate = useNavigate();
const [menuOpen, setMenuOpen] = useState(false);

const goTo = (path) => {
  setMenuOpen(false);
  navigate(path);
};
  const urgentCases = allCases.filter((c) => c.urgency === "high").length;

 const dashboardTitle =
  userProfile?.role === USER_ROLES.ADMIN
    ? `Welcome back, ${userProfile?.full_name || "Admin"}`
    : userProfile?.role === USER_ROLES.COORDINATOR
    ? `Welcome back, ${userProfile?.full_name || "Coordinator"}`
    : `Welcome back, ${userProfile?.full_name || "Volunteer"}`;

  const mapCases = allCases.filter((c) => c.status !== "closed");

  const openCasesCount = mapCases.filter((c) => c.status === "open").length;
  const assignedCasesCount = mapCases.filter((c) => c.status === "assigned").length;

  const [activeFilter, setActiveFilter] = useState("all");

  const filteredMapCases =
    activeFilter === "all"
      ? mapCases
      : mapCases.filter((c) => c.status === activeFilter);


  return (
<div
  className="dashboard-page"
  style={styles.page}
>
  {menuOpen && (
    <div
      className="dashboard-overlay"
      onClick={() => setMenuOpen(false)}
    />
  )}
      <aside
  className={`dashboard-sidebar ${menuOpen ? "open" : ""}`}
  style={styles.sidebar}
>
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />

          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{userProfile?.full_name || "User"}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          <button style={{ ...styles.navItem, ...styles.navItemActive }}>
            Dashboard
          </button>

          {(userProfile?.role === USER_ROLES.ADMIN ||
            userProfile?.role === USER_ROLES.COORDINATOR) && (
            <>
              <button style={styles.navItem} onClick={() => goTo("/cases")}>
                Cases
              </button>

              <button style={styles.navItem} onClick={() => goTo("/users")}>
                Users
              </button>

              {userProfile?.role === USER_ROLES.ADMIN && (
                <button style={styles.navItem} onClick={() => goTo("/reports")}>
                  Reports
                </button>
              )}

              {userProfile?.role === USER_ROLES.ADMIN && (
                <button style={styles.navItem} onClick={() => goTo("/backup")}>
                  Backup
                </button>
              )}
            </>
            
          )}
         <button style={styles.navItem} onClick={() => goTo("/profile")}>
            Profile
          </button>
        </nav>

        <button style={styles.logoutButton} onClick={onLogout}>
          Logout
        </button>
      </aside>

      <main
  className="dashboard-main"
  style={styles.main}
>
  <div className="dashboard-mobile-topbar">
  <button
    className="dashboard-menu-button"
    onClick={() => setMenuOpen(true)}
  >
    ☰
  </button>

  <span className="dashboard-mobile-title">
    Dashboard
  </span>
</div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {(userProfile?.role === USER_ROLES.ADMIN ||
  userProfile?.role === USER_ROLES.COORDINATOR) && (
  <section
  className="dashboard-map-section"
  style={styles.mapSection}
>
 <div
  className="dashboard-map-layout"
  style={styles.mapLayout}
>

    <div
  className="dashboard-map-box"
  style={styles.mapBox}
>
      <AssignedCasesMap
        cases={filteredMapCases}
        defaultFilter="all"
      />
    </div>

  <div
  className="dashboard-control-panel"
  style={styles.controlPanel}
>
  <button
    style={{
      ...styles.filterButton,
      ...(activeFilter === "all"
        ? styles.filterButtonActive
        : {}),
    }}
    onClick={() => setActiveFilter("all")}
  >
    All {mapCases.length}
  </button>

  <button
    style={{
      ...styles.filterButton,
      ...(activeFilter === "open"
        ? styles.filterButtonActive
        : {}),
    }}
    onClick={() => setActiveFilter("open")}
  >
    Open {openCasesCount}
  </button>

  <button
    style={{
      ...styles.filterButton,
      ...(activeFilter === "assigned"
        ? styles.filterButtonActive
        : {}),
    }}
    onClick={() => setActiveFilter("assigned")}
  >
    Assigned {assignedCasesCount}
  </button>

 <div style={styles.sendFormCard}>
  <CoordinatorSendForm />
</div>
</div>

  </div>
</section>
)}

          </main>
        </div>
      );
    }

function StatCard({ title, value, description, color, bg }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, background: bg, color }}>●</div>

      <div>
        <h3 style={styles.statTitle}>{title}</h3>
        <p style={{ ...styles.statNumber, color }}>{value}</p>
        <p style={styles.statDescription}>{description}</p>
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
    width: "52px",
    height: "52px",
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
    textTransform: "capitalize",
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
    padding: "13px",
    borderRadius: "14px",
    border: "none",
    background: "#ea580c",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
  },

 main: {
  padding: "18px",
  boxSizing: "border-box",
  overflow: "hidden",
},

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "28px",
  },

  title: {
    margin: 0,
    color: "#2b160c",
    fontSize: "30px",
    textAlign: "center",
    fontWeight: "900",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#6b625c",
    fontSize: "15px",
  },

  headerActions: {
    display: "flex",
    gap: "12px",
  },

  primaryButton: {
    border: "none",
    borderRadius: "12px",
    background: "#ea580c",
    color: "white",
    padding: "12px 18px",
    fontWeight: "900",
    cursor: "pointer",
  },

  secondaryButton: {
    border: "1px solid #f3c49a",
    borderRadius: "12px",
    background: "white",
    color: "#c2410c",
    padding: "12px 18px",
    fontWeight: "900",
    cursor: "pointer",
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },

  statCard: {
    background: "white",
    border: "1px solid #f0e5d8",
    borderRadius: "18px",
    padding: "10px",
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },

  statIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },

  statTitle: {
    margin: 0,
    color: "#2b160c",
    fontSize: "18px",
    fontWeight: "900",
  },

  statNumber: {
    margin: "4px 0",
    fontSize: "30px",
    fontWeight: "900",
  },

  statDescription: {
    margin: 0,
    color: "#6b625c",
    fontSize: "12px",
  },
sectionHeader: {
  background: "white",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: "14px",
  paddingBottom: "12px",
},
  sectionTitle: {
    margin: 0,
    color: "#2b160c",
    fontSize: "20px",
   textAlign: "center",
    fontWeight: "900",
  },

  legend: {
    display: "flex",
    gap: "16px",
    color: "#4b3b31",
    fontSize: "13px",
    fontWeight: "800",
  },

  errorBox: {
    padding: "12px",
    borderRadius: "12px",
    backgroundColor: "#fde8e8",
    color: "#b42318",
    fontSize: "14px",
    marginBottom: "18px",
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
 mapSection: {
  background: "white",
  border: "1px solid #f0e5d8",
  borderRadius: "20px",
  padding: "12px",
  height: "calc(100vh - 40px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
},
mapLayout: {
  display: "grid",
  gridTemplateColumns: "1fr 300px",
  gap: "20px",
  height: "100%",
},
controlPanel: {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
},

mapTopBar: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "12px",
  flexWrap: "wrap",
},

mapFilters: {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
},

filterButton: {
  border: "1px solid #f3c49a",
  background: "#fffaf4",
  color: "#2b160c",
  borderRadius: "999px",
  padding: "10px 18px",
  fontWeight: "900",
  cursor: "pointer",
},

filterButtonActive: {
  background: "#ea580c",
  color: "white",
  borderColor: "#ea580c",
},

mapBox: {
  flex: 1,
  height: "100%",
  minHeight: 0,
  width: "100%",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #eadfd2",
},
sendFormCard: {
  marginTop: "10px",
  background: "#fffaf4",
  border: "1px solid #f0e5d8",
  borderRadius: "18px",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
},

sendFormTitle: {
  margin: 0,
  textAlign: "center",
  color: "#2b160c",
  fontSize: "20px",
  fontWeight: "900",
},

createFormButton: {
  border: "none",
  borderRadius: "12px",
  background: "#ea580c",
  color: "white",
  padding: "12px",
  fontWeight: "900",
  cursor: "pointer",
},

copyLinkButton: {
  border: "none",
  borderRadius: "12px",
  background: "#15803d",
  color: "white",
  padding: "12px",
  fontWeight: "900",
  cursor: "pointer",
},


phoneInput: {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #d8d2ca",
  marginTop: "10px",
},

quickFormActions: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
  marginTop: "10px",
},
searchInput: {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #d8d2ca",
},
tabActive: {
  border: "none",
  borderRadius: "999px",
  padding: "6px 10px",
  background: "#15803d",
  color: "white",
  fontWeight: "800",
},

tabButton: {
  border: "none",
  borderRadius: "999px",
  padding: "6px 10px",
  background: "#eee",
  color: "#4b3b31",
  fontWeight: "800",
},

};

export default DashboardView;
