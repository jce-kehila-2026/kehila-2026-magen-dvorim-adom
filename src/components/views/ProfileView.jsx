// User profile page.
// Allows users to view and update their personal information.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { USER_ROLES } from "../../services/userSchema";
import logo from "../../assets/logo.png";
import "./ProfileView.css";
import { useLanguage } from "../../contexts/LanguageContext";

export default function ProfileView({
  userProfile,
  currentUserName,
  formData,
  setFormData,
  citySearch,
  setCitySearch,
  showCityDropdown,
  setShowCityDropdown,
  loading,
  error,
  success,
  passwordModalOpen,
  passwordData,
  setPasswordData,
  passwordLoading,
  passwordError,
  passwordSuccess,
  handleSubmit,
  handlePasswordSubmit,
  openPasswordModal,
  closePasswordModal,
  handleLogout,
  ISRAELI_CITIES,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  const initials = (currentUserName || "U").charAt(0).toUpperCase();

const { language, setLanguage } = useLanguage();
const isHebrew = language === "he";
const t = {
   dashboard: isHebrew ? "דשבורד" : "Dashboard",
requests: isHebrew ? "פניות" : "Requests",
  users: isHebrew ? "משתמשים" : "Users",
  reports: isHebrew ? "דוחות" : "Reports",
  backup: isHebrew ? "גיבוי" : "Backup",
  profile: isHebrew ? "פרופיל" : "Profile",
  logout: isHebrew ? "התנתק" : "Logout",

  myCases: isHebrew ? "המקרים שלי" : "My Cases",

  title: isHebrew ? "הפרופיל שלי" : "My Profile",

  personalInfo: isHebrew ? "פרטים אישיים" : "Personal Information",
  location: isHebrew ? "מיקום וזמינות" : "Location & Availability",

  fullName: isHebrew ? "שם מלא" : "Full Name",
  email: isHebrew ? "אימייל" : "Email",
  phone: isHebrew ? "טלפון" : "Phone",
  role: isHebrew ? "תפקיד" : "Role",

  city: isHebrew ? "עיר" : "City",
  searchCity: isHebrew ? "חיפוש עיר..." : "Search city...",

  availability: isHebrew ? "זמינות" : "Availability",
  availabilityDesc: isHebrew
    ? "אפשר לרכזים לשבץ אותך למקרים"
    : "Control whether coordinators can assign you to active cases.",

  changePassword: isHebrew ? "שינוי סיסמה" : "Change Password",
  save: isHebrew ? "שמור שינויים" : "Save Changes",
  saving: isHebrew ? "שומר..." : "Saving...",

  cancel: isHebrew ? "ביטול" : "Cancel",
  updatePassword: isHebrew ? "עדכן סיסמה" : "Update Password",
  updating: isHebrew ? "מעדכן..." : "Updating...",

  currentPassword: isHebrew ? "סיסמה נוכחית" : "Current Password",
  newPassword: isHebrew ? "סיסמה חדשה" : "New Password",
  confirmPassword: isHebrew ? "אימות סיסמה" : "Confirm New Password",

  modalSubtitle: isHebrew
    ? "הזן סיסמה נוכחית לפני בחירת סיסמה חדשה"
    : "Enter your current password before choosing a new one.",
};

  return (
    <div className="profile-layout" style={styles.layout}>
      
      {passwordModalOpen && (
        <div style={styles.modalOverlay} onClick={closePasswordModal}>
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}> {t.changePassword}</h2>
                <p style={styles.modalSubtitle}>
                  {t.modalSubtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                disabled={passwordLoading}
                style={styles.closeButton}
                aria-label="Close change password modal"
              >
                x
              </button>
            </div>

            {passwordError && <div style={styles.errorBox}>{passwordError}</div>}
            {passwordSuccess && <div style={styles.successBox}>{isHebrew ? "הפרופיל עודכן בהצלחה" : success}</div>}

            <form onSubmit={handlePasswordSubmit}>
              <div style={styles.field}>
                <label>{t.currentPassword}</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label>{t.newPassword}</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label>{t.confirmPassword}</label>
                <input
                  type="password"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmNewPassword: e.target.value,
                    }))
                  }
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={passwordLoading}
                  style={styles.secondaryButton}
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={styles.button}
                >
                  {passwordLoading ? t.updating : t.updatePassword}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {menuOpen && (
        <div
          className="profile-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`profile-sidebar ${menuOpen ? "open" : ""}`}
        style={styles.sidebar}
      >
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{currentUserName}</p>
          </div>
        </div>

       <nav style={styles.nav}>

  {/* ✅ ADMIN */}
  {userProfile?.role === USER_ROLES.ADMIN && (
    <>
      <button style={styles.navItem} onClick={() => goTo("/requests")}>
        {t.requests}
      </button>

      <button style={styles.navItem} onClick={() => goTo("/users")}>
        {t.users}
      </button>

      <button style={styles.navItem} onClick={() => goTo("/reports")}>
        {t.reports}
      </button>

      <button style={styles.navItem} onClick={() => goTo("/backup")}>
        {t.backup}
      </button>
    </>
  )}

  {/* ✅ COORDINATOR */}
  {userProfile?.role === USER_ROLES.COORDINATOR && (
    <>
      <button style={styles.navItem} onClick={() => goTo("/requests")}>
        {t.requests}
      </button>

      <button style={styles.navItem} onClick={() => goTo("/users")}>
        {t.users}
      </button>
      <button style={styles.navItem} onClick={() => goTo("/reports")}>
        {t.reports}
      </button>
    </>
  )}

  {/* ✅ VOLUNTEER (UNCHANGED) */}
  {userProfile?.role === USER_ROLES.VOLUNTEER && (
    <>
      <button style={styles.navItem} onClick={() => goTo("/dashboard")}>
        {t.dashboard}
      </button>

      <button style={styles.navItem} onClick={() => goTo("/my-cases")}>
        {t.myCases}
      </button>
    </>
  )}

  {/* ✅ PROFILE (ACTIVE) */}
  <button style={{ ...styles.navItem, ...styles.navItemActive }}>
    {t.profile}
  </button>
</nav>

        <div style={styles.bottomSection}>
          <button
            style={styles.languageButton}
            onClick={() => setLanguage(isHebrew ? "en" : "he")}
          >
            {isHebrew ? "English 🌐" : "עברית 🌐"}
          </button>

          <button style={styles.logoutButton} onClick={handleLogout}>
            {t.logout}
          </button>
        </div>
      </aside>

      <main className="profile-main" style={styles.page}>
        <div className="profile-mobile-topbar">
          <button
            className="profile-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <span className="profile-mobile-title">{t.profile}</span>
        </div>

        <section className="profile-card" style={styles.card}>
          <div style={styles.header}>
            <h1 className="profile-title" style={styles.title}> {t.title}</h1>

            <div style={styles.profileTop}>
              <div style={styles.avatarContainer}>
                <div style={styles.avatarFallback}>{initials}</div>

                <span
                  style={{
                    ...styles.availabilityDot,
                    ...(formData.is_available
                      ? styles.availabilityDotOn
                      : styles.availabilityDotOff),
                  }}
                />
              </div>

              <div style={styles.userName}>{currentUserName}</div>
            </div>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div
            style={{
              ...styles.sectionTitle,
              direction: isHebrew ? "rtl" : "ltr"
            }}
          >
            {t.personalInfo}
          </div>

            <div className="profile-form-grid" style={styles.grid}>
              <div style={styles.field}>
                <label
                  
                style={{
                  direction: isHebrew ? "rtl" : "ltr",
                  textAlign: isHebrew ? "right" : "left",
                  display: "block",
                  width: "100%"
                }}

                >
                  {t.fullName}
                </label>

                <input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label
                  
              style={{
                direction: isHebrew ? "rtl" : "ltr",
                textAlign: isHebrew ? "right" : "left",
                display: "block",
                width: "100%"
              }}

                >
                  {t.email}
                </label>

                <input value={userProfile.email || ""} disabled style={styles.disabledInput} />
              </div>

              <div style={styles.field}>
                <label
  
                  style={{
                    direction: isHebrew ? "rtl" : "ltr",
                    textAlign: isHebrew ? "right" : "left",
                    display: "block",
                    width: "100%"
                  }}

                >
                  {t.phone}
                </label>

                <input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label
  
                  style={{
                    direction: isHebrew ? "rtl" : "ltr",
                    textAlign: isHebrew ? "right" : "left",
                    display: "block",
                    width: "100%"
                  }}

                >
                  {t.role}
                </label>

                <input value={userProfile.role || ""} disabled style={styles.disabledInput} />
              </div>
            </div>

            <div
              style={{
                ...styles.sectionTitle,
                direction: isHebrew ? "rtl" : "ltr"
              }}
            >
              {t.location}
            </div>

            <div style={styles.field}>
              <label
                
  style={{
    direction: isHebrew ? "rtl" : "ltr",
    textAlign: isHebrew ? "right" : "left",
    display: "block",
    width: "100%"
  }}

              >
                {t.city}
              </label>

              <div style={{ position: "relative" }}>
                <input
                  value={citySearch || formData.city}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
                  placeholder={t.searchCity}
                  style={styles.input}
                />

                {showCityDropdown && (
                  <div style={styles.dropdown}>
                    {ISRAELI_CITIES.filter((city) =>
                      city.toLowerCase().includes((citySearch || "").toLowerCase())
                    ).map((city) => (
                      <div
                        key={city}
                        style={styles.dropdownItem}
                        onMouseDown={() => {
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
            </div>


              <div
                className="profile-availability-card"
                style={{
                  ...styles.availabilityCard,
                  flexDirection: isHebrew ? "row-reverse" : "row"
                }}
              >

              <div>
                <strong
                  style={{
                    direction: isHebrew ? "rtl" : "ltr",
                    textAlign: isHebrew ? "right" : "left",
                    display: "block",
                    width: "100%"
                  }}
                >
                  {t.availability}
                </strong>

                <p
                  style={{
                    ...styles.smallText,
                    direction: isHebrew ? "rtl" : "ltr",
                    textAlign: isHebrew ? "right" : "left"
                  }}
                >
                  {t.availabilityDesc}
                </p>
              </div>

              <label style={styles.switch}>
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_available: e.target.checked,
                    }))
                  }
                  style={styles.switchInput}
                />
                <span
                  style={{
                    ...styles.switchTrack,
                    ...(formData.is_available ? styles.switchTrackOn : {}),
                  }}
                >
                  <span
                    style={{
                      ...styles.switchThumb,
                      ...(formData.is_available ? styles.switchThumbOn : {}),
                    }}
                  />
                </span>
              </label>
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                onClick={openPasswordModal}
                style={styles.secondaryButton}
              >
                {t.changePassword}
              </button>

              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? t.saving : t.save}

              </button>
            </div>
          </form>
        </section>
      </main>
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
    borderRight: "1px solid #f3e9da",
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
    textAlign: "left",
    fontWeight: "800",
    cursor: "pointer",
  },

  navItemActive: {
    background: "#fff1df",
    color: "#6a2300",
  },

  logoutButton: {
    marginTop: "auto",
    border: "none",
    background: "#6a2300",
    color: "white",
    borderRadius: "6px",
    padding: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },

  page: {
    minHeight: "100vh",
    padding: "34px",
    boxSizing: "border-box",
  },

  card: {
    maxWidth: "880px",
    margin: "0 auto",
    background: "white",
    borderRadius: "16px",
    padding: "30px",
    boxShadow: "0 16px 40px rgba(43, 22, 12, 0.08)",
    border: "1px solid #f2e7dc",
  },

  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    marginBottom: "32px",
  },

  title: {
    margin: "0 0 4px",
    color: "#6a2300",
    fontSize: "34px",
    fontWeight: "900",
  },

  profileTop: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    marginTop: "16px",
  },

  avatarContainer: {
    position: "relative",
    width: "96px",
    height: "96px",
  },

  avatarFallback: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#fff1df",
    color: "#6a2300",
    fontSize: "38px",
    fontWeight: "900",
    border: "2px solid #f3c49a",
    boxShadow: "0 8px 20px rgba(106, 35, 0, 0.12)",
  },

  availabilityDot: {
    position: "absolute",
    right: "4px",
    bottom: "4px",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "3px solid white",
  },

  availabilityDotOn: {
    background: "#22c55e",
    boxShadow: "0 0 12px rgba(34,197,94,0.7)",
  },

  availabilityDotOff: {
    background: "#9ca3af",
  },

  userName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2b160c",
  },

  sectionTitle: {
    margin: "22px 0 14px",
    color: "#2b160c",
    fontSize: "24px",
    fontWeight: "900",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "16px",
    color: "#2b160c",
    fontWeight: "800",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "6px",
    border: "1px solid #eadfd2",
    background: "#fffdf8",
    fontSize: "14px",
    color: "#2b160c",
    caretColor: "#2b160c",

  },

  disabledInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "6px",
    border: "1px solid #e5ded2",
    background: "#f4f0ea",
    color: "#8a7f72",
    fontSize: "14px",
  },

  dropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #eadfd2",
    borderRadius: "8px",
    maxHeight: "200px",
    overflowY: "auto",
    zIndex: 10,
    boxShadow: "0 12px 25px rgba(43, 22, 12, 0.1)",
  },

  dropdownItem: {
    padding: "11px 14px",
    cursor: "pointer",
    color: "#2b160c",
  },

  availabilityCard: {
    marginTop: "10px",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #f0e5d8",
    background: "#fffdf8",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },

  smallText: {
    margin: "6px 0 0",
    color: "#6b625c",
    fontSize: "13px",
    fontWeight: "400",
  },

  switch: {
    cursor: "pointer",
  },

  switchInput: {
    display: "none",
  },

  switchTrack: {
    width: "52px",
    height: "30px",
    borderRadius: "999px",
    background: "#e5e7eb",
    display: "block",
    position: "relative",
    transition: "0.2s",
  },

  switchTrackOn: {
    background: "#22c55e",
  },

  switchThumb: {
    position: "absolute",
    top: "4px",
    left: "4px",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "white",
    transition: "0.2s",
  },

  switchThumbOn: {
    left: "26px",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "24px",
  },

  button: {
    border: "none",
    padding: "13px 24px",
    borderRadius: "6px",
    background: "#6a2300",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
  },

  secondaryButton: {
    border: "1px solid #6a2300",
    padding: "13px 24px",
    borderRadius: "6px",
    background: "#fffdf8",
    color: "#6a2300",
    fontWeight: "800",
    cursor: "pointer",
  },

  successBox: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(43, 22, 12, 0.35)",
    display: "grid",
    placeItems: "center",
    padding: "18px",
    zIndex: 100,
  },

  modal: {
    width: "100%",
    maxWidth: "460px",
    background: "white",
    borderRadius: "16px",
    padding: "26px",
    boxShadow: "0 24px 70px rgba(43, 22, 12, 0.16)",
    border: "1px solid #f2e7dc",
    boxSizing: "border-box",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
  },

  modalTitle: {
    margin: 0,
    color: "#6a2300",
    fontSize: "24px",
    fontWeight: "900",
  },

  modalSubtitle: {
    margin: "8px 0 0",
    color: "#6b625c",
    fontSize: "13px",
    fontWeight: "400",
  },

  closeButton: {
    width: "34px",
    height: "34px",
    border: "none",
    borderRadius: "6px",
    background: "#fff1df",
    color: "#6a2300",
    fontSize: "18px",
    fontWeight: "900",
    cursor: "pointer",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "8px",
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
  background: "#fffdf8",
  color: "#3d332b",
  fontWeight: "800",
  cursor: "pointer",
},
};