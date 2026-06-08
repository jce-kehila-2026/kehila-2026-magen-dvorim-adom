import { useNavigate } from "react-router-dom";
import logo from "../../assets/עברית-logo.png";

function MyCasesView({
  userProfile,
  cases,
  assignments,
  users,
  loading,
  error,
  coordinatorData,
  expandedCases,
  closingCase,
  closingFormData,
  isSubmitting,
  isVolunteer,
  closeStatusOptions,
  setClosingCase,
  setClosingFormData,
  handleCloseCase,
  handleSubmitCloseCase,
  toggleExpand,
  formatDate,
}) {
  const navigate = useNavigate();

  const assignedCases = cases.filter((c) => c.status !== "closed");
  const closedCases = cases.filter((c) => c.status === "closed");

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{userProfile?.role || "User"}</p>
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
            My Cases
          </button>
          <button style={styles.navItem} onClick={() => navigate("/profile")}>
            Profile
          </button>
        </nav>

        <button style={styles.logoutButton} onClick={() => navigate("/")}>
          Logout
        </button>
      </aside>

      <main style={styles.main}>
        <section style={styles.contentCard}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>
                {isVolunteer ? "My Assigned Cases" : "My Cases"}
              </h1>
              <p style={styles.subtitle}>
                {isVolunteer
                  ? "View your assigned rescue cases and submit results when completed."
                  : "Cases assigned to you as a volunteer will appear here."}
              </p>
            </div>

            <div style={styles.metaBox}>
              <span>{userProfile?.full_name || "User"}</span>
              <strong>{userProfile?.role}</strong>
            </div>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {loading && <div style={styles.loading}>Loading your cases…</div>}

          {!loading && !error && cases.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📁</div>
              <h2>No cases assigned yet</h2>
              <p>
                When a coordinator assigns you a case, it will appear here
                automatically.
              </p>
            </div>
          )}

          {!loading && cases.length > 0 && (
            <>
              <section style={styles.summaryBar}>
                <div style={styles.summaryCard}>
                  <span>Active Cases</span>
                  <strong>{assignedCases.length}</strong>
                </div>

                <div style={styles.summaryCard}>
                  <span>Completed Cases</span>
                  <strong>{closedCases.length}</strong>
                </div>
              </section>

              {assignedCases.length > 0 && (
                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>Active Cases</h2>

                  <div style={styles.caseList}>
                    {assignedCases.map((c) => {
                      const caseAssignments = assignments[c.id] || [];
                      const coordinator = coordinatorData[c.coordinator_id];

                      return (
                        <div key={c.id} style={styles.caseItem}>
                          <div>
                            <h3 style={styles.caseTitle}>
                              {c.requester_first_name} {c.requester_last_name}
                            </h3>

                            <p style={styles.caseMeta}>
                              📍 {c.street} {c.house_number || ""},{" "}
                              {c.city || "Unknown"}
                            </p>

                            <p style={styles.caseMeta}>
                              Phone: {c.requester_phone || "—"} · Opened:{" "}
                              {formatDate(c.opened_at)}
                            </p>

                            {coordinator && (
                              <p style={styles.caseMeta}>
                                Coordinator: {coordinator.full_name || "—"} ·{" "}
                                {coordinator.phone || "—"}
                              </p>
                            )}

                            <p style={styles.caseMeta}>
                              Volunteers assigned: {caseAssignments.length}
                            </p>
                          </div>

                          <div style={styles.caseActions}>
                            <span style={getUrgencyBadge(c.urgency)}>
                              {c.urgency || "normal"}
                            </span>

                            <button
                              style={styles.submitButtonSmall}
                              onClick={() => handleCloseCase(c)}
                            >
                              Submit Results
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {closedCases.length > 0 && (
                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>Completed Cases</h2>

                  <div style={styles.caseList}>
                    {closedCases.map((c) => {
                      const expanded = Boolean(expandedCases[c.id]);

                      return (
                        <div key={c.id} style={styles.closedItem}>
                          <div style={styles.closedTop}>
                            <div>
                              <h3 style={styles.caseTitle}>
                                {c.requester_first_name} {c.requester_last_name}
                              </h3>

                              <p style={styles.caseMeta}>
                                Closed: {formatDate(c.closed_at)}
                              </p>

                              <p style={styles.caseMeta}>
                                Result: {c.result_status || "completed"}
                              </p>
                            </div>

                            <button
                              style={styles.viewButton}
                              onClick={() => toggleExpand(c.id)}
                            >
                              {expanded ? "Collapse" : "View Details"}
                            </button>
                          </div>

                          {expanded && (
                            <div style={styles.detailsGrid}>
                              <p>
                                <strong>Phone:</strong>{" "}
                                {c.requester_phone || "—"}
                              </p>
                              <p>
                                <strong>Opened:</strong>{" "}
                                {formatDate(c.opened_at)}
                              </p>
                              <p>
                                <strong>Location:</strong> {c.street}{" "}
                                {c.house_number || ""}, {c.city || ""}
                              </p>
                              <p>
                                <strong>Height:</strong>{" "}
                                {c.height_from_ground || "—"} meters
                              </p>
                              <p>
                                <strong>Floor:</strong> {c.floor || "—"}
                              </p>
                              <p>
                                <strong>Complexity:</strong>{" "}
                                {c.case_complexity || "simple"}
                              </p>
                              <p style={{ gridColumn: "1 / -1" }}>
                                <strong>Description:</strong>{" "}
                                {c.location_description || "—"}
                              </p>
                              {c.result_notes && (
                                <p style={{ gridColumn: "1 / -1" }}>
                                  <strong>Closing Notes:</strong>{" "}
                                  {c.result_notes}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </section>
      </main>

      {closingCase && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Submit Case Results</h2>
            <p style={styles.modalSubtitle}>
              Case: {closingCase.requester_first_name}{" "}
              {closingCase.requester_last_name}
            </p>

            <form onSubmit={handleSubmitCloseCase}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Result Status *</label>
                <select
                  value={closingFormData.result_status}
                  onChange={(e) =>
                    setClosingFormData({
                      ...closingFormData,
                      result_status: e.target.value,
                    })
                  }
                  style={styles.select}
                  required
                >
                  {closeStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Closing Notes</label>
                <textarea
                  value={closingFormData.result_notes}
                  onChange={(e) =>
                    setClosingFormData({
                      ...closingFormData,
                      result_notes: e.target.value,
                    })
                  }
                  placeholder="Describe what happened during this rescue operation..."
                  style={styles.textarea}
                  rows={4}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setClosingCase(null)}
                  style={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Results"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const getUrgencyBadge = (urgency) => ({
  ...styles.badge,
  ...(urgency === "high"
    ? styles.highBadge
    : urgency === "medium"
    ? styles.mediumBadge
    : styles.lowBadge),
});

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
    border: "1px solid #ffb077",
    background: "white",
    color: "#e85d04",
    fontWeight: "800",
    cursor: "pointer",
  },
  main: {
    padding: "34px",
    boxSizing: "border-box",
  },
  contentCard: {
    background: "#ffffff",
    borderRadius: "26px",
    padding: "34px",
    boxShadow: "0 20px 70px rgba(43, 22, 12, 0.06)",
    border: "1px solid #f2e7dc",
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
    fontSize: "32px",
    fontWeight: "900",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#6b625c",
    fontSize: "15px",
  },
  metaBox: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    color: "#6b625c",
    fontSize: "14px",
    textAlign: "right",
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
    padding: "20px",
    color: "#6b625c",
  },
  emptyState: {
    textAlign: "center",
    padding: "44px 24px",
    borderRadius: "20px",
    background: "#fffdf8",
    border: "1px solid #f0e5d8",
    color: "#6b625c",
  },
  emptyIcon: {
    fontSize: "34px",
    marginBottom: "12px",
  },
  summaryBar: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "28px",
  },
  summaryCard: {
    background: "#fff8ef",
    border: "1px solid #f0e5d8",
    borderRadius: "18px",
    padding: "20px",
  },
  section: {
    marginTop: "28px",
  },
  sectionTitle: {
    margin: "0 0 16px",
    color: "#2b160c",
    fontSize: "20px",
    fontWeight: "900",
  },
  caseList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  caseItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    padding: "18px",
    borderRadius: "18px",
    border: "1px solid #f1ebe5",
    background: "#fffdf8",
  },
  closedItem: {
    padding: "18px",
    borderRadius: "18px",
    border: "1px solid #f1ebe5",
    background: "#fffdf8",
  },
  closedTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
  },
  caseTitle: {
    margin: 0,
    color: "#1f2937",
    fontSize: "17px",
    fontWeight: "900",
  },
  caseMeta: {
    margin: "7px 0 0",
    color: "#6b625c",
    fontSize: "14px",
  },
  caseActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px",
  },
  badge: {
    width: "fit-content",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "12px",
    textTransform: "capitalize",
  },
  highBadge: { background: "#fee2e2", color: "#dc2626" },
  mediumBadge: { background: "#fff3e6", color: "#d95f00" },
  lowBadge: { background: "#eef8ef", color: "#16803d" },
  submitButtonSmall: {
    border: "1px solid #f3c49a",
    background: "#fff8ef",
    color: "#d95f00",
    borderRadius: "10px",
    padding: "8px 13px",
    fontWeight: "800",
    cursor: "pointer",
  },
  viewButton: {
    border: "1px solid #ddd6ce",
    background: "white",
    color: "#3d332b",
    borderRadius: "10px",
    padding: "8px 13px",
    fontWeight: "800",
    cursor: "pointer",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 18px",
    marginTop: "18px",
    color: "#2b160c",
    fontSize: "14px",
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
  modal: {
    width: "100%",
    maxWidth: "520px",
    background: "white",
    borderRadius: "22px",
    padding: "28px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
  },
  modalTitle: {
    margin: "0 0 8px",
    color: "#2b160c",
    fontSize: "22px",
    fontWeight: "900",
  },
  modalSubtitle: {
    margin: "0 0 24px",
    color: "#6b625c",
    fontSize: "14px",
  },
  formGroup: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#2b160c",
    fontSize: "14px",
    fontWeight: "800",
  },
  select: {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid #eadfd2",
    borderRadius: "12px",
    background: "white",
    color: "#1f2937",
  },
  textarea: {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid #eadfd2",
    borderRadius: "12px",
    background: "#fffdf8",
    color: "#1f2937",
    resize: "vertical",
    boxSizing: "border-box",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
  },
  cancelButton: {
    flex: 1,
    padding: "10px 16px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },
  submitButton: {
    flex: 1,
    padding: "10px 16px",
    background: "#ea580c",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },
};

export default MyCasesView;