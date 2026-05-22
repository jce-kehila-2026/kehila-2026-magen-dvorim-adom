import { useState } from "react";
import {
  getCasesForCoordinator,
  updateCaseStatus,
} from "../services/caseService";

function CoordinatorCases() {
  const [phone, setPhone] = useState("");
  const [cases, setCases] = useState([]);
  const [error, setError] = useState("");

  const loadCases = async () => {
    setError("");
    try {
      const data = await getCasesForCoordinator(phone);
      setCases(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (caseId, newStatus) => {
    try {
      await updateCaseStatus(caseId, newStatus);

      // refresh list after update
      const updated = await getCasesForCoordinator(phone);
      setCases(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto" }}>
      <h1>Coordinator Cases</h1>

      <input
        placeholder="Coordinator phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button onClick={loadCases}>Load Cases</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: "20px" }}>
        {cases.map((c) => (
          <div
            key={c.id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "10px",
            }}
          >
            <p><b>ID:</b> {c.id}</p>
            <p><b>Requester:</b> {c.requester_first_name} {c.requester_last_name}</p>
            <p><b>Phone:</b> {c.requester_phone}</p>
            <p><b>Status:</b> {c.status}</p>

            {/* Status Controls */}
            <div style={{ marginTop: "10px" }}>
              <button onClick={() => handleStatusChange(c.id, "open")}>
                Open
              </button>

              <button onClick={() => handleStatusChange(c.id, "in_progress")}>
                Assigned
              </button>

              <button onClick={() => handleStatusChange(c.id, "closed")}>
                Closed
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CoordinatorCases;
