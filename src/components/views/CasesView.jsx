// Case management interface.
// Displays rescue cases with filtering, assignment, and status actions.
import "./CasesView.css";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import VolunteerRecommendationMap from "./VolunteerRecommendationMap";
import { useState } from "react";
import { USER_ROLES } from "../../services/userSchema";

function CasesView({
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

  // Used to navigate between app pages.
  const navigate = useNavigate();
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const title = "Manage Cases";

  let subtitle = "";

  if (activeFilter === "all") {
    subtitle = "All rescue cases in the system.";
  } else if (activeFilter === "open") {
    subtitle = "Open rescue cases waiting for assignment or action.";
  } else if (activeFilter === "assigned") {
    subtitle = "Cases currently assigned and being handled.";
  } else if (activeFilter === "my") {
    subtitle = "Cases assigned directly to you.";
  } else {
    subtitle = "Review completed rescue cases and history.";
  }

  const getStatusStyle = (status) => ({
    ...styles.badge,
    ...(status === "assigned"
      ? styles.assignedBadge
      : status === "closed"
      ? styles.closedBadge
      : styles.openBadge),
  });

  const currentModalCase = cases.find((caseItem) => caseItem.id === modalState.caseId);

  const scoreByUserId = (recommendations || []).reduce((acc, volunteer) => {
    acc[volunteer.id] = volunteer.recommendationScore;
    return acc;
  }, {});

  const closeDetailsModal = () => setDetailsCase(null);

  const openAssignModal = (caseItem) => {
    setModalState((state) => ({
      ...state,
      open: true,
      caseId: caseItem.id,
    }));
    handleGetRecommendations(caseItem);
  };

  const closeAssignModal = () => {
    setModalState({
      open: false,
      caseId: null,
      userId: "",
      selected: [],
      other: "",
      notes: "",
    });
    setUserSearch("");
    setRecommendations(null);
  };

  const showCaseActions = detailsCase && detailsCase.status !== "closed";

  return (
    <div style={styles.page} className="cases-page">
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setMobileMenuOpen(true)}
      >
        ☰
      </button>

      {mobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        style={styles.sidebar}
        className={`cases-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}
      >
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{currentUserName || "User"}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          <button
            style={styles.navItem}
            onClick={() => {
              navigate("/dashboard");
              setMobileMenuOpen(false);
            }}
          >
            Dashboard
          </button>

          <button
            style={{ ...styles.navItem, ...styles.navItemActive }}
            onClick={() => navigate("/cases")}
          >
            Cases
          </button>

          <button style={styles.navItem} onClick={() => navigate("/users")}>
            Users
          </button>

          {currentUserRole === "admin" && (
            <button style={styles.navItem} onClick={() => navigate("/reports")}>
              Reports
            </button>
          )}

          {userProfile?.role === USER_ROLES.ADMIN && (
            <button
              style={styles.navItem}
              onClick={() => {
                navigate("/backup");
                setMobileMenuOpen(false);
              }}
            >
              Backup
            </button>
          )}

          <button style={styles.navItem} onClick={() => navigate("/profile")}>
            Profile
          </button>
        </nav>

        <button
          style={styles.logoutButton}
          onClick={() => {
            setMobileMenuOpen(false);
            handleLogout();
          }}
        >
          Logout
        </button>
      </aside>

      <main style={styles.main} className="cases-main">
        <section style={styles.contentCard} className="cases-content-card">
          <header style={styles.header}>
            <h1 style={styles.title}>{title}</h1>
            <p style={styles.subtitle}>{subtitle}</p>
          </header>

          <div style={styles.filters} className="cases-filters">
            <button
              onClick={() => setActiveFilter("all")}
              style={{
                ...styles.filterButton,
                ...(activeFilter === "all" ? styles.filterActive : {}),
              }}
            >
              All ({cases.length})
            </button>

            <button
              onClick={() => setActiveFilter("open")}
              style={{
                ...styles.filterButton,
                ...(activeFilter === "open" ? styles.filterActive : {}),
              }}
            >
              Open ({openCaseCount})
            </button>

            <button
              onClick={() => setActiveFilter("assigned")}
              style={{
                ...styles.filterButton,
                ...(activeFilter === "assigned" ? styles.filterActive : {}),
              }}
            >
              Assigned ({assignedCaseCount})
            </button>

            <button
              onClick={() => setActiveFilter("closed")}
              style={{
                ...styles.filterButton,
                ...(activeFilter === "closed" ? styles.filterActive : {}),
              }}
            >
              Closed ({closedCases.length})
            </button>

            <button
              onClick={() => setActiveFilter("my")}
              style={{
                ...styles.filterButton,
                ...(activeFilter === "my" ? styles.filterActive : {}),
              }}
            >
              My Cases ({myCasesCount})
            </button>
          </div>

          <div style={styles.toolbar} className="cases-toolbar">
            <input
              placeholder="Search by requester, phone, city, status..."
              value={caseSearch}
              onChange={(event) => setCaseSearch(event.target.value)}
              style={styles.searchInput}
            />
          </div>

          {error && <p style={styles.errorText}>{error}</p>}

          {activeCases.length === 0 && !error ? (
            <div style={styles.emptyState}>No cases match this view.</div>
          ) : (
            <div style={styles.casesList} className="cases-list">

              {/* ✅ HEADER ROW */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    window.innerWidth < 768
                      ? "1.6fr 1fr 1fr 0.8fr 24px" // mobile
                      : "2fr 1.3fr 1.5fr 1fr 40px", // desktop ✅ IMPORTANT
                  alignItems: "center",
                  padding: "12px 18px",
                  fontWeight: "900",
                  background: "#fff8ef",
                  borderBottom: "1px solid #eadfd2",
                  fontSize: "13px",
                  color: "#51443a",
                }}
              >
                <span
                  onClick={() => handleSortClick("name")}
                  style={{ textAlign: "center", cursor: "pointer", userSelect: "none" }}
                >
                  Name {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                </span>
                <span
                  onClick={() => handleSortClick("phone")}
                  style={{ textAlign: "center", cursor: "pointer", userSelect: "none" }}
                >
                  Phone {sortColumn === "phone" && (sortDirection === "asc" ? "↑" : "↓")}
                </span>
                <span
                  onClick={() => handleSortClick("opened_at")}
                  style={{ textAlign: "center", cursor: "pointer", userSelect: "none" }}
                >
                  Opened at {sortColumn === "opened_at" && (sortDirection === "asc" ? "↑" : "↓")}
                </span>
                <span style={{ textAlign: "center" }}>Status</span>
                <span></span>
              </div>

              {/* ✅ CASES */}
              {activeCases.map((caseItem, rowIndex) => {

                const caseAssignments = assignments[caseItem.id] || [];

                const assignedTo =
                  caseAssignments.length > 0
                    ? caseAssignments
                        .map((assignment) => {
                          const assignedUser = usersById[assignment.user_id];
                          return (
                            assignment.volunteer_name ||
                            assignment.full_name ||
                            assignment.user_name ||
                            assignedUser?.full_name ||
                            assignedUser?.email ||
                            "Volunteer"
                          );
                        })
                        .join(", ")
                    : "—";

                const isExpanded = expandedCaseId === caseItem.id;

                const cleanDate = (date) => {
                  if (!date) return "—";
                  return new Date(date.seconds ? date.seconds * 1000 : date).toLocaleDateString("en-GB");
                };

                return (
                  <div
                    key={caseItem.id}
                    style={{
                      ...styles.caseAccordionCard,
                      background: rowIndex % 2 === 0 ? "#ffffff" : "#fdf8f0",
                    }}
                    className="case-accordion-card"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedCaseId(isExpanded ? null : caseItem.id)}
                      style={{
                        ...styles.caseAccordionHeader,
                        display: "grid",
                        gridTemplateColumns:
                          window.innerWidth < 768
                            ? "1.6fr 1fr 1fr 0.8fr 24px"
                            : "2fr 1.3fr 1.5fr 1fr 40px", // desktop ✅ IMPORTANT
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ color: "#2b160c", fontWeight: "700", textAlign: "center", textTransform: "capitalize" }}>
                        {caseItem.requester_first_name} {caseItem.requester_last_name}
                      </span>

                      <span style={{ color: "#2b160c", textAlign: "center" }}>
                        {caseItem.requester_phone || "—"}
                      </span>

                      <span style={{ color: "#2b160c", textAlign: "center" }}>
                        {formatDate(caseItem.opened_at)}
                      </span>

                      <span style={{ ...getStatusStyle(caseItem.status), justifySelf: "center" }}>
                        {caseItem.status}
                      </span>

                      <span
                        style={{
                          display: "inline-block",
                          width: "7px",
                          height: "7px",
                          borderRight: "2px solid #0f5f7a",
                          borderBottom: "2px solid #0f5f7a",
                          transform: isExpanded ? "rotate(-135deg)" : "rotate(45deg)",
                          transition: "transform 0.15s",
                        }}
                      />
                    </button>

                    {isExpanded && (

                      <div style={styles.caseAccordionBody}>
                        <div style={styles.detailTableWrapper}>
                          <div style={styles.detailTableHeader}>
                            <div style={styles.detailTableHeaderCell}>City</div>
                            <div style={styles.detailTableHeaderCell}>Street</div>
                            <div style={styles.detailTableHeaderCell}>Coordinator</div>
                            <div style={styles.detailTableHeaderCell}>Complexity</div>
                          </div>
                          <div style={styles.detailTableRow}>
                            <div style={styles.detailTableCell}>{caseItem.city || "—"}</div>
                            <div style={styles.detailTableCell}>
                              {caseItem.street || "—"} {caseItem.house_number || ""}
                            </div>
                            <div style={styles.detailTableCell}>
                              {currentUserRole === "admin" &&
                              (caseItem.status === "open" || caseItem.status === "assigned") ? (
                                <select
                                  value={caseItem.coordinator_id || ""}
                                  onChange={(event) =>
                                    handleChangeCoordinator(caseItem.id, event.target.value)
                                  }
                                  style={styles.inlineSelect}
                                >
                                  {coordinatorOptions.map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.full_name || user.email}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                usersById[caseItem.coordinator_id]?.full_name ||
                                usersById[caseItem.coordinator_id]?.email ||
                                "—"
                              )}
                            </div>
                            <div style={styles.detailTableCell}>
                              {(currentUserRole === "admin" || currentUserRole === "coordinator") &&
                              caseItem.status === "open" ? (
                                <select
                                  value={caseItem.case_complexity || "simple"}
                                  onChange={(event) =>
                                    handleChangeComplexity(caseItem.id, event.target.value)
                                  }
                                  style={styles.inlineSelect}
                                >
                                  <option value="simple">Simple</option>
                                  <option value="complex">Complex</option>
                                  <option value="very_complex">Very Complex</option>
                                </select>
                              ) : (
                                caseItem.case_complexity || "simple"
                              )}
                            </div>
                          </div>

                          {caseItem.status !== "open" && (
                            <>
                              <div style={{ ...styles.detailTableHeader, gridTemplateColumns: "1fr 1fr 1fr" }}>
                                <div style={styles.detailTableHeaderCell}>Closed at</div>
                                <div style={styles.detailTableHeaderCell}>Result status</div>
                                <div style={{ ...styles.detailTableHeaderCell, borderRight: "none" }}>Assigned to</div>
                              </div>
                              <div style={{ ...styles.detailTableRow, gridTemplateColumns: "1fr 1fr 1fr" }}>
                                <div style={styles.detailTableCell}>
                                  {caseItem.status === "closed" ? cleanDate(caseItem.closed_at) : "—"}
                                </div>
                                <div style={styles.detailTableCell}>
                                  {caseItem.status === "closed" ? getResultLabel(caseItem.result_status) : "—"}
                                </div>
                                <div style={{ ...styles.detailTableCell, borderRight: "none" }}>{assignedTo}</div>
                              </div>

                              <div style={{ ...styles.detailTableHeader, gridTemplateColumns: "1fr" }}>
                                <div style={{ ...styles.detailTableHeaderCell, borderRight: "none" }}>
                                  Closing notes
                                </div>
                              </div>
                              <div style={{ ...styles.detailTableRow, gridTemplateColumns: "1fr" }}>
                                <div style={{ ...styles.detailTableCell, borderRight: "none", textAlign: "left" }}>
                                  {caseItem.result_notes || "No closing notes provided."}
                                </div>
                              </div>
                            </>
                          )}

                          <div style={{ ...styles.detailTableHeader, gridTemplateColumns: "1fr" }}>
                            <div style={{ ...styles.detailTableHeaderCell, borderRight: "none" }}>
                              Notes / description
                            </div>
                          </div>
                          <div style={{ ...styles.detailTableRow, gridTemplateColumns: "1fr" }}>
                            <div style={{ ...styles.detailTableCell, borderRight: "none", textAlign: "left" }}>
                              {caseItem.location_description || "No description provided."}
                            </div>
                          </div>

                          {caseItem.status === "closed" && (() => {
                            const feedback = feedbackByCase[caseItem.id];

                            if (feedback) {
                              return (
                                <>
                                  <div style={{ ...styles.detailTableHeader, gridTemplateColumns: "1fr 1fr 1fr" }}>
                                    <div style={styles.detailTableHeaderCell}>Administrative rating</div>
                                    <div style={styles.detailTableHeaderCell}>Evacuation rating</div>
                                    <div style={{ ...styles.detailTableHeaderCell, borderRight: "none" }}>Feedback notes</div>
                                  </div>
                                  <div style={{ ...styles.detailTableRow, gridTemplateColumns: "1fr 1fr 1fr" }}>
                                    <div style={styles.detailTableCell}>
                                      {feedback.administrative_rating != null ? `${feedback.administrative_rating}/4` : "—"}
                                    </div>
                                    <div style={styles.detailTableCell}>
                                      {feedback.evacuation_rating != null ? `${feedback.evacuation_rating}/4` : "—"}
                                    </div>
                                    <div style={{ ...styles.detailTableCell, borderRight: "none" }}>
                                      {feedback.comments || "No notes provided."}
                                    </div>
                                  </div>
                                </>
                              );
                            }

                            return (
                              <>
                                <div style={{ ...styles.detailTableHeader, gridTemplateColumns: "1fr" }}>
                                  <div style={{ ...styles.detailTableHeaderCell, borderRight: "none" }}>Feedback</div>
                                </div>
                                <div style={{ ...styles.detailTableRow, gridTemplateColumns: "1fr", padding: "10px 12px" }}>
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleSendFeedback(caseItem);
                                    }}
                                    style={styles.assignButton}
                                  >
                                    Copy feedback link
                                  </button>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {closingCase.caseId === caseItem.id ? (
                          <div style={styles.closeCasePicker} className="close-case-picker">
                            <label style={styles.label}>Select a finishing result</label>
                            <select
                              value={closingCase.result_status}
                              onChange={(event) =>
                                setClosingCase((prev) => ({ ...prev, result_status: event.target.value }))
                              }
                              style={styles.inlineSelect}
                            >
                              {FINISHING_STATUSES.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>

                            <label style={styles.label}>Closing notes (optional)</label>
                            <textarea
                              rows={2}
                              value={closingCase.notes}
                              onChange={(event) =>
                                setClosingCase((prev) => ({ ...prev, notes: event.target.value }))
                              }
                              style={styles.textarea}
                            />

                            <div style={styles.caseInlineActions} className="case-inline-actions">
                              <button onClick={cancelCloseCase} style={styles.reopenButton}>
                                Cancel
                              </button>
                              <button onClick={confirmCloseCase} style={styles.closeButton}>
                                Confirm Close
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={styles.caseInlineActions} className="case-inline-actions">
                            {caseItem.status !== "closed" ? (
                              <>
                                <button
                                  onClick={() => openAssignModal(caseItem)}
                                  style={styles.assignButton}
                                >
                                  {caseItem.status === "assigned" ? "Reassign Volunteer" : "Assign Volunteer"}
                                </button>

                                <button
                                  onClick={() => beginCloseCase(caseItem.id)}
                                  style={styles.closeButton}
                                >
                                  Close Case
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleReopenCase(caseItem.id)}
                                style={styles.reopenButton}
                              >
                                Reopen Case
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

      {modalState.open && (
        <div style={styles.modalOverlay} onClick={closeAssignModal}>
          <div
            style={styles.assignModal}
            className="assign-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.modalHeader} className="assign-modal-header">
              <div>
                <h2 style={styles.modalTitle}>Assign volunteer</h2>
                <p style={styles.modalSubtitle}>
                  Choose the best available volunteer for this case.
                </p>
              </div>

              <button onClick={closeAssignModal} style={styles.iconButton}>
                ×
              </button>
            </div>

            <div style={styles.assignModalGrid} className="assign-modal-grid">
              <div style={styles.assignLeftPanel}>
                <label style={styles.label}>Select volunteer</label>

                <input
                  placeholder="Search by name..."
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  style={styles.searchInput}
                />

                <div style={styles.userList} className="assign-user-list">
                  {filteredUsersForModal.length === 0 ? (
                    <div style={styles.emptyState}>No users found.</div>
                  ) : (
                    filteredUsersForModal.map((user) => {
                      const score = scoreByUserId[user.id];

                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setModalState((state) => ({
                              ...state,
                              userId: user.id,
                            }));
                            setUserSearch("");
                          }}
                          style={{
                            ...styles.userOption,
                            ...(modalState.userId === user.id
                              ? styles.userOptionActive
                              : {}),
                          }}
                        >
                          <div style={styles.userOptionTop}>
                            <strong>{user.full_name || user.email}</strong>
                            {score != null && (
                              <span style={styles.scoreBadge}>Score {score}</span>
                            )}
                          </div>
                          <span style={styles.userOptionMeta}>
                            {user.phone || "No phone"} · {user.city || "No city"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={styles.assignRightPanel}>
                <div style={styles.mapPreviewBox} className="assign-map-box">
                  <div style={styles.mapHeader}>
                    <strong>Volunteer map</strong>
                    <span style={styles.mapLegend}>📍 Case • 🟢 Volunteers</span>
                  </div>

                  <VolunteerRecommendationMap
                    caseData={currentModalCase}
                    volunteers={
                      modalState.userId
                        ? (recommendations || filteredUsersForModal).filter(
                            (volunteer) => volunteer.id === modalState.userId
                          )
                        : recommendations || filteredUsersForModal
                    }
                    selectedVolunteerId={modalState.userId}
                  />
                </div>
              </div>
            </div>

            <div style={styles.assignBottomPanel} className="assign-bottom-panel">
              <div>
                <label style={styles.label}>Required equipment</label>

                <div style={styles.equipmentList}>
                  {PRESET_EQUIPMENT.map((equipment) => {
                    const isChecked = (modalState.selected || []).includes(equipment);

                    return (
                      <button
                        key={equipment}
                        type="button"
                        onClick={() => {
                          setModalState((state) => ({
                            ...state,
                            selected: isChecked
                              ? (state.selected || []).filter((item) => item !== equipment)
                              : [...(state.selected || []), equipment],
                          }));
                        }}
                        style={{
                          ...styles.equipmentChip,
                          ...(isChecked ? styles.equipmentChipActive : {}),
                        }}
                      >
                        {equipment}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={styles.label}>Other equipment</label>

                <input
                  placeholder="e.g. gloves, smoker"
                  value={modalState.other}
                  onChange={(event) =>
                    setModalState((state) => ({
                      ...state,
                      other: event.target.value,
                    }))
                  }
                  style={styles.searchInput}
                />
              </div>

              <div>
                <label style={styles.label}>Assignment notes</label>

                <textarea
                  placeholder="Optional notes for the volunteer..."
                  value={modalState.notes}
                  onChange={(event) =>
                    setModalState((state) => ({
                      ...state,
                      notes: event.target.value,
                    }))
                  }
                  rows={2}
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={styles.assignFooterActions}>
              <button onClick={closeAssignModal} style={styles.reopenButton}>
                Cancel
              </button>
              <button
                style={styles.modalAssignButton}
                disabled={!modalState.userId || assigning}
                onClick={handleAssignFromModal}
              >
                {assigning ? "Assigning..." : "Assign volunteer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    background: "#fffdf8",
    fontFamily: "Arial, sans-serif",
  },

  sidebar: {
    height: "100vh",
    position: "sticky",
    top: 0,
    padding: "28px 20px",
    background: "#fff8ef",
    borderRight: "1px solid #f0e5d8",
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
    color: "#6a2300",
    fontSize: "16px",
    fontWeight: "900",
  },

  brandSub: {
    margin: "4px 0 0",
    color: "#e85d04",
    fontSize: "13px",
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
    borderRadius: "14px",
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
    padding: "10px",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  main: {
    padding: "20px 14px",
    boxSizing: "border-box",
  },

  contentCard: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 16px 50px rgba(43, 22, 12, 0.06)",
    border: "1px solid #f2e7dc",
  },

  header: {
    marginBottom: "18px",
    textAlign: "left",
  },

  title: {
    margin: "0 0 4px",
    color: "#6a2300",
    fontSize: "32px",
    fontWeight: "900",
  },

  subtitle: {
    margin: 0,
    color: "#6b4f00",
    fontSize: "13px",
  },

  filters: {
    display: "flex",
    gap: "10px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },

  filterButton: {
    border: "1px solid #f3c49a",
    background: "white",
    color: "#3d332b",
    borderRadius: "6px",
    padding: "10px 16px",
    fontWeight: "800",
    cursor: "pointer",
  },

  filterActive: {
    background: "#fff1df",
    color: "#e85d04",
  },

  toolbar: {
    display: "flex",
    gap: "12px",
    marginBottom: "14px",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #eadfd2",
    background: "#fffdf8",
    fontSize: "14px",
    color: "#2b160c",
    caretColor: "#2b160c",
  },

  sortSelect: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #eadfd2",
    background: "white",
    fontWeight: "800",
    color: "#3d332b",
  },

  inlineSelect: {
    padding: "6px 8px",
    borderRadius: "8px",
    border: "1px solid #eadfd2",
    background: "white",
    fontWeight: "700",
    fontSize: "13px",
    color: "#2b160c",
  },

  closeCasePicker: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "14px",
    background: "#fff3e0",
    border: "1px solid #ffcc80",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  casesList: {
    background: "white",
    border: "1px solid #eee2d8",
    borderRadius: "16px",
    overflow: "hidden",
  },

  requesterName: {
    fontWeight: "900",
    fontSize: "15px",
    color: "#2b160c",
  },

  caseDetailsCell: {
    padding: "14px 16px",
  },

  caseInfoGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1.3fr 1.5fr 1fr",
    gap: "12px 24px",
  },

  detailTableWrapper: {
    marginBottom: "16px",
  },

  detailTableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1.3fr 1.5fr 1fr",
    background: "#f7f7f6",
  },

  detailTableHeaderCell: {
    padding: "8px 12px",
    textAlign: "center",
    fontSize: "11px",
    color: "#9a9a9a",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  detailTableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1.3fr 1.5fr 1fr",
    background: "#ffffff",
  },

  detailTableCell: {
    padding: "10px 12px",
    textAlign: "center",
    fontSize: "14px",
    color: "#2b160c",
    fontWeight: "700",
  },

  infoLabel: {
    fontSize: "11px",
    color: "#9a8f86",
    fontWeight: "700",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  infoValue: {
    fontSize: "14px",
    color: "#2b160c",
    fontWeight: "700",
  },

  caseDescriptionLine: {
    marginTop: "12px",
    color: "#2b160c",
    fontSize: "13px",
    lineHeight: "1.6",
    textAlign: "center",
  },

  caseInlineActions: {
    marginTop: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  badge: {
    width: "fit-content",
    padding: "5px 10px",
    borderRadius: "6px",
    fontWeight: "900",
    fontSize: "12px",
    textTransform: "capitalize",
  },

  openBadge: {
    background: "#fff3e6",
    color: "#d95f00",
  },

  assignedBadge: {
    background: "#eef8ef",
    color: "#16803d",
  },

  closedBadge: {
    background: "#f3f4f6",
    color: "#374151",
  },

  highBadge: {
    background: "#fee2e2",
    color: "#dc2626",
  },

  mediumBadge: {
    background: "#fff3e6",
    color: "#d95f00",
  },

  lowBadge: {
    background: "#eef8ef",
    color: "#16803d",
  },

  primaryActionButton: {
    width: "fit-content",
    border: "1px solid #ddd6ce",
    background: "white",
    color: "#3d332b",
    borderRadius: "9px",
    padding: "7px 13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  assignButton: {
    border: "1px solid #f3c49a",
    background: "#fff8ef",
    color: "#d95f00",
    borderRadius: "6px",
    padding: "7px 11px",
    fontWeight: "800",
    cursor: "pointer",
  },

  closeButton: {
    border: "1px solid #e0c4b8",
    background: "white",
    color: "#7a2e1a",
    borderRadius: "6px",
    padding: "7px 11px",
    fontWeight: "800",
    cursor: "pointer",
  },

  reopenButton: {
    border: "1px solid #d9c2b8",
    background: "white",
    color: "#6a2300",
    borderRadius: "4px",
    padding: "5px 9px",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  emptyState: {
    padding: "24px",
    textAlign: "center",
    background: "#fffdf8",
    color: "#6b625c",
    fontSize: "14px",
  },

  errorText: {
    color: "#dc2626",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    padding: "10px 12px",
    borderRadius: "12px",
    fontSize: "14px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },

  assignModal: {
    width: "90vw",
    maxWidth: "900px",
    maxHeight: "85vh",
    overflowY: "auto",
    background: "white",
    borderRadius: "14px",
    padding: "18px 22px 20px",
    border: "1px solid #f0e5d8",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    marginBottom: "12px",
  },

  modalTitle: {
    margin: 0,
    color: "#6a2300",
    fontSize: "19px",
    fontWeight: "900",
  },

  modalSubtitle: {
    margin: "4px 0 0",
    color: "#6b625c",
    fontSize: "14px",
  },

  iconButton: {
    border: "none",
    background: "transparent",
    color: "#9a8f86",
    borderRadius: "6px",
    width: "30px",
    height: "30px",
    fontSize: "20px",
    cursor: "pointer",
    lineHeight: 1,
  },

  modalActions: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
  },

  label: {
    display: "block",
    margin: "12px 0 6px",
    color: "#2b160c",
    fontWeight: "800",
  },

  userList: {
    height: "275px",
    overflowY: "auto",
    border: "1px solid #eadfd2",
    borderRadius: "12px",
  },

  userOption: {
    width: "100%",
    textAlign: "left",
    padding: "12px",
    border: "none",
    borderBottom: "1px solid #f1ebe5",
    background: "white",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#2b160c",
  },

  userOptionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },

  userOptionMeta: {
    fontSize: "12px",
    color: "#6b625c",
  },

  scoreBadge: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#6a2300",
    background: "#fff1df",
    padding: "2px 8px",
    borderRadius: "6px",
    whiteSpace: "nowrap",
  },

  userOptionActive: {
    background: "#fff1df",
  },

  recommendationBox: {
    marginTop: "14px",
    padding: "12px",
    borderRadius: "12px",
    background: "#eef8ef",
    border: "1px solid #bbf7d0",
  },

  recommendationHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
  },

  recommendButton: {
    border: "none",
    background: "#16a34a",
    color: "white",
    borderRadius: "8px",
    padding: "7px 10px",
    fontWeight: "800",
    cursor: "pointer",
  },

  recommendationList: {
    marginTop: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  recommendationItem: {
    border: "1px solid #bbf7d0",
    background: "white",
    borderRadius: "9px",
    padding: "8px",
    textAlign: "left",
    cursor: "pointer",
  },

  equipmentList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  equipmentChip: {
    border: "1px solid #e0c9b8",
    background: "white",
    color: "#51443a",
    borderRadius: "6px",
    padding: "6px 12px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    textTransform: "capitalize",
  },

  equipmentChipActive: {
    background: "#fff1df",
    color: "#6a2300",
    borderColor: "#6a2300",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 10px",
    borderRadius: "12px",
    border: "1px solid #eadfd2",
    background: "#fffdf8",
    fontSize: "13px",
    minHeight: "38px",
    maxHeight: "50px",
    resize: "none",
    color: "#2b160c",
    caretColor: "#2b160c",
  },

  emptyText: {
    color: "#6b625c",
    margin: "8px 0 0",
  },

  mapPreviewBox: {
    marginTop: "14px",
    border: "1px solid #d6ead8",
    borderRadius: "12px",
    overflow: "hidden",
    background: "white",
  },

  mapHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    background: "#f8fcf8",
    borderBottom: "1px solid #e6efe7",
  },

  mapLegend: {
    fontSize: "12px",
    color: "#6b7280",
  },

  assignModalGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "16px",
    height: "300px",
    marginBottom: "16px",
  },

  assignLeftPanel: {
    minHeight: 0,
    overflow: "hidden",
  },

  modalAssignButton: {
    border: "none",
    background: "#6a2300",
    color: "white",
    borderRadius: "6px",
    padding: "9px 18px",
    fontWeight: "800",
    cursor: "pointer",
  },

  assignFooterActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "14px",
    paddingTop: "14px",
    borderTop: "1px solid #f0e5d8",
  },

  assignRightPanel: {
    minHeight: 0,
    overflow: "hidden",
  },

  assignBottomPanel: {
    marginTop: "14px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px",
    alignItems: "start",
  },

  headerActions: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  caseAccordionCard: {
    borderBottom: "1px solid #eadfd2",
    overflow: "hidden",
  },

  caseAccordionHeader: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: "16px 18px",
    cursor: "pointer",
  },

  caseAccordionBody: {
    borderTop: "1px solid #eadfd2",
    padding: "14px 18px",
  },

  arrowIcon: {
    color: "#0f5f7a",
    fontSize: "18px",
    fontWeight: "900",
  },
};

export default CasesView;