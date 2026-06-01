import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUsersByRole } from "../services/userService";
import { createIntakeForm } from "../services/intakeFormService";
import { USER_ROLES } from "../services/userSchema";

function CoordinatorSendForm({ onClose }) {
  const { userProfile } = useAuth();
  const [requesterPhone, setRequesterPhone] = useState("");
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState("");
  const [coordinators, setCoordinators] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (userProfile?.role === USER_ROLES.COORDINATOR) {
      setSelectedCoordinatorId(userProfile.uid);
    }

    if (userProfile?.role === USER_ROLES.ADMIN) {
      loadCoordinators();
    }
  }, [userProfile]);

  const loadCoordinators = async () => {
    try {
      const users = await getUsersByRole(USER_ROLES.COORDINATOR);
      setCoordinators(users || []);
    } catch (err) {
      console.error("Unable to load coordinators:", err);
      setError("Unable to load coordinators.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!requesterPhone) {
      setError("Requester phone is required.");
      return;
    }

    if (!selectedCoordinatorId) {
      setError("Please select a coordinator before sending the form.");
      return;
    }

    try {
      await createIntakeForm({
        requester_phone: requesterPhone,
        coordinator_id: selectedCoordinatorId,
      });

      setSuccess("✅ Intake form sent successfully!");
      setRequesterPhone("");

      if (onClose) {
        setTimeout(() => onClose(), 800);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send intake form.");
    }
  };

  const isCoordinator = userProfile?.role === USER_ROLES.COORDINATOR;
  const isAdmin = userProfile?.role === USER_ROLES.ADMIN;

  return (
    <div style={{ maxWidth: "480px", width: "100%" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2>Send Case Request Form</h2>
        <p style={{ color: "#4f5f58", lineHeight: 1.5 }}>
          Use this form to send a request link to the requester. The coordinator identity is selected automatically.
        </p>
      </div>

      {error && <div style={{ marginBottom: "14px", color: "#b42318" }}>{error}</div>}
      {success && <div style={{ marginBottom: "14px", color: "#1f7a1f" }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
        <label style={{ fontSize: "14px", color: "#2a3e35" }}>
          Requester phone
          <input
            placeholder="Requester phone *"
            value={requesterPhone}
            onChange={(e) => setRequesterPhone(e.target.value)}
            style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid #cfd8cc" }}
          />
        </label>

        {isAdmin && (
          <label style={{ fontSize: "14px", color: "#2a3e35" }}>
            Coordinator
            <select
              value={selectedCoordinatorId}
              onChange={(e) => setSelectedCoordinatorId(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid #cfd8cc" }}
            >
              <option value="">Select a coordinator</option>
              {coordinators.map((coord) => (
                <option key={coord.uid} value={coord.uid}>
                  {coord.full_name || coord.email}
                </option>
              ))}
            </select>
          </label>
        )}

        {isCoordinator && (
          <div style={{ padding: "14px", borderRadius: "14px", border: "1px solid #cfd8cc", background: "#fbfdfb" }}>
            Sending as <strong>{userProfile?.full_name || userProfile?.email}</strong>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            type="submit"
            style={{ padding: "12px 18px", borderRadius: "14px", border: "none", background: "#1f7a5c", color: "white", cursor: "pointer", fontWeight: 700 }}
          >
            Send Form
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "12px 18px", borderRadius: "14px", border: "1px solid #cfd8cc", background: "white", color: "#173b2f", cursor: "pointer" }}
            >
              Close
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default CoordinatorSendForm;
