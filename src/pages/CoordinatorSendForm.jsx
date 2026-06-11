import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createIntakeForm, getIntakeFormsByCoordinator } from "../services/intakeFormService";
import { USER_ROLES } from "../services/userSchema";

function getStatusBadge(status, expiresAt) {
  // Check if sent form has expired
  if (status === "sent" && expiresAt) {
    const expires = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    if (expires < new Date()) {
      return { label: "Expired", bg: "#f0f0f0", color: "#888" };
    }
    return { label: "Waiting for response", bg: "#FAEEDA", color: "#854F0B" };
  }
  if (status === "submitted") return { label: "Form submitted ✓", bg: "#E1F5EE", color: "#085041" };
  if (status === "expired") return { label: "Expired", bg: "#f0f0f0", color: "#888" };
  return { label: status, bg: "#f0f0f0", color: "#888" };
}

function formatDate(ts) {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("he-IL", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function CoordinatorSendForm({ onClose }) {
  const { userProfile } = useAuth();
  const [requesterPhone, setRequesterPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);

  const [forms, setForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const coordinatorId = userProfile?.uid;

  useEffect(() => {
    if (coordinatorId) loadForms();
  }, [coordinatorId]);

  const loadForms = async () => {
    setLoadingForms(true);
    try {
      const data = await getIntakeFormsByCoordinator(coordinatorId);
      // Sort newest first
      data.sort((a, b) => {
        const aTime = a.sent_at?.toDate ? a.sent_at.toDate() : new Date(a.sent_at);
        const bTime = b.sent_at?.toDate ? b.sent_at.toDate() : new Date(b.sent_at);
        return bTime - aTime;
      });
      setForms(data);
    } catch (err) {
      console.error("Failed to load forms:", err);
    } finally {
      setLoadingForms(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!requesterPhone.trim()) {
      setError("Requester phone is required.");
      return;
    }

    setSending(true);
    try {
      await createIntakeForm({
        requester_phone: requesterPhone,
        coordinator_id: coordinatorId,
      });

      setSuccess("Form created successfully!");
      setRequesterPhone("");
      await loadForms();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create form.");
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/submit-case?coordinator=${coordinatorId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredForms = forms.filter((f) =>
    phoneSearch.trim() === "" ||
    (f.requester_phone || "").includes(phoneSearch.trim())
  );

  const sentCount = forms.filter((f) => {
    if (f.status !== "sent") return false;
    const expires = f.expires_at?.toDate ? f.expires_at.toDate() : new Date(f.expires_at);
    return expires >= new Date();
  }).length;
  const submittedCount = forms.filter((f) => f.status === "submitted").length;
  const expiredCount = forms.filter((f) => {
    if (f.status === "submitted") return false;
    const expires = f.expires_at?.toDate ? f.expires_at.toDate() : new Date(f.expires_at);
    return expires < new Date();
  }).length;

  return (
    <div style={s.wrap}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>📋 Send Request Form</h2>
          <p style={s.sub}>
            Sending as <strong>{userProfile?.full_name || userProfile?.email}</strong>
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        )}
      </div>

      {/* ── Affiliate link ── */}
      <div style={s.linkBox}>
        <div style={s.linkBoxText}>
          <span style={{ fontSize: "16px" }}>🔗</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#2d4a3a" }}>Your personal form link</div>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
              Share this link via WhatsApp — it's automatically linked to you
            </div>
          </div>
        </div>
        <button onClick={handleCopyLink} style={s.copyBtn}>
          {copiedLink ? "✓ Copied!" : "Copy Link"}
        </button>
      </div>

      {/* ── Send form ── */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Send form to requester</h3>
        <p style={s.hint}>Enter the requester's phone number to register them in the system.</p>

        {error && <div style={s.errorBox}>⚠️ {error}</div>}
        {success && <div style={s.successBox}>✅ {success}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            placeholder="Requester phone number *"
            value={requesterPhone}
            onChange={(e) => setRequesterPhone(e.target.value)}
            type="tel"
            style={s.input}
          />
          <button type="submit" disabled={sending} style={s.sendBtn}>
            {sending ? "Sending..." : "Register & Send"}
          </button>
        </form>
      </div>

      {/* ── Stats ── */}
      {forms.length > 0 && (
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#854F0B" }}>{sentCount}</div>
            <div style={{ fontSize: "11px", color: "#888" }}>Waiting</div>
          </div>
          <div style={s.statCard}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#085041" }}>{submittedCount}</div>
            <div style={{ fontSize: "11px", color: "#888" }}>Submitted</div>
          </div>
          <div style={s.statCard}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#888" }}>{expiredCount}</div>
            <div style={{ fontSize: "11px", color: "#888" }}>Expired</div>
          </div>
        </div>
      )}

      {/* ── Forms list ── */}
      <div style={s.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
          <h3 style={s.sectionTitle}>Sent forms history</h3>
          <input
            placeholder="Search by phone..."
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            style={{ ...s.input, maxWidth: "200px", padding: "8px 12px", fontSize: "13px" }}
          />
        </div>

        {loadingForms ? (
          <div style={s.hint}>Loading...</div>
        ) : filteredForms.length === 0 ? (
          <div style={s.hint}>
            {phoneSearch ? "No forms match that phone number." : "No forms sent yet."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredForms.map((form) => {
              const badge = getStatusBadge(form.status, form.expires_at);
              return (
                <div key={form.id} style={s.formRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "#2d4a3a" }}>
                      📞 {form.requester_phone}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                      Sent: {formatDate(form.sent_at)}
                      {form.expires_at && (
                        <span> · Expires: {formatDate(form.expires_at)}</span>
                      )}
                    </div>
                    {form.submitted_at && (
                      <div style={{ fontSize: "12px", color: "#085041", marginTop: "2px" }}>
                        Submitted: {formatDate(form.submitted_at)}
                      </div>
                    )}
                  </div>
                  <span style={{
                    ...s.badge,
                    background: badge.bg,
                    color: badge.color,
                  }}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  wrap: {
    width: "100%",
    fontFamily: "Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#2d4a3a",
  },
  sub: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#6a7f73",
  },
  closeBtn: {
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer",
    color: "#6a7f73",
    padding: "4px 8px",
    lineHeight: 1,
  },
  linkBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "14px 16px",
    background: "#FAEEDA",
    borderRadius: "14px",
    border: "1px solid #EF9F27",
    flexWrap: "wrap",
  },
  linkBoxText: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
  },
  copyBtn: {
    padding: "8px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#BA7517",
    color: "white",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  section: {
    background: "#fffdf8",
    border: "1px solid #f0e6cc",
    borderRadius: "14px",
    padding: "16px",
  },
  sectionTitle: {
    margin: "0 0 6px",
    fontSize: "15px",
    fontWeight: 700,
    color: "#2d4a3a",
  },
  hint: {
    fontSize: "13px",
    color: "#888",
    margin: "0 0 10px",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #e0d4b8",
    fontSize: "14px",
    outline: "none",
    background: "white",
    color: "#2d4a3a",
    boxSizing: "border-box",
    minWidth: "180px",
  },
  sendBtn: {
    padding: "10px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#1f7a5c",
    color: "white",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
  },
  statCard: {
    background: "white",
    border: "1px solid #f0e6cc",
    borderRadius: "12px",
    padding: "12px",
    textAlign: "center",
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    background: "white",
    borderRadius: "12px",
    border: "1px solid #f0e6cc",
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-block",
    fontSize: "12px",
    padding: "4px 10px",
    borderRadius: "999px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  errorBox: {
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#FCEBEB",
    border: "1px solid #F09595",
    color: "#791F1F",
    fontSize: "13px",
    marginBottom: "10px",
  },
  successBox: {
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#E1F5EE",
    border: "1px solid #9FE1CB",
    color: "#085041",
    fontSize: "13px",
    marginBottom: "10px",
  },
};

export default CoordinatorSendForm;
