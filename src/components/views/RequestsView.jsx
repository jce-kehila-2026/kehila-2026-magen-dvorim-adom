// RequestsView — unified page for פניות (Requests)
import "./RequestsView.css";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/logo.png";
import VolunteerRecommendationMap from "./VolunteerRecommendationMap";
import CoordinatorSendForm from "../../pages/CoordinatorSendForm";
import { useState, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { USER_ROLES } from "../../services/userSchema";

const T = {
  en: {
    requests: "Requests", users: "Users", reports: "Reports",
    backup: "Backup", profile: "Profile", logout: "Logout",
    langToggle: "עברית 🌐",
    welcome: "Welcome",
    sendFormTitle: "Send Intake Form",
    instructionsTitle: "How to send a form",
    step1: "Enter the requester's phone number.",
    step2: "Click \"Create Form\" — this logs the request.",
    step3: "Click \"Copy Link\" to copy the form URL.",
    step4: "Send the link to the requester via WhatsApp or SMS.",
    trackTitle: "Form Tracking",
    newest: "Newest first", oldest: "Oldest first",
    all: "All", sent: "Sent", returned: "Returned", expired: "Expired",
    date: "Date", phone: "Phone", coordinator: "Coordinator",
    formStatus: "Status", noForms: "No forms sent yet.",
    casesTitle: "Cases",
    open: "Open", assigned: "Assigned", closed: "Closed",
    myCases: "Assigned to me",
    name: "Requester's name", openedCol: "Opened ", statusCol: "Status",
    assignedTo: "Assigned to", feedback: "Feedback",
    city: "City", street: "Street", coordinator2: "Coordinator",
    complexity: "Complexity", closedAt: "Closed at",
    result: "Result", closingNotes: "Closing notes",
    description: "Requester notes",
    assignedVols: "Assigned volunteer(s)",
    notes: "Notes", feedbackLink: "Feedback link",
    assignVolunteer: "Assign Volunteer", reassignVolunteer: "Reassign Volunteer",
    closeCase: "Close Case", reopenCase: "Reopen Case",
    confirmClose: "Confirm Close", cancel: "Cancel",
    selectResult: "Select a finishing result",
    closingNotesOpt: "Closing notes (optional)",
    copyFeedbackLink: "Copy feedback link",
    sent2: "Sent ", received: "Received ",
    feedbackNotYet: "Feedback not yet received.",
    copyAgain: "Copy again",
    closedFeedbackNote: "Copy and send the feedback link to the requester.",
    noDescription: "No description provided.",
    noClosingNotes: "No closing notes.",
    noNotes: "No notes.",
    noMatch: "No cases match this view.",
    search: "Search by name, phone, city, status…",
    closedTabNote: "After closing a case, copy and send the feedback link to the requester so they can rate the service.",
    assignModalTitle: "Case Details",
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
    reassignBtn: "Reassign volunteer",
    caseMap: "Volunteer map",
    mapLegend: "📍 Case • 🟢 Volunteers",
    score: "Score",
    noPhone: "No phone", noCity: "No city",
    simple: "Simple", complex: "Complex", veryComplex: "Very Complex",
    complexityWarning: " Set complexity before assigning a volunteer.",
    experience: "Experience", occupation: "Occupation",
    heightLicense: "Height work license", equipment2: "Equipment",
    available: "Available", unavailable: "Unavailable",
    totalRescues: "Total rescues",
    loading: "Loading...",
    closedBy: "Closed by",
    adminRating: "Admin rating", evacuationRating: "Evacuation rating",
    yes: "Yes", no: "No",
    beginner: "Beginner", intermediate: "Intermediate", experienced: "Experienced",
    protectiveSuit: "Protective suit", beeBox: "Bee box",
    ladder: "Ladder", smoker: "Smoker",
    caseDetails: "Case Details",
    closingInfo: "Closing Information",
    feedbackSection: "Feedback",
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
    open: "פתוח", assigned: "משויך", closed: "סגור",
    myCases: "מוקצה לי",
    name: "שם הפונה", openedCol: "נפתח ↕", statusCol: "סטטוס",
    assignedTo: "מוקצה ל", feedback: "משוב",
    city: "עיר", street: "רחוב", coordinator2: "רכז",
    complexity: "מורכבות", closedAt: "נסגר ב",
    result: "תוצאה", closingNotes: "הערות סגירה",
    description: "הערות מבקש",
    assignedVols: "מתנדב/ים משויך/ים",
    notes: "הערות", feedbackLink: "קישור משוב",
    assignVolunteer: "שייך מתנדב", reassignVolunteer: "שייך מחדש",
    closeCase: "סגור מקרה", reopenCase: "פתח מחדש",
    confirmClose: "אשר סגירה", cancel: "ביטול",
    selectResult: "בחר תוצאת סיום",
    closingNotesOpt: "הערות סגירה (אופציונלי)",
    copyFeedbackLink: "העתק קישור משוב",
    sent2: "נשלח ", received: "התקבל ",
    feedbackNotYet: "משוב טרם התקבל.",
    copyAgain: "העתק שוב",
    closedFeedbackNote: "העתק ושלח את קישור המשוב לפונה.",
    noDescription: "לא סופק תיאור.",
    noClosingNotes: "אין הערות סגירה.",
    noNotes: "אין הערות.",
    noMatch: "אין מקרים התואמים לתצוגה זו.",
    search: "חיפוש לפי שם, טלפון, עיר, סטטוס…",
    closedTabNote: "לאחר סגירת מקרה, העתק ושלח את קישור המשוב לפונה לדירוג השירות.",
    assignModalTitle: "פרטי מקרה",
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
    reassignBtn: "שייך מחדש",
    caseMap: "מפת מתנדבים",
    mapLegend: "📍 מקרה • 🟢 מתנדבים",
    score: "ניקוד",
    noPhone: "אין טלפון", noCity: "אין עיר",
    simple: "פשוט", complex: "מורכב", veryComplex: "מורכב מאוד",
    complexityWarning: " יש לקבוע מורכבות לפני שיוך מתנדב.",
    experience: "ניסיון", occupation: "עיסוק",
    heightLicense: "רישיון עבודה בגובה", equipment2: "ציוד",
    available: "זמין", unavailable: "לא זמין",
    totalRescues: "סה״כ חילוצים",
    loading: "טוען...",
    closedBy: "נסגר על ידי",
    adminRating: "דירוג מנהלתי", evacuationRating: "דירוג פינוי",
    yes: "כן", no: "לא",
    beginner: "מתחיל", intermediate: "בינוני", experienced: "מנוסה",
    protectiveSuit: "חליפת הגנה", beeBox: "כוורת",
    ladder: "סולם", smoker: "מעשן",
    caseDetails: "פרטי מקרה",
    closingInfo: "מידע סגירה",
    feedbackSection: "משוב",
  },
};

function formStatusLabel(status, t) {
  if (status === "submitted") return t.returned;
  if (status === "sent" || status === "waiting") return t.sent;
  if (status === "expired") return t.expired;
  return "—";
}
function formStatusColor(status) {
  if (status === "sent" || status === "waiting") return { bg: "#fff1df", color: "#c2410c" };
  if (status === "submitted") return { bg: "#dcfce7", color: "#15803d" };
  if (status === "expired") return { bg: "#fee2e2", color: "#b42318" };
  return { bg: "#f1f5f9", color: "#475569" };
}
function cleanDate(value) {
  if (!value) return "—";
  return new Date(value.seconds ? value.seconds * 1000 : value).toLocaleDateString("en-GB");
}
function translateStatus(s, t) {
  if (s === "open") return t.open;
  if (s === "assigned") return t.assigned;
  if (s === "closed") return t.closed;
  return s;
}
function translateExperience(level, t) {
  if (level === "beginner") return t.beginner;
  if (level === "intermediate") return t.intermediate;
  if (level === "experienced") return t.experienced;
  return level || "—";
}

export default function RequestsView({
  userProfile,
  currentUserRole,
  currentUserName,
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
  intakeForms = [],
  coordinatorNames = {},
  formSortDir,
  setFormSortDir,
  formStatusFilter,
  setFormStatusFilter,
  onFormCreated,
  shouldCloseDrawer,
  onDrawerClosed,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [focusState] = useState(() => location.state || {});
  const focusCaseId = focusState.focusCaseId || null;
  const hasAutoOpenedFocusRef = useRef(false);
  const casesRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localFeedbackCopied, setLocalFeedbackCopied] = useState({});
  const [drawerCase, setDrawerCase] = useState(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");
  const [assignClickToken, setAssignClickToken] = useState(0);
  const { language, setLanguage } = useLanguage();
  const isHe = language === "he";
  const t = T[language] || T.en;
  const dir = isHe ? "rtl" : "ltr";
  const isAdmin = currentUserRole === USER_ROLES?.ADMIN || currentUserRole === "admin";
  const isCoordinator = currentUserRole === USER_ROLES?.COORDINATOR || currentUserRole === "coordinator";

  const goTo = (path) => { setMobileMenuOpen(false); navigate(path); };

  // Close drawer when parent signals a successful assignment
  useEffect(() => {
    if (shouldCloseDrawer && drawerCase) {
      closeDrawer();
      onDrawerClosed?.();
    }
  }, [shouldCloseDrawer]);

  // Fire assignment after modalState is committed
  useEffect(() => {
    if (assignClickToken > 0) handleAssignFromModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignClickToken]);

  // Close drawer on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Keep drawerCase in sync when the live case data updates underneath it
  useEffect(() => {
    if (!drawerCase) return;
    const fresh = cases.find((c) => c.id === drawerCase.id);
    if (fresh) setDrawerCase(fresh);
  }, [cases]);

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

  const getStatusBadgeStyle = (s) => ({
    ...styles.badge,
    ...(s === "assigned" ? styles.assignedBadge : s === "closed" ? styles.closedBadge : styles.openBadge),
  });

  const scoreByUserId = (recommendations || []).reduce((acc, v) => {
    acc[v.id] = v.recommendationScore; return acc;
  }, {});

  const sortedVolunteers = useMemo(() => {
    return [...filteredUsersForModal].sort((a, b) =>
      (scoreByUserId[b.id] ?? -1) - (scoreByUserId[a.id] ?? -1)
    );
  }, [filteredUsersForModal, recommendations]);

  const getAssignedNames = (caseItem) => {
    const a = assignments[caseItem.id] || [];
    if (!a.length) return null;
    return a.map((x) => {
      const u = usersById[x.user_id];
      return x.volunteer_name || x.full_name || x.user_name || u?.full_name || u?.email || "Volunteer";
    }).join(", ");
  };

  const openDrawer = (caseItem) => {
    setDrawerCase(caseItem);
    setSelectedVolunteerId("");
    handleGetRecommendations(caseItem);
    document.body.style.overflow = "hidden";
  };

  const closeDrawer = () => {
    setDrawerCase(null);
    setSelectedVolunteerId("");
    cancelCloseCase();
    document.body.style.overflow = "";
  };

  // Clear nav state on mount
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-open drawer when arriving from Reports page
  useEffect(() => {
    if (!focusCaseId || hasAutoOpenedFocusRef.current) return;
    const match = cases.find((c) => c.id === focusCaseId);
    if (!match) return;
    hasAutoOpenedFocusRef.current = true;
    setActiveFilter("all");
    openDrawer(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCaseId, cases]);

  const handleSendFeedbackOptimistic = (caseItem) => {
    setLocalFeedbackCopied((p) => ({ ...p, [caseItem.id]: true }));
    handleSendFeedback(caseItem);
  };

  const handleFormRowClick = (form) => {
    if (form.status !== "submitted") return;
    const phone = form.requester_phone;
    const matchingCases = cases
      .filter((c) => c.requester_phone === phone)
      .sort((a, b) => {
        const aTime = a.opened_at?.toDate ? a.opened_at.toDate().getTime() : new Date(a.opened_at || 0).getTime();
        const bTime = b.opened_at?.toDate ? b.opened_at.toDate().getTime() : new Date(b.opened_at || 0).getTime();
        return bTime - aTime;
      });
    const match = matchingCases[0];
    if (!match) return;
    setActiveFilter("all");
    openDrawer(match);
    setTimeout(() => {
      casesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const selectedUser = sortedVolunteers.find((u) => u.id === selectedVolunteerId);
  const drawerFeedback = drawerCase ? feedbackByCase[drawerCase.id] : null;
  const drawerAssignedNames = drawerCase ? getAssignedNames(drawerCase) : null;

  const canSeeReports =
    currentUserRole === USER_ROLES.ADMIN ||
    currentUserRole === USER_ROLES.COORDINATOR;

  return (
    <div style={styles.page} className="requests-page">
      <button type="button" className="requests-mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>

      {mobileMenuOpen && (
        <>
          <div className="requests-mobile-backdrop" />
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998, background: "transparent" }} />
        </>
      )}

      {/* ── SIDEBAR ── */}
      <aside style={styles.sidebar} className={`requests-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{currentUserName || "User"}</p>
          </div>
        </div>
        <nav style={styles.nav}>
          <button style={{ ...styles.navItem, ...styles.navItemActive }}>{t.requests}</button>
          <button style={styles.navItem} onClick={() => goTo("/users")}>{t.users}</button>
          {canSeeReports && <button style={styles.navItem} onClick={() => goTo("/reports")}>{t.reports}</button>}
          {isAdmin && <button style={styles.navItem} onClick={() => goTo("/backup")}>{t.backup}</button>}
          <button style={styles.navItem} onClick={() => goTo("/profile")}>{t.profile}</button>
        </nav>
        <div style={styles.sidebarBottom}>
          <button style={styles.langButton} onClick={() => setLanguage(isHe ? "en" : "he")}>{t.langToggle}</button>
          <button style={styles.logoutButton} onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>{t.logout}</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={styles.main} className="requests-main" dir={dir}>

        <div style={{ ...styles.welcomeBanner, textAlign: isHe ? "right" : "left" }}>
          <span style={styles.welcomeText}>{t.welcome}, <strong>{currentUserName}</strong></span>
        </div>

        {error && <p style={styles.errorText}>{error}</p>}

        {/* ── TOP ROW ── */}
        <div style={{ ...styles.topRow, flexDirection: isHe ? "row-reverse" : "row" }} className="requests-top-row">

          <div style={styles.topLeft} className="requests-top-left">
            <section style={styles.card} className="requests-card">
              <h2 style={{ ...styles.sectionTitle, textAlign: isHe ? "right" : "left" }}>{t.sendFormTitle}</h2>
              <CoordinatorSendForm onFormCreated={onFormCreated} />
              <div style={{ ...styles.instructionsBox, textAlign: isHe ? "right" : "left", marginTop: "10px" }}>
                <p style={styles.instructionsTitle}>{t.instructionsTitle}</p>
                <ol style={styles.instructionsList}>
                  <li>{t.step1}</li><li>{t.step2}</li><li>{t.step3}</li><li>{t.step4}</li>
                </ol>
              </div>
            </section>
          </div>

          {/* Form Tracking */}
          <div style={styles.topRight} className="requests-top-right">
            <section style={{ ...styles.card, height: "100%", boxSizing: "border-box" }} className="requests-card">
              <div style={{ ...styles.trackHeader, flexDirection: "row" }}>
                <h2 style={{ ...styles.sectionTitle, margin: 0, textAlign: isHe ? "right" : "left" }}>{t.trackTitle}</h2>
                <div style={styles.trackControls}>
                  <select style={styles.sortSelect} value={formSortDir} onChange={(e) => setFormSortDir(e.target.value)}>
                    <option value="desc">{t.newest}</option>
                    <option value="asc">{t.oldest}</option>
                  </select>
                  <select style={styles.sortSelect} value={formStatusFilter} onChange={(e) => setFormStatusFilter(e.target.value)}>
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
                        const isReturned = form.status === "submitted";
                        return (
                          <tr
                            key={form.id}
                            style={{ ...styles.tr, cursor: isReturned ? "pointer" : "default" }}
                            onClick={() => isReturned && handleFormRowClick(form)}
                            title={isReturned ? (isHe ? "לחץ לפתיחת המקרה" : "Click to open case") : undefined}
                          >
                            <td style={styles.td}>{cleanDate(form.sent_at)}</td>
                            <td style={styles.td}>{form.requester_phone || "—"}</td>
                            {isAdmin && <td style={styles.td}>{coordinatorNames[form.coordinator_id] || "—"}</td>}
                            <td style={styles.td}>
                              <span style={{
                                ...styles.statusPill,
                                background: sc.bg,
                                color: sc.color,
                                ...(isReturned ? { textDecoration: "underline", textDecorationStyle: "dotted" } : {}),
                              }}>
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
        <section ref={casesRef} style={styles.card} className="requests-card">
          <h2 style={{ ...styles.sectionTitle, textAlign: isHe ? "right" : "left" }}>{t.casesTitle}</h2>

          <div style={{ ...styles.filters, flexDirection: isHe ? "row-reverse" : "row", justifyContent: isHe ? "flex-end" : "flex-start" }} className="requests-filters">
            {(isHe
              ? [
                  { key: "all", label: t.all, count: cases.length },
                  { key: "open", label: t.open, count: openCaseCount },
                  { key: "assigned", label: t.assigned, count: assignedCaseCount },
                  { key: "closed", label: t.closed, count: closedCases.length },
                  { key: "my", label: t.myCases, count: myCasesCount },
                ].reverse()
              : [
                  { key: "all", label: t.all, count: cases.length },
                  { key: "open", label: t.open, count: openCaseCount },
                  { key: "assigned", label: t.assigned, count: assignedCaseCount },
                  { key: "closed", label: t.closed, count: closedCases.length },
                  { key: "my", label: t.myCases, count: myCasesCount },
                ]
            ).map(({ key, label, count }) => (
              <button key={key} onClick={() => setActiveFilter(key)}
                style={{ ...styles.filterButton, ...(activeFilter === key ? styles.filterActive : {}) }}>
                {label}
                <span style={{ ...styles.filterCount, ...(activeFilter === key ? styles.filterCountActive : {}) }}>{count}</span>
              </button>
            ))}
          </div>

          {activeFilter === "closed" && (
            <div style={{ ...styles.closedNote, textAlign: isHe ? "right" : "left" }}>
              ℹ️ {t.closedTabNote}
            </div>
          )}

          <div style={styles.toolbar}>
            <input placeholder={t.search} value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)}
              style={{ ...styles.searchInput, textAlign: isHe ? "right" : "left" }} className="requests-search-input" />
          </div>

          {activeCases.length === 0 ? (
            <div style={styles.emptyState}>{t.noMatch}</div>
          ) : (
            <div style={styles.casesList}>
              <div style={styles.desktopHeader} className="requests-desktop-header" dir={dir}>
                <span onClick={() => handleSortClick("name")} style={styles.thCell}>
                  {t.name} {sortColumn === "name" ? (sortDirection === "asc" ? "↑" : "↓") : <span style={styles.sortHint}>↕</span>}
                </span>
                <span onClick={() => handleSortClick("phone")} style={styles.thCell}>
                  {t.phone} {sortColumn === "phone" ? (sortDirection === "asc" ? "↑" : "↓") : <span style={styles.sortHint}>↕</span>}
                </span>
                <span onClick={() => handleSortClick("opened_at")} style={styles.thCell}>
                  {t.openedCol} {sortColumn === "opened_at" ? (sortDirection === "asc" ? "↑" : "↓") : <span style={styles.sortHint}>↕</span>}
                </span>
                <span style={{ ...styles.thCell, cursor: "default" }}>{t.statusCol}</span>
                <span style={{ ...styles.thCell, cursor: "default" }}>{t.assignedTo}</span>
                <span style={{ ...styles.thCell, cursor: "default" }}>{t.feedback}</span>
              </div>

              {activeCases.map((caseItem) => {
                const assignedNames = getAssignedNames(caseItem);
                const feedbackSubmitted = caseItem.feedback_submitted;
                const feedbackCopied = localFeedbackCopied[caseItem.id] || !!caseItem.feedback_token;
                return (
                  <div key={caseItem.id} style={{ ...styles.caseRow, background: "#fff" }} dir={dir}>
                    <div className="case-row-trigger" onClick={() => openDrawer(caseItem)} style={styles.rowTrigger}>
                      <span className="col-name" style={styles.colName}>
                        {caseItem.requester_first_name} {caseItem.requester_last_name}
                      </span>
                      <span className="col-phone" style={styles.colMeta}>{caseItem.requester_phone || "—"}</span>
                      <span className="col-date" style={styles.colMeta}>{formatDate(caseItem.opened_at)}</span>
                      <span className="col-status" style={{ display: "flex", justifyContent: "center" }}>
                        <span style={getStatusBadgeStyle(caseItem.status)}>{translateStatus(caseItem.status, t)}</span>
                      </span>
                      <span className="col-assigned" style={styles.colAssigned}>
                        {assignedNames || <span style={{ color: "#aaa" }}>—</span>}
                      </span>
                      <span className="col-feedback" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        {caseItem.status !== "closed" ? (
                          <span style={{ color: "#ccc", fontSize: "12px" }}>—</span>
                        ) : feedbackSubmitted ? (
                          <span style={styles.feedbackReceived}>{t.received}</span>
                        ) : feedbackCopied ? (
                          <button onClick={(e) => { e.stopPropagation(); handleSendFeedbackOptimistic(caseItem); }}
                            style={styles.feedbackSentBtn}>{t.sent2}</button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); handleSendFeedbackOptimistic(caseItem); }}
                            style={styles.feedbackCopyBtn}>{t.copyFeedbackLink}</button>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ── CASE DETAIL DRAWER ── */}
      {drawerCase && (
        <>
          <div className="drawer-overlay" onClick={closeDrawer} />
          <div className={`case-drawer ${isHe ? "drawer-left" : "drawer-right"}`} dir={dir}>

            <div style={styles.drawerHeader}>
              <div>
                <h2 style={styles.drawerTitle}>
                  {drawerCase.requester_first_name} {drawerCase.requester_last_name}
                </h2>
                <span style={getStatusBadgeStyle(drawerCase.status)}>{translateStatus(drawerCase.status, t)}</span>
              </div>
              <button onClick={closeDrawer} style={styles.drawerClose}>×</button>
            </div>

            <div style={styles.drawerBody}>

              <div style={styles.drawerSection}>
                <p style={styles.drawerSectionLabel}>{t.caseDetails}</p>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>{t.phone}</span>
                    <span style={styles.detailValue}>{drawerCase.requester_phone || "—"}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>{t.city}</span>
                    <span style={styles.detailValue}>{drawerCase.city || "—"}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>{t.street}</span>
                    <span style={styles.detailValue}>{drawerCase.street || "—"} {drawerCase.house_number || ""}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>{t.openedCol.replace(" ↕", "")}</span>
                    <span style={styles.detailValue}>{formatDate(drawerCase.opened_at)}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>{t.coordinator2}</span>
                    <span style={styles.detailValue}>
                      {isAdmin && (drawerCase.status === "open" || drawerCase.status === "assigned") ? (
                        <select value={drawerCase.coordinator_id || ""} onChange={(e) => handleChangeCoordinator(drawerCase.id, e.target.value)} style={styles.inlineSelect}>
                          {coordinatorOptions.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                        </select>
                      ) : (
                        usersById[drawerCase.coordinator_id]?.full_name || usersById[drawerCase.coordinator_id]?.email || "—"
                      )}
                    </span>
                  </div>
                  {drawerAssignedNames && (
                    <div style={{ ...styles.detailItem, gridColumn: "1 / -1" }}>
                      <span style={styles.detailLabel}>{t.assignedVols}</span>
                      <span style={{ ...styles.detailValue, color: "#16803d", fontWeight: "700" }}>👤 {drawerAssignedNames}</span>
                    </div>
                  )}
                  {drawerCase.location_description && (
                    <div style={{ ...styles.detailItem, gridColumn: "1 / -1" }}>
                      <span style={styles.detailLabel}>{t.description}</span>
                      <span style={styles.detailValue}>{drawerCase.location_description}</span>
                    </div>
                  )}
                </div>
              </div>

              {drawerCase.status !== "closed" && (
                <>
                  <div style={styles.drawerSection}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div>
                        <p style={styles.drawerSectionLabel}>{t.complexity}</p>
                        <select
                          value={drawerCase.case_complexity || "simple"}
                          onChange={(e) => {
                            handleChangeComplexity(drawerCase.id, e.target.value);
                            setDrawerCase((prev) => ({ ...prev, case_complexity: e.target.value }));
                          }}
                          style={styles.complexitySelect}
                        >
                          <option value="simple">{t.simple}</option>
                          <option value="complex">{t.complex}</option>
                          <option value="very_complex">{t.veryComplex}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={styles.drawerSection}>
                    <p style={styles.drawerSectionLabel}>
                      {drawerCase.status === "assigned" ? t.reassignVolunteer : t.assignVolunteer}
                    </p>

                    <div style={styles.assignGrid} className="drawer-assign-grid">
                      <div style={styles.assignListCol}>
                        <input
                          placeholder={t.searchByName}
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          style={{ ...styles.searchInput, marginBottom: "8px" }}
                          className="requests-search-input"
                        />
                        <div style={styles.volunteerList}>
                          {sortedVolunteers.length === 0 ? (
                            <div style={styles.emptyState}>{t.noUsers}</div>
                          ) : sortedVolunteers.map((user) => {
                            const score = scoreByUserId[user.id];
                            const isSelected = selectedVolunteerId === user.id;
                            return (
                              <button key={user.id} type="button"
                                onClick={() => setSelectedVolunteerId(isSelected ? "" : user.id)}
                                style={{ ...styles.volunteerBtn, ...(isSelected ? styles.volunteerBtnActive : {}) }}>
                                <div style={styles.volunteerBtnTop}>
                                  <strong style={{ fontSize: "13px" }}>{user.full_name || user.email}</strong>
                                  {score != null && <span style={styles.scoreBadge}>{t.score} {score ?? "--"} / 74</span>}
                                </div>
                                <span style={styles.volunteerBtnMeta}>{user.phone || t.noPhone} · {user.city || t.noCity}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div style={styles.assignMapCol} className="drawer-map-col">
                        <div style={styles.mapBox}>
                          <div style={styles.mapHeader}>
                            <strong style={{ fontSize: "12px" }}>{t.caseMap}</strong>
                            <span style={styles.mapLegend}>{t.mapLegend}</span>
                          </div>
                          <VolunteerRecommendationMap
                            caseData={drawerCase}
                            volunteers={selectedVolunteerId
                              ? (recommendations || sortedVolunteers).filter((v) => v.id === selectedVolunteerId)
                              : recommendations || sortedVolunteers}
                            selectedVolunteerId={selectedVolunteerId}
                          />
                        </div>
                      </div>
                    </div>

                    {selectedUser && (
                      <div style={styles.volunteerCard}>
                        <div style={styles.volunteerCardHeader}>
                          <div>
                            <strong style={{ fontSize: "15px", color: "#2b160c" }}>{selectedUser.full_name || selectedUser.email}</strong>
                            <span style={{ ...styles.availBadge, background: selectedUser.is_available ? "#dcfce7" : "#fee2e2", color: selectedUser.is_available ? "#15803d" : "#b42318" }}>
                              {selectedUser.is_available ? t.available : t.unavailable}
                            </span>
                          </div>
                        </div>
                        <div style={styles.volunteerCardGrid}>
                          <div style={styles.vcItem}><span style={styles.vcLabel}>{t.phone}</span><span>{selectedUser.phone || "—"}</span></div>
                          <div style={styles.vcItem}><span style={styles.vcLabel}>{t.city}</span><span>{selectedUser.city || "—"}</span></div>
                          <div style={styles.vcItem}><span style={styles.vcLabel}>{t.occupation}</span><span>{selectedUser.occupation || "—"}</span></div>
                          <div style={styles.vcItem}><span style={styles.vcLabel}>{t.experience}</span><span>{translateExperience(selectedUser.experience_level, t)}</span></div>
                          <div style={styles.vcItem}><span style={styles.vcLabel}>{t.heightLicense}</span><span>{selectedUser.licenses?.height_work ? t.yes : t.no}</span></div>
                        </div>
                      </div>
                    )}

                    {selectedVolunteerId && (
                      <div style={styles.assignFooter}>
                        <div>
                          <label style={styles.label}>{t.requiredEquipment}</label>
                          <div style={styles.equipmentList}>
                            {PRESET_EQUIPMENT.map((eq) => {
                              const checked = (modalState.selected || []).includes(eq);
                              return (
                                <button key={eq} type="button"
                                  onClick={() => setModalState((s) => ({
                                    ...s,
                                    selected: checked ? (s.selected || []).filter((i) => i !== eq) : [...(s.selected || []), eq],
                                  }))}
                                  style={{ ...styles.equipChip, ...(checked ? styles.equipChipActive : {}) }}>
                                  {eq}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div style={styles.assignFooterRow}>
                          <div style={{ flex: 1 }}>
                            <label style={styles.label}>{t.otherEquipment}</label>
                            <input placeholder={t.otherEquipmentPh} value={modalState.other}
                              onChange={(e) => setModalState((s) => ({ ...s, other: e.target.value }))}
                              style={styles.searchInput} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={styles.label}>{t.assignmentNotes}</label>
                            <input placeholder={t.assignmentNotesPh} value={modalState.notes}
                              onChange={(e) => setModalState((s) => ({ ...s, notes: e.target.value }))}
                              style={styles.searchInput} />
                          </div>
                        </div>
                        <button
                          style={{ ...styles.assignConfirmBtn, opacity: assigning ? 0.7 : 1 }}
                          disabled={assigning}
                          onClick={() => {
                            setModalState((s) => ({ ...s, open: true, caseId: drawerCase.id, userId: selectedVolunteerId }));
                            setAssignClickToken((c) => c + 1);
                          }}
                        >
                          {assigning ? t.assigning : drawerCase.status === "assigned" ? t.reassignBtn : t.assignBtn}
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={styles.drawerSection}>
                    {closingCase.caseId === drawerCase.id ? (
                      <div style={styles.closePicker}>
                        <label style={styles.label}>{t.selectResult}</label>
                        <select value={closingCase.result_status}
                          onChange={(e) => setClosingCase((p) => ({ ...p, result_status: e.target.value }))}
                          style={styles.inlineSelect}>
                          {FINISHING_STATUSES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <label style={styles.label}>{t.closingNotesOpt}</label>
                        <textarea rows={2} value={closingCase.notes}
                          onChange={(e) => setClosingCase((p) => ({ ...p, notes: e.target.value }))}
                          style={styles.textarea} />
                        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                          <button onClick={cancelCloseCase} style={styles.secondaryBtn}>{t.cancel}</button>
                          <button onClick={async () => { await confirmCloseCase(); closeDrawer(); }} style={styles.dangerBtn}>{t.confirmClose}</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => beginCloseCase(drawerCase.id)} style={styles.dangerBtn}>{t.closeCase}</button>
                    )}
                  </div>
                </>
              )}

              {drawerCase.status === "closed" && (
                <>
                  <div style={styles.drawerSection}>
                    <p style={styles.drawerSectionLabel}>{t.closingInfo}</p>
                    <div style={styles.detailGrid}>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>{t.closedAt}</span>
                        <span style={styles.detailValue}>{cleanDate(drawerCase.closed_at)}</span>
                      </div>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>{t.result}</span>
                        <span style={styles.detailValue}>{getResultLabel(drawerCase.result_status)}</span>
                      </div>
                      {(drawerCase.result_notes || drawerCase.closed_by?.full_name || drawerCase.closed_by_full_name) && (
                        <>
                          {drawerCase.result_notes && (
                            <div style={{ ...styles.detailItem, gridColumn: "1 / -1" }}>
                              <span style={styles.detailLabel}>{t.closingNotes}</span>
                              <span style={styles.detailValue}>{drawerCase.result_notes}</span>
                            </div>
                          )}
                          <div style={{ ...styles.detailItem, gridColumn: "1 / -1" }}>
                            <span style={styles.detailLabel}>{t.closedBy}</span>
                            <span style={styles.detailValue}>
                              {drawerCase.closed_by?.full_name || drawerCase.closed_by_full_name || "—"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={styles.drawerSection}>
                    <p style={styles.drawerSectionLabel}>{t.feedbackSection}</p>
                    {drawerFeedback ? (
                      <div style={styles.detailGrid}>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>{t.adminRating}</span>
                          <span style={styles.detailValue}>{drawerFeedback.administrative_rating != null ? `${drawerFeedback.administrative_rating}/4` : "—"}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>{t.evacuationRating}</span>
                          <span style={styles.detailValue}>{drawerFeedback.evacuation_rating != null ? `${drawerFeedback.evacuation_rating}/4` : "—"}</span>
                        </div>
                        {drawerFeedback.comments && (
                          <div style={{ ...styles.detailItem, gridColumn: "1 / -1" }}>
                            <span style={styles.detailLabel}>{t.notes}</span>
                            <span style={styles.detailValue}>{drawerFeedback.comments}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <p style={{ margin: 0, fontSize: "13px", color: "#6b625c" }}>{t.feedbackNotYet}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#9a8f86" }}>{t.closedFeedbackNote}</p>
                        <button onClick={() => handleSendFeedbackOptimistic(drawerCase)} style={styles.secondaryBtn}>
                          {localFeedbackCopied[drawerCase.id] || drawerCase.feedback_token ? t.copyAgain : t.copyFeedbackLink}
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={styles.drawerSection}>
                    <button onClick={async () => { await handleReopenCase(drawerCase.id); closeDrawer(); }} style={styles.secondaryBtn}>{t.reopenCase}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
  welcomeBanner: { padding: "14px 20px", background: "#fff8ef", borderRadius: "14px", border: "1px solid #f0e5d8" },
  welcomeText: { color: "#3d332b", fontSize: "15px" },
  errorText: { color: "#dc2626", background: "#fee2e2", border: "1px solid #fecaca", padding: "10px 12px", borderRadius: "12px", fontSize: "14px", margin: 0 },
  card: { background: "#ffffff", borderRadius: "22px", padding: "20px", boxShadow: "0 4px 24px rgba(43,22,12,0.05)", border: "1px solid #f2e7dc" },
  sectionTitle: { margin: "0 0 14px", color: "#6a2300", fontSize: "18px", fontWeight: "900" },
  topRow: { display: "flex", gap: "18px", alignItems: "stretch" },
  topLeft: { flex: "0 0 42%", minWidth: 0 },
  topRight: { flex: "1 1 0", minWidth: 0 },
  instructionsBox: { background: "#fffdf8", border: "1px solid #f0e5d8", borderRadius: "12px", padding: "10px" },
  instructionsTitle: { margin: "0 0 6px", fontWeight: "800", fontSize: "13px", color: "#6a2300" },
  instructionsList: { margin: 0, paddingInlineStart: "20px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "#3d332b", lineHeight: "1.4" },
  trackHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "14px" },
  trackControls: { display: "flex", gap: "8px" },
  sortSelect: { padding: "7px 10px", borderRadius: "6px", border: "1px solid #eadfd2", background: "#ffffff", color: "#2b160c", fontSize: "13px", fontWeight: "800", cursor: "pointer" },
  trackScrollArea: { overflowY: "auto", overflowX: "auto", maxHeight: "210px", borderRadius: "10px", border: "1px solid #f0e5d8" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: { padding: "8px 10px", color: "#6b625c", fontWeight: "800", borderBottom: "1px solid #f0e5d8", whiteSpace: "nowrap", textAlign: "inherit" },
  td: { padding: "10px 10px", color: "#2b160c", borderBottom: "1px solid #f8f4f0", verticalAlign: "middle", textAlign: "inherit" },
  tr: { transition: "background 0.15s" },
  statusPill: { display: "inline-block", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "800" },
  emptyText: { margin: 0, color: "#7a6658", fontSize: "14px" },
  closedNote: { background: "#fffbef", border: "1px solid #f5e0a0", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#7a5c00", marginBottom: "12px" },
  filters: { display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" },
  filterButton: { display: "flex", alignItems: "center", gap: "6px", border: "1.5px solid #f3c49a", background: "white", color: "#3d332b", borderRadius: "20px", padding: "7px 14px", fontWeight: "800", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" },
  filterActive: { background: "#fff1df", color: "#e85d04" },
  filterCount: { background: "#f0e5d8", color: "#7a5c44", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: "900" },
  filterCountActive: { background: "#ffd6b0", color: "#a83600" },
  toolbar: { marginBottom: "14px" },
  searchInput: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "12px", border: "1px solid #eadfd2", background: "#fffdf8", fontSize: "14px", color: "#2b160c" },
  emptyState: { padding: "24px", textAlign: "center", background: "#fffdf8", color: "#6b625c", fontSize: "14px" },
  casesList: { background: "white", border: "1px solid #eee2d8", borderRadius: "16px", overflow: "hidden" },
  desktopHeader: { display: "grid", gridTemplateColumns: "2fr 1.2fr 1.6fr 1.5fr 1.5fr 1.5fr", alignItems: "center", padding: "12px 16px", fontWeight: "900", background: "#fff3e6", borderBottom: "1px solid #eadfd2", fontSize: "12px", color: "#51443a" },
  thCell: { textAlign: "center", cursor: "pointer", userSelect: "none" },
  sortHint: { opacity: 0.35, fontSize: "11px" },
  caseRow: { borderBottom: "1px solid #d6ccc0" },
  rowTrigger: { width: "100%", border: "none", background: "transparent", cursor: "pointer", padding: "14px 16px", display: "grid", gridTemplateColumns: "2fr 1.2fr 1.6fr 1.5fr 1.5fr 1.5fr", alignItems: "center", gap: "8px", textAlign: "inherit" },
  colName: { color: "#2b160c", fontWeight: "700", textTransform: "capitalize", fontSize: "14px", textAlign: "center" },
  colMeta: { color: "#2b160c", fontSize: "13px", textAlign: "center" },
  colAssigned: { color: "#2b160c", fontSize: "12px", textAlign: "center", fontWeight: "600" },
  badge: { padding: "4px 10px", borderRadius: "6px", fontWeight: "900", fontSize: "12px", whiteSpace: "nowrap" },
  openBadge: { background: "#fff3e6", color: "#d95f00" },
  assignedBadge: { background: "#eef8ef", color: "#16803d" },
  closedBadge: { background: "#f3f4f6", color: "#374151" },
  feedbackReceived: { fontSize: "12px", fontWeight: "800", color: "#16803d" },
  feedbackSentBtn: { border: "none", background: "transparent", fontSize: "12px", fontWeight: "800", color: "#16803d", cursor: "pointer", padding: "0" },
  feedbackCopyBtn: { border: "none", background: "transparent", fontSize: "12px", fontWeight: "700", color: "#d95f00", cursor: "pointer", padding: "0", textDecoration: "underline" },
  drawerHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 22px 16px", borderBottom: "1px solid #f0e5d8", gap: "12px" },
  drawerTitle: { margin: "0 0 8px", color: "#2b160c", fontSize: "20px", fontWeight: "900", textTransform: "capitalize" },
  drawerClose: { border: "none", background: "#f0e5d8", color: "#6a2300", borderRadius: "50%", width: "32px", height: "32px", fontSize: "20px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  drawerBody: { padding: "0 22px 32px", overflowY: "auto", flex: 1 },
  drawerSection: { paddingTop: "20px", paddingBottom: "4px", borderTop: "1px solid #f5efe8", marginTop: "4px" },
  drawerSectionLabel: { margin: "0 0 12px", fontSize: "11px", fontWeight: "900", color: "#9a8f86", textTransform: "uppercase", letterSpacing: "0.8px" },
  detailGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" },
  detailItem: { display: "flex", flexDirection: "column", gap: "3px" },
  detailLabel: { fontSize: "11px", color: "#9a8f86", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" },
  detailValue: { fontSize: "14px", color: "#2b160c", fontWeight: "600" },
  complexitySelect: { padding: "7px 10px", borderRadius: "8px", border: "1px solid #eadfd2", background: "white", fontWeight: "700", fontSize: "14px", color: "#2b160c", marginTop: "4px" },
  complexityWarning: { background: "#fffbef", border: "1px solid #f5e0a0", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#7a5000", fontWeight: "700" },
  assignGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "12px" },
  assignListCol: { display: "flex", flexDirection: "column", minHeight: 0 },
  assignMapCol: { minHeight: 0 },
  mapBox: { border: "1px solid #d6ead8", borderRadius: "12px", overflow: "hidden", height: "100%", minHeight: "370px", display: "flex", flexDirection: "column" },
  mapHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fcf8", borderBottom: "1px solid #e6efe7", flexShrink: 0 },
  mapLegend: { fontSize: "11px", color: "#6b7280" },
  volunteerList: { overflowY: "auto", border: "1px solid #eadfd2", borderRadius: "12px", maxHeight: window.innerWidth <= 600 ? "190px" : "320px" },
  volunteerBtn: { width: "100%", textAlign: "left", padding: "10px 12px", border: "none", borderBottom: "1px solid #f1ebe5", background: "white", cursor: "pointer", display: "flex", flexDirection: "column", gap: "3px", color: "#2b160c" },
  volunteerBtnActive: { background: "#fff1df" },
  volunteerBtnTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" },
  volunteerBtnMeta: { fontSize: "12px", color: "#6b625c" },
  scoreBadge: { fontSize: "11px", fontWeight: "800", color: "#6a2300", background: "#fff1df", padding: "2px 8px", borderRadius: "6px", whiteSpace: "nowrap" },
  volunteerCard: { background: "#fffdf8", border: "1px solid #f0e5d8", borderRadius: "12px", padding: "14px", marginBottom: "14px" },
  volunteerCardHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  volunteerCardGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 16px" },
  vcItem: { display: "flex", flexDirection: "column", gap: "2px", fontSize: "13px", color: "#2b160c" },
  vcLabel: { fontSize: "11px", color: "#9a8f86", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" },
  availBadge: { display: "inline-block", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", marginLeft: "8px" },
  assignFooter: { display: "flex", flexDirection: "column", gap: "10px", padding: "14px", background: "#fffdf8", border: "1px solid #f0e5d8", borderRadius: "12px" },
  assignFooterRow: { display: "flex", gap: "12px" },
  equipmentList: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" },
  equipChip: { border: "1px solid #e0c9b8", background: "white", color: "#51443a", borderRadius: "6px", padding: "5px 10px", fontWeight: "700", fontSize: "12px", cursor: "pointer" },
  equipChipActive: { background: "#fff1df", color: "#6a2300", borderColor: "#6a2300" },
  assignConfirmBtn: { background: "#6a2300", color: "white", border: "none", borderRadius: "8px", padding: "11px 20px", fontWeight: "800", fontSize: "14px", cursor: "pointer", alignSelf: "center" },
  closePicker: { background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" },
  inlineSelect: { padding: "7px 10px", borderRadius: "8px", border: "1px solid #eadfd2", background: "white", fontWeight: "700", fontSize: "13px", color: "#2b160c", width: "100%" },
  textarea: { width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: "10px", border: "1px solid #eadfd2", background: "#fffdf8", fontSize: "13px", minHeight: "60px", resize: "vertical", color: "#2b160c" },
  label: { display: "block", margin: "0 0 5px", color: "#2b160c", fontWeight: "800", fontSize: "13px" },
  secondaryBtn: { border: "1px solid #d9c2b8", background: "white", color: "#6a2300", borderRadius: "8px", padding: "9px 16px", fontSize: "13px", fontWeight: "800", cursor: "pointer" },
  dangerBtn: { border: "1px solid #e0c4b8", background: "white", color: "#7a2e1a", borderRadius: "8px", padding: "9px 16px", fontWeight: "800", cursor: "pointer", fontSize: "13px" },
};