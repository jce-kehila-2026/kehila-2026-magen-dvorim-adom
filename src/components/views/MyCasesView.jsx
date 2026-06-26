import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { USER_ROLES } from "../../services/userSchema";
import logo from "../../assets/logo.png";
import "./MyCasesView.css";
import { useLanguage } from "../../contexts/LanguageContext";

const T = {
  en: {
    dashboard: "Dashboard",
    cases: "Cases",
    users: "Users",
    backup: "Backup",
    profile: "Profile",
    logout: "Logout",

    myCases: "My Cases",
    myAssigned: "My Assigned Cases",
    subtitleVolunteer: "View your assigned rescue cases and submit results when completed.",
    subtitleDefault: "Cases currently assigned and being handled.",

    loading: "Loading your cases…",
    noCases: "No cases assigned yet",
    noCasesDesc: "When a coordinator assigns you a case, it will appear here automatically.",

    activeCases: "Active Cases",
    completedCases: "Completed Cases",

    phone: "Phone",
    city: "City",
    street: "Street",
    urgency: "Urgency",
    opened: "Opened",
    status: "Status",
    coordinator: "Coordinator",
    description: "Description",

    submitResults: "Submit Results",
    collapse: "Collapse",
    viewDetails: "View Details",

    closedAt: "Closed",
    result: "Result",
    closingNotes: "Closing Notes",

    modalTitle: "Submit Case Results",
    resultStatus: "Result Status",
    notes: "Closing Notes",
    cancel: "Cancel",
    submitting: "Submitting...",

    height: "Height",
    floor: "Floor",
    complexity: "Complexity",
    location: "Location",
    notesPlaceholder: "Describe what happened during this rescue operation..."
  },

  he: {
    dashboard: "דשבורד",
    cases: "מקרים",
    users: "משתמשים",
    backup: "גיבוי",
    profile: "פרופיל",
    logout: "התנתק",

    myCases: "המקרים שלי",
    myAssigned: "המקרים שלי",
    subtitleVolunteer: "צפה במקרים שהוקצו לך ושלח תוצאות לאחר סיום.",
    subtitleDefault: "מקרים שמטופלים כרגע.",

    loading: "טוען מקרים…",
    noCases: "אין מקרים",
    noCasesDesc: "כאשר יוקצה לך מקרה, הוא יופיע כאן.",

    activeCases: "מקרים פעילים",
    completedCases: "מקרים שהושלמו",

    phone: "טלפון",
    city: "עיר",
    street: "רחוב",
    urgency: "דחיפות",
    opened: "נפתח",
    status: "סטטוס",
    coordinator: "רכז",
    description: "תיאור",

    submitResults: "שלח תוצאות",
    collapse: "סגור",
    viewDetails: "פרטים",

    closedAt: "נסגר",
    result: "תוצאה",
    closingNotes: "הערות",

    modalTitle: "שליחת תוצאות",
    resultStatus: "תוצאת סיום",
    notes: "הערות",
    cancel: "ביטול",
    submitting: "שולח...",

    height: "גובה",
    floor: "קומה",
    complexity: "מורכבות",
    location: "מיקום",
    notesPlaceholder: "תאר מה קרה במהלך פעולת החילוץ..."
  },
};

function MyCasesView({
  userProfile,
  cases,
  assignments,
  users,
  loading,
  error,
  coordinatorData,
  expandedCases,
  closingCase,
  closingFormData,
  isSubmitting,
  isVolunteer,
  closeStatusOptions,
  setClosingCase,
  setClosingFormData,
  handleCloseCase,
  handleSubmitCloseCase,
  toggleExpand,
  formatDate,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const assignedCases = cases.filter((c) => c.status !== "closed");
  const closedCases = cases.filter((c) => c.status === "closed");
  const { language, setLanguage } = useLanguage();
  const t = T[language] || T.en;
  const isHe = language === "he";

  const statusLabel = (s) => {
    if (language === "he") {
      if (s === "assigned") return "משויך";
      if (s === "closed") return "סגור";
      if (s === "open") return "פתוח";
    }
    return s;
  };

  return (
    <div className="my-cases-page" style={styles.page}>
      {menuOpen && (
        <div
          className="my-cases-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`my-cases-sidebar ${menuOpen ? "open" : ""}`}
        style={styles.sidebar}
      >
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{userProfile?.role || "User"}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          <button style={styles.navItem} onClick={() => goTo("/dashboard")}>
            {t.dashboard}
          </button>

          {!isVolunteer && (
            <>
              <button style={styles.navItem} onClick={() => goTo("/cases")}>
                {t.cases}
              </button>

              <button style={styles.navItem} onClick={() => goTo("/users")}>
                {t.users}
              </button>

              {userProfile?.role === USER_ROLES.ADMIN && (
                <button style={styles.navItem} onClick={() => goTo("/backup")}>
                  {t.backup}
                </button>
              )}
            </>
          )}

          <button style={{ ...styles.navItem, ...styles.navItemActive }}>
            {t.myCases}
          </button>

          <button style={styles.navItem} onClick={() => goTo("/profile")}>
            {t.profile}
          </button>
        </nav>

        <div style={styles.bottomSection}>
          <button
            style={styles.languageButton}
            onClick={() =>
              setLanguage(language === "he" ? "en" : "he")
            }
          >
            {language === "he" ? "English 🌐" : "עברית 🌐"}
          </button>

          <button style={styles.logoutButton} onClick={() => goTo("/")}>
            {t.logout}
          </button>
        </div>
      </aside>

      <main className="my-cases-main" style={styles.main}>
        <div className="my-cases-mobile-topbar">
          <button
            className="my-cases-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <span className="my-cases-mobile-title">{t.myCases}</span>
        </div>

        <section className="my-cases-card" style={styles.contentCard}>
          <div
            className="my-cases-header"
            style={{
              ...styles.header,
              flexDirection: isHe ? "row-reverse" : "row",
            }}
          >

<div
  style={{
    width: "100%",                // ✅ VERY IMPORTANT
    textAlign: isHe ? "right" : "left",
  }}
>
  <h1 className="my-cases-title" style={styles.title}>
    {isVolunteer ? t.myAssigned : t.myCases}
  </h1>

  <p className="my-cases-subtitle" style={styles.subtitle}>
    {isVolunteer ? t.subtitleVolunteer : t.subtitleDefault}
  </p>
</div>


          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {loading && <div style={styles.loading}> {t.loading}</div>}

          {!loading && !error && cases.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📁</div>
              <h2> {t.noCases}</h2>
              <p>
                {t.noCasesDesc}
              </p>
            </div>
          )}

          {!loading && cases.length > 0 && (
            <>
              <section
                className="my-cases-summary"
                style={{
                  ...styles.summaryBar,
                  direction: isHe ? "rtl" : "ltr",
                }}
              >

                <div style={styles.summaryCard}>
                  <span>{t.activeCases}</span>
                  <strong>{assignedCases.length}</strong>
                </div>

                <div style={styles.summaryCard}>
                  <span>{t.completedCases}</span>
                  <strong>{closedCases.length}</strong>
                </div>
              </section>

              {assignedCases.length > 0 && (
                <section style={styles.section}>
                  <h2
                    style={{
                      ...styles.sectionTitle,
                      textAlign: isHe ? "right" : "left",
                    }}
                  >{t.activeCases}</h2>

                  <div style={styles.caseList}>
                    {assignedCases.map((c) => {
                      const expanded = Boolean(expandedCases[c.id]);
                      const coordinator = coordinatorData[c.coordinator_id];

                      return (
                        <div key={c.id} style={styles.accordionCase}>
                          <button
                           
                          style={{
                              ...styles.accordionHeader,
                              flexDirection: isHe ? "row-reverse" : "row",
                            }}

                            onClick={() => toggleExpand(c.id)}
                          >
                            <div>
                              <strong style={styles.caseTitle}>
                                {c.requester_first_name}{" "}
                                {c.requester_last_name}
                              </strong>

                              <p style={styles.caseMeta}>
                                {c.city || t.city} · {statusLabel(c.status)}
                              </p>
                            </div>

                            <span style={styles.expandIcon}>
                              {expanded ? "▲" : "▼"}
                            </span>
                          </button>

                          {expanded && (
                            <div style={styles.accordionBody}>
                              <div
                                className="my-cases-details-grid"
                                style={styles.detailsGrid}
                              >
                                <p>
                                  <strong>{t.phone}:</strong>{" "}
                                  {c.requester_phone || "—"}
                                </p>

                                <p>
                                  <strong>{t.city}:</strong> {c.city || "—"}
                                </p>

                                <p>
                                  <strong>{t.street}:</strong> {c.street}{" "}
                                  {c.house_number || ""}
                                </p>



                                <p>
                                  <strong>{t.opened}:</strong>{" "}
                                  {formatDate(c.opened_at)}
                                </p>

                                <p>
                                  <strong>{t.status}:</strong>{" "}
                                  {c.status || "assigned"}
                                </p>

                                {coordinator && (
                                  <p style={{ gridColumn: "1 / -1" }}>
                                    <strong>{t.coordinator}:</strong>{" "}
                                    {coordinator.full_name || "—"} ·{" "}
                                    {coordinator.phone || "—"}
                                  </p>
                                )}

                                <p style={{ gridColumn: "1 / -1" }}>
                                  <strong>{t.description}:</strong>{" "}
                                  {c.location_description ||
                                    c.description ||
                                    "—"}
                                </p>
                              </div>

                              <div style={styles.caseActionsRow}>
                                <button
                                  style={styles.submitButtonSmall}
                                  onClick={() => handleCloseCase(c)}
                                >
                                  {t.submitResults}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {closedCases.length > 0 && (
                <section style={styles.section}>
                  <h2
                    style={{
                      ...styles.sectionTitle,
                      textAlign: isHe ? "right" : "left",
                      width: "100%", // ✅ THIS fixes the empty gap
                    }}
                  >
                    {t.completedCases}
                  </h2>

                  <div style={styles.caseList}>
                    {closedCases.map((c) => {
                      const expanded = Boolean(expandedCases[c.id]);

                      return (
                        <div key={c.id} style={styles.closedItem}>
                         <div style={styles.closedTop}>

                            <div>
                              <h3 style={styles.caseTitle}>
                                {c.requester_first_name}{" "}
                                {c.requester_last_name}
                              </h3>

                              <p style={styles.caseMeta}>
                                {t.closedAt}: {formatDate(c.closed_at)}
                              </p>

                              <p style={styles.caseMeta}>
                                {t.result}: {c.result_status || "completed"}
                              </p>
                            </div>

                            <button
                              style={styles.viewButton}
                              onClick={() => toggleExpand(c.id)}
                            >
                              {expanded ? t.collapse : t.viewDetails}
                            </button>
                          </div>

                          {expanded && (
                            <div
                              className="my-cases-details-grid"
                              style={{
                                ...styles.detailsGrid,
                                textAlign: isHe ? "right" : "left",
                              }}
                            >
                              <p>
                                <strong>Phone:</strong>{" "}
                                {c.requester_phone || "—"}
                              </p>

                              <p>
                                <strong>{t.opened}:</strong>{" "}
                                {formatDate(c.opened_at)}
                              </p>

                              <p>
                                <strong>{t.street}:</strong> {c.street}{" "}
                                {c.house_number || ""}, {c.city || ""}
                              </p>

                              <p>
                                <strong>{t.height}:</strong>{" "}
                                {c.height_from_ground || "—"} meters
                              </p>

                              <p>
                                <strong>{t.floor}:</strong> {c.floor || "—"}
                              </p>

                              <p>
                                <strong>{t.complexity}:</strong>{" "}
                                {c.case_complexity || "simple"}
                              </p>

                              <p style={{ gridColumn: "1 / -1" }}>
                                <strong>{t.description}:</strong>{" "}
                                {c.location_description || "—"}
                              </p>

                              {c.result_notes && (
                                <p style={{ gridColumn: "1 / -1" }}>
                                  <strong>Closing Notes:</strong>{" "}
                                  {c.result_notes}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </section>
      </main>

      {closingCase && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>{t.modalTitle}</h2>
            <p style={styles.modalSubtitle}>
              {t.myCases}: {closingCase.requester_first_name}{" "}
              {closingCase.requester_last_name}
            </p>

            <form onSubmit={handleSubmitCloseCase}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t.resultStatus} *</label>
                <select
                  value={closingFormData.result_status}
                  onChange={(e) =>
                    setClosingFormData({
                      ...closingFormData,
                      result_status: e.target.value,
                    })
                  }
                  style={styles.select}
                  required
                >
                  {closeStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{t.notes}</label>
                <textarea
                  value={closingFormData.result_notes}
                  onChange={(e) =>
                    setClosingFormData({
                      ...closingFormData,
                      result_notes: e.target.value,
                    })
                  }
                  placeholder={t.notesPlaceholder}
                  style={styles.textarea}
                  rows={4}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setClosingCase(null)}
                  style={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  style={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t.submitting : t.submitResults}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
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
    padding: "28px 20px",
    background: "#fff8ef",
    borderRight: "1px solid #f3e9da",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "36px",
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
  },

  brandSub: {
    margin: "4px 0 0",
    color: "#e85d04",
    fontSize: "13px",
    textTransform: "capitalize",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  navItem: {
    border: "none",
    background: "transparent",
    color: "#3d332b",
    padding: "13px 16px",
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
  padding: "13px",
  borderRadius: "6px",               // ✅ FIX
  border: "none",
  background: "#6a2300",             // ✅ FIX
  color: "white",
  fontWeight: "800",
  cursor: "pointer",
},


  main: {
    padding: "34px",
    boxSizing: "border-box",
  },


  contentCard: {
  background: "#ffffff",
  borderRadius: "16px",   // ✅ MATCH PROFILE
  padding: "30px",        // ✅ MATCH PROFILE
  boxShadow: "0 16px 40px rgba(0,0,0,0.03)",
  border: "1px solid #f0e5d8",
},

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "28px",
  },

  title: {
    margin: 0,
    color: "#2b160c",
    fontSize: "32px",
    fontWeight: "900",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#6b625c",
    fontSize: "15px",
  },

  metaBox: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    color: "#6b625c",
    fontSize: "14px",
    textAlign: "right",
  },

  errorBox: {
    padding: "12px",
    borderRadius: "12px",
    backgroundColor: "#fde8e8",
    color: "#b42318",
    fontSize: "14px",
    marginBottom: "18px",
    textAlign: "center",
  },

  loading: {
    padding: "20px",
    color: "#6b625c",
  },

  emptyState: {
    textAlign: "center",
    padding: "44px 24px",
    borderRadius: "20px",
    background: "#fffdf8",
    border: "1px solid #f0e5d8",
    color: "#6b625c",
  },

  emptyIcon: {
    fontSize: "34px",
    marginBottom: "12px",
  },

  summaryBar: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "28px",
  },

  summaryCard: {
    background: "#fff8ef",
    border: "1px solid #f0e5d8",
    borderRadius: "16px",
    padding: "20px",
  },

  section: {
    marginTop: "28px",
  },

  sectionTitle: {
    margin: "0 0 16px",
    color: "#2b160c",
    fontSize: "20px",
    fontWeight: "900",
  },

  caseList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  closedItem: {
    padding: "18px",
    borderRadius: "16px",
    border: "1px solid #f1ebe5",
    background: "#fffdf8",
  },

  closedTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
  },

  caseTitle: {
    margin: 0,
    color: "#1f2937",
    fontSize: "17px",
    fontWeight: "900",
  },

  caseMeta: {
    margin: "7px 0 0",
    color: "#6b625c",
    fontSize: "14px",
  },

  submitButtonSmall: {
    border: "1px solid #f3c49a",
    background: "#fff8ef",
    color: "#d95f00",
    borderRadius: "6px",
    padding: "8px 13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  viewButton: {
    border: "1px solid #ddd6ce",
    background: "white",
    color: "#3d332b",
    borderRadius: "6px",
    padding: "8px 13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 18px",
    marginTop: "18px",
    color: "#2b160c",
    fontSize: "14px",
  },

  accordionCase: {
    borderRadius: "16px",
    border: "1px solid #f1ebe5",
    background: "#fffdf8",
    overflow: "hidden",
  },

  accordionHeader: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    textAlign: "left",
  },

  expandIcon: {
    color: "#0f6b78",
    fontSize: "16px",
    fontWeight: "900",
  },

  accordionBody: {
    borderTop: "1px solid #f1ebe5",
    padding: "18px",
  },

  caseActionsRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "18px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.42)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },

  modal: {
    width: "100%",
    maxWidth: "520px",
    background: "white",
    borderRadius: "22px",
    padding: "28px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
  },

  modalTitle: {
    margin: "0 0 8px",
    color: "#2b160c",
    fontSize: "22px",
    fontWeight: "900",
  },

  modalSubtitle: {
    margin: "0 0 24px",
    color: "#6b625c",
    fontSize: "14px",
  },

  formGroup: {
    marginBottom: "18px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#2b160c",
    fontSize: "14px",
    fontWeight: "800",
  },

  select: {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid #eadfd2",
    borderRadius: "12px",
    background: "white",
    color: "#1f2937",
  },

  textarea: {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid #eadfd2",
    borderRadius: "12px",
    background: "#fffdf8",
    color: "#1f2937",
    resize: "vertical",
    boxSizing: "border-box",
  },

  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
  },

submitButton: {
  flex: 1,
  padding: "10px 16px",
  background: "#6a2300",   // ✅ FIX
  color: "white",
  border: "none",
  borderRadius: "6px",     // ✅ FIX
  fontWeight: "800",
  cursor: "pointer",
},

cancelButton: {
  flex: 1,
  padding: "10px 16px",
  background: "#f3f4f6",
  color: "#374151",
  border: "none",
  borderRadius: "6px",     // ✅ FIX
  fontWeight: "800",
  cursor: "pointer",
},
  bottomSection: {
  marginTop: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
},


languageButton: {
  padding: "13px",
  borderRadius: "6px",               // ✅ FIX
  border: "1px solid #eadfd2",
  background: "#fffaf4",
  color: "#2b160c",
  fontWeight: "800",
  cursor: "pointer",
},

};

export default MyCasesView;
