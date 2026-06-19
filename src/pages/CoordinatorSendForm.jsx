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
    <div style={s.quickBox}>

      <form onSubmit={submit} style={s.form}>
        <input
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={s.input}
        />

        <div style={s.actions}>
          <button style={s.createBtn}>Create form</button>

          <button type="button" onClick={copy} style={s.linkBtn}>
            Copy Link
          </button>
        </div>
      </form>

      {msg && <div style={s.msg}>{msg}</div>}
    </div>

    <input
      placeholder="Search phone..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      style={s.input}
    />

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

    <div style={s.list}>
      <div style={s.headerRow}>
        <div style={s.headerPhone}>Phone</div>
        <div style={s.headerDates}>Dates</div>
        <div style={s.headerStatus}>Status</div>
      </div>

      {list.map((f) => {
        const status = getStatus(f);

        return (
          <div key={f.id} style={s.row}>
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
        <div style={s.empty}>No results</div>
      )}
    </div>
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

 quickBox: {
  background: "white",
  padding: 10,
  borderRadius: 14,
  border: "1px solid #f0e5d8",
},
  title: {
    margin: "0 0 10px",
    color: "#2b160c",
    fontSize: 20,
    fontWeight: 900,
    textAlign: "center",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  input: {
    padding: 10,
    border: "1px solid #ddd0c4",
    borderRadius: 10,
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
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
    marginTop: 8,
    fontSize: 12,
    color: "#15803d",
    textAlign: "center",
    fontWeight: 700,
  },

  filters: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },

  filterBtn: {
    padding: "6px 10px",
    border: "none",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
  },

list: {
  maxHeight: "180px",
  overflowY: "auto",
  border: "1px solid #eee",
  borderRadius: 12,
  background: "white",
},

  headerRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr 0.9fr",
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 800,
    color: "#777",
    borderBottom: "1px solid #ddd",
    background: "#f9f9f9",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr 0.9fr",
    padding: "9px 10px",
    borderBottom: "1px solid #eee",
    fontSize: 12,
    background: "white",
    alignItems: "center",
  },

  headerPhone: {},
  headerDates: {},
  headerStatus: { textAlign: "right" },

  phone: {
    fontWeight: 800,
  },

  dates: {
    color: "#777",
    fontSize: 11,
  },

  status: {
    textAlign: "right",
    fontWeight: 900,
    fontSize: 11,
  },

  empty: {
    padding: 16,
    color: "#999",
    textAlign: "center",
    fontWeight: 700,
  },
};

export default CoordinatorSendForm;