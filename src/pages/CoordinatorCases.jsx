import { useAuth } from "../contexts/AuthContext";
import CasesView from "../components/views/CasesView";
import { recommendVolunteersForCase } from "../services/recommendationService";
import { logoutUser } from "../services/authService";
import {
  getCasesForCoordinatorById,
  getAllCases,
  updateCaseStatus,
  updateCaseComplexity,
  updateCaseCoordinator,
  attachFeedbackToken,
} from "../services/caseService";

import { getFeedbackByCaseIds } from "../services/feedbackService";

import { useEffect, useState } from "react";

import {
  getAssignableUsers,
  getAssignmentsByCaseIds,
  assignUserToCase,
  reopenCaseAndCleanConflicts,
} from "../services/assignmentService";
import { generateToken } from "../utils/generateToken";

function CoordinatorCases() {
  const { userProfile } = useAuth();

  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [activeFilter, setActiveFilter] = useState("open");
  const [caseSearch, setCaseSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("opened_at");
  const [sortDirection, setSortDirection] = useState("desc");

  const handleSortClick = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const [detailsCase, setDetailsCase] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [userSearch, setUserSearch] = useState("");

  const [modalState, setModalState] = useState({
    open: false,
    caseId: null,
    userId: "",
    selected: [],
    other: "",
    notes: "",
  });

  const [closingCase, setClosingCase] = useState({
    caseId: null,
    result_status: "evacuated_by_volunteer",
    notes: "",
  });

  const [feedbackByCase, setFeedbackByCase] = useState({});
  
  const currentUserId = userProfile?.uid || null;
  const currentUserRole = userProfile?.role || "";
  const currentUserName =
  userProfile?.full_name || userProfile?.displayName || userProfile?.email || "User";

  const PRESET_EQUIPMENT = ["ladder", "net", "bee house"];

  useEffect(() => {
    if (!currentUserId) return;

    loadUsers();
    loadCases();
  }, [currentUserId, currentUserRole]);

  useEffect(() => {
    if (!modalState.open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalState.open]);

  const loadUsers = async () => {
    try {
      const allUsers = await getAssignableUsers();
      setUsers(allUsers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCases = async () => {
    setError("");

    try {
      let data = [];

      if (currentUserRole === "admin") {
        data = await getAllCases();
      } else if (currentUserRole === "coordinator") {
        data = await getCasesForCoordinatorById(currentUserId);
      }

    setCases(data || []);

      const assignmentMap = await getAssignmentsByCaseIds(
        (data || []).map((item) => item.id)
      );

      setAssignments(assignmentMap || {});

      const feedbackMap = await getFeedbackByCaseIds(
        (data || []).map((item) => item.id)
      );

      setFeedbackByCase(feedbackMap || {});
    } catch (err) {
      setError(err.message || "Failed to load cases.");
    }
  };
  
  const refreshData = async () => {
    await loadCases();
    await loadUsers();
  };

const formatDate = (timestamp) => {
    if (!timestamp) return "—";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const FINISHING_STATUSES = [
    { value: "evacuated_by_volunteer", label: "Evacuated by a volunteer" },
    { value: "sent_to_chofesh_farm", label: "Sent to Chofesh Farm" },
    {
      value: "remains_in_place_without_treatment",
      label: "Remains in place without treatment",
    },
    { value: "cancelled", label: "Cancelled" },
  ];

  const getResultLabel = (value) => {
    const option = FINISHING_STATUSES.find((item) => item.value === value);
    return option ? option.label : value || "Not specified";
  };

const activeCases = cases.filter((caseItem) => caseItem.status !== "closed");
const closedCases = cases.filter((caseItem) => caseItem.status === "closed");

// ✅ quick lookup: user ID → full user object (used to show coordinator's name)
const usersById = users.reduce((acc, user) => {
  acc[user.id] = user;
  return acc;
}, {});

// ✅ who's allowed to be picked as a case's coordinator (admin can act as coordinator too)
const coordinatorOptions = users.filter(
  (user) => user.role === "coordinator" || user.role === "admin"
);

  const getAssignedUsersForCase = (caseItem) => {
    const caseAssignments = assignments[caseItem.id] || [];

    return caseAssignments
      .map((assignment) => users.find((user) => user.id === assignment.user_id))
      .filter(Boolean);
  };

  const isMyCoordinatorCase = (caseItem) => {
    return caseItem.coordinator_id === currentUserId;
  };

  const hasVolunteerAssigned = (caseItem) => {
    return getAssignedUsersForCase(caseItem).some(
      (user) => user.role === "volunteer"
    );
  };

  const openCases =
  currentUserRole === "admin"
    ? activeCases.filter((caseItem) => caseItem.status === "open")
    : activeCases.filter(
        (caseItem) => caseItem.status === "open" && isMyCoordinatorCase(caseItem)
      );

  const myCases = activeCases.filter((caseItem) =>
  (assignments[caseItem.id] || []).some(
    (assignment) => assignment.user_id === currentUserId
  )
);

  const assignedCases =
    currentUserRole === "admin"
      ? activeCases.filter((caseItem) => hasVolunteerAssigned(caseItem))
      : activeCases.filter(
          (caseItem) =>
            isMyCoordinatorCase(caseItem) && hasVolunteerAssigned(caseItem)
        );

  const openCaseCount = openCases.length;
  const myCasesCount = myCases.length;
  const assignedCaseCount = assignedCases.length;

  const getCaseTime = (caseItem) => {
    const value =
      caseItem.opened_at ||
      caseItem.created_at ||
      caseItem.first_seen ||
      caseItem.closed_at;

    if (!value) return 0;

    const date = value.toDate ? value.toDate() : new Date(value);
    return date.getTime();
  };

  const urgencyRank = {
    high: 3,
    medium: 2,
    low: 1,
  };
const baseCases =
  activeFilter === "all"
    ? cases
    : activeFilter === "open"
    ? openCases
    : activeFilter === "assigned"
    ? assignedCases
    : activeFilter === "my"
    ? myCases
    : activeFilter === "closed"
    ? closedCases
    : activeCases;

  const visibleCases = baseCases
    .filter((caseItem) => {
      const search = caseSearch.trim().toLowerCase();

      if (!search) return true;

      return (
        `${caseItem.requester_first_name || ""} ${
          caseItem.requester_last_name || ""
        }`
          .toLowerCase()
          .includes(search) ||
        (caseItem.requester_phone || "").toLowerCase().includes(search) ||
        (caseItem.city || "").toLowerCase().includes(search) ||
        (caseItem.status || "").toLowerCase().includes(search) ||
        (caseItem.urgency || "").toLowerCase().includes(search)
      );
    })
   .sort((a, b) => {
      let result = 0;

      if (sortColumn === "name") {
        const nameA = `${a.requester_first_name || ""} ${a.requester_last_name || ""}`
          .trim()
          .toLowerCase();
        const nameB = `${b.requester_first_name || ""} ${b.requester_last_name || ""}`
          .trim()
          .toLowerCase();
        result = nameA.localeCompare(nameB);
      } else if (sortColumn === "phone") {
        result = (a.requester_phone || "").localeCompare(b.requester_phone || "");
      } else {
        result = getCaseTime(a) - getCaseTime(b);
      }

      return sortDirection === "asc" ? result : -result;
    });
 const assignedUserIds = Object.entries(assignments).reduce(
  (acc, [caseId, assignmentList]) => {
    if (!Array.isArray(assignmentList)) {
      return acc;
    }

    const relatedCase = cases.find(
      (caseItem) => caseItem.id === caseId
    );

    if (!relatedCase) {
      return acc;
    }

    //
    if (relatedCase.status === "closed") {
      return acc;
    }

    // 
    if (caseId === modalState.caseId) {
      return acc;
    }

    return acc.concat(
      assignmentList.map((item) => item.user_id)
    );
  },
  []
);

  const isVolunteerUnavailable = (user) => {
  const hasActiveCase = assignedUserIds.includes(user.id);

  const markedUnavailable =
    user.is_available === false;

  return hasActiveCase || markedUnavailable;
};
  const assignableUsersByRole = users.filter((user) => {
  if (currentUserRole === "admin") {
    return ["admin", "coordinator", "volunteer"].includes(user.role);
  }

  if (currentUserRole === "coordinator") {
    return user.role === "volunteer" || user.id === currentUserId;
  }

  return false;
});

  const filteredUsersForModal = assignableUsersByRole
  .filter((user) => {
    if (user.id === currentUserId) {
      return true;
    }

    return !isVolunteerUnavailable(user);
  })
  .filter((user) => {
    const text = `${user.full_name || ""} ${user.email || ""}`.toLowerCase();
    return text.includes(userSearch.toLowerCase());
  });
   
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
    setError(err.message || "Failed to close case.");
  }
};

const handleSendFeedback = async (caseItem) => {
  try {
    let token = caseItem.feedback_token;

    if (!token) {
      token = generateToken();
      await attachFeedbackToken(caseItem.id, token);
    }

    const link = `${window.location.origin}/feedback?token=${token}`;

    await navigator.clipboard.writeText(link);

    alert("Feedback link copied.");
  } catch (err) {
    console.error(err);
    alert("Failed to generate feedback link.");
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
          `The following volunteer(s) already have another open case and were removed from this reopened case:\n- ${names.join(
            "\n- "
          )}`
        );
      }
    } catch (err) {
      setError(err.message || "Failed to reopen case.");
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
    const selectedUser = users.find((user) => user.id === userId);

    const equipment = [
      ...(selected || []),
      ...(other
        ? other
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : []),
    ];

    await assignUserToCase({
      case_id: caseId,
      user_id: userId,
      user_name: selectedUser?.full_name || selectedUser?.email || "Volunteer",
      assigned_by: currentUserId,
      required_equipment: equipment,
      notes: notes || null,
    });

    setModalState({
      open: false,
      caseId: null,
      userId: "",
      selected: [],
      other: "",
      notes: "",
    });

    setUserSearch("");
    setRecommendations(null);

    await refreshData();
  } catch (err) {
    setError(err.message || "Failed to assign volunteer.");
  } finally {
    setAssigning(false);
  }
};

  const handleChangeComplexity = async (caseId, newComplexity) => {
  setError("");
  try {
    await updateCaseComplexity(caseId, newComplexity);
    await loadCases();
  } catch (err) {
    setError(err.message || "Failed to update complexity.");
  }
};

const handleChangeCoordinator = async (caseId, newCoordinatorId) => {
  setError("");
  try {
    await updateCaseCoordinator(caseId, newCoordinatorId);
    await loadCases();
  } catch (err) {
    setError(err.message || "Failed to update coordinator.");
  }
};

const handleGetRecommendations = (caseItem) => {
    if (!caseItem) return;

    const result = recommendVolunteersForCase({
      caseItem,
      users,
      assignedUserIds,
    });

    setRecommendations(result);
  };

  const handleLogout = async () => {
  await logoutUser();
};
 return (
  <CasesView
    currentUserRole={currentUserRole}
    currentUserName={currentUserName}
    handleLogout={handleLogout}
    cases={cases}
    activeCases={visibleCases}
    closedCases={closedCases}
    openCaseCount={openCaseCount}
    assignedCaseCount={assignedCaseCount}
    myCasesCount={myCasesCount}
    activeFilter={activeFilter}
    setActiveFilter={setActiveFilter}
    caseSearch={caseSearch}
    setCaseSearch={setCaseSearch}
    sortColumn={sortColumn}
    sortDirection={sortDirection}
    handleSortClick={handleSortClick}
    error={error}
    assignments={assignments}
    detailsCase={detailsCase}
    setDetailsCase={setDetailsCase}
    modalState={modalState}
    setModalState={setModalState}
    userSearch={userSearch}
    setUserSearch={setUserSearch}
    filteredUsersForModal={filteredUsersForModal}
    recommendations={recommendations}
    setRecommendations={setRecommendations}
    assigning={assigning}
    PRESET_EQUIPMENT={PRESET_EQUIPMENT}
    beginCloseCase={beginCloseCase}
    cancelCloseCase={cancelCloseCase}
    confirmCloseCase={confirmCloseCase}
    closingCase={closingCase}
    setClosingCase={setClosingCase}
    FINISHING_STATUSES={FINISHING_STATUSES}
    handleAssignFromModal={handleAssignFromModal}
    handleGetRecommendations={handleGetRecommendations}
    handleReopenCase={handleReopenCase}
    handleSendFeedback={handleSendFeedback}
    formatDate={formatDate}
    getResultLabel={getResultLabel}
    usersById={usersById}
    coordinatorOptions={coordinatorOptions}
handleChangeComplexity={handleChangeComplexity}
    handleChangeCoordinator={handleChangeCoordinator}
    feedbackByCase={feedbackByCase}
  />
);
   
}

export default CoordinatorCases;