// Reports and analytics dashboard.
// Displays system statistics, charts, and performance insights.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse"; // Library for CSV export
import logo from "../../assets/logo.png";
import "./ReportsView.css";

function ReportsView({ userProfile, stats, loading, error }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [modalType, setModalType] = useState(null);
  const [showBackupModal, setShowBackupModal] = useState(false);

  const cases = stats?.casesList || [];
  const users = stats?.usersList || [];
  const latestFeedbacks = stats?.latestFeedbacks || [];
  const ratingBreakdown = stats?.ratingBreakdown || [];

  // Backup Logic
  const handleDownloadBackup = () => {
    const csv = Papa.unparse(cases);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "system_backup.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowBackupModal(false);
  };

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const getCaseYear = (caseItem) => {
    const value = caseItem.opened_at || caseItem.created_at || caseItem.closed_at;
    if (!value) return null;
    if (value.toDate) return value.toDate().getFullYear();
    const date = new Date(value);
    return Number.isNaN(date.getFullYear()) ? null : date.getFullYear();
  };

  const years = [...new Set(cases.map((c) => getCaseYear(c)).filter(Boolean))].sort((a, b) => b - a);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const text = `${c.requester_first_name || ""} ${c.requester_last_name || ""} ${c.city || ""} ${c.status || ""}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const year = getCaseYear(c);
      const matchesYear = selectedYear === "all" || String(year) === String(selectedYear);
      return matchesSearch && matchesStatus && matchesYear;
    });
  }, [cases, search, statusFilter, selectedYear]);

  const filteredStats = useMemo(() => ({
    totalCases: filteredCases.length,
    openCases: filteredCases.filter((c) => c.status === "open").length,
    assignedCases: filteredCases.filter((c) => c.status === "assigned").length,
    closedCases: filteredCases.filter((c) => c.status === "closed").length,
  }), [filteredCases]);

  const filteredCityStats = useMemo(() => {
    const result = {};
    filteredCases.forEach((c) => {
      const city = c.city || "Unknown";
      if (!result[city]) result[city] = { city, total: 0, open: 0, assigned: 0, closed: 0, urgent: 0 };
      result[city].total += 1;
      if (c.status === "open") result[city].open += 1;
      if (c.status === "assigned") result[city].assigned += 1;
      if (c.status === "closed") result[city].closed += 1;
      if (c.urgency === "high") result[city].urgent += 1;
    });
    return Object.values(result).sort((a, b) => b.total - a.total);
  }, [filteredCases]);

  if (loading) return <div style={styles.page}><main style={styles.main}><div style={styles.loading}>Loading reports...</div></main></div>;

  return (
    <div className="reports-page" style={styles.page}>
      {menuOpen && <div className="reports-overlay" onClick={() => setMenuOpen(false)} />}
      <aside className={`reports-sidebar ${menuOpen ? "open" : ""}`} style={styles.sidebar}>
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div><h2 style={styles.brandTitle}>Magen Dvorim Adom</h2><p style={styles.brandSub}>{userProfile?.full_name || "Admin"}</p></div>
        </div>
        <nav style={styles.nav}>
          <button style={styles.navItem} onClick={() => goTo("/dashboard")}>Dashboard</button>
          <button style={styles.navItem} onClick={() => goTo("/cases")}>Cases</button>
          <button style={styles.navItem} onClick={() => goTo("/users")}>Users</button>
          <button style={{ ...styles.navItem, ...styles.navItemActive }}>Reports</button>
          <button style={styles.navItem} onClick={() => goTo("/profile")}>Profile</button>
        </nav>
      </aside>

      <main className="reports-main" style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>Reports & Statistics</h1>
          {userProfile?.role === 'admin' && (
            <button onClick={() => setShowBackupModal(true)} style={styles.backupButton}>Backup Data</button>
          )}
        </header>

        {/* ... [Rest of your UI code from your original file remains here] ... */}
        {/* Make sure to keep all your existing StatsCards, Feedback sections, and modals as they were */}
      </main>

      {/* Backup Modal */}
      {showBackupModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBackupModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Download Data Backup</h2>
            <p>Export all case records to a CSV file?</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleDownloadBackup} style={styles.confirmButton}>Confirm Download</button>
              <button onClick={() => setShowBackupModal(false)} style={styles.cancelButton}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ensure you update your styles object to include these:
const styles = {
  // ... (Include all your existing styles here) ...
  backupButton: {
    background: "#ea580c",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "14px",
    fontWeight: "900",
    cursor: "pointer",
    marginTop: "10px"
  },
  confirmButton: { padding: "10px 20px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" },
  cancelButton: { padding: "10px 20px", background: "#e5e7eb", border: "none", borderRadius: "8px", cursor: "pointer" }
};

export default ReportsView;