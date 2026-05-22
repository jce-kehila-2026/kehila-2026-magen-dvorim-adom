import { useState } from "react";
import { createIntakeForm } from "../services/intakeFormService";

function CoordinatorSendForm() {
  // ✅ Form state
  const [requesterPhone, setRequesterPhone] = useState("");
  const [coordinatorPhone, setCoordinatorPhone] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!requesterPhone || !coordinatorPhone) {
      setError("Both requester phone and coordinator phone are required.");
      return;
    }

    try {
      // ✅ Send intake form (backend handles validation)
      await createIntakeForm({
        requester_phone: requesterPhone,
        coordinator_phone: coordinatorPhone,
      });

      setSuccess("✅ Intake form sent successfully!");
      setRequesterPhone("");
      setCoordinatorPhone("");

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send intake form.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto" }}>
      <h2>Send Case Request Form</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        {/* ✅ Requester phone */}
        <input
          placeholder="Requester phone *"
          value={requesterPhone}
          onChange={(e) => setRequesterPhone(e.target.value)}
        />

        {/* ✅ Coordinator phone */}
        <input
          placeholder="Coordinator phone *"
          value={coordinatorPhone}
          onChange={(e) => setCoordinatorPhone(e.target.value)}
        />

        <button type="submit">Send Form</button>
      </form>
    </div>
  );
}

export default CoordinatorSendForm;