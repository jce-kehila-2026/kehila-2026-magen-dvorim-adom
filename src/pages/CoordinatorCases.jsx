import { recommendVolunteersForCase } from "../services/recommendationService";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import {
  getCasesForCoordinatorById,
  getAllCases,
  updateCaseStatus,
  updateCaseCoordinator,
  updateCaseComplexity,
  attachFeedbackToken,
} from "../services/caseService";
import { getUsersByRole } from "../services/userService";
import {
  getAssignableUsers,
  getAssignmentsByCaseIds,
  assignUserToCase,
  removeAssignment,
  reopenCaseAndCleanConflicts,
} from "../services/assignmentService";
import { generateToken } from "../utils/generateToken";

function CoordinatorCases() {
  const { userProfile } = useAuth();
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [assignmentInputs, setAssignmentInputs] = useState({});
  const [coordinatorSelections, setCoordinatorSelections] = useState({});
  const [coordinatorList, setCoordinatorList] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [modalState, setModalState] = useState({ open: false, caseId: null, userId: "", selected: [], other: "", notes: "" });
  const [userSearch, setUserSearch] = useState("");
  const [editingComplexity, setEditingComplexity] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  const currentUserId = userProfile?.uid || null;
  const currentUserRole = userProfile?.role || "";
  const [closingCase, setClosingCase] = useState({ caseId: null, result_status: "evacuated_by_volunteer", notes: "" });
  const [showClosedHistory, setShowClosedHistory] = useState(false);
  const [historyPhoneSearch, setHistoryPhoneSearch] = useState("");

  const PRESET_EQUIPMENT = ["ladder", "net", "bee house"];
  const caseCardBase = {
    border: "1px solid rgba(255, 193, 7, 0.35)",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "18px",
    background: "#fffdf4",
    boxShadow: "0 8px 18px rgba(255, 152, 0, 0.12)",
    minWidth: "180px",
    maxWidth: "240px",
    flex: "1 1 200px",
    fontSize: "0.9em",
  };
  const compactInfoGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "8px",
    marginBottom: "8px",
  };
  const compactPanel = {
    padding: "8px",
    borderRadius: "14px",
    background: "#fff8e1",
    border: "1px solid #ffe082",
    marginBottom: "10px",
  };
  const FINISHING_STATUSES = [
    { value: "evacuated_by_volunteer", label: "Evacuated by a volunteer" },
    { value: "sent_to_chofesh_farm", label: "Sent to Chofesh Farm" },
    { value: "remains_in_place_without_treatment", label: "Remains in place without treatment" },
    { value: "cancelled", label: "Cancelled" },
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

  const activeCaseIds = new Set(cases.filter((c) => c.status !== "closed").map((c) => c.id));
  const assignedUserIds = Object.entries(assignments).reduce((acc, [caseId, arr]) => {
    if (!activeCaseIds.has(caseId) || !Array.isArray(arr)) return acc;
    return acc.concat(arr.map((item) => item.user_id));
  }, []);

  const isValidUrl = (value) => {
    if (!value) return false;
    try {
      new URL(value);
      return true;
    } catch (err) {
      return false;
    }
  };

  const filteredUsersForModal = users
    .filter((u) => !assignedUserIds.includes(u.id))
    .filter((u) => {
      const fullName = `${u.full_name || ""} ${u.email || ""}`.toLowerCase();
      return fullName.includes(userSearch.toLowerCase());
    });

  const activeCases = cases.filter((c) => c.status !== "closed");
  const closedCases = cases.filter((c) => c.status === "closed");
  const openCaseCount = cases.filter((c) => c.status === "open").length;
  const assignedCaseCount = cases.filter((c) => c.status === "assigned").length;
  const filteredClosedCases = closedCases.filter((c) =>
    historyPhoneSearch.trim() === ""
      ? true
      : c.requester_phone?.toLowerCase().includes(historyPhoneSearch.trim().toLowerCase())
  );

  useEffect(() => {
    if (!currentUserId) return;
    loadUsers();
    loadCases();
  }, [currentUserId, currentUserRole]);

  // lock body scroll when modal is open
  useEffect(() => {
    if (modalState.open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [modalState.open]);

  const loadUsers = async () => {
    try {
      const allUsers = await getAssignableUsers();
      setUsers(allUsers);

      if (currentUserRole === "admin") {
        const coordinators = await getUsersByRole("coordinator");
        setCoordinatorList(coordinators || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCases = async () => {
    setError("");
    setLoading(true);

    try {
      let data = [];

      if (currentUserRole === "admin") {
        data = await getAllCases();
      } else if (currentUserRole === "coordinator") {
        data = await getCasesForCoordinatorById(currentUserId);
      }

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
    await loadCases();
    await loadUsers();
  };

  const handleStatusChange = async (caseId, newStatus) => {
    setError("");

    if (newStatus === "closed") {
      const confirmed = window.confirm(
        "Are you sure you want to close this case? It will move to your closed history and assigned volunteers cannot be removed until you reopen it."
      );
      if (!confirmed) return;
    }

    try {
      await updateCaseStatus(caseId, newStatus);
      await loadCases();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCoordinatorChange = async (caseId, newCoordinatorId) => {
    setError("");
    if (!newCoordinatorId) {
      setError("Please select a coordinator.");
      return;
    }

    try {
      await updateCaseCoordinator(caseId, newCoordinatorId);
      await loadCases();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleComplexityChange = async (caseId, newComplexity) => {
    setError("");

    try {
      await updateCaseComplexity(caseId, newComplexity);
      setEditingComplexity(null);
      await loadCases();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendFeedback = async (caseItem) => {
    try {
      let token = caseItem.feedback_token;

      //  don't recreate if already exists
      if (!token) {
        token = generateToken();
        await attachFeedbackToken(caseItem.id, token);
      }

      const link = `${window.location.origin}/feedback?token=${token}`;

      await navigator.clipboard.writeText(link);

      alert("Feedback link copied ");
    } catch (err) {
      console.error(err);
      alert("Failed to generate feedback link");
    }
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
        closed_by: {
          user_id: userProfile?.uid || null,
          full_name: userProfile?.full_name || userProfile?.email || "Unknown",
          role: userProfile?.role || "coordinator",
        },
      });

      cancelCloseCase();
      await loadCases();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReopenCase = async (caseId) => {
    setError("");

    try {
      const removed = await reopenCaseAndCleanConflicts(caseId);
      await loadCases();

      if (removed.length) {
        const names = removed.map((item) => {
          const user = users.find((u) => u.id === item.user_id);
          return user?.full_name || user?.email || item.user_id;
        });
        window.alert(
          `The following volunteer(s) already have another open case and were removed from this reopened case:\n- ${names.join("\n- ")}`
        );
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const updateInput = (caseId, field, value) => {
    setAssignmentInputs((prev) => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        [field]: value,
      },
    }));
  };

  const handleAssign = async (caseId) => {
    setError("");
    const input = assignmentInputs[caseId] || {};

    if (!input.userId) {
      setError("Please select a user before assigning.");
      return;
    }

    try {
      const equipment = input.equipment
        ? input.equipment
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      await assignUserToCase({
        case_id: caseId,
        user_id: input.userId,
        assigned_by: currentUserId,
        required_equipment: equipment,
        notes: input.notes || null,
      });

      setAssignmentInputs((prev) => ({
        ...prev,
        [caseId]: {
          equipment: "",
          notes: "",
          userId: "",
        },
      }));

      await refreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignFromModal = async () => {
    if (assigning) return;
    setError("");
    const { caseId, userId, selected, other, notes } = modalState;

    if (!caseId || !userId) {
      setError("Please select a valid case and volunteer before assigning.");
      return;
    }

    setAssigning(true);
    try {
      const equipment = [
        ...selected,
        ...(other ? other.split(",").map((s) => s.trim()).filter(Boolean) : []),
      ];

      await assignUserToCase({
        case_id: caseId,
        user_id: userId,
        assigned_by: currentUserId,
        required_equipment: equipment,
        notes: notes || null,
      });

      setModalState({ open: false, caseId: null, userId: "", selected: [], other: "", notes: "" });
      setUserSearch("");
      await refreshData();
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };
  const handleGetRecommendations = (caseItem) => {
  const result = recommendVolunteersForCase({
    caseItem,
    users,
    assignedUserIds,
  });

  setRecommendations(result);
};

  const handleRemoveAssignment = async (assignmentId, caseId) => {
    setError("");

    try {
      await removeAssignment(assignmentId, caseId);
      await refreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "980px", margin: "40px auto", padding: "32px", background: "linear-gradient(180deg, #fffdf3 0%, #fff7e0 100%)", borderRadius: 28, boxShadow: "0 32px 90px rgba(0,0,0,0.08)" }}>
      <div style={{ marginBottom: "12px" }}>
        <h1 style={{ margin: "0 0 8px", color: "#f57c00", fontSize: "2.6rem" }}>
          {currentUserRole === "admin" ? "All Coordinator Cases" : "My Coordinator Cases"}
        </h1>
        <p style={{ margin: 0, color: "#6b4f00", lineHeight: 1.6 }}>
          {currentUserRole === "admin"
            ? "View every coordinator case in the system, and reassign or manage responsibility across coordinators."
            : "Your cases are shown here automatically, based on your coordinator account."}
        </p>
      </div>

      <div style={{ marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <div style={{ flex: "1 1 220px", minWidth: "240px", padding: "16px", borderRadius: 18, background: "#fff9e6", border: "1px solid #ffe082", color: "#5d4037" }}>
          {currentUserRole === "admin"
            ? "Admin view: all coordinator cases are shown here. You can reassign the responsible coordinator for each case."
            : "Your coordinator cases are loaded automatically from your account."}
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          style={{ padding: "14px 22px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)", color: "#fff", cursor: "pointer", fontWeight: 700, boxShadow: "0 12px 24px rgba(76, 175, 80, 0.18)" }}
        >
          {loading ? "Refreshing..." : "Refresh Cases"}
        </button>
      </div>

      {cases.length > 0 && (
        <div style={{ marginBottom: "22px", display: "flex", flexWrap: "wrap", gap: "12px", color: "#5d4037" }}>
          <div style={{ padding: "10px 14px", borderRadius: 16, background: "#fff4e0", border: "1px solid #ffd54f", fontWeight: 700 }}>
            Open cases: {openCaseCount}
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 16, background: "#fff4e0", border: "1px solid #ffd54f", fontWeight: 700 }}>
            Assigned cases: {assignedCaseCount}
          </div>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {cases.length === 0 && !error && (
        <p>No cases found yet. If you are a coordinator, your assigned cases will appear automatically. If you are an admin, there may be no coordinator cases in the system.</p>
      )}

      {activeCases.length === 0 && closedCases.length > 0 && !error && (
        <p>All active cases are closed. Expand your closed case history below to review them.</p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", justifyContent: "center", alignItems: "flex-start" }}>
        {activeCases.map((c) => {
          const caseAssignments = assignments[c.id] || [];
          const availableUsers = users.filter((user) => !assignedUserIds.includes(user.id));
          const input = assignmentInputs[c.id] || {};
          const assignedCoordinator = users.find((user) => user.id === c.coordinator_id);

          return (
            <div key={c.id} style={caseCardBase}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
              <h3 style={{ margin: 0, color: "#ff6f00", fontSize: "1.05rem" }}>🐝 Case Details</h3>
              <span style={{ background: c.status === "closed" ? "#ccc" : c.status === "assigned" ? "#ffd54f" : "#ffe082", padding: "6px 10px", borderRadius: 18, fontWeight: 600, fontSize: "0.78em", color: c.status === "closed" ? "#666" : "#e65100" }}>
                {c.status.toUpperCase()}
              </span>
            </div>
            <div style={{ marginBottom: "8px", color: "#5d4037", fontSize: "0.9em" }}>
              Assigned coordinator: <strong>{assignedCoordinator ? assignedCoordinator.full_name || assignedCoordinator.email : c.coordinator_id || "None"}</strong>
            </div>
            {currentUserRole === "admin" && (
              <div style={{ ...compactPanel, marginBottom: "10px" }}>
                <label style={{ display: "grid", gap: "8px", fontSize: "0.95em", color: "#5d4037" }}>
                  Responsible coordinator
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                      value={coordinatorSelections[c.id] || c.coordinator_id || ""}
                      onChange={(e) => setCoordinatorSelections((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      style={{ flex: "1 1 220px", padding: "10px 14px", borderRadius: 10, border: "1px solid #d9b56f", background: "#fff", color: "#333" }}
                    >
                      <option value="">Select coordinator</option>
                      {coordinatorList.map((coord) => (
                        <option key={coord.uid} value={coord.uid}>
                          {coord.full_name || coord.email}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleCoordinatorChange(c.id, coordinatorSelections[c.id] || c.coordinator_id)}
                      style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#fb8c00", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                    >
                      Save
                    </button>
                  </div>
                </label>
              </div>
            )}

            <div style={{ ...compactInfoGrid, fontSize: "0.9em", marginBottom: "10px" }}>
              <div>
                <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Requester:</strong></p>
                <p style={{ margin: "0 0 8px 0", color: "#333" }}>{c.requester_first_name} {c.requester_last_name}</p>
                <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Phone:</strong></p>
                <p style={{ margin: "0 0 8px 0", color: "#333" }}>{c.requester_phone}</p>
                <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Opened:</strong></p>
                <p style={{ margin: "0 0 8px 0", color: "#333", fontSize: "0.9em" }}>{formatDate(c.opened_at)}</p>
              </div>
              <div>
                <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Urgency:</strong></p>
                <p style={{ margin: "0 0 8px 0", color: "#d84315", fontWeight: 600 }}>
                  {c.urgency ? c.urgency.toUpperCase() : "Not specified"}
                </p>
                <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Complexity:</strong></p>
                {editingComplexity === c.id ? (
                  <select
                    value={c.case_complexity || "simple"}
                    onChange={(e) => handleComplexityChange(c.id, e.target.value)}
                    style={{ padding: "6px", borderRadius: 4, border: "2px solid #ff9800", background: "#fff", color: "#333", fontWeight: 600, cursor: "pointer" }}
                  >
                    <option value="simple">Simple</option>
                    <option value="complex">Complex</option>
                    <option value="very_complex">Very Complex</option>
                  </select>
                ) : (
                  <p
                    onClick={() => setEditingComplexity(c.id)}
                    style={{ margin: "0", color: "#333", padding: "4px 8px", background: "#fff9e6", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}
                  >
                    {c.case_complexity ? c.case_complexity.charAt(0).toUpperCase() + c.case_complexity.slice(1) : "Not specified"} ✏️
                  </p>
                )}
              </div>
            </div>

            <div style={{ background: "#fff8e1", padding: "10px", borderRadius: 10, marginBottom: "14px", borderLeft: "4px solid #ffd54f" }}>
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px", marginBottom: "10px", fontSize: "0.86em", background: "#fff5e6", padding: "10px", borderRadius: 8 }}>
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
              <div style={{ marginBottom: "10px", background: "#f5f5f5", padding: "10px", borderRadius: 8, borderLeft: "4px solid #ff9800" }}>
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

            <div style={{ marginTop: "12px" }}>
              <strong>Assigned users</strong>
              {caseAssignments.length === 0 ? (
                <p style={{ margin: "8px 0" }}>No users assigned.</p>
              ) : (
                <ul>
                  {caseAssignments.map((assignment) => {
                    const user = users.find((u) => u.id === assignment.user_id);

                    return (
                      <li key={assignment.id} style={{ marginBottom: "8px" }}>
                        <span>
                          {user?.full_name || assignment.user_id} ({user?.role || "unknown"}) •
                          {assignment.required_equipment?.length
                            ? ` ${assignment.required_equipment.join(", ")}`
                            : " No equipment"}
                        </span>
                        <button
                          style={{
                            marginLeft: "12px",
                            padding: "6px 12px",
                            borderRadius: 999,
                            border: "1px solid #ffb74d",
                            background: "#fff8e1",
                            color: "#bf360c",
                            cursor: "pointer",
                            fontWeight: 700,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }}
                          onClick={() => handleRemoveAssignment(assignment.id, c.id)}
                        >
                          Remove
                        </button>
                        {assignment.notes && (
                          <div style={{ marginTop: "4px", color: "#555" }}>
                            <em>Notes:</em> {assignment.notes}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div style={{ marginTop: "12px", marginBottom: "10px" }}>
              <button
               onClick={() => {
                 setRecommendations(null);
                 setModalState((s) => ({ ...s, open: true, caseId: c.id }));
                }}
                style={{ padding: "10px 20px", background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: "0.95em", boxShadow: "0 4px 10px rgba(76, 175, 80, 0.3)", transition: "all 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                ✓ Assign User to Case
              </button>
            </div>

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
                  style={{ padding: "10px 20px", borderRadius: 8, background: "linear-gradient(135deg, #f44336 0%, #c62828 100%)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, boxShadow: "0 4px 10px rgba(244, 67, 54, 0.3)", transition: "all 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  ✕ Close Case
                </button>
              </div>
            )}
          </div>
        );
      })}
      </div>

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
              {filteredClosedCases.map((c) => {
                const caseAssignments = assignments[c.id] || [];

                return (
                  <div
                    key={c.id}
                    style={{
                      ...caseCardBase,
                      border: "2px solid #ffcc80",
                      background: "#fff8e1",
                      minWidth: "200px",
                      maxWidth: "260px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                      <h3 style={{ margin: 0, color: "#ff6f00" }}>🐝 Closed Case</h3>
                      <span style={{ background: "#ccc", padding: "6px 12px", borderRadius: 20, fontWeight: 600, fontSize: "0.85em", color: "#666" }}>
                        CLOSED
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px", fontSize: "0.92em" }}>
                      <div>
                        <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Requester:</strong></p>
                        <p style={{ margin: "0 0 8px 0", color: "#333" }}>{c.requester_first_name} {c.requester_last_name}</p>
                        <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Phone:</strong></p>
                        <p style={{ margin: "0 0 8px 0", color: "#333" }}>{c.requester_phone}</p>
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
                      </div>
                      <div>
                        <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Urgency:</strong></p>
                        <p style={{ margin: "0 0 8px 0", color: "#d84315", fontWeight: 600 }}>
                          {c.urgency ? c.urgency.toUpperCase() : "Not specified"}
                        </p>
                        <p style={{ margin: "4px 0" }}><strong style={{ color: "#e65100" }}>Complexity:</strong></p>
                        <p style={{ margin: "0", color: "#333", fontWeight: 600 }}>
                          {c.case_complexity ? c.case_complexity.charAt(0).toUpperCase() + c.case_complexity.slice(1) : "Not specified"}
                        </p>
                        <p style={{ margin: "8px 0 4px 0" }}><strong style={{ color: "#e65100" }}>Result:</strong></p>
                        <p style={{ margin: "0", color: "#4a148c", fontWeight: 700 }}>
                          {getResultLabel(c.result_status)}
                        </p>
                      </div>
                    </div>

                    <div style={{ background: "#fff8e1", padding: "10px", borderRadius: 10, marginBottom: "14px", borderLeft: "4px solid #ffd54f" }}>
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

                    <div style={{ marginTop: "12px" }}>
                      <strong>Assigned users</strong>
                      {caseAssignments.length === 0 ? (
                        <p style={{ margin: "8px 0" }}>No users assigned.</p>
                      ) : (
                        <ul>
                          {caseAssignments.map((assignment) => {
                            const user = users.find((u) => u.id === assignment.user_id);

                            return (
                              <li key={assignment.id} style={{ marginBottom: "8px" }}>
                                <span>
                                  {user?.full_name || assignment.user_id} ({user?.role || "unknown"}) •
                                  {assignment.required_equipment?.length
                                    ? ` ${assignment.required_equipment.join(", ")}`
                                    : " No equipment"}
                                </span>
                                <button
                                  disabled
                                  style={{
                                    marginLeft: "12px",
                                    opacity: 0.5,
                                    cursor: "not-allowed",
                                    background: "#eee",
                                    border: "1px solid #ccc",
                                    borderRadius: 4,
                                    padding: "4px 8px",
                                  }}
                                >
                                  Remove
                                </button>
                                {assignment.notes && (
                                  <div style={{ marginTop: "4px", color: "#555" }}>
                                    <em>Notes:</em> {assignment.notes}
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {c.result_notes && (
                      <div style={{ marginTop: "16px", padding: "12px", background: "#fff3e0", borderRadius: 8, border: "1px solid #ffd54f" }}>
                        <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#bf360c" }}>Closing notes</p>
                        <p style={{ margin: 0, color: "#333" }}>{c.result_notes}</p>
                      </div>
                    )}

                    <div style={{ marginTop: "18px" }}>
                      <button
                        onClick={() => handleReopenCase(c.id)}
                        style={{
                          padding: "10px 24px",
                          borderRadius: 8,
                          background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                          boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      >
                        ↺ Reopen Case
                      </button>
                    </div>

                    <div style={{ marginTop: "10px" }}>
                      <button
                        onClick={() => handleSendFeedback(c)}
                        disabled={c.feedback_submitted}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "none",
                          cursor: c.feedback_submitted ? "not-allowed" : "pointer",
                          background: c.feedback_submitted
                            ? "#ccc"
                            : "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      >
                        {c.feedback_submitted
                          ? "✅ Feedback Submitted"
                          : "📩 Send Feedback"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {modalState.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => {
            setModalState({ open: false, caseId: null, userId: "", selected: [], other: "", notes: "" });
            setUserSearch("");
          }}
        >
            <div
              role="dialog"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(135deg, #fffaed 0%, #fff8f0 100%)",
                padding: "24px",
                borderRadius: "14px",
                width: "480px",
                maxWidth: "95%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 12px 40px rgba(255, 152, 0, 0.15)",
                border: "2px solid #ffd54f",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 16, color: "#ff6f00" }}>🐝 Assign user to case {modalState.caseId}</h3>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#e65100" }}>Select user</label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ width: "100%", padding: "10px", marginBottom: "8px", borderRadius: 8, border: "2px solid #ffe082", background: "#fffef5" }}
                />
                <div style={{ maxHeight: "400px", overflowY: "auto", border: "2px solid #ffe082", borderRadius: 8, background: "#fafaf5" }}>
                  {filteredUsersForModal.length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "#999" }}>No users found</div>
                  ) : (
                    <>
                      <div style={{ fontSize: "0.75em", color: "#666", padding: "8px 10px", background: "#ffe082", borderBottom: "2px solid #ffd54f", fontWeight: 600 }}>
                        {filteredUsersForModal.length} user{filteredUsersForModal.length !== 1 ? "s" : ""} available
                      </div>
                      {filteredUsersForModal.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setModalState((s) => ({ ...s, userId: u.id }));
                            setUserSearch("");
                          }}
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #f0e6d2",
                            cursor: "pointer",
                            background: modalState.userId === u.id ? "#fff3cd" : "transparent",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (modalState.userId !== u.id) e.currentTarget.style.background = "#fffbf0";
                          }}
                          onMouseLeave={(e) => {
                            if (modalState.userId !== u.id) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div style={{ fontWeight: 600, marginBottom: "4px", color: "#d84315" }}>
                            {u.full_name || u.email} <span style={{ color: "#999", fontSize: "0.85em", fontWeight: 400 }}>({u.role})</span>
                          </div>
                          <div style={{ fontSize: "0.85em", color: "#666", marginBottom: "2px" }}>
                            {u.phone && <span>📞 {u.phone}</span>}
                            {u.phone && u.city && <span> • </span>}
                            {u.city && <span>📍 {u.city}</span>}
                          </div>
                          <div style={{ fontSize: "0.8em", color: "#777", marginTop: "4px" }}>
                            {u.experience_level && <span>Experience: {u.experience_level}</span>}
                            {u.has_height_license && <span style={{ marginLeft: "8px" }}>✓ Height License</span>}
                            {u.total_rescues !== undefined && <span style={{ marginLeft: "8px" }}>Rescues: {u.total_rescues}</span>}
                          </div>
                          {u.is_available === false && (
                            <div style={{ marginTop: "4px", color: "#d1293a", fontSize: "0.8em" }}>⚠ Not available</div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "14px", padding: "10px", background: "#e8f5e9", borderRadius: 8, border: "2px solid #81c784" }}>
  <div style={{ fontSize: "0.9em", fontWeight: 600, marginBottom: "6px", color: "#2e7d32" }}>
    🎯 Recommendation System
  </div>

  <button
    onClick={() => {
      const currentCase = cases.find((c) => c.id === modalState.caseId);
      handleGetRecommendations(currentCase);
    }}
    style={{
      padding: "6px 12px",
      borderRadius: 6,
      background: "#43a047",
      border: "none",
      cursor: "pointer",
      color: "white",
      fontSize: "0.85em",
      fontWeight: 600,
    }}
  >
    Get Recommendations
  </button>

  <div style={{ fontSize: "0.75em", color: "#555", marginTop: "4px" }}>
    Recommended volunteers are ranked by distance, experience, training, height license, and previous rescues.
  </div>

  {recommendations && recommendations.length > 0 && (
    <div style={{ marginTop: "10px" }}>
      {recommendations.slice(0, 3).map((volunteer) => (
        <div
          key={volunteer.id}
          onClick={() => setModalState((s) => ({ ...s, userId: volunteer.id }))}
          style={{
            padding: "8px",
            marginBottom: "6px",
            borderRadius: 6,
            background: modalState.userId === volunteer.id ? "#c8e6c9" : "#ffffff",
            border: "1px solid #c8e6c9",
            cursor: "pointer",
          }}
        >
          <div style={{ fontWeight: 600, color: "#2e7d32" }}>
            {volunteer.full_name || volunteer.email} — Score: {volunteer.recommendationScore}
          </div>

          <div style={{ fontSize: "0.75em", color: "#555" }}>
            Distance: {volunteer.recommendationDetails.distanceScore} •
            Experience: {volunteer.recommendationDetails.experienceScore} •
            Training: {volunteer.recommendationDetails.trainingScore} •
            Height: {volunteer.recommendationDetails.heightLicenseScore} •
            Previous: {volunteer.recommendationDetails.previousCaseScore}
          </div>
        </div>
      ))}
    </div>
  )}
  {recommendations && recommendations.length === 0 && (
   <div
      style={{
        marginTop: "10px",
        padding: "8px",
        borderRadius: 6,
        background: "#fff3cd",
        color: "#856404",
        border: "1px solid #ffeeba",
        fontSize: "0.85em",
      }}
  >
    No available volunteers found.
  </div>
    )}
</div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#e65100" }}>Required equipment</label>
                <div>
                  {PRESET_EQUIPMENT.map((eq) => (
                    <label key={eq} style={{ display: "inline-flex", alignItems: "center", marginRight: "12px", background: "#fff9e6", padding: "8px 10px", borderRadius: 8, border: "1px solid #ffe082" }}>
                      <input
                        type="checkbox"
                        checked={modalState.selected && modalState.selected.includes(eq)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setModalState((s) => ({
                            ...s,
                            selected: checked ? [...(s.selected || []), eq] : (s.selected || []).filter((x) => x !== eq),
                          }));
                        }}
                      />
                      <span style={{ marginLeft: "8px", textTransform: "capitalize", color: "#e65100", fontWeight: 500 }}>{eq}</span>
                    </label>
                  ))}
                </div>

                <div style={{ marginTop: "8px" }}>
                  <label style={{ display: "block", marginBottom: "6px", color: "#e65100", fontWeight: 500 }}>Other (comma-separated)</label>
                  <input
                    value={modalState.other}
                    onChange={(e) => setModalState((s) => ({ ...s, other: e.target.value }))}
                    style={{ width: "100%", padding: "8px", borderRadius: 8, border: "2px solid #ffe082", background: "#fffef5", color: "#000" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", color: "#e65100", fontWeight: 600 }}>Notes (optional)</label>
                <textarea
                  value={modalState.notes}
                  onChange={(e) => setModalState((s) => ({ ...s, notes: e.target.value }))}
                  rows={3}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "2px solid #ffe082", background: "#fffef5", color: "#000" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setModalState({ open: false, caseId: null, userId: "", selected: [], other: "", notes: "" });
                    setUserSearch("");
                    setRecommendations(null);
                  }}
                  style={{ padding: "10px 18px", borderRadius: 8, background: "#e0e0e0", border: "none", cursor: "pointer", fontWeight: 600, color: "#333" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignFromModal}
                  disabled={!modalState.userId || assigning}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    background: modalState.userId && !assigning ? "#ff9800" : "#ccc",
                    color: "#fff",
                    border: "none",
                    cursor: modalState.userId && !assigning ? "pointer" : "not-allowed",
                    fontWeight: 600,
                  }}
                >
                  {assigning ? "Assigning…" : "🐝 Assign"}
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  </div>
  );
}

export default CoordinatorCases;
