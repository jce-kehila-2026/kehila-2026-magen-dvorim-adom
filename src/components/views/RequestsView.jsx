// RequestsView — unified page for פניות (Requests)
// Replaces Dashboard + Cases for admin & coordinator
import "./RequestsView.css";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import VolunteerRecommendationMap from "./VolunteerRecommendationMap";
import CoordinatorSendForm from "../../pages/CoordinatorSendForm";
import { useState, useMemo } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { USER_ROLES } from "../../services/userSchema";

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    // nav
    requests: "Requests", users: "Users", reports: "Reports",
    backup: "Backup", profile: "Profile", logout: "Logout",
    langToggle: "עברית 🌐",
    // welcome
    welcome: "Welcome",
    // send form section
    sendFormTitle: "Send Intake Form",
    instructionsTitle: "How to send a form",
    step1: "Enter the requester's phone number.",
    step2: "Click \"Create Form\" — this logs the request.",
    step3: "Click \"Copy Link\" to copy the form URL.",
    step4: "Send the link to the requester via WhatsApp or SMS.",
    // form tracking
    trackTitle: "Form Tracking",
    newest: "Newest first", oldest: "Oldest first",
    all: "All", sent: "Sent", returned: "Returned", expired: "Expired",
    date: "Date", phone: "Phone", coordinator: "Coordinator",
    formStatus: "Status", noForms: "No forms sent yet.",
    // cases section
    casesTitle: "Cases",
    open: "Open", assigned: "Assigned", closed: "Closed", myCases: "My Cases",
    // table headers
    name: "Name", openedCol: "Opened", statusCol: "Status",
    assignedTo: "Assigned to", feedback: "Feedback",
    // detail rows
    city: "City", street: "Street", coordinator2: "Coordinator",
    complexity: "Complexity", closedAt: "Closed at",
    result: "Result", closingNotes: "Closing notes",
    description: "Requester notes / description",
    assignedVols: "Assigned volunteer(s)",
    adminRating: "Admin rating", evacuationRating: "Evacuation rating",
    notes: "Notes", feedbackLink: "Feedback link",
    // actions
    assignVolunteer: "Assign Volunteer", reassignVolunteer: "Reassign Volunteer",
    closeCase: "Close Case", reopenCase: "Reopen Case",
    confirmClose: "Confirm Close", cancel: "Cancel",
    selectResult: "Select a finishing result",
    closingNotesOpt: "Closing notes (optional)",
    received: "✅ Received", copied: "Copied ✓", sendLink: "Send link",
    linkCopied: "✓ Link copied — send to requester",
    copyAgain: "Copy again", copyFeedbackLink: "Copy feedback link",
    noDescription: "No description provided.",
    noClosingNotes: "No closing notes.",
    noNotes: "No notes.",
    noMatch: "No cases match this view.",
    search: "Search by name, phone, city, status…",
    // assign modal
    assignModalTitle: "Assign volunteer",
    assignModalSub: "Choose the best available volunteer for this case.",
    selectVolunteer: "Select volunteer",
    searchByName: "Search by name...",
    noUsers: "No users found.",
    requiredEquipment: "Required equipment",
    otherEquipment: "Other equipment",
    otherEquipmentPh: "e.g. gloves, smoker",
    assignmentNotes: "Assignment notes",
    assignmentNotesPh: "Optional notes for the volunteer...",
    assigning: "Assigning...",
    assignBtn: "Assign volunteer",
    caseMap: "Volunteer map",
    mapLegend: "📍 Case • 🟢 Volunteers",
    score: "Score",
    noPhone: "No phone", noCity: "No city",
    simple: "Simple", complex: "Complex", veryComplex: "Very Complex",
  },
  he: {
    requests: "פניות", users: "משתמשים", reports: "דוחות",
    backup: "גיבוי", profile: "פרופיל", logout: "התנתק",
    langToggle: "English 🌐",
    welcome: "ברוך הבא",
    sendFormTitle: "שליחת טופס פנייה",
    instructionsTitle: "איך שולחים טופס",
    step1: "הזן את מספר הטלפון של הפונה.",
    step2: "לחץ \"צור טופס\" — הפנייה תירשם במערכת.",
    step3: "לחץ \"העתק קישור\" להעתקת הקישור לטופס.",
    step4: "שלח את הקישור לפונה בוואטסאפ או SMS.",
    trackTitle: "מעקב טפסים",
    newest: "חדשים קודם", oldest: "ישנים קודם",
    all: "הכל", sent: "נשלח", returned: "חזר", expired: "פג תוקף",
    date: "תאריך", phone: "טלפון", coordinator: "רכז",
    formStatus: "סטטוס", noForms: "אין טפסים שנשלחו עדיין.",
    casesTitle: "פניות",
    open: "פתוחים", assigned: "משויכים", closed: "סגורים", myCases: "המקרים שלי",
    name: "שם", openedCol: "נפתח", statusCol: "סטטוס",
    assignedTo: "מוקצה ל", feedback: "משוב",
    city: "עיר", street: "רחוב", coordinator2: "רכז",
    complexity: "מורכבות", closedAt: "נסגר ב",
    result: "תוצאה", closingNotes: "הערות סגירה",
    description: "הערות המבקש / תיאור",
    assignedVols: "מתנדב/ים משויך/ים",
    adminRating: "דירוג מנהלתי", evacuationRating: "דירוג פינוי",
    notes: "הערות", feedbackLink: "קישור משוב",
    assignVolunteer: "שייך מתנדב", reassignVolunteer: "שייך מחדש",
    closeCase: "סגור מקרה", reopenCase: "פתח מחדש",
    confirmClose: "אשר סגירה", cancel: "ביטול",
    selectResult: "בחר תוצאת סיום",
    closingNotesOpt: "הערות סגירה (אופציונלי)",
    received: "✅ התקבל", copied: "הועתק ✓", sendLink: "שלח קישור",
    linkCopied: "✓ הקישור הועתק — שלח למבקש",
    copyAgain: "העתק שוב", copyFeedbackLink: "העתק קישור משוב",
    noDescription: "לא סופק תיאור.",
    noClosingNotes: "אין הערות סגירה.",
    noNotes: "אין הערות.",
    noMatch: "אין מקרים התואמים לתצוגה זו.",
    search: "חיפוש לפי שם, טלפון, עיר, סטטוס…",
    assignModalTitle: "שייך מתנדב",
    assignModalSub: "בחר את המתנדב הזמין הטוב ביותר למקרה זה.",
    selectVolunteer: "בחר מתנדב",
    searchByName: "חפש לפי שם...",
    noUsers: "לא נמצאו משתמשים.",
    requiredEquipment: "ציוד נדרש",
    otherEquipment: "ציוד אחר",
    otherEquipmentPh: "לדוג׳ כפפות, מעשן",
    assignmentNotes: "הערות שיוך",
    assignmentNotesPh: "הערות אופציונליות עבור המתנדב...",
    assigning: "משייך...",
    assignBtn: "שייך מתנדב",
    caseMap: "מפת מתנדבים",
    mapLegend: "📍 מקרה • 🟢 מתנדבים",
    score: "ניקוד",
    noPhone: "אין טלפון", noCity: "אין עיר",
    simple: "פשוט", complex: "מורכב", veryComplex: "מורכב מאוד",
  },
};

// ─── Form status helpers ───────────────────────────────────────────────────────
function formStatusLabel(status, t) {
  if (status === "submitted") return t.returned;
  if (status === "sent" || status === "waiting") return t.sent;
  if (status === "expired") return t.expired;
  return "—";
}

function formStatusColor(status) {
  if (status === "sent" || status === "waiting")
    return { bg: "#fff1df", color: "#c2410c" };
  if (status === "submitted")
    return { bg: "#dcfce7", color: "#15803d" };
  if (status === "expired")
    return { bg: "#fee2e2", color: "#b42318" };
  return { bg: "#f1f5f9", color: "#475569" };
}

function cleanDate(value) {
  if (!value) return "—";
  return new Date(value.seconds ? value.seconds * 1000 : value)
    .toLocaleDateString("en-GB");
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RequestsView({
  userProfile,
  currentUserRole,
  currentUserName,
  // cases
  cases = [],
  activeCases = [],
  closedCases = [],
  openCaseCount = 0,
  assignedCaseCount = 0,
  myCasesCount = 0,
  activeFilter,
  setActiveFilter,
  caseSearch,
  setCaseSearch,
  sortColumn,
  sortDirection,
  handleSortClick,
  error,
  assignments = {},
  detailsCase,
  setDetailsCase,
  modalState,
  setModalState,
  userSearch,
  setUserSearch,
  filteredUsersForModal = [],
  recommendations,
  setRecommendations,
  assigning,
  PRESET_EQUIPMENT = [],
  beginCloseCase,
  cancelCloseCase,
  confirmCloseCase,
  closingCase = { caseId: null, result_status: "evacuated_by_volunteer", notes: "" },
  setClosingCase,
  FINISHING_STATUSES = [],
  handleAssignFromModal,
  handleGetRecommendations,
  handleReopenCase,
  handleSendFeedback,
  formatDate,
  getResultLabel,
  usersById = {},
  coordinatorOptions = [],
  handleChangeComplexity,
  handleChangeCoordinator,
  feedbackByCase = {},
  handleLogout,
  // forms
  intakeForms = [],
  coordinatorNames = {},
  formSortDir,
  setFormSortDir,
  formStatusFilter,
  setFormStatusFilter,
}) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [localFeedbackCopied, setLocalFeedbackCopied] = useState({});
  const { language, setLanguage } = useLanguage();
  const isHe = language === "he";
  const t = T[language] || T.en;
  const dir = isHe ? "rtl" : "ltr";
  const isAdmin = currentUserRole === USER_ROLES?.ADMIN || currentUserRole === "admin";

  const goTo = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  // ── Form tracking ────────────────────────────────────────────────────────────
  const filteredForms = useMemo(() => {
    if (formStatusFilter === "all") return intakeForms;
    return intakeForms.filter((f) => {
      if (formStatusFilter === "returned") return f.status === "submitted";
      if (formStatusFilter === "sent") return f.status === "sent" || f.status === "waiting";
      return f.status === formStatusFilter;
    });
  }, [intakeForms, formStatusFilter]);

  const sortedForms = useMemo(() => {
    return [...filteredForms].sort((a, b) => {
      const aTime = a.sent_at?.toDate ? a.sent_at.toDate().getTime() : new Date(a.sent_at).getTime();
      const bTime = b.sent_at?.toDate ? b.sent_at.toDate().getTime() : new Date(b.sent_at).getTime();
      return formSortDir === "desc" ? bTime - aTime : aTime - bTime;
    });
  }, [filteredForms, formSortDir]);

  // ── Case helpers ─────────────────────────────────────────────────────────────
  const getStatusStyle = (s) => ({
    ...styles.badge,
    ...(s === "assigned" ? styles.assignedBadge : s === "closed" ? styles.closedBadge : styles.openBadge),
  });

  const complexityLabel = (v) =>
    v === "very_complex" ? t.veryComplex : v === "complex" ? t.complex : t.simple;

  const currentModalCase = cases.find((c) => c.id === modalState.caseId);

  const scoreByUserId = (recommendations || []).reduce((acc, v) => {
    acc[v.id] = v.recommendationScore; return acc;
  }, {});

  const closeAssignModal = () => {
    setModalState({ open: false, caseId: null, userId: "", selected: [], other: "", notes: "" });
    setUserSearch("");
    setRecommendations(null);
  };

  const openAssignModal = (caseItem) => {
    setModalState((s) => ({ ...s, open: true, caseId: caseItem.id }));
    handleGetRecommendations(caseItem);
  };

  const handleSendFeedbackOptimistic = (caseItem) => {
    setLocalFeedbackCopied((p) => ({ ...p, [caseItem.id]: true }));
    handleSendFeedback(caseItem);
  };

  const getAssignedNames = (caseItem) => {
    const a = assignments[caseItem.id] || [];
    if (!a.length) return null;
    return a.map((x) => {
      const u = usersById[x.user_id];
      return x.volunteer_name || x.full_name || x.user_name || u?.full_name || u?.email || "Volunteer";
    }).join(", ");
  };

  // ── Column order for RTL ──────────────────────────────────────────────────────
  // In Hebrew: Name on right → feedback on left
  // gridTemplateColumns order is always: name | phone | date | status | assigned | feedback | chevron
  // In RTL the browser flips the visual order automatically with dir="rtl"

  return (
    <div style={styles.page} className="requests-page">
      {/* ── MOBILE MENU BUTTON ── */}
      <button type="button" className="requests-mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>

      {mobileMenuOpen && (
        <>
          <div className="requests-mobile-backdrop" />
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 998, background: "transparent" }}
          />
        </>
      )}

      {/* ── SIDEBAR ── */}
      <aside
        style={styles.sidebar}
        className={`requests-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{currentUserName || "User"}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          <button style={{ ...styles.navItem, ...styles.navItemActive }}>
            {t.requests}
          </button>
          <button style={styles.navItem} onClick={() => goTo("/users")}>
            {t.users}
          </button>
          {isAdmin && (
            <button style={styles.navItem} onClick={() => goTo("/reports")}>
              {t.reports}
            </button>
          )}
          {isAdmin && (
            <button style={styles.navItem} onClick={() => goTo("/backup")}>
              {t.backup}
            </button>
          )}
          <button style={styles.navItem} onClick={() => goTo("/profile")}>
            {t.profile}
          </button>
        </nav>

        <div style={styles.sidebarBottom}>
          <button style={styles.langButton} onClick={() => setLanguage(isHe ? "en" : "he")}>
            {t.langToggle}
          </button>
          <button style={styles.logoutButton} onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>
            {t.logout}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={styles.main} className="requests-main" dir={dir}>

        {/* Welcome banner */}
        <div style={{ ...styles.welcomeBanner, textAlign: isHe ? "right" : "left" }}>
          <span style={styles.welcomeText}>
            {t.welcome}, <strong>{currentUserName}</strong>
          </span>
        </div>

        {error && <p style={styles.errorText}>{error}</p>}

        {/* ── TOP ROW: send form (left) + form tracking (right) ── */}
        {/* In Hebrew the columns swap via flex-direction row-reverse */}
        <div style={{ ...styles.topRow, flexDirection: isHe ? "row-reverse" : "row" }} className="requests-top-row">

          {/* LEFT COL: Send Form + Instructions */}
          <div style={styles.topLeft} className="requests-top-left">
            <section style={styles.card} className="requests-card">
              <h2 style={{ ...styles.sectionTitle, textAlign: isHe ? "right" : "left" }}>
                {t.sendFormTitle}
              </h2>
              <CoordinatorSendForm />
              <div style={{ ...styles.instructionsBox, textAlign: isHe ? "right" : "left", marginTop: "10px" }}>
                <p style={styles.instructionsTitle}>{t.instructionsTitle}</p>
                <ol style={styles.instructionsList}>
                  <li>{t.step1}</li>
                  <li>{t.step2}</li>
                  <li>{t.step3}</li>
                  <li>{t.step4}</li>
                </ol>
              </div>
            </section>
          </div>

          {/* RIGHT COL: Form Tracking */}
          <div style={styles.topRight} className="requests-top-right">
            <section style={{ ...styles.card, height: "100%", boxSizing: "border-box" }} className="requests-card">
<div
  style={{
    ...styles.trackHeader,
    flexDirection: "row", // always normal
    justifyContent: "space-between",
  }}
>
  {/* TITLE */}
  <h2
    style={{
      ...styles.sectionTitle,
      margin: 0,
      textAlign: isHe ? "right" : "left",
    }}
  >
    {t.trackTitle}
  </h2>

  {/* FILTERS */}
  <div
    style={{
      ...styles.trackControls,
      marginLeft: isHe ? 0 : "auto",  // push right in EN
      marginRight: isHe ? "auto" : 0, // push left in HE
    }}
  >
    <select
      style={styles.sortSelect}
      value={formSortDir}
      onChange={(e) => setFormSortDir(e.target.value)}
    >
      <option value="desc">{t.newest}</option>
      <option value="asc">{t.oldest}</option>
    </select>

    <select
      style={styles.sortSelect}
      value={formStatusFilter}
      onChange={(e) => setFormStatusFilter(e.target.value)}
    >
      <option value="all">{t.all}</option>
      <option value="sent">{t.sent}</option>
      <option value="returned">{t.returned}</option>
      <option value="expired">{t.expired}</option>
    </select>
  </div>
</div>

              {sortedForms.length === 0 ? (
                <p style={styles.emptyText}>{t.noForms}</p>
              ) : (
                <div style={styles.trackScrollArea}>
                  <table style={{ ...styles.table, direction: dir, textAlign: isHe ? "right" : "left" }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>{t.date}</th>
                        <th style={styles.th}>{t.phone}</th>
                        {isAdmin && <th style={styles.th}>{t.coordinator}</th>}
                        <th style={styles.th}>{t.formStatus}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedForms.map((form) => {
                        const sc = formStatusColor(form.status);
                        return (
                          <tr key={form.id} style={styles.tr}>
                            <td style={styles.td}>{cleanDate(form.sent_at)}</td>
                            <td style={styles.td}>{form.requester_phone || "—"}</td>
                            {isAdmin && (
                              <td style={styles.td}>{coordinatorNames[form.coordinator_id] || "—"}</td>
                            )}
                            <td style={styles.td}>
                              <span style={{ ...styles.statusPill, background: sc.bg, color: sc.color }}>
                                {formStatusLabel(form.status, t)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── CASES ── */}
        <section style={styles.card} className="requests-card">
          <h2 style={{ ...styles.sectionTitle, textAlign: isHe ? "right" : "left" }}>
            {t.casesTitle}
          </h2>

          {/* Filter pills */}
          <div style={{ ...styles.filters, flexDirection: isHe ? "row-reverse" : "row" , justifyContent: isHe ? "flex-end" : "flex-start",}} className="requests-filters">
            {[
              { key: "all", label: t.all, count: cases.length },
              { key: "open", label: t.open, count: openCaseCount },
              { key: "assigned", label: t.assigned, count: assignedCaseCount },
              { key: "closed", label: t.closed, count: closedCases.length },
              { key: "my", label: t.myCases, count: myCasesCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                style={{ ...styles.filterButton, ...(activeFilter === key ? styles.filterActive : {}) }}
              >
                {label}
                <span style={{ ...styles.filterCount, ...(activeFilter === key ? styles.filterCountActive : {}) }}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          <div style={styles.toolbar}>
            <input
              placeholder={t.search}
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
              style={{ ...styles.searchInput, textAlign: isHe ? "right" : "left" }}
              className="requests-search-input"
            />
          </div>

          {activeCases.length === 0 ? (
            <div style={styles.emptyState}>{t.noMatch}</div>
          ) : (
            <div style={styles.casesList}>
              {/* Desktop header — column order flips via dir="rtl" on parent */}
              <div style={styles.desktopHeader} className="requests-desktop-header" dir={dir}>
                <span onClick={() => handleSortClick("name")} style={styles.thCell}>
                  {t.name} {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                </span>
                <span onClick={() => handleSortClick("phone")} style={styles.thCell}>
                  {t.phone} {sortColumn === "phone" && (sortDirection === "asc" ? "↑" : "↓")}
                </span>
                <span onClick={() => handleSortClick("opened_at")} style={styles.thCell}>
                  {t.openedCol} {sortColumn === "opened_at" && (sortDirection === "asc" ? "↑" : "↓")}
                </span>
                <span style={{ ...styles.thCell, cursor: "default" }}>{t.statusCol}</span>
                <span style={{ ...styles.thCell, cursor: "default" }}>{t.assignedTo}</span>
                <span style={{ ...styles.thCell, cursor: "default" }}>{t.feedback}</span>
                <span />
              </div>

              {activeCases.map((caseItem, rowIndex) => {
                const isExpanded = expandedCaseId === caseItem.id;
                const assignedNames = getAssignedNames(caseItem);
                const feedbackSubmitted = caseItem.feedback_submitted;
                const feedbackCopied = localFeedbackCopied[caseItem.id] || !!caseItem.feedback_token;
                const feedbackData = feedbackByCase[caseItem.id];

                return (
                  <div
                    key={caseItem.id}
                    style={{ ...styles.accordionCard, background: rowIndex % 2 === 0 ? "#fff" : "#fdf8f0" }}
                    dir={dir}
                  >
                    <div
                      className="case-row-trigger"
                      onClick={() => setExpandedCaseId(isExpanded ? null : caseItem.id)}
                      style={styles.rowTrigger}
                    >
                      <span className="col-name" style={styles.colName}>
                        {caseItem.requester_first_name} {caseItem.requester_last_name}
                      </span>
                      <span className="col-phone" style={styles.colMeta}>{caseItem.requester_phone || "—"}</span>
                      <span className="col-date" style={styles.colMeta}>{formatDate(caseItem.opened_at)}</span>
                      <span className="col-status" style={{ display: "flex", justifyContent: "center" }}>
                        <span style={getStatusStyle(caseItem.status)}>{caseItem.status}</span>
                      </span>
                      <span className="col-assigned" style={styles.colAssigned}>
                        {assignedNames || <span style={{ color: "#aaa" }}>—</span>}
                      </span>
                      <span className="col-feedback" style={{ display: "flex", justifyContent: "center" }}>
                        {caseItem.status !== "closed" ? (
                          <span style={{ color: "#aaa", fontSize: "13px" }}>—</span>
                        ) : feedbackSubmitted ? (
                          <span style={styles.feedbackReceived}>{t.received}</span>
                        ) : feedbackCopied ? (
                          <button onClick={(e) => { e.stopPropagation(); handleSendFeedbackOptimistic(caseItem); }} style={styles.feedbackCopiedBtn}>{t.copied}</button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); handleSendFeedbackOptimistic(caseItem); }} style={styles.feedbackSendBtn}>{t.sendLink}</button>
                        )}
                      </span>
                      <span className={`row-chevron ${isExpanded ? "chevron-up" : "chevron-down"}`} />
                    </div>

                    {/* Accordion body */}
                    {isExpanded && (
                      <div style={styles.accordionBody}>
                        <div style={styles.detailTableWrapper}>
                          {/* City / Street / Coordinator / Complexity */}
                          <div style={{ ...styles.dtHead, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                            {[t.city, t.street, t.coordinator2, t.complexity].map((h) => (
                              <div key={h} style={styles.dtHeadCell}>{h}</div>
                            ))}
                          </div>
                          <div style={{ ...styles.dtRow, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                            <div style={styles.dtCell}>{caseItem.city || "—"}</div>
                            <div style={styles.dtCell}>{caseItem.street || "—"} {caseItem.house_number || ""}</div>
                            <div style={styles.dtCell}>
                              {isAdmin && (caseItem.status === "open" || caseItem.status === "assigned") ? (
                                <select
                                  value={caseItem.coordinator_id || ""}
                                  onChange={(e) => handleChangeCoordinator(caseItem.id, e.target.value)}
                                  style={styles.inlineSelect}
                                >
                                  {coordinatorOptions.map((u) => (
                                    <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                                  ))}
                                </select>
                              ) : (
                                usersById[caseItem.coordinator_id]?.full_name ||
                                usersById[caseItem.coordinator_id]?.email || "—"
                              )}
                            </div>
                            <div style={styles.dtCell}>
                              {(currentUserRole === "admin" || currentUserRole === "coordinator") && caseItem.status === "open" ? (
                                <select
                                  value={caseItem.case_complexity || "simple"}
                                  onChange={(e) => handleChangeComplexity(caseItem.id, e.target.value)}
                                  style={styles.inlineSelect}
                                >
                                  <option value="simple">{t.simple}</option>
                                  <option value="complex">{t.complex}</option>
                                  <option value="very_complex">{t.veryComplex}</option>
                                </select>
                              ) : (
                                complexityLabel(caseItem.case_complexity)
                              )}
                            </div>
                          </div>

                          {/* Assigned volunteers */}
                          {assignedNames && (
                            <>
                              <div style={{ ...styles.dtHead, gridTemplateColumns: "1fr" }}>
                                <div style={{ ...styles.dtHeadCell, borderRight: "none" }}>{t.assignedVols}</div>
                              </div>
                              <div style={{ ...styles.dtRow, gridTemplateColumns: "1fr" }}>
                                <div style={{ ...styles.dtCell, borderRight: "none", textAlign: isHe ? "right" : "left", color: "#16803d", fontWeight: "800" }}>
                                  👤 {assignedNames}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Closed extra rows */}
                          {caseItem.status === "closed" && (
                            <>
                              <div style={{ ...styles.dtHead, gridTemplateColumns: "1fr 1fr 1fr" }}>
                                <div style={styles.dtHeadCell}>{t.closedAt}</div>
                                <div style={styles.dtHeadCell}>{t.result}</div>
                                <div style={{ ...styles.dtHeadCell, borderRight: "none" }}>{t.closingNotes}</div>
                              </div>
                              <div style={{ ...styles.dtRow, gridTemplateColumns: "1fr 1fr 1fr" }}>
                                <div style={styles.dtCell}>{cleanDate(caseItem.closed_at)}</div>
                                <div style={styles.dtCell}>{getResultLabel(caseItem.result_status)}</div>
                                <div style={{ ...styles.dtCell, borderRight: "none", textAlign: isHe ? "right" : "left" }}>
                                  {caseItem.result_notes || t.noClosingNotes}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Description */}
                          <div style={{ ...styles.dtHead, gridTemplateColumns: "1fr" }}>
                            <div style={{ ...styles.dtHeadCell, borderRight: "none" }}>{t.description}</div>
                          </div>
                          <div style={{ ...styles.dtRow, gridTemplateColumns: "1fr" }}>
                            <div style={{ ...styles.dtCell, borderRight: "none", textAlign: isHe ? "right" : "left" }}>
                              {caseItem.location_description || t.noDescription}
                            </div>
                          </div>

                          {/* Feedback (closed) */}
                          {caseItem.status === "closed" && (
                            feedbackData ? (
                              <>
                                <div style={{ ...styles.dtHead, gridTemplateColumns: "1fr 1fr 1fr" }}>
                                  <div style={styles.dtHeadCell}>{t.adminRating}</div>
                                  <div style={styles.dtHeadCell}>{t.evacuationRating}</div>
                                  <div style={{ ...styles.dtHeadCell, borderRight: "none" }}>{t.notes}</div>
                                </div>
                                <div style={{ ...styles.dtRow, gridTemplateColumns: "1fr 1fr 1fr" }}>
                                  <div style={styles.dtCell}>{feedbackData.administrative_rating != null ? `${feedbackData.administrative_rating}/4` : "—"}</div>
                                  <div style={styles.dtCell}>{feedbackData.evacuation_rating != null ? `${feedbackData.evacuation_rating}/4` : "—"}</div>
                                  <div style={{ ...styles.dtCell, borderRight: "none" }}>{feedbackData.comments || t.noNotes}</div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ ...styles.dtHead, gridTemplateColumns: "1fr" }}>
                                  <div style={{ ...styles.dtHeadCell, borderRight: "none" }}>{t.feedbackLink}</div>
                                </div>
                                <div style={{ ...styles.dtRow, gridTemplateColumns: "1fr", justifyItems: "center", padding: "10px 0" }}>
                                  {feedbackCopied ? (
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ fontWeight: "700", color: "#16803d", marginBottom: "6px" }}>{t.linkCopied}</div>
                                      <button onClick={(e) => { e.stopPropagation(); handleSendFeedbackOptimistic(caseItem); }} style={styles.assignButton}>{t.copyAgain}</button>
                                    </div>
                                  ) : (
                                    <button onClick={(e) => { e.stopPropagation(); handleSendFeedbackOptimistic(caseItem); }} style={styles.assignButton}>{t.copyFeedbackLink}</button>
                                  )}
                                </div>
                              </>
                            )
                          )}
                        </div>

                        {/* Case actions */}
                        {closingCase.caseId === caseItem.id ? (
                          <div style={styles.closeCasePicker} className="close-case-picker">
                            <label style={styles.label}>{t.selectResult}</label>
                            <select
                              value={closingCase.result_status}
                              onChange={(e) => setClosingCase((p) => ({ ...p, result_status: e.target.value }))}
                              style={styles.inlineSelect}
                            >
                              {FINISHING_STATUSES.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <label style={styles.label}>{t.closingNotesOpt}</label>
                            <textarea
                              rows={2}
                              value={closingCase.notes}
                              onChange={(e) => setClosingCase((p) => ({ ...p, notes: e.target.value }))}
                              style={styles.textarea}
                            />
                            <div style={styles.inlineActions} className="case-inline-actions">
                              <button onClick={cancelCloseCase} style={styles.reopenButton}>{t.cancel}</button>
                              <button onClick={confirmCloseCase} style={styles.closeButton}>{t.confirmClose}</button>
                            </div>
                          </div>
                        ) : (
                          <div style={styles.inlineActions} className="case-inline-actions">
                            {caseItem.status !== "closed" ? (
                              <>
                                <button onClick={() => openAssignModal(caseItem)} style={styles.assignButton}>
                                  {caseItem.status === "assigned" ? t.reassignVolunteer : t.assignVolunteer}
                                </button>
                                <button onClick={() => beginCloseCase(caseItem.id)} style={styles.closeButton}>{t.closeCase}</button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setLocalFeedbackCopied((p) => { const n = { ...p }; delete n[caseItem.id]; return n; });
                                  handleReopenCase(caseItem.id);
                                }}
                                style={styles.reopenButton}
                              >
                                {t.reopenCase}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ── ASSIGN MODAL ── */}
      {modalState.open && (
        <div style={styles.modalOverlay} onClick={closeAssignModal}>
          <div style={styles.assignModal} className="assign-modal" onClick={(e) => e.stopPropagation()} dir={dir}>
            <div style={styles.modalHeader} className="assign-modal-header">
              <div>
                <h2 style={styles.modalTitle}>{t.assignModalTitle}</h2>
                <p style={styles.modalSubtitle}>{t.assignModalSub}</p>
              </div>
              <button onClick={closeAssignModal} style={styles.iconButton}>×</button>
            </div>

            <div style={styles.assignModalGrid} className="assign-modal-grid">
              <div style={styles.assignLeftPanel}>
                <label style={styles.label}>{t.selectVolunteer}</label>
                <input
                  placeholder={t.searchByName}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={styles.searchInput}
                  className="requests-search-input"
                />
                <div style={styles.userList} className="assign-user-list">
                  {filteredUsersForModal.length === 0 ? (
                    <div style={styles.emptyState}>{t.noUsers}</div>
                  ) : filteredUsersForModal.map((user) => {
                    const score = scoreByUserId[user.id];
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => { setModalState((s) => ({ ...s, userId: user.id })); setUserSearch(user.full_name || user.email); }}
                        style={{ ...styles.userOption, ...(modalState.userId === user.id ? styles.userOptionActive : {}) }}
                      >
                        <div style={styles.userOptionTop}>
                          <strong>{user.full_name || user.email}</strong>
                          {score != null && <span style={styles.scoreBadge}>{t.score} {score}</span>}
                        </div>
                        <span style={styles.userOptionMeta}>{user.phone || t.noPhone} · {user.city || t.noCity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={styles.assignRightPanel}>
                <div style={styles.mapPreviewBox} className="assign-map-box">
                  <div style={styles.mapHeader}>
                    <strong>{t.caseMap}</strong>
                    <span style={styles.mapLegend}>{t.mapLegend}</span>
                  </div>
                  <VolunteerRecommendationMap
                    caseData={currentModalCase}
                    volunteers={modalState.userId
                      ? (recommendations || filteredUsersForModal).filter((v) => v.id === modalState.userId)
                      : recommendations || filteredUsersForModal}
                    selectedVolunteerId={modalState.userId}
                  />
                </div>
              </div>
            </div>

            <div style={styles.assignBottomPanel} className="assign-bottom-panel">
              <div>
                <label style={styles.label}>{t.requiredEquipment}</label>
                <div style={styles.equipmentList}>
                  {PRESET_EQUIPMENT.map((eq) => {
                    const checked = (modalState.selected || []).includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => setModalState((s) => ({
                          ...s,
                          selected: checked
                            ? (s.selected || []).filter((i) => i !== eq)
                            : [...(s.selected || []), eq],
                        }))}
                        style={{ ...styles.equipmentChip, ...(checked ? styles.equipmentChipActive : {}) }}
                      >
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={styles.label}>{t.otherEquipment}</label>
                <input
                  placeholder={t.otherEquipmentPh}
                  value={modalState.other}
                  onChange={(e) => setModalState((s) => ({ ...s, other: e.target.value }))}
                  style={styles.searchInput}
                />
              </div>
              <div>
                <label style={styles.label}>{t.assignmentNotes}</label>
                <textarea
                  placeholder={t.assignmentNotesPh}
                  value={modalState.notes}
                  onChange={(e) => setModalState((s) => ({ ...s, notes: e.target.value }))}
                  rows={2}
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={styles.assignFooterActions}>
              <button onClick={closeAssignModal} style={styles.reopenButton}>{t.cancel}</button>
              <button
                style={styles.modalAssignButton}
                disabled={!modalState.userId || assigning}
                onClick={handleAssignFromModal}
              >
                {assigning ? t.assigning : t.assignBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  page: { minHeight: "100vh", width: "100%", display: "grid", gridTemplateColumns: "200px 1fr", background: "#fffdf8", fontFamily: "Arial, sans-serif" },
  sidebar: { height: "100vh", position: "sticky", top: 0, padding: "28px 20px", background: "#fff8ef", borderRight: "1px solid #f0e5d8", boxSizing: "border-box", display: "flex", flexDirection: "column" },
  brand: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "36px" },
  logo: { width: "50px", height: "50px", objectFit: "contain" },
  brandTitle: { margin: 0, color: "#6a2300", fontSize: "16px", fontWeight: "900" },
  brandSub: { margin: "4px 0 0", color: "#e85d04", fontSize: "13px" },
  nav: { display: "flex", flexDirection: "column", gap: "10px" },
  navItem: { border: "none", background: "transparent", color: "#3d332b", padding: "13px 16px", borderRadius: "14px", textAlign: "left", fontWeight: "800", cursor: "pointer" },
  navItemActive: { background: "#fff1df", color: "#6a2300" },
  sidebarBottom: { marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" },
  langButton: { border: "1px solid #eadfd2", background: "#fffaf4", color: "#2b160c", borderRadius: "10px", padding: "10px", fontWeight: "800", cursor: "pointer", fontSize: "13px" },
  logoutButton: { border: "none", background: "#6a2300", color: "white", borderRadius: "6px", padding: "10px", fontSize: "13px", fontWeight: "800", cursor: "pointer" },
  main: { padding: "20px 18px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "18px" },
  welcomeBanner: { padding: window.innerWidth < 768 ? "10px 14px" : "14px 20px", background: "#fff8ef", borderRadius: "14px", border: "1px solid #f0e5d8" },
  welcomeText: { color: "#3d332b", fontSize: "15px" },
  errorText: { color: "#dc2626", background: "#fee2e2", border: "1px solid #fecaca", padding: "10px 12px", borderRadius: "12px", fontSize: "14px", margin: 0 },
  card: { background: "#ffffff", borderRadius: "22px", padding: window.innerWidth < 768 ? "10px" : "16px", boxShadow: "0 4px 24px rgba(43,22,12,0.05)", border: "1px solid #f2e7dc" },
  sectionTitle: { margin: "0 0 10px", color: "#6a2300", fontSize: "18px", fontWeight: "900" },
  // Top two-column row
  topRow: { display: "flex", gap: "18px", alignItems: "stretch" },
  topLeft: { flex: "0 0 380px", minWidth: 0 },
  topRight: { flex: "1 1 0", minWidth: 0 },
  // Instructions inside send form card
  instructionsBox: { background: "#fffdf8", border: "1px solid #f0e5d8", borderRadius: "12px", padding: "7px" },
  instructionsTitle: { margin: "0 0 4px", fontWeight: "800", fontSize: "13px", color: "#6a2300" },
  instructionsList: { margin: 0, paddingInlineStart: "20px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "#3d332b", lineHeight: "1.2" },
  // Form tracking — scrollable list showing ~5 rows
  trackHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "14px" },
  trackControls: { display: "flex", gap: "8px" , flexDirection: "row"},
  sortSelect: { padding: "7px 10px", borderRadius: "6px", border: "1px solid #eadfd2", background: "#ffffff", color: "#2b160c", fontSize: "13px", fontWeight: "800", cursor: "pointer" },
  trackScrollArea: { overflowY: "auto", overflowX: "auto", maxHeight: window.innerWidth < 768 ? "130px" : "190px", borderRadius: "10px", border: "1px solid #f0e5d8" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: { padding: "8px 10px", color: "#6b625c", fontWeight: "800", borderBottom: "1px solid #f0e5d8", whiteSpace: "nowrap", textAlign: "inherit" },
  td: { padding: "10px 10px", color: "#2b160c", borderBottom: "1px solid #f8f4f0", verticalAlign: "middle", textAlign: "inherit" },
  tr: { transition: "background 0.15s" },
  statusPill: { display: "inline-block", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "800" },
  emptyText: { margin: 0, color: "#7a6658", fontSize: "14px" },
  // Cases
  filters: { display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap",   justifyContent: window.innerWidth < 768 ? "flex-start" : "flex-start" },
  filterButton: { display: "flex", alignItems: "center", gap: "6px", border: "1.5px solid #f3c49a", background: "white", color: "#3d332b", borderRadius: "20px", padding: "7px 14px", fontWeight: "800", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" },
  filterActive: { background: "#fff1df", color: "#e85d04" },
  filterCount: { background: "#f0e5d8", color: "#7a5c44", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: "900" },
  filterCountActive: { background: "#ffd6b0", color: "#a83600" },
  toolbar: { marginBottom: "14px" },
  searchInput: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "12px", border: "1px solid #eadfd2", background: "#fffdf8", fontSize: "14px", color: "#2b160c" },
  emptyState: { padding: "24px", textAlign: "center", background: "#fffdf8", color: "#6b625c", fontSize: "14px" },
  casesList: { background: "white", border: "1px solid #eee2d8", borderRadius: "16px", overflow: "hidden" },
  desktopHeader: { display: "grid", gridTemplateColumns: "1.8fr 1.1fr 1.3fr 0.9fr 1.2fr 0.9fr 32px", alignItems: "center", padding: "12px 16px", fontWeight: "900", background: "#fff8ef", borderBottom: "1px solid #eadfd2", fontSize: "12px", color: "#51443a" },
  thCell: { textAlign: "center", cursor: "pointer", userSelect: "none" },
  accordionCard: { borderBottom: "1px solid #eadfd2" },
  rowTrigger: { width: "100%", border: "none", background: "transparent", cursor: "pointer", padding: "14px 16px", display: "grid", gridTemplateColumns: "1.8fr 1.1fr 1.3fr 0.9fr 1.2fr 0.9fr 32px", alignItems: "center", gap: "8px", textAlign: "inherit" },
  colName: { color: "#2b160c", fontWeight: "700", textTransform: "capitalize", fontSize: "14px", textAlign: "center" },
  colMeta: { color: "#2b160c", fontSize: "13px", textAlign: "center" },
  colAssigned: { color: "#2b160c", fontSize: "12px", textAlign: "center", fontWeight: "600" },
  accordionBody: { borderTop: "1px solid #eadfd2", padding: "14px 16px" },
  detailTableWrapper: { marginBottom: "16px" },
  dtHead: { display: "grid", background: "#f7f7f6" },
  dtHeadCell: { padding: "8px 12px", textAlign: "center", fontSize: "11px", color: "#9a9a9a", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", borderRight: "1px solid #efefef" },
  dtRow: { display: "grid", background: "#fff" },
  dtCell: { padding: "10px 12px", textAlign: "center", fontSize: "13px", color: "#2b160c", fontWeight: "600", borderRight: "1px solid #f3f3f3" },
  inlineSelect: { padding: "5px 7px", borderRadius: "8px", border: "1px solid #eadfd2", background: "white", fontWeight: "700", fontSize: "13px", color: "#2b160c" },
  inlineActions: { marginTop: "14px", display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" },
  closeCasePicker: { marginTop: "16px", padding: "14px", borderRadius: "14px", background: "#fff3e0", border: "1px solid #ffcc80", display: "flex", flexDirection: "column", gap: "8px" },
  badge: { padding: "4px 10px", borderRadius: "6px", fontWeight: "900", fontSize: "12px", textTransform: "capitalize", whiteSpace: "nowrap" },
  openBadge: { background: "#fff3e6", color: "#d95f00" },
  assignedBadge: { background: "#eef8ef", color: "#16803d" },
  closedBadge: { background: "#f3f4f6", color: "#374151" },
  feedbackReceived: { color: "#16803d", fontWeight: "800", fontSize: "12px", whiteSpace: "nowrap" },
  feedbackCopiedBtn: { border: "1px solid #b7dfc0", background: "#eef8ef", color: "#16803d", borderRadius: "6px", padding: "4px 8px", fontWeight: "800", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" },
  feedbackSendBtn: { border: "1px solid #f3c49a", background: "#fff8ef", color: "#d95f00", borderRadius: "6px", padding: "4px 8px", fontWeight: "800", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" },
  assignButton: { border: "1px solid #f3c49a", background: "#fff8ef", color: "#d95f00", borderRadius: "6px", padding: "7px 11px", fontWeight: "800", cursor: "pointer" },
  closeButton: { border: "1px solid #e0c4b8", background: "white", color: "#7a2e1a", borderRadius: "6px", padding: "7px 11px", fontWeight: "800", cursor: "pointer" },
  reopenButton: { border: "1px solid #d9c2b8", background: "white", color: "#6a2300", borderRadius: "4px", padding: "5px 9px", fontSize: "13px", fontWeight: "800", cursor: "pointer" },
  label: { display: "block", margin: "10px 0 5px", color: "#2b160c", fontWeight: "800", fontSize: "13px" },
  textarea: { width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: "12px", border: "1px solid #eadfd2", background: "#fffdf8", fontSize: "13px", minHeight: "38px", maxHeight: "50px", resize: "none", color: "#2b160c" },
  // Modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" },
  assignModal: { width: "90vw", maxWidth: "900px", maxHeight: "85vh", overflowY: "auto", background: "white", borderRadius: "14px", padding: "18px 22px 20px", border: "1px solid #f0e5d8" },
  modalHeader: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "12px" },
  modalTitle: { margin: 0, color: "#6a2300", fontSize: "19px", fontWeight: "900" },
  modalSubtitle: { margin: "4px 0 0", color: "#6b625c", fontSize: "14px" },
  iconButton: { border: "none", background: "transparent", color: "#9a8f86", borderRadius: "6px", width: "30px", height: "30px", fontSize: "20px", cursor: "pointer", flexShrink: 0 },
  assignModalGrid: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px", height: "300px", marginBottom: "16px" },
  assignLeftPanel: { minHeight: 0, overflow: "hidden" },
  assignRightPanel: { minHeight: 0, overflow: "hidden" },
  assignBottomPanel: { marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", alignItems: "start" },
  assignFooterActions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f0e5d8" },
  modalAssignButton: { border: "none", background: "#6a2300", color: "white", borderRadius: "6px", padding: "9px 18px", fontWeight: "800", cursor: "pointer" },
  userList: { height: "220px", overflowY: "auto", border: "1px solid #eadfd2", borderRadius: "12px", marginTop: "8px" },
  userOption: { width: "100%", textAlign: "left", padding: "10px 12px", border: "none", borderBottom: "1px solid #f1ebe5", background: "white", cursor: "pointer", display: "flex", flexDirection: "column", gap: "3px", color: "#2b160c" },
  userOptionActive: { background: "#fff1df" },
  userOptionTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" },
  userOptionMeta: { fontSize: "12px", color: "#6b625c" },
  scoreBadge: { fontSize: "11px", fontWeight: "800", color: "#6a2300", background: "#fff1df", padding: "2px 8px", borderRadius: "6px", whiteSpace: "nowrap" },
  equipmentList: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" },
  equipmentChip: { border: "1px solid #e0c9b8", background: "white", color: "#51443a", borderRadius: "6px", padding: "6px 12px", fontWeight: "700", fontSize: "13px", cursor: "pointer" },
  equipmentChipActive: { background: "#fff1df", color: "#6a2300", borderColor: "#6a2300" },
  mapPreviewBox: { border: "1px solid #d6ead8", borderRadius: "12px", overflow: "hidden", background: "white", height: "100%" },
  mapHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fcf8", borderBottom: "1px solid #e6efe7" },
  mapLegend: { fontSize: "12px", color: "#6b7280" },
};