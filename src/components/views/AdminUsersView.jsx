import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";

import "./AdminUsersView.css";
import logo from "../../assets/logo.png";
import BulkImportModal from "../bulk-import/BulkImportModal";

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

export default function AdminUsersView({
  userProfile,
  currentUserName,
  handleLogout,

  // harden against blank page crash if props are missing
  users = [],
  deletedUsers = [],

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

  const { language, setLanguage } = useLanguage();
  const isHebrew = language === "he";

  const t = useMemo(() => {
    // Use LanguageContext (language) for all table headers.
    // (CasesView uses its own translation map; we keep headers consistent with the current UI language.)
    const map = {
      en: {
        userDirectory: "User Directory",
        filtersActive: "Active",
        filtersDeleted: "Deleted",
        searchPlaceholder: "Search by name, phone, city...",

        headers: {
          name: "Name",
          phone: "Phone",
          city: "City",
          email: "Email",
          role: "Role",
          status: "Status",
          actions: "Actions",
        },

        empty: {
          loading: "Loading users...",
          none: "No users found.",
        },

        actions: {
          edit: "Edit",
          delete: "Delete",
          restore: "Restore",
        },

        dropdowns: {
          allRoles: "All roles",
          admins: "Admins",
          coordinators: "Coordinators",
          volunteers: "Volunteers",
          newestFirst: "Newest first",
          oldestFirst: "Oldest first",
          addUsers: "+ Add Users",
          addManually: "+ Add Manually",
          importUsers: "Import Users",
        },
      },
      he: {
        userDirectory: "רשימת משתמשים",
        filtersActive: "פעילים",
        filtersDeleted: "מחקים",
        searchPlaceholder: "חפש לפי שם, טלפון, עיר...",

        headers: {
          name: "שם",
          phone: "טלפון",
          city: "עיר",
          email: "אימייל",
          role: "תפקיד",
          status: "סטטוס",
          actions: "פעולות",
        },

        empty: {
          loading: "טוען משתמשים...",
          none: "לא נמצאו משתמשים.",
        },

        actions: {
          edit: "ערוך",
          delete: "מחק",
          restore: "שחזר",
        },

        dropdowns: {
          allRoles: "כל התפקידים",
          admins: "מנהלים",
          coordinators: "רכזים",
          volunteers: "מתנדבים",
          newestFirst: "חדשים קודם",
          oldestFirst: "ישנים קודם",
          addUsers: "+ הוסף משתמשים",
          addManually: "+ הוסף ידנית",
          importUsers: "ייבוא משתמשים",
        },
      },
    };

    return map[language] || map.en;
  }, [language]);

  const navTexts = useMemo(
    () => ({
      requests: isHebrew ? "פניות" : "Requests",
      users: isHebrew ? "משתמשים" : "Users",
      reports: isHebrew ? "דוחות" : "Reports",
      backup: isHebrew ? "גיבוי" : "Backup",
      profile: isHebrew ? "פרופיל" : "Profile",
      logout: isHebrew ? "התנתק" : "Logout",
    }),
    [isHebrew]
  );

  const activeCount = useMemo(() => users.filter((u) => u.is_available !== false).length, [users]);
  const deletedCount = deletedUsers.length;

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  // If parent passes undefined for filteredUsers (edge), harden.
  const safeFilteredUsers = filteredUsers || [];

  return (
    <div style={styles.layout} className="users-page">
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setMenuOpen(true)}
      >
        ☰
      </button>

      {menuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        style={styles.sidebar}
        className={`users-sidebar ${menuOpen ? "mobile-open" : ""}`}
      >
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{currentUserName}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          <button style={styles.navItem} onClick={() => goTo("/requests")}>
            {navTexts.requests}
          </button>

          <button style={{ ...styles.navItem, ...styles.activeNav }}>
            {navTexts.users}
          </button>

          {(canManageUsers || userProfile?.role === USER_ROLES.COORDINATOR) && (
            <button style={styles.navItem} onClick={() => goTo("/reports")}>
              {navTexts.reports}
            </button>
          )}

          {userProfile?.role === USER_ROLES.ADMIN && (
            <button style={styles.navItem} onClick={() => goTo("/backup")}>
              {navTexts.backup}
            </button>
          )}

          <button style={styles.navItem} onClick={() => goTo("/profile")}>
            {navTexts.profile}
          </button>
        </nav>

        <div style={styles.bottomSection}>
          <button
            style={styles.languageButton}
            onClick={() => setLanguage(language === "he" ? "en" : "he")}
          >
            {language === "he" ? "English 🌐" : "עברית 🌐"}
          </button>

          <button style={styles.logoutButton} onClick={handleLogout}>
            {navTexts.logout}
          </button>
        </div>
      </aside>

      <main style={styles.page} className="users-main" dir={isHebrew ? "rtl" : "ltr"}>

        <section style={styles.contentCard} className="users-content-card">
          <header style={styles.header}>
            <h1 style={styles.title}>{t.userDirectory}</h1>

            <div style={styles.headerActions}>
              {/* Pill-shaped filter bar with counter badges */}
              <div
                className="users-filter-pillbar"
                style={styles.pillBar}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("active")}
                  className={`users-filter-pill ${viewMode === "active" ? "selected" : ""}`}
                  style={styles.pill}
                >
                  <span style={styles.pillLabel}>{t.filtersActive}</span>
                  <span style={styles.pillBadge}>{activeCount}</span>
                </button>

                {canManageUsers && (
                  <button
                    type="button"
                    onClick={() => setViewMode("deleted")}
                    className={`users-filter-pill ${viewMode === "deleted" ? "selected" : ""}`}
                    style={styles.pill}
                  >
                    <span style={styles.pillLabel}>{t.filtersDeleted}</span>
                    <span style={styles.pillBadge}>{deletedCount}</span>
                  </button>
                )}
              </div>

              {canManageUsers && (
                <div style={styles.addMenuWrap}>
                  <button
                    type="button"
                    onClick={() => setAddMenuOpen((prev) => !prev)}
                    style={styles.addButton}
                  >
                    {t.dropdowns.addUsers}
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
                        {t.dropdowns.addManually}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddMenuOpen(false);
                          setImportModalOpen(true);
                        }}
                        style={styles.addMenuItem}
                      >
                        {t.dropdowns.importUsers}
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
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={styles.searchInput}
            />

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              style={styles.selectInput}
            >
              <option value="all">{t.dropdowns.allRoles}</option>
              <option value={USER_ROLES.ADMIN}>{t.dropdowns.admins}</option>
              <option value={USER_ROLES.COORDINATOR}>{t.dropdowns.coordinators}</option>
              <option value={USER_ROLES.VOLUNTEER}>{t.dropdowns.volunteers}</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
              style={styles.selectInput}
            >
              <option value="newest">{t.dropdowns.newestFirst}</option>
              <option value="oldest">{t.dropdowns.oldestFirst}</option>
            </select>
          </div>

          <div className="users-table-scroll">
            <div style={styles.usersList}>
              {/* beige-tinted table header with sortable arrows */}
              <div
                className="users-table-header"
                style={styles.tableHeader}
              >
                <button
                  type="button"
                  className="users-sort-th"
                  style={styles.sortHeader}
                  onClick={() => handleSort("full_name")}
                >
                  {t.headers.name}
                  {sortField === "full_name" ? (sortDirection === "asc" ? "▲" : "▼") : "⇅"}
                </button>

                <button
                  type="button"
                  className="users-sort-th"
                  style={styles.sortHeader}
                  onClick={() => handleSort("phone")}
                >
                  {t.headers.phone}
                  {sortField === "phone" ? (sortDirection === "asc" ? "▲" : "▼") : "⇅"}
                </button>

                <button
                  type="button"
                  className="users-sort-th"
                  style={styles.sortHeader}
                  onClick={() => handleSort("city")}
                >
                  {t.headers.city}
                  {sortField === "city" ? (sortDirection === "asc" ? "▲" : "▼") : "⇅"}
                </button>

                <div className="users-th" style={styles.thCell}>
                  {t.headers.email}
                </div>

                <div className="users-th" style={styles.thCell}>
                  {t.headers.role}
                </div>

                <div className="users-th" style={styles.thCell}>
                  {t.headers.status}
                </div>

                <div className="users-th" style={{...styles.thCell, marginInlineStart: "auto"}}>
                  {t.headers.actions}
                </div>
              </div>

              {loading ? (
                <div style={styles.emptyState}>{t.empty.loading}</div>
              ) : safeFilteredUsers.length === 0 ? (
                <div style={styles.emptyState}>{t.empty.none}</div>
              ) : (
                safeFilteredUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.role, USER_ROLES);

                  return (
                    <div
                      key={user.uid}
                      style={styles.tableRow}
                    >
                      <span style={{...styles.userName, flex: "1.15", minWidth: 0}}>{user.full_name || "—"}</span>
                      <span style={{flex: "0.95", minWidth: 0}}>{user.phone || "—"}</span>
                      <span style={{flex: "0.85", minWidth: 0}}>{user.city || "—"}</span>
                      <span style={{flex: "1.35", minWidth: 0}}>{user.email || "—"}</span>

                      <span style={{...styles.badge, ...{flex: "0.9", minWidth: 0}, background: roleBadge.background, color: roleBadge.color}}>
                        {roleBadge.label}
                      </span>

                      <span
                        style={{
                          ...styles.badge,
                          ...{flex: "0.9", minWidth: 0},
                          ...(viewMode === "deleted"
                            ? styles.deletedBadge
                            : user.is_available !== false
                              ? styles.availableBadge
                              : styles.unavailableBadge),
                        }}
                      >
                        {viewMode === "deleted"
                          ? "Deleted"
                          : user.is_available !== false
                            ? "Available"
                            : "Unavailable"}
                      </span>

                      <div style={{...styles.actions, ...{flex: "0.8", minWidth: 0}}}>
                        {canManageUsers ? (
                          viewMode === "active" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openUserModal("edit", user)}
                                style={styles.iconButton}
                                title={t.actions.edit}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(user)}
                                style={{
                                  ...styles.iconButton,
                                  ...styles.deleteButton,
                                }}
                                title={t.actions.delete}
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRestore(user)}
                              style={styles.restoreTextButton}
                            >
                              {t.actions.restore}
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
                      setFormData((prev) => ({ ...prev, city: value }));
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
                      {[...ISRAELI_CITIES.filter((city) =>
                        city !== "Other" &&
                        city
                          .toLowerCase()
                          .includes((citySearch || "").toLowerCase())
                      ), "Other"].map((city) => (
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
    direction: "ltr",
  },

  sidebar: {
    height: "100vh",
    position: "sticky",
    top: 0,
    background: "#fff8ef",
    borderInlineEnd: "1px solid #f0e5d8",
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
    color: "#6a2300",
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
    borderRadius: "6px",
    textAlign: "start",
    fontWeight: "800",
    cursor: "pointer",
  },

  activeNav: {
    background: "#fff1df",
    color: "#6a2300",
  },

  bottomSection: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  languageButton: {
    padding: "13px",
    borderRadius: "6px",
    border: "1px solid #eadfd2",
    background: "#fffaf4",
    color: "#2b160c",
    fontWeight: "800",
    cursor: "pointer",
  },

  logoutButton: {
    border: "none",
    background: "#6a2300",
    color: "white",
    borderRadius: "6px",
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
    borderRadius: "16px",
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
    color: "#6a2300",
    fontSize: "28px",
    fontWeight: "900",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  pillBar: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  pill: {
    border: "1px solid #eadfd2",
    background: "#fff",
    color: "#3d332b",
    borderRadius: "999px",
    padding: "9px 14px",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  pillLabel: {
    lineHeight: 1,
  },

  pillBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "28px",
    padding: "3px 8px",
    borderRadius: "999px",
    background: "#fff1df",
    color: "#e85d04",
    fontWeight: "900",
    fontSize: "12px",
  },

  addButton: {
    border: "none",
    background: "#6a2300",
    color: "white",
    borderRadius: "6px",
    padding: "9px 16px",
    fontWeight: "700",
    fontSize: "13.5px",
    cursor: "pointer",
  },

  addMenuWrap: {
    position: "relative",
  },

  addMenu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    insetInlineEnd: 0,
    minWidth: "180px",
    maxWidth: "220px",
    background: "white",
    border: "1px solid #eadfd2",
    borderRadius: "8px",
    boxShadow: "0 12px 25px rgba(43, 22, 12, 0.12)",
    padding: "6px",
    zIndex: 100,
  },

  addMenuItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#3d332b",
    padding: "10px 12px",
    borderRadius: "6px",
    textAlign: "start",
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
    width: "100%",
    padding: "14px 16px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    background: "white",
    fontSize: "14px",
    color: "#2b160c",
    caretColor: "#2b160c",
  },

  selectInput: {
    padding: "12px 14px",
    borderRadius: "6px",
    border: "1px solid #eadfd2",
    background: "white",
    fontWeight: "800",
    color: "#3d332b",
  },

  usersList: {
    border: "1px solid #eee2d8",
    borderRadius: "12px",
    overflow: "hidden",
  },

  tableHeader: {
    display: "flex",
    gap: "10px",
    padding: "14px 14px",
    background: "#fbf3e6",
    color: "#3d332b",
    fontWeight: "900",
    fontSize: "13px",
    borderBottom: "1px solid #f1e5d8",
    alignItems: "center",
  },

  thCell: {
    textAlign: "center",
    fontWeight: "900",
    color: "#3d332b",
    flex: 1,
    minWidth: 0,
  },

  sortHeader: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontWeight: "900",
    color: "#3d332b",
    textAlign: "center",
    padding: 0,
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    flex: 1,
    minWidth: 0,
  },

  tableRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    padding: "16px 14px",
    borderBottom: "1px solid #f1e5d8",
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
    justifySelf: "center",
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
    justifyContent: "center",
    alignItems: "center",
    marginInlineStart: "auto",
  },

  iconButton: {
    border: "1px solid #eadfd2",
    background: "white",
    borderRadius: "6px",
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
    borderRadius: "6px",
    padding: "8px 12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  viewOnlyButton: {
    border: "1px solid #eadfd2",
    background: "white",
    color: "#3d332b",
    borderRadius: "6px",
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
    borderRadius: "8px",
    marginBottom: "14px",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "14px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(43, 22, 12, 0.35)",
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
    borderRadius: "16px",
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
    color: "#6a2300",
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
    background: "#fff1df",
    color: "#6a2300",
    borderRadius: "6px",
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
    borderRadius: "6px",
    border: "1px solid #eadfd2",
    background: "#fffdf8",
    boxSizing: "border-box",
    color: "#2b160c",
    caretColor: "#2b160c",
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
    insetInlineStart: 0,
    insetInlineEnd: 0,
    background: "white",
    border: "1px solid #eadfd2",
    borderRadius: "8px",
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
    borderRadius: "6px",
    padding: "9px 16px",
    fontWeight: "700",
    cursor: "pointer",
  },
};

