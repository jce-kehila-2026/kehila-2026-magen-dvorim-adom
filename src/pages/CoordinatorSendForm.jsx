import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createIntakeForm, isValidPhone } from "../services/intakeFormService";
import { useLanguage } from "../contexts/LanguageContext";

function CoordinatorSendForm({ onFormCreated }) {
  const { userProfile } = useAuth();

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgIsError, setMsgIsError] = useState(false);
  const { language } = useLanguage();
  const isHebrew = language === "he";

  function validatePhone(value) {
    if (!value.trim()) {
      setPhoneError(
        isHebrew ? "יש להזין מספר טלפון" : "Phone number is required."
      );
      return false;
    }
    if (!isValidPhone(value)) {
      setPhoneError(
        isHebrew
          ? "הכנס מספר טלפון תקין"
          : "Enter a valid phone number (e.g. 0521234567)."
      );
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
      setMsg(
        isHebrew ? "הטופס נוצר בהצלחה" : "Form created successfully."
      );
      onFormCreated?.();
      setMsgIsError(false);
    } catch (e) {
      setMsg(
        isHebrew ? "יצירת הטופס נכשלה" : "Failed to create form."
      );
      setMsgIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    const link = `${window.location.origin}/submit-case?coordinator=${userProfile.uid}`;
    try {
      await navigator.clipboard.writeText(link);
      setMsg(
        isHebrew ? "הקישור הועתק" : "Link copied to clipboard."
      );
      setMsgIsError(false);
    } catch {
      setMsg(
  isHebrew
    ? `העתק ידנית: ${link}`
    : `Copy manually: ${link}`
);
      setMsgIsError(false);
    }
  }

  return (
    <div style={s.wrapper}>

      <input
        type="tel"
        placeholder={
          isHebrew ? "טלפון הפונה" : "Requester phone number"
        }

        value={phone}
        onChange={handlePhoneChange}
        style={{
          ...s.input,
          borderColor: phoneError ? "#b42318" : "#eadfd2",
            textAlign: isHebrew ? "right" : "left"
        }}
 
        disabled={loading}
      />

      {phoneError && <p style={s.fieldError}>{phoneError}</p>}

      <div style={s.actions}>
        <button style={s.createBtn} onClick={handleCreate} disabled={loading}>
          {loading
            ? (isHebrew ? "שולח..." : "Sending...")
            : (isHebrew ? "צור טופס" : "Create form")}
        </button>

        <button style={s.linkBtn} onClick={handleCopyLink} disabled={loading}>
          {isHebrew ? "העתק קישור" : "Copy link"}
        </button>
      </div>

      {msg && (
        <p style={{ ...s.msg, color: msgIsError ? "#b42318" : "#c2410c" }}>
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
    borderRadius: 6,
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
    background: "#fffdf8",
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
    background: "#6a2300",
    color: "white",
    border: "none",
    padding: "10px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12.5,
  },
  linkBtn: {
    background: "#fffdf8",
    color: "#6a2300",
    border: "1px solid #6a2300",
    padding: "10px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12.5,
  },
  msg: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
    fontWeight: 700,
  },
};

export default CoordinatorSendForm;
