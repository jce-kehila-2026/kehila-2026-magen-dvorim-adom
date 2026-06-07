import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { registerUser } from "../services/authService";
import {
  getAllUsers,
  updateUserProfileAdmin,
  deleteUserProfile,
  activateUser,
} from "../services/userService";
import {
  USER_ROLES,
  buildUserProfile,
  validateUserProfile,
} from "../services/userSchema";

const ISRAELI_CITIES = [
  "Jerusalem", "Tel Aviv", "Haifa", "Rishon LeZion", "Petah Tikva",
  "Ashdod", "Netanya", "Beer Sheva", "Bnei Brak", "Holon",
  "Bat Yam", "Ramat Gan", "Ashkelon", "Rehovot", "Herzliya",
  "Kfar Saba", "Modi'in", "Hadera", "Nazareth", "Lod",
  "Ramla", "Ra'anana", "Nahariya", "Givatayim", "Hod HaSharon",
  "Rosh HaAyin", "Acre", "Afula", "Nes Ziona", "Eilat",
  "Tiberias", "Safed", "Dimona", "Kiryat Gat", "Kiryat Ata",
  "Kiryat Bialik", "Kiryat Motzkin", "Kiryat Ono", "Kiryat Yam",
  "Netivot", "Ofakim", "Or Yehuda", "Yehud", "Azur",
  "Tayibe", "Umm al-Fahm", "Shfaram", "Sakhnin", "Tamra",
  "Arraba", "Maghar", "Tira", "Qalansawe", "Kafr Qasim",
  "Kafr Manda", "Nof HaGalil", "Ma'alot-Tarshiha", "Shlomi",
  "Tirat Carmel", "Nesher", "Yokneam", "Zichron Yaakov",
  "Caesarea", "Pardes Hanna", "Binyamina", "Or Akiva",
  "Migdal HaEmek", "Bet She'an", "Bet Shemesh", "Modi'in Illit",
  "Beitar Illit", "Ariel", "Maale Adumim",
];

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name[0].toUpperCase();
}

function getRoleBadge(role) {
  if (role === USER_ROLES.ADMIN)
    return { bg: "#FAEEDA", color: "#854F0B", label: "Admin" };
  if (role === USER_ROLES.COORDINATOR)
    return { bg: "#E6F1FB", color: "#0C447C", label: "Coordinator" };
  return { bg: "#E1F5EE", color: "#085041", label: "Volunteer" };
}

function getAvatarStyle(role) {
  if (role === USER_ROLES.ADMIN) return { bg: "#FAEEDA", color: "#854F0B" };
  if (role === USER_ROLES.COORDINATOR) return { bg: "#E6F1FB", color: "#0C447C" };
  return { bg: "#E1F5EE", color: "#085041" };
}

function AdminUsers() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("active");
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [formMode, setFormMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    occupation: "",
    city: "",
    role: USER_ROLES.VOLUNTEER,
    is_available: true,
    password: "",
    experience_level: "beginner",
    height_work: false,
  });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAllUsers(100);
      const all = result.users || [];
      setUsers(all.filter((u) => u.is_active !== false));
      setDeletedUsers(all.filter((u) => u.is_active === false));
    } catch (err) {
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setFormMode("create");
    setFormData({
      full_name: "", email: "", phone: "", occupation: "", city: "",
      role: USER_ROLES.VOLUNTEER, is_available: true, password: "",
      experience_level: "beginner", height_work: false,
    });
    setCitySearch("");
    setShowCityDropdown(false);
    setMessage("");
    setError("");
  };

  const openUserModal = (mode = "create", user = null) => {
    resetForm();
    if (mode === "edit" && user) {
      setSelectedUser(user);
      setFormMode("edit");
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        occupation: user.occupation || "",
        city: user.city || "",
        role: user.role || USER_ROLES.VOLUNTEER,
        is_available: Boolean(user.is_available),
        password: "",
        experience_level: user.experience_level || "beginner",
        height_work: Boolean(user.height_work),
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); resetForm(); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const isFormValid = () => {
    if (!formData.full_name.trim()) return false;
    if (!formData.email.trim()) return false;
    if (!formData.phone.trim()) return false;
    if (!formData.city) return false;
    if (formMode === "create" && !formData.password) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const profilePayload = buildUserProfile({
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      occupation: formData.occupation,
      city: formData.city,
      role: formData.role,
      is_available: formData.is_available,
      experience_level: formData.experience_level,
      height_work: formData.height_work,
    });

    const validation = validateUserProfile(profilePayload);
    if (!validation.isValid) {
      setError(Object.values(validation.errors).join(" "));
      return;
    }

    setSaving(true);
    try {
      if (formMode === "create") {
        if (!formData.password) { setError("Password is required."); return; }
        await registerUser(formData.email, formData.password, profilePayload);
        setMessage("New user created successfully.");
      } else if (selectedUser) {
        await updateUserProfileAdmin(selectedUser.uid, {
          full_name: profilePayload.full_name,
          phone: profilePayload.phone,
          occupation: profilePayload.occupation,
          city: profilePayload.city,
          role: profilePayload.role,
          is_available: profilePayload.is_available,
          experience_level: formData.experience_level,
          height_work: formData.height_work,
        });
        setMessage("User updated successfully.");
      }
      resetForm();
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.full_name || user.email}?`)) return;
    setSaving(true);
    try {
      await deleteUserProfile(user.uid);
      setMessage("User deactivated.");
      if (selectedUser?.uid === user.uid) resetForm();
      await loadUsers();
    } catch (err) {
      setError(err.message || "Could not delete user.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (user) => {
    setSaving(true);
    try {
      await activateUser(user.uid);
      setMessage("User restored.");
      await loadUsers();
    } catch (err) {
      setError(err.message || "Could not restore user.");
    } finally {
      setSaving(false);
    }
  };

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email)),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const list = viewMode === "deleted" ? deletedUsers : sortedUsers;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) =>
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  }, [searchQuery, sortedUsers, deletedUsers, viewMode]);

  const volunteerCount = users.filter((u) => u.role === USER_ROLES.VOLUNTEER).length;
  const coordinatorCount = users.filter((u) => u.role === USER_ROLES.COORDINATOR).length;
  const availableCount = users.filter((u) => u.is_available).length;

  const formatDate = (ts) => {
    if (!ts) return "—";
    if (ts.toDate) return ts.toDate().toLocaleDateString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
    return String(ts);
  };

  return (
    <div style={{ background: "#fffdf5", minHeight: "100vh" }}>
      <Navbar />
      <main style={s.page}>

        {/* Header */}
        <div style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>🐝 User Directory</h1>
            <p style={s.pageSub}>Manage volunteers, coordinators, and admins</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => setViewMode("active")}
              style={{ ...s.tabBtn, ...(viewMode === "active" ? s.tabBtnActive : {}) }}
            >
              Active users
            </button>
            <button
              onClick={() => setViewMode("deleted")}
              style={{ ...s.tabBtn, ...(viewMode === "deleted" ? s.tabBtnActive : {}) }}
            >
              Deleted users
            </button>
            {viewMode === "active" && (
              <button onClick={() => openUserModal("create")} style={s.primaryBtn}>
                + Add User
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {viewMode === "active" && (
          <div style={s.statsRow}>
            {[
              { val: users.length, lbl: "Total users" },
              { val: volunteerCount, lbl: "Volunteers" },
              { val: coordinatorCount, lbl: "Coordinators" },
              { val: availableCount, lbl: "Available now" },
            ].map((stat) => (
              <div key={stat.lbl} style={s.statCard}>
                <div style={s.statVal}>{stat.val}</div>
                <div style={s.statLbl}>{stat.lbl}</div>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        {message && <div style={s.successBox}>{message}</div>}
        {error && <div style={s.errorBox}>{error}</div>}

        {/* User list card */}
        <div style={s.card}>
          <div style={s.searchRow}>
            <div style={s.searchBox}>
              <span style={{ fontSize: "16px", color: "#888" }}>🔍</span>
              <input
                placeholder="Search by name, phone, or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={s.searchInput}
              />
            </div>
            <span style={s.countPill}>{filteredUsers.length} users</span>
          </div>

          {loading ? (
            <div style={s.loading}>Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <div style={s.emptyState}>No users found.</div>
          ) : (
            filteredUsers.map((user) => {
              const badge = getRoleBadge(user.role);
              const avatar = getAvatarStyle(user.role);
              return (
                <div key={user.uid} style={s.userRow}>
                  <div style={{ ...s.avatar, background: avatar.bg, color: avatar.color }}>
                    {getInitials(user.full_name || user.email)}
                  </div>
                  <div style={s.userInfo}>
                    <div style={s.userName}>{user.full_name || "—"}</div>
                    <div style={s.userMeta}>
                      {user.phone && <span>📞 {user.phone}</span>}
                      {user.phone && user.city && <span> · </span>}
                      {user.city && <span>📍 {user.city}</span>}
                      {user.email && <span style={{ marginLeft: user.phone || user.city ? "6px" : 0 }}>✉️ {user.email}</span>}
                    </div>
                    <div style={{ marginTop: "4px", fontSize: "11px", color: "#888" }}>
                      Joined {formatDate(user.created_at)}
                      {user.experience_level && <span> · {user.experience_level}</span>}
                      {user.height_work && <span> · 🪜 Height license</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ ...s.badge, background: badge.bg, color: badge.color }}>{badge.label}</span>
                    <span style={{
                      ...s.badge,
                      background: user.is_available ? "#EAF3DE" : "#FCEBEB",
                      color: user.is_available ? "#27500A" : "#791F1F",
                    }}>
                      {user.is_available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginLeft: "8px" }}>
                    <button
                      onClick={() => openUserModal("edit", user)}
                      style={s.iconBtn}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    {viewMode === "active" ? (
                      <button
                        onClick={() => handleDelete(user)}
                        style={{ ...s.iconBtn, borderColor: "#F09595", color: "#A32D2D" }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestore(user)}
                        style={{ ...s.iconBtn, borderColor: "#9FE1CB", color: "#085041" }}
                        title="Restore"
                      >
                        ↩️
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div style={s.modalOverlay}>
            <div style={s.modal}>
              <div style={s.modalHeader}>
                <div>
                  <h2 style={s.modalTitle}>
                    {formMode === "create" ? "🐝 Create new user" : "✏️ Edit user"}
                  </h2>
                  <p style={s.modalSub}>
                    {formMode === "create" ? "Fields marked * are required." : "Update this user's profile."}
                  </p>
                </div>
                <button onClick={closeModal} style={s.closeBtn}>✕</button>
              </div>

              {message && <div style={s.successBox}>{message}</div>}
              {error && <div style={s.errorBox}>{error}</div>}

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>

                <div style={s.fieldGroup}>
                  <label style={s.fieldLabel}>Full name <span style={s.required}>*</span></label>
                  <input
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    style={{ ...s.input, borderColor: !formData.full_name.trim() ? "#e74c3c" : "#e0d4b8" }}
                  />
                  {!formData.full_name.trim() && <span style={s.fieldError}>Required</span>}
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.fieldLabel}>Email <span style={s.required}>*</span></label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    readOnly={formMode === "edit"}
                    style={{
                      ...s.input,
                      borderColor: !formData.email.trim() ? "#e74c3c" : "#e0d4b8",
                      background: formMode === "edit" ? "#f5f5f5" : "#fffdf8",
                    }}
                  />
                  {!formData.email.trim() && <span style={s.fieldError}>Required</span>}
                </div>

                {formMode === "create" && (
                  <div style={s.fieldGroup}>
                    <label style={s.fieldLabel}>Password <span style={s.required}>*</span></label>
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      style={{ ...s.input, borderColor: !formData.password ? "#e74c3c" : "#e0d4b8" }}
                    />
                    {!formData.password && <span style={s.fieldError}>Required</span>}
                  </div>
                )}

                <div style={s.fieldGroup}>
                  <label style={s.fieldLabel}>Role <span style={s.required}>*</span></label>
                  <select name="role" value={formData.role} onChange={handleChange} style={s.input}>
                    <option value={USER_ROLES.ADMIN}>Admin</option>
                    <option value={USER_ROLES.COORDINATOR}>Coordinator</option>
                    <option value={USER_ROLES.VOLUNTEER}>Volunteer</option>
                  </select>
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.fieldLabel}>Phone number <span style={s.required}>*</span></label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ ...s.input, borderColor: !formData.phone.trim() ? "#e74c3c" : "#e0d4b8" }}
                  />
                  {!formData.phone.trim() && <span style={s.fieldError}>Required</span>}
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.fieldLabel}>
                    Occupation <span style={{ color: "#999", fontSize: "12px", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input name="occupation" value={formData.occupation} onChange={handleChange} style={s.input} />
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.fieldLabel}>City <span style={s.required}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <input
                      value={citySearch || formData.city}
                      onChange={(e) => { setCitySearch(e.target.value); setShowCityDropdown(true); }}
                      onFocus={() => setShowCityDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
                      placeholder="Search city..."
                      style={{ ...s.input, borderColor: !formData.city ? "#e74c3c" : "#e0d4b8" }}
                    />
                    {showCityDropdown && (
                      <div style={s.dropdown}>
                        {ISRAELI_CITIES.filter((c) =>
                          c.toLowerCase().includes((citySearch || "").toLowerCase())
                        ).map((city) => (
                          <div
                            key={city}
                            onMouseDown={() => {
                              setFormData((prev) => ({ ...prev, city }));
                              setCitySearch("");
                              setShowCityDropdown(false);
                            }}
                            style={s.dropdownItem}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#fff8ec"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                          >
                            {city}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {!formData.city && <span style={s.fieldError}>Required</span>}
                  {formData.city && (
                    <span style={{ fontSize: "12px", color: "#6a7f73" }}>
                      Selected: <strong>{formData.city}</strong>
                    </span>
                  )}
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.fieldLabel}>Experience level</label>
                  <select name="experience_level" value={formData.experience_level} onChange={handleChange} style={s.input}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="experienced">Experienced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <label style={s.checkLabel}>
                  <input
                    name="height_work"
                    type="checkbox"
                    checked={formData.height_work}
                    onChange={handleChange}
                    style={{ accentColor: "#BA7517" }}
                  />
                  🪜 Has working from heights license
                </label>

                <label style={s.checkLabel}>
                  <input
                    name="is_available"
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={handleChange}
                    style={{ accentColor: "#BA7517" }}
                  />
                  ✅ Available for assignments
                </label>

                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <button
                    type="submit"
                    disabled={saving || !isFormValid()}
                    style={{
                      ...s.primaryBtn,
                      opacity: saving || !isFormValid() ? 0.5 : 1,
                      cursor: saving || !isFormValid() ? "not-allowed" : "pointer",
                      flex: 1,
                    }}
                  >
                    {saving ? "Saving..." : formMode === "create" ? "Create User" : "Save Changes"}
                  </button>
                  <button type="button" onClick={closeModal} style={{ ...s.cancelBtn, flex: 1 }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  page: {
    padding: "28px 28px 60px",
    maxWidth: "1100px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },
  pageTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#2d4a3a",
  },
  pageSub: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#6a7f73",
  },
  tabBtn: {
    padding: "8px 16px",
    borderRadius: "12px",
    border: "1px solid #e0d4b8",
    background: "white",
    color: "#6a7f73",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: 500,
  },
  tabBtnActive: {
    background: "#FAEEDA",
    borderColor: "#EF9F27",
    color: "#854F0B",
  },
  primaryBtn: {
    padding: "10px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#BA7517",
    color: "#FAEEDA",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: "12px",
    border: "1px solid #e0d4b8",
    background: "white",
    color: "#4a5e52",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  statCard: {
    background: "white",
    border: "1px solid #f0e6cc",
    borderRadius: "16px",
    padding: "16px 18px",
  },
  statVal: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#2d4a3a",
  },
  statLbl: {
    fontSize: "12px",
    color: "#6a7f73",
    marginTop: "2px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    border: "1px solid #f0e6cc",
    padding: "20px 24px",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 14px",
    borderRadius: "12px",
    border: "1px solid #e0d4b8",
    background: "#fffdf8",
    flex: 1,
    minWidth: "200px",
    maxWidth: "360px",
  },
  searchInput: {
    border: "none",
    background: "transparent",
    color: "#2d4a3a",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  },
  countPill: {
    fontSize: "12px",
    color: "#6a7f73",
    background: "#f5f0e8",
    borderRadius: "999px",
    padding: "5px 12px",
    border: "1px solid #e0d4b8",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 0",
    borderBottom: "1px solid #f5f0e8",
    flexWrap: "wrap",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 700,
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    minWidth: "160px",
  },
  userName: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#2d4a3a",
  },
  userMeta: {
    fontSize: "12px",
    color: "#6a7f73",
    marginTop: "2px",
  },
  badge: {
    display: "inline-block",
    fontSize: "11px",
    padding: "3px 10px",
    borderRadius: "999px",
    fontWeight: 600,
  },
  iconBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    border: "1px solid #e0d4b8",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "14px",
  },
  loading: {
    padding: "24px",
    color: "#6a7f73",
    textAlign: "center",
  },
  emptyState: {
    padding: "32px",
    textAlign: "center",
    color: "#6a7f73",
    fontSize: "15px",
  },
  successBox: {
    background: "#E1F5EE",
    border: "1px solid #9FE1CB",
    color: "#085041",
    borderRadius: "12px",
    padding: "12px 16px",
    marginBottom: "14px",
    fontSize: "14px",
  },
  errorBox: {
    background: "#FCEBEB",
    border: "1px solid #F09595",
    color: "#791F1F",
    borderRadius: "12px",
    padding: "12px 16px",
    marginBottom: "14px",
    fontSize: "14px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
    zIndex: 999,
  },
  modal: {
    width: "100%",
    maxWidth: "520px",
    maxHeight: "calc(100vh - 60px)",
    overflowY: "auto",
    background: "#fffdf8",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 24px 70px rgba(0,0,0,0.15)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    gap: "12px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#2d4a3a",
  },
  modalSub: {
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
  fieldGroup: {
    display: "grid",
    gap: "6px",
  },
  fieldLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#2d4a3a",
  },
  required: {
    color: "#e74c3c",
  },
  fieldError: {
    fontSize: "11px",
    color: "#e74c3c",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "12px",
    border: "1px solid #e0d4b8",
    fontSize: "14px",
    outline: "none",
    background: "#fffdf8",
    color: "#2d4a3a",
    boxSizing: "border-box",
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "#2d4a3a",
    cursor: "pointer",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #e0d4b8",
    borderRadius: "12px",
    maxHeight: "180px",
    overflowY: "auto",
    zIndex: 300,
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
  },
  dropdownItem: {
    padding: "10px 14px",
    cursor: "pointer",
    color: "#2d4a3a",
    fontSize: "14px",
    borderBottom: "1px solid #f5f0e8",
    background: "white",
  },
};

export default AdminUsers;
