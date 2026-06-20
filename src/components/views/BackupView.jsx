import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

function serializeForBackup(key, value) {
  if (value?.toDate) {
    return value.toDate().toISOString();
  }

  if (value?.seconds && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString();
  }

  return value;
}

function downloadJsonFile(data, selectedType) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `magen-dvorim-adom-${selectedType}-backup-${timestamp}.json`;
  const json = JSON.stringify(data, serializeForBackup, 2);
  const blob = new Blob([json], { type: "application/json" });
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
  const [selectedType, setSelectedType] = useState(BACKUP_TYPES.ALL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const fetchBackupData = async () => {
    if (selectedType === BACKUP_TYPES.USERS) {
      const result = await getAllUsers(1000);
      return { users: result.users || [] };
    }

    if (selectedType === BACKUP_TYPES.CASES) {
      return { cases: await getAllCases() };
    }

    if (selectedType === BACKUP_TYPES.REPORTS) {
      return { reports: await getReportsStats() };
    }

    const [usersResult, cases, reports] = await Promise.all([
      getAllUsers(1000),
      getAllCases(),
      getReportsStats(),
    ]);

    return {
      users: usersResult.users || [],
      cases,
      reports,
    };
  };

  const handleDownload = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await fetchBackupData();
      const backupPayload = {
        metadata: {
          exported_at: new Date().toISOString(),
          exported_by: userProfile?.uid || null,
          exported_by_email: userProfile?.email || null,
          data_type: selectedType,
        },
        data,
      };

      downloadJsonFile(backupPayload, selectedType);
      setSuccess("Backup file downloaded successfully.");
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
              Export a JSON backup for the selected system data.
            </p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <div style={styles.formPanel}>
            <label style={styles.field}>
              Data Type
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                style={styles.input}
              >
                {BACKUP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? "Preparing..." : "Download JSON Backup"}
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
