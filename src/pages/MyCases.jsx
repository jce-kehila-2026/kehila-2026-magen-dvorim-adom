import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { getCasesForUser, closeCase } from "../services/caseService";
import { getAssignmentsByCaseIds, getAssignableUsers } from "../services/assignmentService";
import { getUserById } from "../services/userService";
import { USER_ROLES } from "../services/userSchema";

const CLOSE_STATUS_OPTIONS = [
  { value: "evacuated_by_volunteer", label: "Evacuated by volunteer" },
  { value: "sent_to_chofesh_farm", label: "Sent to Chofesh Farm" },
  { value: "remains_in_place_without_treatment", label: "Remains in place without treatment" },
  // { value: "cancelled", label: "Cancelled" },
];

function MyCases() {
  const { userProfile } = useAuth();
  const [cases, setCases] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coordinatorData, setCoordinatorData] = useState({});

  // State for closing case modal
  const [closingCase, setClosingCase] = useState(null);
  const [closingFormData, setClosingFormData] = useState({
    result_status: "evacuated_by_volunteer",
    result_notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!userProfile?.uid) return;
    loadData();
  }, [userProfile]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      let caseData;

    caseData = await getCasesForUser(userProfile.uid);

    const coordMap = {};
    for (const c of caseData) {
      if (c.coordinator_id && !coordMap[c.coordinator_id]) {
        try {
          const coord = await getUserById(c.coordinator_id);
          coordMap[c.coordinator_id] = coord;
        } catch (err) {
          console.error("Failed to load coordinator info:", err);
        }
      }
    }
    setCoordinatorData(coordMap);

   
    setUsers(await getAssignableUsers());
    setAssignments(await getAssignmentsByCaseIds(caseData.map((item) => item.id)));
  

      setCases(caseData);
    } catch (err) {
      console.error("Failed to load assigned cases:", err);
      setError(err.message || "Unable to load your assigned cases.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCloseCase = (caseItem) => {
    setClosingCase(caseItem);
    setClosingFormData({
      result_status: "evacuated_by_volunteer",
      result_notes: "",
    });
  };

  const handleSubmitCloseCase = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await closeCase({
        case_id: closingCase.id,
        closed_by: userProfile.uid,
        closed_by_full_name: userProfile.full_name,
        result_status: closingFormData.result_status,
        result_notes: closingFormData.result_notes,
      });

      // Reload data
      await loadData();
      setClosingCase(null);
    } catch (err) {
      console.error("Failed to close case:", err);
      alert("Failed to close case: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignedCases = cases.filter((c) => c.status !== "closed");
  const closedCases = cases.filter((c) => c.status === "closed");
  const isVolunteer = userProfile?.role === USER_ROLES.VOLUNTEER;
  const [expandedCases, setExpandedCases] = useState({});

  const toggleExpand = (caseId) => {
    setExpandedCases((prev) => ({ ...prev, [caseId]: !prev[caseId] }));
  };

  return (
    <div>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.panel}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>
                {isVolunteer ? "My Assigned Cases" : "My Cases"}
              </h1>
              <p style={styles.subtitle}>
                {isVolunteer
                  ? "View your assigned cases and submit results when completed."
                  : "Here are the cases where you are assigned as a volunteer."}
              </p>
            </div>
            <div style={styles.meta}>
              <span>{userProfile?.full_name}</span>
              <strong>{userProfile?.role}</strong>
            </div>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {loading && <div style={styles.loading}>Loading your cases…</div>}

          {!loading && !error && cases.length === 0 && (
            <div style={styles.emptyState}>
              <strong>No cases assigned yet.</strong>
              <p>
                {isVolunteer
                  ? "When a coordinator assigns you a case, it will appear here."
                  : "Cases assigned to you will appear here automatically."}
              </p>
            </div>
          )}

          {!loading && cases.length > 0 && (
            <>
              <div style={styles.summaryBar}>
                <div style={styles.summaryCard}>
                  <span style={styles.summaryLabel}>Active</span>
                  <strong>{assignedCases.length}</strong>
                </div>
                <div style={styles.summaryCard}>
                  <span style={styles.summaryLabel}>Closed</span>
                  <strong>{closedCases.length}</strong>
                </div>
              </div>

              {/* Active/Assigned Cases */}
              {assignedCases.length > 0 && (
                <div style={styles.section}>
                  <h2 style={styles.sectionTitle}>Active Cases</h2>
                  <div style={styles.caseGrid}>
                    {assignedCases.map((c) => {
                      const caseAssignments = assignments[c.id] || [];
                      const coordinator = coordinatorData[c.coordinator_id];

                      return (
                        <div key={c.id} style={styles.caseCard}>
                          <div style={styles.caseHeader}>
                            <div>
                              <h2 style={styles.caseTitle}>
                                {c.requester_first_name} {c.requester_last_name}
                              </h2>
                              <p style={styles.caseMeta}>{c.status.toUpperCase()}</p>
                            </div>
                            <span style={styles.caseBadge}>
                              {c.urgency || "normal"}
                            </span>
                          </div>

                          {/* Requester Info */}
                          <div style={styles.caseSection}>
                            <div>
                              <strong>Phone</strong>
                              <p>{c.requester_phone || "—"}</p>
                            </div>
                            <div>
                              <strong>Opened</strong>
                              <p>{formatDate(c.opened_at)}</p>
                            </div>
                          </div>

                          {/* Location Info */}
                          <div style={styles.caseSection}>
                            <div>
                              <strong>Location</strong>
                              <p>
                                {c.street} {c.house_number || ""}, {c.city || ""}
                              </p>
                            </div>
                            <div>
                              <strong>Height from Ground</strong>
                              <p>{c.height_from_ground || "—"} meters</p>
                            </div>
                          </div>

                          <div style={styles.caseSection}>
                            <div>
                              <strong>Floor</strong>
                              <p>{c.floor || "—"}</p>
                            </div>
                            <div>
                              <strong>Complexity</strong>
                              <p>{c.case_complexity || "simple"}</p>
                            </div>
                          </div>

                          {/* Description */}
                          <div style={styles.caseSection}>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <strong>Location Description</strong>
                              <p>{c.location_description || "—"}</p>
                            </div>
                          </div>

                          {/* Coordinator Info (for volunteers) */}
                          { coordinator && (
                            <div
                              style={{
                                ...styles.caseSection,
                                background: "#eef7ee",
                                padding: "12px",
                                borderRadius: "12px",
                                gridColumn: "1 / -1",
                              }}
                            >
                              <div>
                                <strong>Coordinator Name</strong>
                                <p>{coordinator.full_name || "—"}</p>
                              </div>
                              <div>
                                <strong>Coordinator Phone</strong>
                                <p>{coordinator.phone || "—"}</p>
                              </div>
                            </div>
                          )}

                          {/* Assigned Volunteers (for coordinators) */}
                          <div style={styles.caseSection}>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <strong>Assigned Volunteers</strong>
                              {caseAssignments.length === 0 ? (
                                <p>None</p>
                              ) : (
                                <ul style={styles.assignmentList}>
                                  {caseAssignments.map((assignment) => {
                                    const assignedUser = users.find((u) => u.id === assignment.user_id);
                                    return (
                                      <li key={assignment.id} style={styles.assignmentItem}>
                                        <strong>{assignedUser?.full_name || assignedUser?.email || assignment.user_id}</strong>
                                        {assignedUser?.phone && <span> · 📞 {assignedUser.phone}</span>}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          </div>

                          {/* Close Case Button  */}
                          
                            <div style={styles.actions}>
                              <button
                                onClick={() => handleCloseCase(c)}
                                style={styles.closeButton}
                              >
                                Submit Case Results
                              </button>
                            </div>
                          
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Closed Cases */}
              {closedCases.length > 0 && (
                <div style={styles.section}>
                  <h2 style={styles.sectionTitle}>Completed Cases</h2>
                  <div style={styles.caseGrid}>
                    {closedCases.map((c) => {
                      const expanded = Boolean(expandedCases[c.id]);
                      return (
                        <div key={c.id} style={styles.caseCardClosed}>
                          <div style={styles.caseHeader}>
                            <div>
                              <h2 style={styles.caseTitle}>
                                {c.requester_first_name} {c.requester_last_name}
                              </h2>
                              <p style={styles.caseMeta}>CLOSED ✓</p>
                            </div>
                            <span style={styles.caseBadgeSuccess}>
                              {c.result_status || "completed"}
                            </span>
                          </div>

                          {!expanded ? (
                            <>
                              <div style={styles.caseSection}>
                                <div>
                                  <strong>Closed Date</strong>
                                  <p>{formatDate(c.closed_at)}</p>
                                </div>
                                <div>
                                  <strong>Closed By</strong>
                                  <p>{c.closed_by_full_name || "—"}</p>
                                </div>
                              </div>

                              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button
                                  onClick={() => toggleExpand(c.id)}
                                  style={{
                                    padding: "8px 12px",
                                    background: "#1f5a46",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                  }}
                                >
                                  View more
                                </button>
                              </div>
                            </>
                          ) : (<>
                            {/* Closing Info */}
                            <div style={styles.caseSection}>
                              <div>
                                <strong>Closed Date</strong>
                                <p>{formatDate(c.closed_at)}</p>
                              </div>
                              <div>
                                <strong>Closed By</strong>
                                <p>{c.closed_by_full_name || "—"}</p>
                              </div>
                            </div>

                            <div style={styles.caseSection}>
                              <div>
                                <strong>Result Status</strong>
                                <p style={{ color: "#000" }}>
                                  {c.result_status || "—"}
                                </p>
                              </div>
                            </div>

                            {c.result_notes && (
                              <div
                                style={{
                                  ...styles.caseSection,
                                  background: "#fff7e6",
                                  padding: "12px",
                                  borderRadius: "12px",
                                }}
                              >
                                <div style={{ gridColumn: "1 / -1" }}>
                                  <strong>Closing Notes</strong>
                                  <p style={{ color: "#000" }}>{c.result_notes}</p>
                                </div>
                              </div>
                            )}

                            {/* FULL CASE DETAILS */}
                            <div style={styles.caseSection}>
                              <div>
                                <strong>Phone</strong>
                                <p>{c.requester_phone || "—"}</p>
                              </div>
                              <div>
                                <strong>Opened</strong>
                                <p>{formatDate(c.opened_at)}</p>
                              </div>
                            </div>

                            <div style={styles.caseSection}>
                              <div>
                                <strong>Location</strong>
                                <p>
                                  {c.street} {c.house_number || ""}, {c.city || ""}
                                </p>
                              </div>
                              <div>
                                <strong>Height from Ground</strong>
                                <p>{c.height_from_ground || "—"} meters</p>
                              </div>
                            </div>

                            <div style={styles.caseSection}>
                              <div>
                                <strong>Floor</strong>
                                <p>{c.floor || "—"}</p>
                              </div>
                              <div>
                                <strong>Complexity</strong>
                                <p>{c.case_complexity || "simple"}</p>
                              </div>
                            </div>

                            <div style={styles.caseSection}>
                              <div style={{ gridColumn: "1 / -1" }}>
                                <strong>Location Description</strong>
                                <p>{c.location_description || "—"}</p>
                              </div>
                            </div>

                            {/* Collapse button */}
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <button
                                onClick={() => toggleExpand(c.id)}
                                style={{
                                  padding: "8px 12px",
                                  background: "#e0e8e0",
                                  color: "#4f5f58",
                                  border: "none",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                }}
                              >
                                Collapse
                              </button>
                            </div>
                          </>

                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Close Case Modal */}
      {closingCase && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Submit Case Results</h2>
            <p style={styles.modalSubtitle}>
              Case: {closingCase.requester_first_name} {closingCase.requester_last_name}
            </p>

            <form onSubmit={handleSubmitCloseCase} style={styles.form}>
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
                  {CLOSE_STATUS_OPTIONS.map((option) => (
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

const styles = {
  page: {
    padding: "24px 24px 48px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  panel: {
    background: "white",
    borderRadius: "28px",
    boxShadow: "0 32px 90px rgba(0,0,0,0.08)",
    padding: "32px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    marginBottom: "28px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    color: "#173b2f",
  },
  subtitle: {
    margin: "10px 0 0",
    maxWidth: "680px",
    color: "#4f5f58",
    fontSize: "16px",
  },
  meta: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "14px",
    color: "#5f6f68",
  },
  loading: {
    padding: "20px",
    color: "#5f6f68",
  },
  emptyState: {
    padding: "24px",
    borderRadius: "20px",
    background: "#f5f7f5",
    border: "1px solid #dfe7de",
    color: "#4f5f58",
  },
  summaryBar: {
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  summaryCard: {
    flex: "1 1 220px",
    background: "#eef7ee",
    borderRadius: "20px",
    padding: "18px",
    border: "1px solid #cfe8d6",
  },
  summaryLabel: {
    display: "block",
    color: "#5d6f5d",
    marginBottom: "8px",
    fontSize: "14px",
  },
  section: {
    marginBottom: "32px",
  },
  sectionTitle: {
    margin: "0 0 20px",
    fontSize: "20px",
    color: "#173b2f",
    fontWeight: 600,
  },
  caseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  caseCard: {
    background: "#fffdf8",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.06)",
    border: "1px solid #f5e9d1",
  },
  caseCardClosed: {
    background: "#f0f8f0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.04)",
    border: "1px solid #d4e8d4",
    opacity: 0.9,
  },
  caseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
  },
  caseTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#173b2f",
  },
  caseMeta: {
    margin: "6px 0 0",
    color: "#6d4c41",
    fontSize: "0.95em",
  },
  caseBadge: {
    padding: "8px 14px",
    borderRadius: "999px",
    background: "#ffe082",
    color: "#6d4c41",
    fontWeight: 700,
    fontSize: "0.9em",
  },
  caseBadgeSuccess: {
    padding: "8px 14px",
    borderRadius: "999px",
    background: "#a8d5a8",
    color: "#2d5a2d",
    fontWeight: 700,
    fontSize: "0.9em",
  },
  caseSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    marginBottom: "16px",
  },
  assignmentList: {
    margin: "8px 0 0",
    listStyle: "disc",
    paddingLeft: "20px",
    color: "#3e4f3e",
  },
  assignmentItem: {
    marginBottom: "6px",
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
  },
  closeButton: {
    flex: 1,
    padding: "10px 16px",
    background: "#1f5a46",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  errorBox: {
    background: "#fdecea",
    border: "1px solid #f5c6cb",
    color: "#9f3a38",
    borderRadius: "14px",
    padding: "14px 16px",
    marginBottom: "24px",
  },
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  modalTitle: {
    margin: "0 0 8px",
    fontSize: "22px",
    color: "#173b2f",
    fontWeight: 600,
  },
  modalSubtitle: {
    margin: "0 0 24px",
    fontSize: "14px",
    color: "#7f8f7f",
  },
  form: {
    marginTop: "20px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#173b2f",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d9e8d8",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
    background: "white",
    color: "#000000",
    cursor: "pointer",
  },

  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #f3d9a4",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
    resize: "vertical",
    background: "#fffcc0",   // ✅ light orange/yellow
    color: "#000000",        // ✅ black text
  },




  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
  },
  cancelButton: {
    flex: 1,
    padding: "10px 16px",
    background: "#e0e8e0",
    color: "#4f5f58",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  submitButton: {
    flex: 1,
    padding: "10px 16px",
    background: "#1f5a46",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default MyCases;
