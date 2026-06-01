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
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    occupation: "",
    city: "",
    role: USER_ROLES.VOLUNTEER,
    is_available: true,
    password: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAllUsers(100);
      const all = result.users || [];
      setUsers(all.filter((user) => user.is_active !== false));
      setDeletedUsers(all.filter((user) => user.is_active === false));
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  const [modalOpen, setModalOpen] = useState(false);

  const resetForm = () => {
    setSelectedUser(null);
    setFormMode("create");
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      occupation: "",
      city: "",
      role: USER_ROLES.VOLUNTEER,
      is_available: true,
      password: "",
    });
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
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleSelectUser = (user) => {
    openUserModal("edit", user);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
    });

    const validation = validateUserProfile(profilePayload);
    if (!validation.isValid) {
      setError(Object.values(validation.errors).join(" "));
      return;
    }

    setSaving(true);

    try {
      if (formMode === "create") {
        if (!formData.password) {
          setError("Password is required when creating a new user.");
          return;
        }

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
        });
        setMessage("User updated successfully.");
      }

      resetForm();
      await loadUsers();
    } catch (err) {
      console.error("User save failed:", err);
      setError(err.message || "Failed to save user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.full_name || user.email}?`)) {
      return;
    }

    setError("");
    setSaving(true);

    try {
      await deleteUserProfile(user.uid);
      setMessage("User deactivated successfully.");
      if (selectedUser?.uid === user.uid) {
        resetForm();
      }
      await loadUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError(err.message || "Could not delete user.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (user) => {
    setError("");
    setSaving(true);

    try {
      await activateUser(user.uid);
      setMessage("User restored successfully.");
      await loadUsers();
    } catch (err) {
      console.error("Failed to restore user:", err);
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
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return list;
    return list.filter((user) => {
      const name = (user.full_name || "").toLowerCase();
      const phone = (user.phone || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return (
        name.includes(normalized) ||
        phone.includes(normalized) ||
        email.includes(normalized)
      );
    });
  }, [searchQuery, sortedUsers, deletedUsers, viewMode]);

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "—";
    }

    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }

    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }

    return String(timestamp);
  };

  return (
    <div>
      <Navbar />
      <main style={styles.page}>
        <section style={styles.panel}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>User Directory</h1>
              <p style={styles.subtitle}>
                Search users by name or phone, update roles, and manage profile details.
              </p>
            </div>
            <div style={styles.meta}>
              <span>Signed in as {userProfile?.full_name}</span>
              <strong>{userProfile?.role}</strong>
            </div>
          </div>

          <div style={styles.topBar}>
            <div>
              <h2>{viewMode === "deleted" ? "Deleted users" : "User list"}</h2>
              <p style={styles.helperText}>
                {viewMode === "deleted"
                  ? "Review deleted users and restore accounts."
                  : "Search users by name, phone number, or email."}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setViewMode("active")}
                style={{
                  ...styles.addButton,
                  background: viewMode === "active" ? "#1f7a5c" : "#ccc",
                }}
              >
                Active users
              </button>
              <button
                type="button"
                onClick={() => setViewMode("deleted")}
                style={{
                  ...styles.addButton,
                  background: viewMode === "deleted" ? "#1f7a5c" : "#ccc",
                }}
              >
                Deleted users
              </button>
              {viewMode === "active" && (
                <button type="button" onClick={() => openUserModal("create")} style={styles.addButton}>
                  + Add User
                </button>
              )}
            </div>
          </div>

          <div style={styles.listCard}>
            <div style={styles.searchRow}>
              <input
                placeholder="Search name, phone, or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              <span>{filteredUsers.length} users</span>
            </div>

            {loading ? (
              <div style={styles.loading}>Loading users…</div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Availability</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.uid}>
                        <td>{user.full_name || "—"}</td>
                        <td>{user.email || "—"}</td>
                        <td>{user.phone || "—"}</td>
                        <td>{user.role}</td>
                        <td>{user.is_available ? "Available" : "Unavailable"}</td>
                        <td>{formatDate(user.created_at)}</td>
                        <td style={styles.actionsCell}>
                          <button
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            style={styles.smallButton}
                          >
                            Edit
                          </button>
                          {viewMode === "active" ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              style={styles.deleteButton}
                            >
                              Delete
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRestore(user)}
                              style={{ ...styles.smallButton, background: "#2e7d32" }}
                            >
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {modalOpen && (
            <div style={styles.modalOverlay}>
              <div style={styles.modal}>
                <div style={styles.modalHeader}>
                  <div>
                    <h2>{formMode === "create" ? "Create New User" : "Edit User"}</h2>
                    <p style={styles.helperText}>
                      {formMode === "create"
                        ? "Add a new user and set their role."
                        : "Update this user’s profile details."}
                    </p>
                  </div>
                  <button type="button" onClick={closeModal} style={styles.closeButton}>
                    ✕
                  </button>
                </div>

                {message && <div style={styles.successBox}>{message}</div>}
                {error && <div style={styles.errorBox}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                  <label style={styles.label}>
                    Full name
                    <input
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.label}>
                    Email
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      style={styles.input}
                      readOnly={formMode === "edit"}
                    />
                  </label>

                  {formMode === "create" && (
                    <label style={styles.label}>
                      Password
                      <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </label>
                  )}

                  <label style={styles.label}>
                    Role
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      style={styles.input}
                    >
                      <option value={USER_ROLES.ADMIN}>Admin</option>
                      <option value={USER_ROLES.COORDINATOR}>Coordinator</option>
                      <option value={USER_ROLES.VOLUNTEER}>Volunteer</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    Phone number
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.label}>
                    Occupation
                    <input
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.label}>
                    City
                    <input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.switchLabel}>
                    <input
                      name="is_available"
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={handleChange}
                    />
                    Available for assignments
                  </label>

                  <div style={styles.actions}>
                    <button type="submit" disabled={saving} style={styles.saveButton}>
                      {saving ? "Saving..." : formMode === "create" ? "Create User" : "Save Changes"}
                    </button>
                    <button type="button" onClick={closeModal} style={styles.cancelButton}>
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px 24px 48px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  panel: {
    background: "white",
    borderRadius: "28px",
    boxShadow: "0 32px 90px rgba(0,0,0,0.08)",
    padding: "32px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    marginBottom: "28px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    color: "#173b2f",
  },
  subtitle: {
    margin: "10px 0 0",
    maxWidth: "680px",
    color: "#4f5f58",
    fontSize: "16px",
  },
  meta: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "14px",
    color: "#5f6f68",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    marginBottom: "20px",
  },
  addButton: {
    border: "none",
    borderRadius: "16px",
    padding: "12px 20px",
    background: "#1f7a5c",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  helperText: {
    margin: "6px 0 0",
    color: "#5f6f68",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 420px) 1fr",
    gap: "28px",
  },
  formCard: {
    padding: "24px",
    borderRadius: "24px",
    border: "1px solid #e8f1ec",
    background: "#fafafa",
  },
  form: {
    display: "grid",
    gap: "14px",
  },
  label: {
    display: "grid",
    gap: "8px",
    fontSize: "14px",
    color: "#2a3e35",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  searchInput: {
    padding: "12px 14px",
    borderRadius: "14px",
    border: "1px solid #cfd8cc",
    minWidth: "240px",
    width: "100%",
    maxWidth: "320px",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #cfd8cc",
    fontSize: "15px",
    outline: "none",
  },
  switchLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "15px",
    color: "#2a3e35",
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "10px",
  },
  saveButton: {
    border: "none",
    borderRadius: "14px",
    padding: "14px 22px",
    background: "#1f7a5c",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  cancelButton: {
    border: "1px solid #ccc",
    borderRadius: "14px",
    padding: "14px 22px",
    background: "white",
    color: "#173b2f",
    cursor: "pointer",
  },
  listCard: {
    padding: "24px",
    borderRadius: "24px",
    border: "1px solid #e8f1ec",
    background: "#fbfdfb",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
    zIndex: 99,
  },
  modal: {
    width: "100%",
    maxWidth: "540px",
    maxHeight: "calc(100vh - 80px)",
    overflowY: "auto",
    background: "white",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 24px 70px rgba(0,0,0,0.15)",
    position: "relative",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },
  closeButton: {
    border: "none",
    background: "transparent",
    color: "#233d33",
    fontSize: "22px",
    cursor: "pointer",
    padding: "6px 10px",
    lineHeight: 1,
  },
  loading: {
    padding: "24px",
    color: "#5f6f68",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  actionsCell: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    whiteSpace: "nowrap",
  },
  smallButton: {
    border: "none",
    borderRadius: "12px",
    padding: "8px 14px",
    background: "#173b2f",
    color: "white",
    cursor: "pointer",
  },
  deleteButton: {
    border: "none",
    borderRadius: "12px",
    padding: "8px 14px",
    background: "#c0392b",
    color: "white",
    cursor: "pointer",
  },
  successBox: {
    background: "#e0f2f1",
    border: "1px solid #a7d7ca",
    color: "#1b5e20",
    borderRadius: "14px",
    padding: "14px 16px",
  },
  errorBox: {
    background: "#fdecea",
    border: "1px solid #f5c6cb",
    color: "#9f3a38",
    borderRadius: "14px",
    padding: "14px 16px",
  },
};

export default AdminUsers;
