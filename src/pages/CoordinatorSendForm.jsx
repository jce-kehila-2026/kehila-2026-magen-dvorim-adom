import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createIntakeForm, isValidPhone } from "../services/intakeFormService";

function CoordinatorSendForm() {
  const { userProfile } = useAuth();

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgIsError, setMsgIsError] = useState(false);

  function validatePhone(value) {
    if (!value.trim()) {
      setPhoneError("Phone number is required.");
      return false;
    }
    if (!isValidPhone(value)) {
      setPhoneError("Enter a valid phone number (e.g. 0521234567).");
      return false;
    }
    setPhoneError("");
    return true;
  }

  function handlePhoneChange(e) {
    setPhone(e.target.value);
    if (phoneError) validatePhone(e.target.value);
    setMsg("");
  }

  async function handleCreate() {
    if (!validatePhone(phone)) return;
    setLoading(true);
    setMsg("");
    try {
      await createIntakeForm({
        requester_phone: phone,
        coordinator_id: userProfile.uid,
      });
      setPhone("");
      setMsg("Form created successfully.");
      setMsgIsError(false);
    } catch (e) {
      setMsg(e.message || "Failed to create form.");
      setMsgIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    const link = `${window.location.origin}/submit-case?coordinator=${userProfile.uid}`;
    try {
      await navigator.clipboard.writeText(link);
      setMsg("Link copied to clipboard.");
      setMsgIsError(false);
    } catch {
      setMsg(`Copy manually: ${link}`);
      setMsgIsError(false);
    }
  }

  return (
    <div style={s.wrapper}>

      <input
        type="tel"
        placeholder="Requester phone number"
        value={phone}
        onChange={handlePhoneChange}
        style={{
          ...s.input,
          borderColor: phoneError ? "#b42318" : "#ddd0c4",
        }}
        disabled={loading}
      />

      {phoneError && <p style={s.fieldError}>{phoneError}</p>}

      <div style={s.actions}>
        <button style={s.createBtn} onClick={handleCreate} disabled={loading}>
          {loading ? "Sending..." : "Create form"}
        </button>

        <button style={s.linkBtn} onClick={handleCopyLink} disabled={loading}>
          Copy link
        </button>
      </div>

      {msg && (
        <p style={{ ...s.msg, color: msgIsError ? "#b42318" : "#15803d" }}>
          {msg}
        </p>
      )}
    </div>
  );
}

const s = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%",
  },
  label: {
    margin: "0 0 4px",
    fontSize: 13,
    fontWeight: 800,
    color: "#2b160c",
  },
  input: {
    padding: 10,
    border: "1px solid",
    borderRadius: 10,
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#2b160c",
    outline: "none",
  },
  fieldError: {
    margin: "2px 0 0",
    fontSize: 12,
    color: "#b42318",
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginTop: 2,
  },
  createBtn: {
    background: "#ea580c",
    color: "white",
    border: "none",
    padding: "9px 6px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12,
  },
  linkBtn: {
    background: "#15803d",
    color: "white",
    border: "none",
    padding: "9px 6px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12,
  },
  msg: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
    fontWeight: 700,
  },
};

export default CoordinatorSendForm;