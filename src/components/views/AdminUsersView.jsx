// User management interface.
// Allows viewing, creating, editing, deleting, and restoring users.

import { useState } from "react";
import "./AdminUsersView.css";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import BulkImportModal from "../bulk-import/BulkImportModal";


// Returns the visual badge style and label based on the user's role.
function getRoleBadge(role, USER_ROLES) {
  const labels = {
    [USER_ROLES.ADMIN]: "Admin",
    [USER_ROLES.COORDINATOR]: "Coordinator",
    [USER_ROLES.VOLUNTEER]: "Volunteer",
  };

  return {
    background: "#e0f2fe",
    color: "#075985",
    label: labels[role] || role,
  };
}

function AdminUsersView({
  userProfile,
  currentUserName,
  handleLogout,
  filteredUsers,
  loading,
  saving,
  message,
  error,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  roleFilter,
  setRoleFilter,
  sortMode,
  setSortMode,
  formMode,
  formData,
  setFormData,
  modalOpen,
  citySearch,
  setCitySearch,
  showCityDropdown,
  setShowCityDropdown,
  openUserModal,
  closeModal,
  handleChange,
  handleSubmit,
  handleDelete,
  handleRestore,
  isFormValid,
  ISRAELI_CITIES,
  USER_ROLES,
  addMenuOpen,
  setAddMenuOpen,
  canManageUsers,
  sortField,
  sortDirection,
  handleSort,
  importModalOpen,
  setImportModalOpen,
  handleImportComplete,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

const goTo = (path) => {
  setMenuOpen(false);
  navigate(path);
};
  return (
    <div style={styles.layout} className="users-page">

  {menuOpen && (
    <div
      className="users-overlay"
      onClick={() => setMenuOpen(false)}
    />
  )}
    <aside
  style={styles.sidebar}
  className={`users-sidebar ${menuOpen ? "open" : ""}`}
>
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{currentUserName}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          <button
            style={styles.navItem}
            onClick={() => goTo("/dashboard")}
          >
            Dashboard
          </button>

        <button style={styles.navItem} onClick={() => goTo("/cases")}>
          Cases
        </button>

        <button style={{ ...styles.navItem, ...styles.activeNav }}>
          Users
        </button>

        {canManageUsers && (
          <button
            style={styles.navItem}
            onClick={() => goTo("/reports")}
          >
            Reports
          </button>
        )}

        {userProfile?.role === USER_ROLES.ADMIN && (
          <button style={styles.navItem} onClick={() => goTo("/backup")}>
            Backup
          </button>
        )}

          <button style={styles.navItem} onClick={() => goTo("/profile")}>
            Profile
          </button>
        </nav>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </aside>

     <main style={styles.page} className="users-main">

  <div className="users-mobile-topbar">
    <button
      className="users-menu-button"
      onClick={() => setMenuOpen(true)}
    >
      ☰
    </button>

    <span className="users-mobile-title">
      Users
    </span>
  </div>
        <section style={styles.contentCard} className="users-content-card">
          <header style={styles.header}>
            <h1 style={styles.title}>User Directory</h1>

            <div style={styles.headerActions}>
              <button
                onClick={() => setViewMode("active")}
                style={{
                  ...styles.filterButton,
                  ...(viewMode === "active" ? styles.filterActive : {}),
                }}
              >
                Active users
              </button>

              {canManageUsers && (
                <button
                  onClick={() => setViewMode("deleted")}
                  style={{
                    ...styles.filterButton,
                    ...(viewMode === "deleted" ? styles.filterActive : {}),
                  }}
                >
                  Deleted users
                </button>
              )}

              {canManageUsers && (
                <div style={styles.addMenuWrap}>
                  <button
                    type="button"
                    onClick={() => setAddMenuOpen((prev) => !prev)}
                    style={styles.addButton}
                  >
                    + Add Users
                  </button>

                  {addMenuOpen && (
                    <div style={styles.addMenu}>
                      <button
                        type="button"
                        onClick={() => {
                          setAddMenuOpen(false);
                          openUserModal("create");
                        }}
                        style={styles.addMenuItem}
                      >
                        + Add Manually
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAddMenuOpen(false);
                          setImportModalOpen(true);
                        }}
                        style={styles.addMenuItem}
                      >
                        Import Users
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          {message && <div style={styles.successBox}>{message}</div>}
          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.toolbar} className="users-toolbar">
            <input
              placeholder="Search by name, phone, email or city..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={styles.searchInput}
            />

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              style={styles.selectInput}
            >
              <option value="all">All roles</option>
              <option value={USER_ROLES.ADMIN}>Admins</option>
              <option value={USER_ROLES.COORDINATOR}>Coordinators</option>
              <option value={USER_ROLES.VOLUNTEER}>Volunteers</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
              style={styles.selectInput}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
         <div className="users-table-scroll">
          <div style={styles.usersList}>
            <div
              style={{
                ...styles.tableHeader,
                gridTemplateColumns: canManageUsers
  ? "1.1fr 0.9fr 0.8fr 1.3fr 0.85fr 0.85fr 0.8fr"
  : "1.1fr 0.9fr 0.8fr 1.3fr 0.85fr 0.85fr 0.8fr",
              }}
            >
             <button
  style={styles.sortHeader}
  onClick={() => handleSort("full_name")}
>
  Name {sortField === "full_name" && (sortDirection === "asc" ? "▲" : "▼")}
</button>

<button
  style={styles.sortHeader}
  onClick={() => handleSort("phone")}
>
  Phone {sortField === "phone" && (sortDirection === "asc" ? "▲" : "▼")}
</button>

<button
  style={styles.sortHeader}
  onClick={() => handleSort("city")}
>
  City {sortField === "city" && (sortDirection === "asc" ? "▲" : "▼")}
</button>

<button
  style={styles.sortHeader}
  onClick={() => handleSort("email")}
>
  Email {sortField === "email" && (sortDirection === "asc" ? "▲" : "▼")}
</button>

<button
  style={styles.sortHeader}
  onClick={() => handleSort("role")}
>
  Role {sortField === "role" && (sortDirection === "asc" ? "▲" : "▼")}
</button>

<button
  style={styles.sortHeader}
  onClick={() => handleSort("is_available")}
>
  Status {sortField === "is_available" && (sortDirection === "asc" ? "▲" : "▼")}
</button>
             
              <span>Actions</span>
            </div>

            {loading ? (
              <div style={styles.emptyState}>Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div style={styles.emptyState}>No users found.</div>
            ) : (
              filteredUsers.map((user) => {
                const roleBadge = getRoleBadge(user.role, USER_ROLES);

                return (
                  <div
                  key={user.uid}
                  style={{
                    ...styles.tableRow,
                    gridTemplateColumns: canManageUsers
  ? "1.1fr 0.9fr 0.8fr 1.3fr 0.85fr 0.85fr 0.8fr"
  : "1.1fr 0.9fr 0.8fr 1.3fr 0.85fr 0.85fr 0.8fr",
                  }}
                >
                    <span style={styles.userName}>{user.full_name || "—"}</span>
                    <span>{user.phone || "—"}</span>
                    <span>{user.city || "—"}</span>
                    <span>{user.email || "—"}</span>

                    <span
                      style={{
                        ...styles.badge,
                        background: roleBadge.background,
                        color: roleBadge.color,
                      }}
                    >
                      {roleBadge.label}
                    </span>

                    <span
                      style={{
                        ...styles.badge,
                        ...(viewMode === "deleted"
                          ? styles.deletedBadge
                          : user.is_available
                          ? styles.availableBadge
                          : styles.unavailableBadge),
                      }}
                    >
                      {viewMode === "deleted"
                        ? "Deleted"
                        : user.is_available
                        ? "Available"
                        : "Unavailable"}
                    </span>

                    <div style={styles.actions}>
                      {canManageUsers ? (
                        viewMode === "active" ? (
                          <>
                            <button
                              onClick={() => openUserModal("edit", user)}
                              style={styles.iconButton}
                              title="Edit"
                            >
                              ✏️
                            </button>

                            <button
                              onClick={() => handleDelete(user)}
                              style={{
                                ...styles.iconButton,
                                ...styles.deleteButton,
                              }}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestore(user)}
                            style={styles.restoreTextButton}
                          >
                            Restore
                          </button>
                        )
                      ) : (
                        <button type="button" style={styles.viewOnlyButton}>
                          View
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          </div>
        </section>
      </main>

      {canManageUsers && modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {formMode === "create" ? "Create New User" : "Edit User"}
                </h2>
                <p style={styles.modalSubtitle}>
                  {formMode === "create"
                    ? "Fields marked with * are required."
                    : "Update this user's profile."}
                </p>
              </div>

              <button onClick={closeModal} style={styles.closeButton}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.field}>
                Full name *
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                Email *
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                />
              </label>

              {formMode === "create" && (
                <label style={styles.field}>
                  Password *
                  <input
                    name="password"
                    type="text"
                    value={formData.password}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </label>
              )}

              <label style={styles.field}>
                Role *
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

              <label style={styles.field}>
                Phone *
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                Occupation
                <input
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                City *
                <div style={{ position: "relative" }}>
                  <input
                    value={formData.city}
                    onChange={(event) => {
                      const value = event.target.value;

                      setFormData((prev) => ({
                        ...prev,
                        city: value,
                      }));

                      setCitySearch(value);
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowCityDropdown(false), 150)
                    }
                    placeholder="Search city or type another city..."
                    style={styles.input}
                  />

                  {showCityDropdown && (
                    <div style={styles.dropdown}>
                      {[
                        ...ISRAELI_CITIES.filter(
                          (city) =>
                            city !== "Other" &&
                            city
                              .toLowerCase()
                              .includes((citySearch || "").toLowerCase())
                        ),
                        "Other",
                      ].map((city) => (
                        <div
                          key={city}
                          style={styles.dropdownItem}
                          onMouseDown={() => {
                            if (city === "Other") {
                              setFormData((prev) => ({ ...prev, city: "" }));
                              setCitySearch("");
                              setShowCityDropdown(false);
                              return;
                            }

                            setFormData((prev) => ({ ...prev, city }));
                            setCitySearch("");
                            setShowCityDropdown(false);
                          }}
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </label>

              <label style={styles.field}>
                Experience level
                <select
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="experienced">Experienced</option>
                  <option value="expert">Expert</option>
                </select>
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  name="height_work"
                  type="checkbox"
                  checked={formData.height_work}
                  onChange={handleChange}
                />
                Has working from heights license
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  name="is_available"
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={handleChange}
                />
                Available for assignments
              </label>

              <div style={styles.modalActions}>
                <button
                  type="submit"
                  disabled={saving || !isFormValid()}
                  style={{
                    ...styles.addButton,
                    opacity: saving || !isFormValid() ? 0.5 : 1,
                    cursor: saving || !isFormValid() ? "not-allowed" : "pointer",
                    flex: 1,
                  }}
                >
                  {saving
                    ? "Saving..."
                    : formMode === "create"
                    ? "Create User"
                    : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  style={{ ...styles.cancelButton, flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
            {canManageUsers && importModalOpen && (
              <BulkImportModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onComplete={handleImportComplete}
              />
            )}
    </div>
  );
}

const styles = {
  layout: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    background: "#fffdf8",
    fontFamily: "Arial, sans-serif",
  },

  sidebar: {
    height: "100vh",
    position: "sticky",
    top: 0,
    background: "#fff8ef",
    borderRight: "1px solid #f0e5d8",
    padding: "28px 20px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "42px",
  },

  logo: {
    width: "50px",
    height: "50px",
    objectFit: "contain",
  },

  brandTitle: {
    margin: 0,
    color: "#2b160c",
    fontSize: "16px",
    fontWeight: "900",
    lineHeight: 1.1,
  },

  brandSub: {
    margin: "6px 0 0",
    color: "#e85d04",
    fontSize: "13px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  navItem: {
    border: "none",
    background: "transparent",
    color: "#3d332b",
    padding: "14px 16px",
    borderRadius: "14px",
    textAlign: "left",
    fontWeight: "800",
    cursor: "pointer",
  },

  activeNav: {
    background: "#fff1df",
    color: "#e85d04",
  },

  logoutButton: {
    marginTop: "auto",
    border: "none",
    background: "#f97316",
    color: "white",
    borderRadius: "14px",
    padding: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },

  page: {
    padding: "28px",
    boxSizing: "border-box",
  },

  contentCard: {
    background: "white",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 16px 50px rgba(43, 22, 12, 0.06)",
    border: "1px solid #f2e7dc",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  title: {
    margin: 0,
    color: "#f57c00",
    fontSize: "32px",
    fontWeight: "900",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  filterButton: {
    border: "1px solid #f3c49a",
    background: "white",
    color: "#3d332b",
    borderRadius: "12px",
    padding: "10px 16px",
    fontWeight: "800",
    cursor: "pointer",
  },

  filterActive: {
    background: "#fff1df",
    color: "#e85d04",
  },

  addButton: {
    border: "none",
    background: "#f97316",
    color: "white",
    borderRadius: "12px",
    padding: "10px 16px",
    fontWeight: "800",
    cursor: "pointer",
  },

  addMenuWrap: {
    position: "relative",
  },

  addMenu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    minWidth: "180px",
    background: "white",
    border: "1px solid #eadfd2",
    borderRadius: "12px",
    boxShadow: "0 12px 25px rgba(43, 22, 12, 0.12)",
    padding: "6px",
    zIndex: 20,
  },

  addMenuItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#3d332b",
    padding: "10px 12px",
    borderRadius: "10px",
    textAlign: "left",
    fontWeight: "800",
    cursor: "pointer",
  },

  toolbar: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "14px",
  },

  searchInput: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #eadfd2",
    background: "#fffdf8",
    fontSize: "14px",
    
    color: "#2b160c",      
    caretColor: "#2b160c",  

  },

  selectInput: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #eadfd2",
    background: "white",
    fontWeight: "800",
    color: "#3d332b",
  },

  usersList: {
    border: "1px solid #eee2d8",
    borderRadius: "16px",
    overflow: "hidden",
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns:
       "1.1fr 0.9fr 0.8fr 1.3fr 0.85fr 0.85fr 0.8fr",
    gap: "10px",
    padding: "12px 14px",
    background: "#fff8ef",
    color: "#51443a",
    fontWeight: "900",
    fontSize: "13px",
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns:
       "1.1fr 0.9fr 0.8fr 1.3fr 0.85fr 0.85fr 0.8fr",
    gap: "10px",
    alignItems: "center",
    padding: "14px",
    borderTop: "1px solid #f1ebe5",
    color: "#1f2933",
    fontSize: "13px",
  },

  userName: {
    fontWeight: "800",
    color: "#2b160c",
  },

  badge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "12px",
    width: "fit-content",
  },

  availableBadge: {
    background: "#eef8ef",
    color: "#16803d",
  },

  unavailableBadge: {
    background: "#fee2e2",
    color: "#dc2626",
  },

  deletedBadge: {
    background: "#fee2e2",
    color: "#dc2626",
  },

  actions: {
    display: "flex",
    gap: "8px",
  },

  iconButton: {
    border: "1px solid #eadfd2",
    background: "white",
    borderRadius: "10px",
    width: "34px",
    height: "34px",
    cursor: "pointer",
  },

  deleteButton: {
    borderColor: "#fecaca",
    color: "#dc2626",
  },

  restoreTextButton: {
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#16a34a",
    borderRadius: "10px",
    padding: "8px 12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  viewOnlyButton: {
    border: "1px solid #eadfd2",
    background: "white",
    color: "#3d332b",
    borderRadius: "10px",
    padding: "8px 12px",
    fontWeight: "800",
    cursor: "default",
  },

  emptyState: {
    padding: "28px",
    textAlign: "center",
    color: "#6b625c",
  },

  successBox: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "14px",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "14px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: "18px",
  },

  modal: {
    width: "100%",
    maxWidth: "520px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "white",
    borderRadius: "22px",
    padding: "24px",
    border: "1px solid #f0e5d8",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "18px",
  },

  modalTitle: {
    margin: 0,
    color: "#2b160c",
    fontSize: "22px",
    fontWeight: "900",
  },

  modalSubtitle: {
    margin: "4px 0 0",
    color: "#6b625c",
    fontSize: "13px",
  },

  closeButton: {
    border: "none",
    background: "#fff8ef",
    color: "#d95f00",
    borderRadius: "10px",
    width: "34px",
    height: "34px",
    fontSize: "22px",
    cursor: "pointer",
  },

  form: {
    display: "grid",
    gap: "14px",
  },

  field: {
    display: "grid",
    gap: "6px",
    color: "#2b160c",
    fontWeight: "800",
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #eadfd2",
    background: "#fffdf8",
    boxSizing: "border-box",
    color: "#2b160c",       
    caretColor: "#2b160c",  

  },

  disabledInput: {
    background: "#f8fafc",
    color: "#6b7280",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#2b160c",
    fontWeight: "700",
  },

  dropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #eadfd2",
    borderRadius: "12px",
    maxHeight: "180px",
    overflowY: "auto",
    zIndex: 300,
    boxShadow: "0 12px 25px rgba(43, 22, 12, 0.08)",
  },

  dropdownItem: {
    padding: "11px 14px",
    cursor: "pointer",
    color: "#2b160c",
  },

  modalActions: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
  },

  cancelButton: {
    border: "1px solid #eadfd2",
    background: "white",
    color: "#3d332b",
    borderRadius: "12px",
    padding: "10px 16px",
    fontWeight: "800",
    cursor: "pointer",
  },
  sortHeader: {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontWeight: "900",
  color: "#51443a",
  textAlign: "left",
  padding: 0,
  fontSize: "13px",
},
  
};

export default AdminUsersView;
