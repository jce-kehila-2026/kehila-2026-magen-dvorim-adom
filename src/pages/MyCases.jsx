import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { getCasesForUser } from "../services/caseService";
import { getAssignmentsByCaseIds } from "../services/assignmentService";
import { getAssignableUsers } from "../services/assignmentService";

function MyCases() {
  const { userProfile } = useAuth();
  const [cases, setCases] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userProfile?.uid) return;
    loadData();
  }, [userProfile]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const caseData = await getCasesForUser(userProfile.uid);
      setCases(caseData);
      setUsers(await getAssignableUsers());
      setAssignments(await getAssignmentsByCaseIds(caseData.map((item) => item.id)));
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

  const assignedCases = cases.filter((c) => c.status !== "closed");
  const closedCases = cases.filter((c) => c.status === "closed");

  return (
    <div>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.panel}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>My Assigned Cases</h1>
              <p style={styles.subtitle}>
                Here are the cases where you are responsible as a coordinator or assigned as a volunteer.
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
              <p>Cases assigned to you will appear here automatically.</p>
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

              <div style={styles.caseGrid}>
                {cases.map((c) => {
                  const caseAssignments = assignments[c.id] || [];

                  return (
                    <div key={c.id} style={styles.caseCard}>
                      <div style={styles.caseHeader}>
                        <div>
                          <h2 style={styles.caseTitle}>{c.requester_first_name} {c.requester_last_name}</h2>
                          <p style={styles.caseMeta}>{c.status.toUpperCase()}</p>
                        </div>
                        <span style={styles.caseBadge}>{c.urgency || "normal"}</span>
                      </div>

                      <div style={styles.caseSection}>
                        <div>
                          <strong>Assigned as</strong>
                          <p>{userProfile?.role}</p>
                        </div>
                        <div>
                          <strong>Coordinator</strong>
                          <p>{c.coordinator_id || "—"}</p>
                        </div>
                      </div>

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
                          <p>{c.street} {c.house_number || ""}, {c.city || ""}</p>
                        </div>
                        <div>
                          <strong>Complexity</strong>
                          <p>{c.case_complexity || "simple"}</p>
                        </div>
                      </div>

                      <div style={styles.caseSection}>
                        <div>
                          <strong>Assigned volunteers</strong>
                          {caseAssignments.length === 0 ? (
                            <p>None</p>
                          ) : (
                            <ul style={styles.assignmentList}>
                              {caseAssignments.map((assignment) => {
                                const assignedUser = users.find((u) => u.id === assignment.user_id);
                                return (
                                  <li key={assignment.id} style={styles.assignmentItem}>
                                    {assignedUser?.full_name || assignedUser?.email || assignment.user_id}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>
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
  caseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },
  caseCard: {
    background: "#fffdf8",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.06)",
    border: "1px solid #f5e9d1",
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
  errorBox: {
    background: "#fdecea",
    border: "1px solid #f5c6cb",
    color: "#9f3a38",
    borderRadius: "14px",
    padding: "14px 16px",
    marginBottom: "24px",
  },
};

export default MyCases;
