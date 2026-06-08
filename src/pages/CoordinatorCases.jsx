import { recommendVolunteersForCase } from "../services/recommendationService";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/עברית-logo.png";
import { useAuth } from "../contexts/AuthContext";
import {
  getCasesForCoordinatorById,
  getAllCases,
  updateCaseStatus,
  updateCaseCoordinator,
  updateCaseComplexity,
} from "../services/caseService";
import { getUsersByRole } from "../services/userService";
import {
  getAssignableUsers,
  getAssignmentsByCaseIds,
  assignUserToCase,
  removeAssignment,
  reopenCaseAndCleanConflicts,
} from "../services/assignmentService";

function CoordinatorCases() {
  const navigate = useNavigate();
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

  const [detailsCase, setDetailsCase] = useState(null);

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

const getStatusStyle = (status) => ({
  ...styles.badge,
  ...(status === "assigned"
    ? styles.assignedBadge
    : status === "closed"
    ? styles.closedBadge
    : styles.openBadge),
});

const getUrgencyStyle = (urgency) => ({
  ...styles.badge,
  ...(urgency === "high"
    ? styles.highBadge
    : urgency === "medium"
    ? styles.mediumBadge
    : styles.lowBadge),
});

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
  <div style={styles.page}>
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
        <div>
          <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
          <p style={styles.brandSub}>Coordinator</p>
        </div>
      </div>

      <nav style={styles.nav}>
        <button style={styles.navItem} onClick={() => navigate("/coordinator-dashboard")}>Dashboard</button>
        <button style={{ ...styles.navItem, ...styles.navItemActive }} onClick={() => navigate("/cases")}>Cases</button>
        <button style={styles.navItem} onClick={() => navigate("/admin-users")}>Users</button>
        <button style={styles.navItem} onClick={() => navigate("/my-cases")}>My Cases</button>
        <button style={styles.navItem} onClick={() => navigate("/profile")}>Profile</button>
      </nav>

      <button style={styles.logoutButton}>Logout</button>
    </aside>

    <main style={styles.main}>
      <div style={styles.contentCard}>
      <div style={{ marginBottom: "12px" }}>
        <h1 style={{ margin: "0 0 8px", color: "#f57c00", fontSize: "2.6rem" }}>
          {currentUserRole === "admin" ? "All Coordinator Cases" : "Coordinator Cases"}
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

<div style={styles.casesList}>
  <div style={styles.listHeader}>
    <span>Requester</span>
    <span>Phone</span>
    <span>Location</span>
    <span>Urgency</span>
    <span>Status</span>
    <span>Actions</span>
  </div>

  {activeCases.map((c) => (
    <div key={c.id} style={styles.caseRow}>
      <span>{c.requester_first_name} {c.requester_last_name}</span>
      <span>{c.requester_phone}</span>
      <span>{c.city || "-"}</span>

      <span style={getUrgencyStyle(c.urgency)}>
        {c.urgency || "low"}
      </span>

      <span style={getStatusStyle(c.status)}>
        {c.status || "open"}
      </span>

      <div style={styles.rowActions}>
        <button onClick={() => setDetailsCase(c)} style={styles.viewButton}>
          View
        </button>

        <button
          onClick={() => {
            setRecommendations(null);
            setModalState((s) => ({ ...s, open: true, caseId: c.id }));
          }}
          style={styles.assignButton}
        >
          Assign
        </button>

        <button onClick={() => beginCloseCase(c.id)} style={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  ))}
</div>

{detailsCase && (
  <div style={styles.modalOverlay} onClick={() => setDetailsCase(null)}>
    <div style={styles.detailsModal} onClick={(e) => e.stopPropagation()}>
      <h2 style={styles.modalTitle}>Case Details</h2>

      <div style={styles.detailsGrid}>
        <p><strong>Requester:</strong> {detailsCase.requester_first_name} {detailsCase.requester_last_name}</p>
        <p><strong>Phone:</strong> {detailsCase.requester_phone}</p>
        <p><strong>City:</strong> {detailsCase.city || "-"}</p>
        <p><strong>Street:</strong> {detailsCase.street || "-"} {detailsCase.house_number || ""}</p>
        <p><strong>Urgency:</strong> {detailsCase.urgency || "low"}</p>
        <p><strong>Status:</strong> {detailsCase.status || "open"}</p>
        <p><strong>Complexity:</strong> {detailsCase.case_complexity || "simple"}</p>
        <p><strong>Opened:</strong> {formatDate(detailsCase.opened_at)}</p>
      </div>

      <div style={styles.descriptionBox}>
        <strong>Description</strong>
        <p>{detailsCase.location_description || "No description provided."}</p>
      </div>

      <div style={styles.modalActions}>
        <button onClick={() => setDetailsCase(null)} style={styles.viewButton}>
          Close
        </button>
      </div>
    </div>
  </div>
)}
{closedCases.length > 0 && (
  <section style={styles.closedHistorySection}>
    <div style={styles.closedHistoryHeader}>
      <div>
        <h2 style={styles.closedHistoryTitle}>
          Closed Cases History ({closedCases.length})
        </h2>
        <p style={styles.closedHistorySubtitle}>
          Review completed rescue cases and reopening options.
        </p>
      </div>

      <button
        onClick={() => setShowClosedHistory((prev) => !prev)}
        style={styles.historyToggleButton}
      >
        {showClosedHistory ? "Hide history" : "Show history"}
      </button>
    </div>

    {showClosedHistory && (
      <>
        <input
          placeholder="Search by requester phone"
          value={historyPhoneSearch}
          onChange={(e) => setHistoryPhoneSearch(e.target.value)}
          style={styles.historySearch}
        />

        {filteredClosedCases.length === 0 ? (
          <p style={styles.emptyText}>
            No closed cases match that requester phone.
          </p>
        ) : (
          <div style={styles.closedList}>
            {filteredClosedCases.map((c) => {
              const caseAssignments = assignments[c.id] || [];

              return (
                <div key={c.id} style={styles.closedItem}>
                  <div>
                    <h3 style={styles.closedRequester}>
                      {c.requester_first_name} {c.requester_last_name}
                    </h3>

                    <p style={styles.closedMeta}>
                      📍 {c.city || "Unknown location"} · Closed:{" "}
                      {formatDate(c.closed_at)}
                    </p>

                    <p style={styles.closedMeta}>
                      Result: {getResultLabel(c.result_status)}
                    </p>

                    <p style={styles.closedMeta}>
                      Assigned users: {caseAssignments.length || 0}
                    </p>
                  </div>

                  <div style={styles.closedActions}>
                    <button
                      onClick={() => setDetailsCase(c)}
                      style={styles.viewButton}
                    >
                      View
                    </button>

                    <button
                      onClick={() => handleReopenCase(c.id)}
                      style={styles.reopenButton}
                    >
                      Reopen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    )}
  </section>
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
    </main>
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
    width: "50px",
    height: "50px",
    objectFit: "contain",
  },
  brandTitle: {
    margin: 0,
    color: "#2b160c",
    fontSize: "16px",
    fontWeight: "800",
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

  casesList: {
    background: "white",
    border: "1px solid #eee2d8",
    borderRadius: "18px",
    overflow: "hidden",
    marginTop: "28px",
  },
  listHeader: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 0.8fr 1.4fr",
    gap: "12px",
    padding: "16px 18px",
    background: "#fff8ef",
    color: "#51443a",
    fontWeight: "800",
    fontSize: "14px",
  },
  caseRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 0.8fr 1.4fr",
    gap: "12px",
    alignItems: "center",
    padding: "22px 18px",
    borderTop: "1px solid #f1ebe5",
    color: "#1f2933",
    fontSize: "14px",
  },

  badge: {
    width: "fit-content",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "12px",
    textTransform: "capitalize",
  },
  openBadge: { background: "#fff3e6", color: "#d95f00" },
  assignedBadge: { background: "#eef8ef", color: "#16803d" },
  closedBadge: { background: "#f3f4f6", color: "#374151" },
  highBadge: { background: "#fee2e2", color: "#dc2626" },
  mediumBadge: { background: "#fff3e6", color: "#d95f00" },
  lowBadge: { background: "#eef8ef", color: "#16803d" },

  rowActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
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
  assignButton: {
    border: "1px solid #f3c49a",
    background: "#fff8ef",
    color: "#d95f00",
    borderRadius: "10px",
    padding: "8px 13px",
    fontWeight: "800",
    cursor: "pointer",
  },
  closeButton: {
    border: "1px solid #fecaca",
    background: "white",
    color: "#dc2626",
    borderRadius: "10px",
    padding: "8px 13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  detailsModal: {
    width: "100%",
    maxWidth: "560px",
    background: "white",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #f0e5d8",
  },
  modalTitle: {
    margin: "0 0 18px",
    color: "#2b160c",
    fontSize: "22px",
    fontWeight: "900",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 18px",
    color: "#2b160c",
    fontSize: "14px",
  },
  descriptionBox: {
    marginTop: "18px",
    padding: "14px",
    borderRadius: "14px",
    background: "#fff8ef",
    color: "#2b160c",
  },
  modalActions: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "flex-end",
  },
  closedHistorySection: {
  marginTop: "28px",
  padding: "22px",
  borderRadius: "20px",
  background: "#ffffff",
  border: "1px solid #f0e5d8",
},

closedHistoryHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "16px",
},

closedHistoryTitle: {
  margin: 0,
  color: "#2b160c",
  fontSize: "20px",
  fontWeight: "900",
},

closedHistorySubtitle: {
  margin: "6px 0 0",
  color: "#6b625c",
  fontSize: "14px",
},

historyToggleButton: {
  border: "1px solid #f3c49a",
  background: "#fff8ef",
  color: "#d95f00",
  borderRadius: "12px",
  padding: "10px 16px",
  fontWeight: "800",
  cursor: "pointer",
},

historySearch: {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 16px",
  borderRadius: "14px",
  border: "1px solid #eadfd2",
  background: "#fffdf8",
  marginBottom: "16px",
},

closedList: {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
},

closedItem: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid #f1ebe5",
  background: "#fffdf8",
},

closedRequester: {
  margin: 0,
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "900",
},

closedMeta: {
  margin: "6px 0 0",
  color: "#6b625c",
  fontSize: "13px",
},

closedActions: {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
},

reopenButton: {
  border: "1px solid #bbf7d0",
  background: "#ecfdf3",
  color: "#16a34a",
  borderRadius: "10px",
  padding: "8px 13px",
  fontWeight: "800",
  cursor: "pointer",
},

emptyText: {
  color: "#6b625c",
  margin: 0,
},
};

export default CoordinatorCases;
