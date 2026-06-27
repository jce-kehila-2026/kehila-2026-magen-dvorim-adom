import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { getCasesForUser, closeCase } from "../services/caseService";
import {
  getAssignmentsByCaseIds,
  getAssignableUsers,
} from "../services/assignmentService";
import { getUserById } from "../services/userService";
import { USER_ROLES } from "../services/userSchema";
import { logoutUser } from "../services/authService";
import MyCasesView from "../components/views/MyCasesView";

const CLOSE_STATUS_OPTIONS = [
  { value: "evacuated_by_volunteer", label: "Evacuated by volunteer" },
  { value: "sent_to_chofesh_farm", label: "Sent to Chofesh Farm" },
  {
    value: "remains_in_place_without_treatment",
    label: "Remains in place without treatment",
  },
];

function MyCases() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coordinatorData, setCoordinatorData] = useState({});
  const [expandedCases, setExpandedCases] = useState({});
  const [closingCase, setClosingCase] = useState(null);
  const [closingFormData, setClosingFormData] = useState({
    result_status: "evacuated_by_volunteer",
    result_notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isVolunteer = userProfile?.role === USER_ROLES.VOLUNTEER;

  useEffect(() => {
    if (!userProfile?.uid) return;
    loadData();
  }, [userProfile]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const caseData = await getCasesForUser(userProfile.uid);

      const coordMap = {};
      for (const c of caseData) {
        if (c.coordinator_id && !coordMap[c.coordinator_id]) {
          try {
            coordMap[c.coordinator_id] = await getUserById(c.coordinator_id);
          } catch (err) {
            console.error("Failed to load coordinator info:", err);
          }
        }
      }

      setCoordinatorData(coordMap);
      if (userProfile.role !== "volunteer") {
        setUsers(await getAssignableUsers());
      }
      setAssignments(
        await getAssignmentsByCaseIds(caseData.map((item) => item.id))
      );
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

      await loadData();
      setClosingCase(null);
    } catch (err) {
      console.error("Failed to close case:", err);
      alert("Failed to close case: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpand = (caseId) => {
    setExpandedCases((prev) => ({
      ...prev,
      [caseId]: !prev[caseId],
    }));
  };

  // Actually clears the Firebase session before navigating — previously
  // this page had no logout handler at all, so clicking "Logout" just
  // tried to redirect to "/" while the session stayed signed in, which
  // bounced straight back into the Dashboard.
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed. Please try again.");
    }
  };

  return (
    <MyCasesView
      userProfile={userProfile}
      cases={cases}
      assignments={assignments}
      users={users}
      loading={loading}
      error={error}
      coordinatorData={coordinatorData}
      expandedCases={expandedCases}
      closingCase={closingCase}
      closingFormData={closingFormData}
      isSubmitting={isSubmitting}
      isVolunteer={isVolunteer}
      closeStatusOptions={CLOSE_STATUS_OPTIONS}
      setClosingCase={setClosingCase}
      setClosingFormData={setClosingFormData}
      handleCloseCase={handleCloseCase}
      handleSubmitCloseCase={handleSubmitCloseCase}
      toggleExpand={toggleExpand}
      formatDate={formatDate}
      handleLogout={handleLogout}
    />
  );
}

export default MyCases;