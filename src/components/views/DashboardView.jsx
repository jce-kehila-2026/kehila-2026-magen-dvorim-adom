import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AssignedCasesMap from "../AssignedCasesMap";
import CoordinatorSendForm from "../../pages/CoordinatorSendForm";
import { USER_ROLES } from "../../services/userSchema";
import logo from "../../assets/logo.png";

import "./DashboardView.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return "—";
  const d = value?.toDate ? value.toDate() : new Date(value);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusLabel(status) {
  if (status === "waiting") return "sent";
  return status || "—";
}

function statusColor(status) {
  const s = statusLabel(status);
  switch (s) {
    case "sent":
      return { bg: "#fff1df", color: "#c2410c" };
    case "submitted":
      return { bg: "#dcfce7", color: "#15803d" };
    case "expired":
      return { bg: "#fee2e2", color: "#b42318" };
    default:
      return { bg: "#f1f5f9", color: "#475569" };
  }
}

// ─── DashboardView ────────────────────────────────────────────────────────────

function DashboardView({
  userProfile,
  stats,
  allCases,
  intakeForms = [],
  coordinatorNames = {},
  error,
  onLogout,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Map filters
  const [activeFilter, setActiveFilter] = useState("all");

  // Form tracking sort
  const [sortDir, setSortDir] = useState("desc"); // desc = newest first

  const isAdmin = userProfile?.role === USER_ROLES.ADMIN;

  const [statusFilter, setStatusFilter] = useState("all");

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const mapCases = allCases.filter((c) => c.status !== "closed");

  const openCasesCount = mapCases.filter((c) => c.status === "open").length;
  const assignedCasesCount = mapCases.filter(
    (c) => c.status === "assigned"
  ).length;

  const filteredMapCases =
    activeFilter === "all"
      ? mapCases
      : mapCases.filter((c) => c.status === activeFilter);

const filteredForms = useMemo(() => {
  if (statusFilter === "all") return intakeForms;

  return intakeForms.filter((form) => {
    const s = statusLabel(form.status);
    return s === statusFilter;
  });
}, [intakeForms, statusFilter]);

const sortedForms = useMemo(() => {
  return [...filteredForms].sort((a, b) => {
    const aTime = a.sent_at?.toDate
      ? a.sent_at.toDate().getTime()
      : new Date(a.sent_at).getTime();
    const bTime = b.sent_at?.toDate
      ? b.sent_at.toDate().getTime()
      : new Date(b.sent_at).getTime();
    return sortDir === "desc" ? bTime - aTime : aTime - bTime;
  });
}, [filteredForms, sortDir]);

  function handleFormRowClick(form) {
    if (form.status === "submitted" && form.case_id) {
      navigate(`/cases/${form.case_id}`);
    }
  }

  function handleMarkerClick(caseItem) {
    navigate(`/cases/${caseItem.id}`);
  }

  const dashboardTitle =
    isAdmin
      ? `Welcome back, ${userProfile?.full_name || "Admin"}`
      : `Welcome back, ${userProfile?.full_name || "Coordinator"}`;

  return (
    <div className="dashboard-page" style={styles.page}>
      {menuOpen && (
        <div
          className="dashboard-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
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

          <button style={styles.navItem} onClick={() => goTo("/cases")}>
            Cases
          </button>

          <button style={styles.navItem} onClick={() => goTo("/users")}>
            Users
          </button>

          {isAdmin && (
            <button style={styles.navItem} onClick={() => goTo("/reports")}>
              Reports
            </button>
          )}

          {isAdmin && (
            <button style={styles.navItem} onClick={() => goTo("/backup")}>
              Backup
            </button>
          )}

          <button style={styles.navItem} onClick={() => goTo("/profile")}>
            Profile
          </button>
        </nav>

        <button style={styles.logoutButton} onClick={onLogout}>
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="dashboard-main" style={styles.main}>
        <div className="dashboard-mobile-topbar">
          <button
            className="dashboard-menu-button"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
          <span className="dashboard-mobile-title">Dashboard</span>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}



        {/* ── NEW MAIN GRID ─────────────────────────────────────────── */}
        <div className="dashboard-main-grid" style={styles.mainGrid}>
          {/* LEFT SIDE */}
          <div style={styles.leftCol}>
            <section style={styles.mapSection}>
              <h2 style={styles.sectionTitle}>Active Cases</h2>

              <div style={styles.filterRow}>
                <FilterButton
                  label="All"
                  count={mapCases.length}
                  active={activeFilter === "all"}
                  onClick={() => setActiveFilter("all")}
                />
                <FilterButton
                  label="Open"
                  count={openCasesCount}
                  active={activeFilter === "open"}
                  onClick={() => setActiveFilter("open")}
                />
                <FilterButton
                  label="Assigned"
                  count={assignedCasesCount}
                  active={activeFilter === "assigned"}
                  onClick={() => setActiveFilter("assigned")}
                />
              </div>

              <div style={styles.mapBox}>
                <AssignedCasesMap
                  cases={filteredMapCases}
                  defaultFilter={activeFilter}
                  onMarkerClick={handleMarkerClick}
                />
              </div>
            </section>
          </div>

          {/* RIGHT SIDE */}
          <div style={styles.rightCol}>
            {/* Send Form */}
            <section style={styles.formCard}>
              <h2 style={styles.sectionTitle}>Send Form to Requester</h2>
              <CoordinatorSendForm />
            </section>

            {/* Track Form Status */}
            <section style={styles.trackCard}>
              <div style={styles.trackHeader}>
                <h2 style={styles.sectionTitle}>Track Form Status</h2>

               <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    style={styles.sortSelect}
                    value={sortDir}
                    onChange={(e) => setSortDir(e.target.value)}
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>

                  <select
                    style={styles.sortSelect}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="sent">Sent</option>
                    <option value="submitted">Submitted</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              {sortedForms.length === 0 ? (
                <p style={styles.emptyText}>No forms sent yet.</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <div style={styles.tableScroll}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Date</th>
                          <th style={styles.th}>Phone</th>
                          {isAdmin && <th style={styles.th}>Coordinator</th>}
                          <th style={styles.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedForms.map((form) => {
                          const isSubmitted = form.status === "submitted";
                          const sc = statusColor(form.status);

                          return (
                            <tr
                              key={form.id}
                              style={{
                                ...styles.tr,
                                cursor: isSubmitted ? "pointer" : "default",
                              }}
                              onClick={() => handleFormRowClick(form)}
                            >
                              <td style={styles.td}>
                                {formatDate(form.sent_at)}
                              </td>
                              <td style={styles.td}>
                                {form.requester_phone || "—"}
                              </td>
                              {isAdmin && (
                                <td style={styles.td}>
                                  {coordinatorNames[form.coordinator_id] || "—"}
                                </td>
                              )}
                              <td style={styles.td}>
                                <span
                                  style={{
                                    ...styles.badge,
                                    background: sc.bg,
                                    color: sc.color,
                                  }}
                                >
                                  {statusLabel(form.status)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterButton({ label, count, active, onClick }) {
  return (
    <button
      style={{
        ...styles.filterButton,
        ...(active ? styles.filterButtonActive : {}),
      }}
      onClick={onClick}
    >
      {label} {count}
    </button>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  errorBox: {
    padding: "12px",
    borderRadius: "12px",
    backgroundColor: "#fde8e8",
    color: "#b42318",
    fontSize: "14px",
  },

  // ── Map section ──
  mapSection: {
    background: "white",
    border: "1px solid #f0e5d8",
    borderRadius: "20px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    height: "100%",    
  },

  sectionTitle: {
    margin: 0,
    color: "#2b160c",
    fontSize: "18px",
    fontWeight: "900",
  },

  filterRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  filterButton: {
    border: "1px solid #f3c49a",
    background: "#fffaf4",
    color: "#2b160c",
    borderRadius: "999px",
    padding: "8px 16px",
    fontWeight: "900",
    fontSize: "13px",
    cursor: "pointer",
  },

  filterButtonActive: {
    background: "#ea580c",
    color: "white",
    borderColor: "#ea580c",
  },

mapBox: {
  height: window.innerWidth <= 900 ? "280px" : "520px",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #eadfd2",
},





  // ── Bottom two-column grid ──
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "16px",
    alignItems: "start",
  },

  formCard: {
    background: "white",
    border: "1px solid #f0e5d8",
    borderRadius: "20px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  trackCard: {
    background: "white",
    border: "1px solid #f0e5d8",
    borderRadius: "20px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  trackHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  sortSelect: {
    padding: "7px 10px",
    borderRadius: "10px",
    border: "1px solid #d8d2ca",
    background: "#ffffff",
    color: "#2b160c",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },

  th: {
    textAlign: "left",
    padding: "8px 10px",
    color: "#6b625c",
    fontWeight: "800",
    borderBottom: "1px solid #f0e5d8",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "10px 10px",
    color: "#2b160c",
    borderBottom: "1px solid #f8f4f0",
    verticalAlign: "middle",
  },

  tr: {
    transition: "background 0.15s",
  },

  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "capitalize",
  },

  emptyText: {
    margin: 0,
    color: "#7a6658",
    fontSize: "14px",
  },

  mainGrid: {
  display: "grid",
  gridTemplateColumns: "40% 60%",
  gap: "16px",
},

leftCol: {
  display: "flex",
  flexDirection: "column",
},

rightCol: {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
},

tableScroll: {
  maxHeight: window.innerWidth <= 900 ? "250px" : "400px",
  overflowY: "auto",
},
};

export default DashboardView;