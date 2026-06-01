import { useEffect, useState } from "react";
import {
  getCasesForVolunteer,
  updateCaseStatus,
} from "../services/caseService";
import { getUserByPhone } from "../services/userService";
import {
  getAssignmentsByCaseIds,
  getAssignableUsers,
} from "../services/assignmentService";

function VolunteerCases() {
  const [phone, setPhone] = useState("");
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [volunteerId, setVolunteerId] = useState(null);
  const [volunteerInfo, setVolunteerInfo] = useState(null);
  const [closingCase, setClosingCase] = useState({ caseId: null, result_status: "evacuated_by_volunteer", notes: "" });
  const [showClosedHistory, setShowClosedHistory] = useState(false);
  const [historyPhoneSearch, setHistoryPhoneSearch] = useState("");

  // ✅ Volunteers CANNOT close cases with "cancelled" status
  const FINISHING_STATUSES = [
    { value: "evacuated_by_volunteer", label: "Evacuated by a volunteer" },
    { value: "sent_to_chofesh_farm", label: "Sent to Chofesh Farm" },
    { value: "remains_in_place_without_treatment", label: "Remains in place without treatment" },
  ];

  const getResultLabel = (value) => {
    const option = FINISHING_STATUSES.find((item) => item.value === value);
    return option ? option.label : value || "Not specified";
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("he-IL", { 
      year: "numeric", 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const activeCases = cases.filter((c) => c.status !== "closed");
  const closedCases = cases.filter((c) => c.status === "closed");
  const filteredClosedCases = closedCases.filter((c) =>
    historyPhoneSearch.trim() === ""
      ? true
      : c.requester_phone?.toLowerCase().includes(historyPhoneSearch.trim().toLowerCase())
  );

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await getAssignableUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCases = async () => {
    setError("");
    setLoading(true);

    try {
      const volunteer = await getUserByPhone(phone);
      setVolunteerId(volunteer.id);
      setVolunteerInfo(volunteer);

      const data = await getCasesForVolunteer(volunteer.id);
      setCases(data);

      const assignmentMap = await getAssignmentsByCaseIds(data.map((item) => item.id));
      setAssignments(assignmentMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!phone) return;
    await loadCases();
    await loadUsers();
  };

  const beginCloseCase = (caseId) => {
    setClosingCase({ caseId, result_status: "evacuated_by_volunteer", notes: "" });
  };

  const cancelCloseCase = () => {
    setClosingCase({ caseId: null, result_status: "evacuated_by_volunteer", notes: "" });
  };

  const confirmCloseCase = async () => {
    setError("");

    try {
      await updateCaseStatus(closingCase.caseId, "closed", {
        result_status: closingCase.result_status,
        result_notes: closingCase.notes || null,
        closed_by: volunteerInfo ? {
          user_id: volunteerId,
          full_name: volunteerInfo.full_name || volunteerInfo.email,
          role: "volunteer",
        } : null,
      });

      cancelCloseCase();
      await refreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  const isValidUrl = (value) => {
    if (!value) return false;
    try {
      new URL(value);
      return true;
    } catch (err) {
      return false;
    }
  };

  return (
    <div style={{ maxWidth: "980px", margin: "40px auto", padding: "32px", background: "linear-gradient(180deg, #fffdf3 0%, #fff7e0 100%)", borderRadius: 28, boxShadow: "0 32px 90px rgba(0,0,0,0.08)" }}>
      <div style={{ marginBottom: "12px" }}>
        <h1 style={{ margin: "0 0 8px", color: "#f57c00", fontSize: "2.6rem" }}>🐝 My Assigned Cases</h1>
        <p style={{ margin: 0, color: "#6b4f00", lineHeight: 1.6 }}>
          View your assigned cases, close them when completed, and track your history.
        </p>
      </div>

      <div style={{ marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <input
          placeholder="Your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ marginRight: "10px", padding: "14px 16px", width: "260px", borderRadius: 14, border: "2px solid #ffd54f", background: "#fffef5", color: "#333", boxShadow: "0 12px 24px rgba(255, 193, 7, 0.14)" }}
        />
        <button
          onClick={loadCases}
          disabled={loading}
          style={{ padding: "14px 22px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #ffb300 0%, #fb8c00 100%)", color: "#fff", cursor: "pointer", fontWeight: 700, boxShadow: "0 12px 24px rgba(255, 152, 0, 0.18)" }}
        >
          {loading ? "Loading..." : "Load My Cases"}
        </button>
      </div>

      {cases.length > 0 && (
        <div style={{ marginBottom: "22px", display: "flex", flexWrap: "wrap", gap: "12px", color: "#5d4037" }}>
          <div style={{ padding: "10px 14px", borderRadius: 16, background: "#fff4e0", border: "1px solid #ffd54f", fontWeight: 700 }}>
            Active cases: {activeCases.length}
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 16, background: "#fff4e0", border: "1px solid #ffd54f", fontWeight: 700 }}>
            Closed cases: {closedCases.length}
          </div>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {cases.length === 0 && !error && (
        <p>No cases loaded yet. Enter your phone number and click Load My Cases.</p>
      )}

      {activeCases.length === 0 && closedCases.length > 0 && !error && (
        <p>All your cases are closed. Expand your closed case history below to review them.</p>
      )}

      {activeCases.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", justifyContent: "center", alignItems: "flex-start", marginBottom: "30px" }}>
          {activeCases.map((c) => (
            <div
              key={c.id}
              style={{
                border: "1px solid rgba(255, 193, 7, 0.35)",
                padding: "18px",
                marginBottom: "18px",
                borderRadius: "22px",
                background: "#fffdf4",
                boxShadow: "0 14px 30px rgba(255, 152, 0, 0.12)",
                minWidth: "220px",
                maxWidth: "340px",
                flex: "1 1 240px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, color: "#ff6f00" }}>🐝 Case Details</h3>
                <span style={{ background: c.status === "assigned" ? "#ffd54f" : "#ffe082", padding: "6px 12px", borderRadius: 20, fontWeight: 600, fontSize: "0.85em", color: "#e65100" }}>
                  {c.status.toUpperCase()}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "16px", fontSize: "0.95em" }}>
                <div>
                  <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Requester:</strong></p>
                  <p style={{ margin: "0 0 8px 0", color: "#333" }}>{c.requester_first_name} {c.requester_last_name}</p>
                  <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Phone:</strong></p>
                  <p style={{ margin: "0 0 8px 0", color: "#333" }}>{c.requester_phone}</p>
                  <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Urgency:</strong></p>
                  <p style={{ margin: "0 0 8px 0", color: "#d84315", fontWeight: 600 }}>
                    {c.urgency ? c.urgency.toUpperCase() : "Not specified"}
                  </p>
                  <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Opened:</strong></p>
                  <p style={{ margin: "0", color: "#333", fontSize: "0.9em" }}>{formatDate(c.opened_at)}</p>
                </div>
              </div>

              <div style={{ background: "#fff8e1", padding: "12px", borderRadius: 8, marginBottom: "16px", borderLeft: "4px solid #ffd54f" }}>
                <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>📍 Location:</strong></p>
                <p style={{ margin: "4px 0", color: "#333" }}>
                  {c.street} {c.house_number && <span>#{c.house_number}</span>}, {c.city}
                </p>
                {c.location_description && (
                  <>
                    <p style={{ margin: "8px 0 4px 0" }}><strong style={{ color: "#e65100" }}>Description:</strong></p>
                    <p style={{ margin: "4px 0", color: "#333" }}>{c.location_description}</p>
                  </>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px", fontSize: "0.9em", background: "#fff5e6", padding: "10px", borderRadius: 6 }}>
                <div>
                  <p style={{ margin: "2px 0", color: "#666", fontSize: "0.8em" }}><strong>Height</strong></p>
                  <p style={{ margin: "0", color: "#ff6f00", fontWeight: 600 }}>{c.height_from_ground}m</p>
                </div>
                <div>
                  <p style={{ margin: "2px 0", color: "#666", fontSize: "0.8em" }}><strong>Floor</strong></p>
                  <p style={{ margin: "0", color: "#ff6f00", fontWeight: 600 }}>{c.floor}</p>
                </div>
                <div>
                  <p style={{ margin: "2px 0", color: "#666", fontSize: "0.8em" }}><strong>First Seen</strong></p>
                  <p style={{ margin: "0", color: "#ff6f00", fontWeight: 600 }}>{c.first_seen ? c.first_seen.replace(/_/g, " ") : "—"}</p>
                </div>
              </div>

              {c.navigation_link && (
                <div style={{ marginBottom: "16px", background: "#f5f5f5", padding: "12px", borderRadius: 8, borderLeft: "4px solid #ff9800" }}>
                  <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "#e65100" }}>🗺 Navigation Link</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isValidUrl(c.navigation_link) ? (
                      <a href={c.navigation_link} target="_blank" rel="noopener noreferrer" style={{ color: "#ff6f00", fontWeight: 600, textDecoration: "none", wordBreak: "break-all", flex: 1 }}>
                        {c.navigation_link}
                      </a>
                    ) : (
                      <div style={{ flex: 1, color: "#b71c1c", fontWeight: 600, wordBreak: "break-all" }}>
                        {c.navigation_link}
                        <span style={{ display: "block", marginTop: "4px", color: "#d84315", fontSize: "0.9em" }}>Invalid link format</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(c.navigation_link);
                        alert("Link copied!");
                      }}
                      style={{ padding: "6px 12px", background: "#ff9800", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}

              {closingCase.caseId === c.id ? (
                <div style={{ marginTop: "18px", padding: "16px", background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: 10 }}>
                  <p style={{ margin: "0 0 10px 0", fontWeight: 700, color: "#d84315" }}>Select a finishing result before closing</p>
                  <div style={{ marginBottom: "10px" }}>
                    <select
                      value={closingCase.result_status}
                      onChange={(e) => setClosingCase((prev) => ({ ...prev, result_status: e.target.value }))}
                      style={{ width: "100%", padding: "10px", borderRadius: 8, border: "2px solid #ff9800", background: "#fff", color: "#000", fontWeight: 600, cursor: "pointer" }}
                    >
                      {FINISHING_STATUSES.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", marginBottom: "6px", color: "#e65100", fontWeight: 600 }}>Closing notes (optional)</label>
                    <textarea
                      rows={3}
                      value={closingCase.notes}
                      onChange={(e) => setClosingCase((prev) => ({ ...prev, notes: e.target.value }))}
                      style={{ width: "100%", padding: "10px", borderRadius: 8, border: "2px solid #ffe082", background: "#fffef5", color: "#000" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                      onClick={cancelCloseCase}
                      style={{ padding: "10px 18px", borderRadius: 8, background: "#e0e0e0", border: "none", cursor: "pointer", fontWeight: 600, color: "#333" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmCloseCase}
                      style={{ padding: "10px 18px", borderRadius: 8, background: "linear-gradient(135deg, #f44336 0%, #c62828 100%)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      ✕ Close Case
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: "18px" }}>
                  <button
                    onClick={() => beginCloseCase(c.id)}
                    style={{ padding: "10px 24px", borderRadius: 8, background: "linear-gradient(135deg, #f44336 0%, #c62828 100%)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)", transition: "all 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    ✕ Close Case
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {closedCases.length > 0 && (
        <div style={{ marginTop: "30px", padding: "18px", background: "#fff7e5", borderRadius: 12, border: "2px solid #ffd180" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "14px" }}>
            <button
              onClick={() => setShowClosedHistory((prev) => !prev)}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "#ffb74d",
                color: "#5d4037",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {showClosedHistory ? "Hide" : "Show"} closed case history ({closedCases.length})
            </button>
            <input
              placeholder="Search history by requester phone"
              value={historyPhoneSearch}
              onChange={(e) => setHistoryPhoneSearch(e.target.value)}
              style={{ flex: "1 1 220px", minWidth: "220px", padding: "12px 14px", borderRadius: 12, border: "2px solid #ffcc80", background: "#fffdf6", color: "#333" }}
            />
          </div>

          {showClosedHistory && filteredClosedCases.length === 0 && (
            <p style={{ margin: 0, color: "#6d4c41" }}>No closed cases match that requester phone.</p>
          )}

          {showClosedHistory && filteredClosedCases.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", justifyContent: "center" }}>
              {filteredClosedCases.map((c) => (
                <div
                  key={c.id}
                  style={{
                    border: "2px solid #ffcc80",
                    padding: "14px",
                    marginBottom: "16px",
                    borderRadius: "18px",
                    background: "#fff8e1",
                    minWidth: "220px",
                    maxWidth: "340px",
                    flex: "1 1 240px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                    <h3 style={{ margin: 0, color: "#ff6f00" }}>🐝 Closed Case</h3>
                    <span style={{ background: "#ccc", padding: "6px 12px", borderRadius: 20, fontWeight: 600, fontSize: "0.85em", color: "#666" }}>
                      CLOSED
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "16px", fontSize: "0.95em" }}>
                    <div>
                      <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Requester:</strong></p>
                      <p style={{ margin: "0 0 8px 0", color: "#333" }}>{c.requester_first_name} {c.requester_last_name}</p>
                      <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Phone:</strong></p>
                      <p style={{ margin: "0 0 8px 0", color: "#333" }}>{c.requester_phone}</p>
                      <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Urgency:</strong></p>
                      <p style={{ margin: "0 0 8px 0", color: "#d84315", fontWeight: 600 }}>
                        {c.urgency ? c.urgency.toUpperCase() : "Not specified"}
                      </p>
                      <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Opened:</strong></p>
                      <p style={{ margin: "0 0 8px 0", color: "#333", fontSize: "0.9em" }}>{formatDate(c.opened_at)}</p>
                      <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Closed:</strong></p>
                      <p style={{ margin: "0 0 8px 0", color: "#333", fontSize: "0.9em" }}>{formatDate(c.closed_at)}</p>
                      {c.closed_by && (
                        <>
                          <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Closed by:</strong></p>
                          <p style={{ margin: "0", color: "#333", fontSize: "0.9em" }}>{c.closed_by.full_name} ({c.closed_by.role})</p>
                        </>
                      )}
                      <p style={{ margin: "8px 0 4px 0" }}><strong style={{ color: "#e65100" }}>Result:</strong></p>
                      <p style={{ margin: "0", color: "#4a148c", fontWeight: 700 }}>
                        {getResultLabel(c.result_status)}
                      </p>
                    </div>
                  </div>

                  <div style={{ background: "#fff8e1", padding: "12px", borderRadius: 8, marginBottom: "16px", borderLeft: "4px solid #ffd54f" }}>
                    <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>📍 Location:</strong></p>
                    <p style={{ margin: "4px 0", color: "#333" }}>
                      {c.street} {c.house_number && <span>#{c.house_number}</span>}, {c.city}
                    </p>
                    {c.location_description && (
                      <>
                        <p style={{ margin: "8px 0 4px 0" }}><strong style={{ color: "#e65100" }}>Description:</strong></p>
                        <p style={{ margin: "4px 0", color: "#333" }}>{c.location_description}</p>
                      </>
                    )}
                  </div>

                  {c.result_notes && (
                    <div style={{ marginTop: "16px", padding: "12px", background: "#fff3e0", borderRadius: 8, border: "1px solid #ffd54f" }}>
                      <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#bf360c" }}>Closing notes</p>
                      <p style={{ margin: 0, color: "#333" }}>{c.result_notes}</p>
                    </div>
                  )}

                  <div style={{ marginTop: "12px", padding: "10px", background: "#e8f5e9", borderRadius: 8, border: "1px solid #c8e6c9", textAlign: "center" }}>
                    <p style={{ margin: 0, color: "#2e7d32", fontSize: "0.9em", fontWeight: 600 }}>
                      ✓ Closed by {c.closed_by?.full_name || "Unknown"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VolunteerCases;
