// Reports and analytics dashboard.
// Displays system statistics, charts, and performance insights.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

function ReportsView({ userProfile, stats, loading, error }) {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [modalType, setModalType] = useState(null);

  const cases = stats?.casesList || [];
  const users = stats?.usersList || [];

  console.log("REPORT STATS:", stats);
  console.log("REPORT CASES:", cases);
  
  const getCaseYear = (caseItem) => {
  const value =
    caseItem.opened_at ||
    caseItem.created_at ||
    caseItem.closed_at;

  if (!value) return null;

  if (value.toDate) {
    return value.toDate().getFullYear();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getFullYear())) {
    return null;
  }

  return date.getFullYear();
};

  const years = [
  ...new Set(cases.map((caseItem) => getCaseYear(caseItem)).filter(Boolean)),
].sort((a, b) => b - a);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const text = `${c.requester_first_name || ""} ${
        c.requester_last_name || ""
      } ${c.city || ""} ${c.status || ""}`.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;

      const year = getCaseYear(c);

      const matchesYear =
        selectedYear === "all" || String(year) === String(selectedYear);

      return matchesSearch && matchesStatus && matchesYear;
    });
  }, [cases, search, statusFilter, selectedYear]);

  const filteredStats = useMemo(() => {
    const total = filteredCases.length;

    return {
      totalCases: total,
      openCases: filteredCases.filter((c) => c.status === "open").length,
      assignedCases: filteredCases.filter((c) => c.status === "assigned").length,
      closedCases: filteredCases.filter((c) => c.status === "closed").length,
      urgentCases: filteredCases.filter((c) => c.urgency === "high").length,
    };
  }, [filteredCases]);

  const filteredCityStats = useMemo(() => {
    const result = {};

    filteredCases.forEach((caseItem) => {
      const city = caseItem.city || "Unknown";

      if (!result[city]) {
        result[city] = {
          city,
          total: 0,
          open: 0,
          assigned: 0,
          closed: 0,
          urgent: 0,
        };
      }

      result[city].total += 1;

      if (caseItem.status === "open") result[city].open += 1;
      if (caseItem.status === "assigned") result[city].assigned += 1;
      if (caseItem.status === "closed") result[city].closed += 1;
      if (caseItem.urgency === "high") result[city].urgent += 1;
    });

    return Object.values(result).sort((a, b) => b.total - a.total);
  }, [filteredCases]);

  const statusChart = [
    { label: "Open", value: filteredStats.openCases, color: "#f59e0b" },
    { label: "Assigned", value: filteredStats.assignedCases, color: "#16a34a" },
    { label: "Closed", value: filteredStats.closedCases, color: "#374151" },
  ];

  if (loading) {
    return (
      <div style={styles.page}>
        <main style={styles.main}>
          <div style={styles.loading}>Loading reports...</div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />

          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{userProfile?.full_name || "Admin"}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          <button style={styles.navItem} onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>

          <button style={styles.navItem} onClick={() => navigate("/cases")}>
            Cases
          </button>

          <button style={styles.navItem} onClick={() => navigate("/users")}>
            Users
          </button>

          <button style={{ ...styles.navItem, ...styles.navItemActive }}>
            Reports
          </button>

          <button style={styles.navItem} onClick={() => navigate("/profile")}>
            Profile
          </button>
        </nav>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>Reports & Statistics</h1>
          <p style={styles.subtitle}>
            Analyze rescue activity, users, cities, urgency, and yearly trends.
          </p>
        </header>

        {error && <div style={styles.errorBox}>{error}</div>}

        <section style={styles.filtersBar}>
          <input
            placeholder="Search by requester, city, status..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={styles.searchInput}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={styles.select}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            style={styles.select}
          >
            <option value="all">All Years</option>

            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </section>

        <section style={styles.cards}>
          <StatCard title="Total Cases" value={filteredStats.totalCases} />
          <StatCard
            title="Open Cases"
            value={filteredStats.openCases}
            color="#f59e0b"
          />
          <StatCard
            title="Assigned Cases"
            value={filteredStats.assignedCases}
            color="#16a34a"
          />
          <StatCard
            title="Closed Cases"
            value={filteredStats.closedCases}
            color="#374151"
          />
          <StatCard
            title="Urgent Cases"
            value={filteredStats.urgentCases}
            color="#dc2626"
          />
          <StatCard
            title="Success Rate"
            value={`${stats?.successRate || 0}%`}
            color="#8b5cf6"
            />
        </section>

        <section style={styles.analyticsGrid}>
          <div style={styles.chartPanel}>
            <h2 style={styles.panelTitle}>Cases by Status</h2>

            {statusChart.map((item) => (
              <BarRow
                key={item.label}
                label={item.label}
                value={item.value}
                total={filteredStats.totalCases}
                color={item.color}
              />
            ))}
          </div>

          <div style={styles.chartPanel}>
            <h2 style={styles.panelTitle}>Cases by City</h2>

            {!filteredCityStats.length ? (
              <p style={styles.emptyText}>No city data available.</p>
            ) : (
              filteredCityStats.slice(0, 5).map((item) => (
                <BarRow
                  key={item.city}
                  label={item.city}
                  value={item.total}
                  total={filteredStats.totalCases}
                  color="#ea580c"
                />
              ))
            )}
          </div>
        </section>

        <section style={styles.grid}>
          <button style={styles.panelButton} onClick={() => setModalType("users")}>
            <h2 style={styles.panelTitle}>Users Summary</h2>
            <p style={styles.panelText}>
              Admins: {stats?.admins || 0} · Coordinators:{" "}
              {stats?.coordinators || 0} · Volunteers: {stats?.volunteers || 0}
            </p>
            <span style={styles.clickHint}>Click to view full users table →</span>
          </button>

          <button style={styles.panelButton} onClick={() => setModalType("cities")}>
            <h2 style={styles.panelTitle}>Detailed Cases by City</h2>

            {!filteredCityStats.length ? (
              <p style={styles.emptyText}>No city data available.</p>
            ) : (
              filteredCityStats.slice(0, 4).map((item) => (
                <ReportRow key={item.city} label={item.city} value={item.total} />
              ))
            )}

            <span style={styles.clickHint}>Click to view full city table →</span>
          </button>
        </section>
      </main>

      {modalType && (
        <div style={styles.modalOverlay} onClick={() => setModalType(null)}>
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <button
              style={styles.closeButton}
              onClick={() => setModalType(null)}
            >
              ×
            </button>

            {modalType === "users" && (
              <>
                <h2 style={styles.modalTitle}>Users Summary</h2>

                <div style={styles.tableHeader}>
                  <span>Name</span>
                  <span>Role</span>
                  <span>Phone</span>
                  <span>City</span>
                  <span>Available</span>
                </div>

                {users.map((user) => (
                  <div key={user.id} style={styles.tableRow}>
                    <strong>{user.full_name || user.email || "Unknown"}</strong>
                    <span>{user.role || "—"}</span>
                    <span>{user.phone || "No phone"}</span>
                    <span>{user.city || "No city"}</span>
                    <span>
                      {user.is_available === false ? "Unavailable" : "Available"}
                    </span>
                  </div>
                ))}
              </>
            )}

            {modalType === "cities" && (
              <>
                <h2 style={styles.modalTitle}>Cases by City</h2>

                <div style={styles.cityTableHeader}>
                  <span>City</span>
                  <span>Total</span>
                  <span>Open</span>
                  <span>Assigned</span>
                  <span>Closed</span>
                  <span>Urgent</span>
                </div>

                {filteredCityStats.map((item) => (
                  <div key={item.city} style={styles.cityTableRow}>
                    <strong>{item.city}</strong>
                    <span>{item.total}</span>
                    <span>{item.open}</span>
                    <span>{item.assigned}</span>
                    <span>{item.closed}</span>
                    <span>{item.urgent}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color = "#ea580c" }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statTitle}>{title}</p>
      <h2 style={{ ...styles.statValue, color }}>{value}</h2>
    </div>
  );
}

function ReportRow({ label, value }) {
  return (
    <div style={styles.reportRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BarRow({ label, value, total, color }) {
  const width = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div style={styles.barRow}>
      <div style={styles.barTop}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div style={styles.barTrack}>
        <div
          style={{
            ...styles.barFill,
            width: `${width}%`,
            background: color,
          }}
        />
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
  main: {
    padding: "34px",
    boxSizing: "border-box",
  },
  header: {
    textAlign: "center",
    marginBottom: "26px",
  },
  title: {
    margin: 0,
    color: "#2b160c",
    fontSize: "34px",
    fontWeight: "900",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#6b625c",
    fontSize: "15px",
  },
  filtersBar: {
    display: "grid",
    gridTemplateColumns: "1fr 180px 160px",
    gap: "12px",
    marginBottom: "22px",
  },
  searchInput: {
    padding: "13px 16px",
    borderRadius: "14px",
    border: "1px solid #eadfd2",
    background: "white",
    fontSize: "14px",
  },
  select: {
    padding: "13px 16px",
    borderRadius: "14px",
    border: "1px solid #eadfd2",
    background: "white",
    fontWeight: "800",
    color: "#3d332b",
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
    padding: "20px",
    textAlign: "center",
  },
  statTitle: {
    margin: 0,
    color: "#6b625c",
    fontSize: "14px",
    fontWeight: "800",
  },
  statValue: {
    margin: "10px 0 0",
    fontSize: "34px",
    fontWeight: "900",
  },
  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
    marginBottom: "18px",
  },
  chartPanel: {
    background: "white",
    border: "1px solid #f0e5d8",
    borderRadius: "20px",
    padding: "22px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },
  panelButton: {
    background: "white",
    border: "1px solid #f0e5d8",
    borderRadius: "20px",
    padding: "22px",
    textAlign: "left",
    cursor: "pointer",
  },
  panelTitle: {
    margin: "0 0 16px",
    color: "#2b160c",
    fontSize: "20px",
    fontWeight: "900",
  },
  panelText: {
    color: "#6b625c",
    fontSize: "14px",
  },
  clickHint: {
    display: "inline-block",
    marginTop: "12px",
    color: "#ea580c",
    fontWeight: "900",
    fontSize: "13px",
  },
  reportRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f1ebe5",
    color: "#3d332b",
    fontSize: "14px",
  },
  barRow: {
    marginBottom: "16px",
  },
  barTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "7px",
    color: "#3d332b",
    fontSize: "14px",
    fontWeight: "800",
  },
  barTrack: {
    height: "10px",
    background: "#f3eee8",
    borderRadius: "999px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: "999px",
  },
  emptyText: {
    color: "#6b625c",
  },
  errorBox: {
    padding: "12px",
    borderRadius: "12px",
    backgroundColor: "#fde8e8",
    color: "#b42318",
    fontSize: "14px",
    marginBottom: "18px",
  },
  loading: {
    padding: "30px",
    color: "#6b625c",
    fontWeight: "800",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modal: {
    width: "90%",
    maxWidth: "820px",
    maxHeight: "82vh",
    overflowY: "auto",
    background: "white",
    borderRadius: "22px",
    padding: "28px",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    border: "none",
    background: "#fff1df",
    color: "#ea580c",
    borderRadius: "10px",
    width: "34px",
    height: "34px",
    fontSize: "22px",
    cursor: "pointer",
  },
  modalTitle: {
    margin: "0 0 20px",
    color: "#2b160c",
    fontSize: "24px",
    fontWeight: "900",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr",
    gap: "12px",
    padding: "12px 14px",
    background: "#fff8ef",
    borderRadius: "12px",
    fontWeight: "900",
    color: "#3d332b",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr",
    gap: "12px",
    padding: "14px",
    borderBottom: "1px solid #f1ebe5",
    color: "#3d332b",
    fontSize: "14px",
  },
  cityTableHeader: {
    display: "grid",
    gridTemplateColumns: "1.4fr repeat(5, 1fr)",
    gap: "12px",
    padding: "12px 14px",
    background: "#fff8ef",
    borderRadius: "12px",
    fontWeight: "900",
    color: "#3d332b",
  },
  cityTableRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr repeat(5, 1fr)",
    gap: "12px",
    padding: "14px",
    borderBottom: "1px solid #f1ebe5",
    color: "#3d332b",
    fontSize: "14px",
  },
};

export default ReportsView;