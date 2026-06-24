import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { USER_ROLES } from "../../services/userSchema";
import { getAllUsers } from "../../services/userService";
import { getAllCases } from "../../services/caseService";
import { getReportsStats } from "../../services/reportService";
import logo from "../../assets/logo.png";
import "./ProfileView.css";

const BACKUP_TYPES = {
  ALL: "all",
  USERS: "users",
  CASES: "cases",
  REPORTS: "reports",
};

const BACKUP_OPTIONS = [
  { value: BACKUP_TYPES.ALL, label: "All Data" },
  { value: BACKUP_TYPES.USERS, label: "Users" },
  { value: BACKUP_TYPES.CASES, label: "Cases" },
  { value: BACKUP_TYPES.REPORTS, label: "Reports" },
];

const DETAIL_FIELDS = [
  { key: "name", label: "Full Name", header: "Name" },
  { key: "email", label: "Email", header: "Email" },
  { key: "phone", label: "Phone", header: "Phone" },
  { key: "role", label: "Role", header: "User Role" },
  { key: "status", label: "Status", header: "Status" },
];

const DEFAULT_DETAIL_FIELDS = DETAIL_FIELDS.map((field) => field.key);

function formatRole(role) {
  if (!role) return "";
  return String(role)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatStatus(status) {
  if (typeof status === "boolean") {
    return status ? "Active" : "Inactive";
  }

  if (!status) return "";
  return formatRole(status);
}

function getUserStatus(user) {
  if (user.is_active === false) return "Inactive";
  if (user.is_available === false) return "Unavailable";
  return "Active";
}

function getCaseName(caseItem) {
  return [caseItem.requester_first_name, caseItem.requester_last_name]
    .filter(Boolean)
    .join(" ");
}

function buildRow(recordType, source, selectedFields) {
  const row = {
    "Record Type": recordType,
  };

  DETAIL_FIELDS.forEach((field) => {
    if (!selectedFields.includes(field.key)) return;

    if (recordType === "User") {
      const values = {
        name: source.full_name || source.displayName || "",
        email: source.email || "",
        phone: source.phone || "",
        role: formatRole(source.role),
        status: getUserStatus(source),
      };
      row[field.header] = values[field.key] || "";
      return;
    }

    if (recordType === "Case") {
      const values = {
        name: getCaseName(source),
        email: "",
        phone: source.requester_phone || "",
        role: source.coordinator_name ? `Coordinator: ${source.coordinator_name}` : "",
        status: formatStatus(source.status),
      };
      row[field.header] = values[field.key] || "";
      return;
    }

    const values = {
      name: source.metric || "",
      email: "",
      phone: "",
      role: "",
      status: source.value ?? "",
    };
    row[field.header] = values[field.key] || "";
  });

  return row;
}

function flattenReportsForCsv(reports) {
  if (!reports) return [];

  return [
    { metric: "Total Cases", value: reports.totalCases || 0 },
    { metric: "Open Cases", value: reports.openCases || 0 },
    { metric: "Assigned Cases", value: reports.assignedCases || 0 },
    { metric: "Closed Cases", value: reports.closedCases || 0 },
    { metric: "Success Rate", value: `${reports.successRate || 0}%` },
    { metric: "Admins", value: reports.admins || 0 },
    { metric: "Coordinators", value: reports.coordinators || 0 },
    { metric: "Volunteers", value: reports.volunteers || 0 },
    { metric: "Average Rating", value: reports.averageRating || "0.0" },
    { metric: "Total Feedbacks", value: reports.totalFeedbacks || 0 },
  ];
}

function downloadCsvFile(rows, selectedTypes) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const typeLabel = selectedTypes.includes(BACKUP_TYPES.ALL)
    ? BACKUP_TYPES.ALL
    : selectedTypes.join("-");
  const filename = `magen-dvorim-adom-${typeLabel}-backup-${timestamp}.csv`;
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function BackupView({ userProfile, currentUserName, handleLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([BACKUP_TYPES.ALL]);
  const [selectedFields, setSelectedFields] = useState(DEFAULT_DETAIL_FIELDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const effectiveSelectedTypes = selectedTypes.includes(BACKUP_TYPES.ALL)
    ? [BACKUP_TYPES.USERS, BACKUP_TYPES.CASES, BACKUP_TYPES.REPORTS]
    : selectedTypes;

  const toggleType = (type) => {
    setSelectedTypes((current) => {
      if (type === BACKUP_TYPES.ALL) {
        return current.includes(BACKUP_TYPES.ALL) ? [] : [BACKUP_TYPES.ALL];
      }

      const withoutAll = current.filter((item) => item !== BACKUP_TYPES.ALL);
      const next = withoutAll.includes(type)
        ? withoutAll.filter((item) => item !== type)
        : [...withoutAll, type];

      return next.length === 3 ? [BACKUP_TYPES.ALL] : next;
    });
  };

  const toggleField = (fieldKey) => {
    setSelectedFields((current) =>
      current.includes(fieldKey)
        ? current.filter((item) => item !== fieldKey)
        : [...current, fieldKey]
    );
  };

  const fetchBackupData = async () => {
    const data = {};

    await Promise.all(
      effectiveSelectedTypes.map(async (type) => {
        if (type === BACKUP_TYPES.USERS) {
          const result = await getAllUsers(1000);
          data.users = result.users || [];
        }

        if (type === BACKUP_TYPES.CASES) {
          data.cases = await getAllCases();
        }

        if (type === BACKUP_TYPES.REPORTS) {
          data.reports = await getReportsStats();
        }
      })
    );

    return data;
  };

  const buildCsvRows = (data) => {
    const rows = [];

    (data.users || []).forEach((user) => {
      rows.push(buildRow("User", user, selectedFields));
    });

    (data.cases || []).forEach((caseItem) => {
      rows.push(buildRow("Case", caseItem, selectedFields));
    });

    flattenReportsForCsv(data.reports).forEach((reportRow) => {
      rows.push(buildRow("Report", reportRow, selectedFields));
    });

    return rows;
  };

  const handleDownload = async () => {
    if (effectiveSelectedTypes.length === 0) {
      setError("Select at least one data type to export.");
      setSuccess("");
      return;
    }

    if (selectedFields.length === 0) {
      setError("Select at least one detail field to include.");
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await fetchBackupData();
      const rows = buildCsvRows(data);

      if (rows.length === 0) {
        setError("No matching records were found for this export.");
        return;
      }

      downloadCsvFile(rows, selectedTypes);
      setSuccess("CSV backup downloaded successfully.");
    } catch (err) {
      console.error("Failed to create backup:", err);
      setError(err.message || "Failed to create backup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-layout" style={styles.layout}>
      {menuOpen && (
        <div className="profile-overlay" onClick={() => setMenuOpen(false)} />
      )}

      <aside
        className={`profile-sidebar ${menuOpen ? "open" : ""}`}
        style={styles.sidebar}
      >
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{currentUserName}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          <button style={styles.navItem} onClick={() => goTo("/dashboard")}>
            Dashboard
          </button>

          <button style={styles.navItem} onClick={() => goTo("/cases")}>
            Cases
          </button>

          <button style={styles.navItem} onClick={() => goTo("/users")}>
            Users
          </button>

          <button style={styles.navItem} onClick={() => goTo("/reports")}>
            Reports
          </button>

          {userProfile?.role === USER_ROLES.ADMIN && (
            <button style={{ ...styles.navItem, ...styles.navItemActive }}>
              Backup
            </button>
          )}

          <button style={styles.navItem} onClick={() => goTo("/profile")}>
            Profile
          </button>
        </nav>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="profile-main" style={styles.page}>
        <div className="profile-mobile-topbar">
          <button
            className="profile-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            Menu
          </button>

          <span className="profile-mobile-title">Backup</span>
        </div>

        <section className="profile-card" style={styles.card}>
          <div style={styles.header}>
            <h1 className="profile-title" style={styles.title}>
              Backup
            </h1>
            <p style={styles.subtitle}>
              Export a spreadsheet-ready CSV with the details you choose.
            </p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <div style={styles.formPanel}>
            <div style={styles.fieldGroup}>
              <div style={styles.groupTitle}>Data to Export</div>
              <div style={styles.checkboxGrid}>
                {BACKUP_OPTIONS.map((option) => (
                  <label key={option.value} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(option.value)}
                      onChange={() => toggleType(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {(selectedTypes.includes(BACKUP_TYPES.ALL) || selectedTypes.includes(BACKUP_TYPES.USERS)) && (
              <div style={styles.fieldGroup}>
                <div style={styles.groupTitle}>Details to Include</div>
                <div style={styles.checkboxGrid}>
                  {DETAIL_FIELDS.map((field) => (
                    <label key={field.key} style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.key)}
                        onChange={() => toggleField(field.key)}
                      />
                      {field.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? "Preparing..." : "Download CSV Backup"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  layout: {
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
    background: "#fff8ef",
    borderRight: "1px solid #f0e5d8",
    padding: "28px 20px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "42px",
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
    lineHeight: 1.1,
  },

  brandSub: {
    margin: "6px 0 0",
    color: "#e85d04",
    fontSize: "13px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  navItem: {
    border: "none",
    background: "transparent",
    color: "#3d332b",
    padding: "14px 16px",
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

  page: {
    minHeight: "100vh",
    padding: "34px",
    boxSizing: "border-box",
  },

  card: {
    maxWidth: "880px",
    margin: "0 auto",
    background: "white",
    borderRadius: "26px",
    padding: "30px",
    boxShadow: "0 20px 70px rgba(43, 22, 12, 0.06)",
    border: "1px solid #f2e7dc",
  },

  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    marginBottom: "32px",
  },

  title: {
    margin: "0 0 4px",
    color: "#173b2f",
    fontSize: "34px",
    fontWeight: "900",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#6b625c",
    fontSize: "15px",
  },

  formPanel: {
    maxWidth: "520px",
    margin: "0 auto",
    display: "grid",
    gap: "18px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "#2b160c",
    fontWeight: "800",
  },

  fieldGroup: {
    display: "grid",
    gap: "12px",
    padding: "16px",
    border: "1px solid #f0e5d8",
    borderRadius: "18px",
    background: "#fffdf8",
  },

  groupTitle: {
    color: "#2b160c",
    fontSize: "15px",
    fontWeight: "900",
  },

  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#3d332b",
    fontSize: "14px",
    fontWeight: "800",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #eadfd2",
    background: "#fffdf8",
    fontSize: "14px",
    color: "#2b160c",
    caretColor: "#2b160c",
  },

  button: {
    border: "none",
    padding: "13px 24px",
    borderRadius: "14px",
    background: "#f97316",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
  },

  buttonDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },

  successBox: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "16px",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "16px",
  },
};