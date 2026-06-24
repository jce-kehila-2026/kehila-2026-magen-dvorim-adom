

// Case management interface — bilingual (EN / HE)
import "./CasesView.css";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import VolunteerRecommendationMap from "./VolunteerRecommendationMap";
import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

// ─── Translation map ──────────────────────────────────────────────────────────
const T = {
  en: {
    // nav
    dashboard: "Dashboard", cases: "Cases", users: "Users",
    reports: "Reports", backup: "Backup", profile: "Profile",
    logout: "Logout", langToggle: "עברית 🌐",
    // page
    manageCases: "Manage Cases",
    subtitleAll: "All rescue cases in the system.",
    subtitleOpen: "Open rescue cases waiting for assignment or action.",
    subtitleAssigned: "Cases currently assigned and being handled.",
    subtitleMy: "Cases assigned directly to you.",
    subtitleClosed: "Review completed rescue cases and history.",
    // filters
    all: "All", open: "Open", assigned: "Assigned",
    closed: "Closed", myCases: "My Cases",
    // table headers
    name: "Name", phone: "Phone", opened: "Opened",
    status: "Status", assignedTo: "Assigned to", feedback: "Feedback",
    // detail rows
    city: "City", street: "Street", coordinator: "Coordinator",
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
    // close picker
    selectResult: "Select a finishing result",
    closingNotesOpt: "Closing notes (optional)",
    // feedback
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
    dashboard: "דשבורד", cases: "מקרים", users: "משתמשים",
    reports: "דוחות", backup: "גיבוי", profile: "פרופיל",
    logout: "התנתק", langToggle: "English 🌐",
    manageCases: "ניהול מקרים",
    subtitleAll: "כל מקרי ההצלה במערכת.",
    subtitleOpen: "מקרים פתוחים הממתינים לשיוך או פעולה.",
    subtitleAssigned: "מקרים שמטופלים כרגע.",
    subtitleMy: "מקרים שהוקצו אליך ישירות.",
    subtitleClosed: "סקור מקרים שהסתיימו והיסטוריה.",
    all: "הכל", open: "פתוחים", assigned: "משויכים",
    closed: "סגורים", myCases: "המקרים שלי",
    name: "שם", phone: "טלפון", opened: "נפתח",
    status: "סטטוס", assignedTo: "מוקצה ל", feedback: "משוב",
    city: "עיר", street: "רחוב", coordinator: "רכז",
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

export default function CasesView({
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
  handleAssignFromModal,
  handleGetRecommendations,
  handleReopenCase,
  formatDate,
  getResultLabel,
  handleLogout,
  handleSendFeedback,
  usersById = {},
  coordinatorOptions = [],
  handleChangeComplexity,
  handleChangeCoordinator,
  feedbackByCase = {},
  cancelCloseCase,
  confirmCloseCase,
  closingCase = { caseId: null, result_status: "evacuated_by_volunteer", notes: "" },
  setClosingCase,
  FINISHING_STATUSES = [],
}) {
  const navigate = useNavigate();
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localFeedbackCopied, setLocalFeedbackCopied] = useState({});
  const { language, setLanguage } = useLanguage();
  const isHe = language === "he";
  const t = T[language] || T.en;
  const dir = isHe ? "rtl" : "ltr";

  const subtitle =
    activeFilter === "all" ? t.subtitleAll :
    activeFilter === "open" ? t.subtitleOpen :
    activeFilter === "assigned" ? t.subtitleAssigned :
    activeFilter === "my" ? t.subtitleMy :
    t.subtitleClosed;

  const getStatusStyle = (s) => ({
    ...styles.badge,
    ...(s === "assigned" ? styles.assignedBadge : s === "closed" ? styles.closedBadge : styles.openBadge),
  });

  const currentModalCase = cases.find((c) => c.id === modalState.caseId);

  const scoreByUserId = (recommendations || []).reduce((acc, v) => {
    acc[v.id] = v.recommendationScore; return acc;
  }, {});

  const closeAssignModal = () => {
    setModalState({ open: false, caseId: null, userId: "", selected: [], other: "", notes: "" });
    setUserSearch(""); setRecommendations(null);
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

  const cleanDate = (date) => {
    if (!date) return "—";
    return new Date(date.seconds ? date.seconds * 1000 : date).toLocaleDateString("en-GB");
  };

  // Complexity label translation
  const complexityLabel = (v) =>
    v === "very_complex" ? t.veryComplex : v === "complex" ? t.complex : t.simple;

  return (
    <div style={ styles.page } className="cases-page">
      <button type="button" className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)}>☰</button>

      {mobileMenuOpen && <div className="mobile-menu-backdrop" onClick={() => setMobileMenuOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside style={styles.sidebar} className={`cases-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{currentUserName || "User"}</p>
          </div>
        </div>
        <nav style={styles.nav}>
          <button style={styles.navItem} onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }}>{t.dashboard}</button>
          <button style={{ ...styles.navItem, ...styles.navItemActive }}>{t.cases}</button>
          <button style={styles.navItem} onClick={() => navigate("/users")}>{t.users}</button>
          {currentUserRole === "admin" && <button style={styles.navItem} onClick={() => navigate("/reports")}>{t.reports}</button>}
          {currentUserRole === "admin" && <button style={styles.navItem} onClick={() => { navigate("/backup"); setMobileMenuOpen(false); }}>{t.backup}</button>}
          <button style={styles.navItem} onClick={() => navigate("/profile")}>{t.profile}</button>
        </nav>
        <div style={styles.sidebarBottom}>
          <button style={styles.langButton} onClick={() => setLanguage(isHe ? "en" : "he")}>{t.langToggle}</button>
          <button style={styles.logoutButton} onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>{t.logout}</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={styles.main} className="cases-main">
        <section style={styles.contentCard} className="cases-content-card">
          <header style={{  ...styles.header,  textAlign: isHe ? "right" : "left" }}>
            <h1 style={styles.title}>{t.manageCases}</h1>
          <p
            style={{
              ...styles.subtitle,
              textAlign: isHe ? "right" : "left"
            }}
          >
            {subtitle}
          </p>
         </header>

          {/* Filter pills */}
          <div style={{ ...styles.filters,  flexDirection: isHe ? "row-reverse" : "row" }} className="cases-filters">
            {[
              { key: "all", label: t.all, count: cases.length },
              { key: "open", label: t.open, count: openCaseCount },
              { key: "assigned", label: t.assigned, count: assignedCaseCount },
              { key: "closed", label: t.closed, count: closedCases.length },
              { key: "my", label: t.myCases, count: myCasesCount },
            ].map(({ key, label, count }) => (
              <button key={key} onClick={() => setActiveFilter(key)}
                style={{ ...styles.filterButton, ...(activeFilter === key ? styles.filterActive : {}) }}>
                {label}
                <span style={{ ...styles.filterCount, ...(activeFilter === key ? styles.filterCountActive : {}) }}>{count}</span>
              </button>
            ))}
          </div>

          <div style={styles.toolbar}>
            <input placeholder={t.search} value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)}
              style={styles.searchInput} className="cases-search-input" />
          </div>

          {error && <p style={styles.errorText}>{error}</p>}

          {activeCases.length === 0 && !error ? (
            <div style={styles.emptyState}>{t.noMatch}</div>
          ) : (
            <div style={styles.casesList}>
              {/* Desktop header */}
              <div style={styles.desktopHeader} className="cases-desktop-header">
                <span onClick={() => handleSortClick("name")} style={styles.thCell}>{t.name} {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}</span>
                <span onClick={() => handleSortClick("phone")} style={styles.thCell}>{t.phone} {sortColumn === "phone" && (sortDirection === "asc" ? "↑" : "↓")}</span>
                <span onClick={() => handleSortClick("opened_at")} style={styles.thCell}>{t.opened} {sortColumn === "opened_at" && (sortDirection === "asc" ? "↑" : "↓")}</span>
                <span style={{ ...styles.thCell, cursor: "default" }}>{t.status}</span>
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
                  <div key={caseItem.id} style={{ ...styles.accordionCard, background: rowIndex % 2 === 0 ? "#fff" : "#fdf8f0" }}>
                    {/* Row trigger */}
                    
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
                            {[t.city, t.street, t.coordinator, t.complexity].map((h) => (
                              <div key={h} style={styles.dtHeadCell}>{h}</div>
                            ))}
                          </div>
                          <div style={{ ...styles.dtRow, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                            <div style={styles.dtCell}>{caseItem.city || "—"}</div>
                            <div style={styles.dtCell}>{caseItem.street || "—"} {caseItem.house_number || ""}</div>
                            <div style={styles.dtCell}>
                              {currentUserRole === "admin" && (caseItem.status === "open" || caseItem.status === "assigned") ? (
                                <select value={caseItem.coordinator_id || ""} onChange={(e) => handleChangeCoordinator(caseItem.id, e.target.value)} style={styles.inlineSelect}>
                                  {coordinatorOptions.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                                </select>
                              ) : (
                                usersById[caseItem.coordinator_id]?.full_name || usersById[caseItem.coordinator_id]?.email || "—"
                              )}
                            </div>
                            <div style={styles.dtCell}>
                              {(currentUserRole === "admin" || currentUserRole === "coordinator") && caseItem.status === "open" ? (
                                <select value={caseItem.case_complexity || "simple"} onChange={(e) => handleChangeComplexity(caseItem.id, e.target.value)} style={styles.inlineSelect}>
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
                                <div style={{ ...styles.dtCell, borderRight: "none", textAlign: isHe ? "right" : "left" }}>{caseItem.result_notes || t.noClosingNotes}</div>
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
                            <select value={closingCase.result_status} onChange={(e) => setClosingCase((p) => ({ ...p, result_status: e.target.value }))} style={styles.inlineSelect}>
                              {FINISHING_STATUSES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <label style={styles.label}>{t.closingNotesOpt}</label>
                            <textarea rows={2} value={closingCase.notes} onChange={(e) => setClosingCase((p) => ({ ...p, notes: e.target.value }))} style={styles.textarea} />
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
                                style={styles.reopenButton}>{t.reopenCase}</button>
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
          <div style={{ ...styles.assignModal}} className="assign-modal" onClick={(e) => e.stopPropagation()}>
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
                <input placeholder={t.searchByName} value={userSearch} onChange={(e) => setUserSearch(e.target.value)} style={styles.searchInput} className="cases-search-input" />
                <div style={styles.userList} className="assign-user-list">
                  {filteredUsersForModal.length === 0 ? (
                    <div style={styles.emptyState}>{t.noUsers}</div>
                  ) : filteredUsersForModal.map((user) => {
                    const score = scoreByUserId[user.id];
                    return (
                      <button key={user.id} type="button"
                        onClick={() => { setModalState((s) => ({ ...s, userId: user.id })); setUserSearch(user.full_name || user.email); }}
                        style={{ ...styles.userOption, ...(modalState.userId === user.id ? styles.userOptionActive : {}) }}>
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
                    volunteers={modalState.userId ? (recommendations || filteredUsersForModal).filter((v) => v.id === modalState.userId) : recommendations || filteredUsersForModal}
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
                      <button key={eq} type="button"
                        onClick={() => setModalState((s) => ({ ...s, selected: checked ? (s.selected || []).filter((i) => i !== eq) : [...(s.selected || []), eq] }))}
                        style={{ ...styles.equipmentChip, ...(checked ? styles.equipmentChipActive : {}) }}>{eq}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={styles.label}>{t.otherEquipment}</label>
                <input placeholder={t.otherEquipmentPh} value={modalState.other} onChange={(e) => setModalState((s) => ({ ...s, other: e.target.value }))} style={styles.searchInput} />
              </div>
              <div>
                <label style={styles.label}>{t.assignmentNotes}</label>
                <textarea placeholder={t.assignmentNotesPh} value={modalState.notes} onChange={(e) => setModalState((s) => ({ ...s, notes: e.target.value }))} rows={2} style={styles.textarea} />
              </div>
            </div>

            <div style={styles.assignFooterActions}>
              <button onClick={closeAssignModal} style={styles.reopenButton}>{t.cancel}</button>
              <button style={styles.modalAssignButton} disabled={!modalState.userId || assigning} onClick={handleAssignFromModal}>
                {assigning ? t.assigning : t.assignBtn}
              </button>
            </div>
          </div>
        </div>
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
  main: { padding: "20px 14px", boxSizing: "border-box" },
  contentCard: { background: "#ffffff", borderRadius: "22px", padding: "24px", boxShadow: "0 16px 50px rgba(43,22,12,0.06)", border: "1px solid #f2e7dc" },
  header: { marginBottom: "18px" },
  title: { margin: "0 0 4px", color: "#6a2300", fontSize: "32px", fontWeight: "900" },
  subtitle: { margin: 0, color: "#6b4f00", fontSize: "13px" },
  filters: { display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" },
  filterButton: { display: "flex", alignItems: "center", gap: "6px", border: "1.5px solid #f3c49a", background: "white", color: "#3d332b", borderRadius: "20px", padding: "7px 14px", fontWeight: "800", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" },
  filterActive: { background: "#fff1df", color: "#e85d04" },
  filterCount: { background: "#f0e5d8", color: "#7a5c44", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: "900" },
  filterCountActive: { background: "#ffd6b0", color: "#a83600" },
  toolbar: { display: "flex", gap: "12px", marginBottom: "14px" },
  searchInput: { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: "12px", border: "1px solid #eadfd2", background: "#fffdf8", fontSize: "14px", color: "#2b160c" },
  errorText: { color: "#dc2626", background: "#fee2e2", border: "1px solid #fecaca", padding: "10px 12px", borderRadius: "12px", fontSize: "14px" },
  emptyState: { padding: "24px", textAlign: "center", background: "#fffdf8", color: "#6b625c", fontSize: "14px" },
  casesList: { background: "white", border: "1px solid #eee2d8", borderRadius: "16px", overflow: "hidden" },
  desktopHeader: { display: "grid", gridTemplateColumns: "1.8fr 1.1fr 1.3fr 0.9fr 1.2fr 0.9fr 32px", alignItems: "center", padding: "12px 16px", fontWeight: "900", background: "#fff8ef", borderBottom: "1px solid #eadfd2", fontSize: "12px", color: "#51443a" },
  thCell: { textAlign: "center", cursor: "pointer", userSelect: "none" },
  accordionCard: { borderBottom: "1px solid #eadfd2" },
  rowTrigger: { width: "100%", border: "none", background: "transparent", cursor: "pointer", padding: "14px 16px", display: "grid", gridTemplateColumns: "1.8fr 1.1fr 1.3fr 0.9fr 1.2fr 0.9fr 32px", alignItems: "center", gap: "8px", textAlign: "left" },
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
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" },
  assignModal: { width: "90vw", maxWidth: "900px", maxHeight: "85vh", overflowY: "auto", background: "white", borderRadius: "14px", padding: "18px 22px 20px", border: "1px solid #f0e5d8" },
  modalHeader: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "12px" },
  modalTitle: { margin: 0, color: "#6a2300", fontSize: "19px", fontWeight: "900" },
  modalSubtitle: { margin: "4px 0 0", color: "#6b625c", fontSize: "14px" },
  iconButton: { border: "none", background: "transparent", color: "#9a8f86", borderRadius: "6px", width: "30px", height: "30px", fontSize: "20px", cursor: "pointer" },
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
