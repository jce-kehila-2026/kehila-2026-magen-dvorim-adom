import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  createIntakeForm,
  getIntakeFormsByCoordinator,
  getAllIntakeForms,
} from "../services/intakeFormService";
import { USER_ROLES } from "../services/userSchema";

function getStatus(form) {
  const expires = form.expires_at?.toDate
    ? form.expires_at.toDate()
    : new Date(form.expires_at);

  if (form.status === "submitted") return "submitted";
  if (expires < new Date()) return "expired";
  return "waiting";
}

function formatDate(ts) {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB'); 
  // en-GB gives DD/MM/YYYY
}


function CoordinatorSendForm() {
  const { userProfile } = useAuth();

  const [phone, setPhone] = useState("");
  const [forms, setForms] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [msg, setMsg] = useState("");

  const id = userProfile.uid;

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    let data =
      userProfile.role === USER_ROLES.ADMIN
        ? await getAllIntakeForms()
        : await getIntakeFormsByCoordinator(id);

    data.sort((a, b) => (b.sent_at?.seconds || 0) - (a.sent_at?.seconds || 0));
    setForms(data);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!phone) return;

    try {
      await createIntakeForm({
        requester_phone: phone,
        coordinator_id: id,
      });
      setPhone("");
      setMsg("Created ✅");
      load();
    } catch (e) {
      setMsg(e.message);
    }
  };

  const copy = () => {
    const link = `${window.location.origin}/submit-case?coordinator=${id}`;
    navigator.clipboard.writeText(link);
    setMsg("Link copied ✅");
  };

  // ✅ counts
  const counts = {
    all: forms.length,
    waiting: forms.filter((f) => getStatus(f) === "waiting").length,
    submitted: forms.filter((f) => getStatus(f) === "submitted").length,
    expired: forms.filter((f) => getStatus(f) === "expired").length,
  };

  // ✅ filtering
  const list = forms.filter((f) => {
    const matchesSearch = f.requester_phone.includes(search);
    if (filter === "all") return matchesSearch;
    return matchesSearch && getStatus(f) === filter;
  });

  return (
    <div style={s.wrapper}>
      {/* LEFT PANEL */}
      <div style={s.left}>
        <h3>Send Form</h3>

        <form onSubmit={submit} style={s.form}>
          <input
            placeholder="Phone..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={s.input}
          />
          <button style={s.createBtn}>Create form</button>
        </form>

        <button onClick={copy} style={s.linkBtn}>
          Copy Link
        </button>

        {msg && <div style={s.msg}>{msg}</div>}
      </div>

      {/* RIGHT PANEL */}
      <div style={s.right}>
        {/* search */}
        <input
          placeholder="Search phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={s.input}
        />

        {/* filters */}
        <div style={s.filters}>
          {["all", "waiting", "submitted", "expired"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...s.filterBtn,
                background: filter === f ? "#1f7a5c" : "#eee",
                color: filter === f ? "white" : "#333",
              }}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        {/* table */}
        <div style={s.list}>
          {/* headers */}
          <div style={s.headerRow}>
            <div style={s.headerPhone}>Phone</div>
            <div style={s.headerDates}>Dates</div>
            <div style={s.headerStatus}>Status</div>
          </div>

          {/* rows */}
          {list.map((f) => {
            const status = getStatus(f);

            return (
              <div
                key={f.id}
                style={s.row}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fafafa")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "white")
                }
              >
                <div style={s.phone}>{f.requester_phone}</div>

                <div style={s.dates}>
                  {formatDate(f.sent_at)} → {formatDate(f.expires_at)}
                </div>

                <div
                  style={{
                    ...s.status,
                    color:
                      status === "waiting"
                        ? "#ff9800"
                        : status === "submitted"
                        ? "#1f7a5c"
                        : "#999",
                  }}
                >
                  {status}
                </div>
              </div>
            );
          })}

          {list.length === 0 && (
            <div style={{ padding: 10, color: "#999", textAlign: "center" }}>
              No results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    display: "flex",
    gap: 20,
    alignItems: "flex-start",
  },

  left: {
    width: "30%",
    background: "#fafafa",
    padding: 15,
    borderRadius: 10,
    border: "1px solid #eee",
  },

  right: {
    width: "70%",
  },

  form: {
    display: "flex",
    gap: 6,
    marginBottom: 10,
  },

  input: {
    padding: 8,
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: 13,
    width: "100%",
  },

  createBtn: {
    background: "#ff9800",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },

  linkBtn: {
    background: "#1f7a5c",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
    width: "100%",
  },

  msg: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },

  filters: {
    display: "flex",
    gap: 6,
    margin: "10px 0",
    flexWrap: "wrap",
  },

  filterBtn: {
    padding: "4px 10px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
  },

  list: {
    maxHeight: "180px", // ✅ ~5 rows
    overflowY: "auto",
    border: "1px solid #eee",
    borderRadius: 6,
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "#777",
    borderBottom: "1px solid #ddd",
    background: "#f9f9f9",
  },

  headerPhone: { width: "35%" },
  headerDates: { width: "40%" },
  headerStatus: { width: "25%", textAlign: "right" },

  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 10px",
    borderBottom: "1px solid #eee",
    fontSize: 13,
    background: "white",
  },

  phone: {
    width: "35%",
    fontWeight: 600,
  },

  dates: {
    width: "40%",
    color: "#777",
    fontSize: 12,
  },

  status: {
    width: "25%",
    textAlign: "right",
    fontWeight: "bold",
  },
};

export default CoordinatorSendForm;