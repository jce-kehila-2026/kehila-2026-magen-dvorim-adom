// Case management interface.
// Displays rescue cases with filtering, assignment, and status actions.
import "./CasesView.css";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import VolunteerRecommendationMap from "./VolunteerRecommendationMap";
import { useState } from "react";

function CasesView({
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
  sortMode,
  setSortMode,
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
}) {
   // Used to navigate between app pages.
  const navigate = useNavigate();
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const title = currentUserRole === "admin" ? "All Cases" : "Coordinator Cases";

  let subtitle = "";

if (activeFilter === "open") {
  subtitle = "Open rescue cases waiting for assignment or action.";
} else if (activeFilter === "assigned") {
  subtitle = "Cases currently assigned and being handled.";
} else if (activeFilter === "my") {
  subtitle = "Cases assigned directly to you.";
}else {
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

  const getUrgencyStyle = (urgency) => ({
    ...styles.badge,
    ...(urgency === "high"
      ? styles.highBadge
      : urgency === "medium"
      ? styles.mediumBadge
      : styles.lowBadge),
  });

  const currentModalCase = cases.find((caseItem) => caseItem.id === modalState.caseId);

  const closeDetailsModal = () => setDetailsCase(null);

  const openAssignModal = (caseItem) => {
    setRecommendations(null);
    setModalState((state) => ({
      ...state,
      open: true,
      caseId: caseItem.id,
    }));
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
            onClick={() => setActiveFilter("my")}
            style={{
              ...styles.filterButton,
              ...(activeFilter === "my" ? styles.filterActive : {}),
            }}
          >
            My Cases ({myCasesCount})
          </button>

          <button
            onClick={() => setActiveFilter("closed")}
            style={{
              ...styles.filterButton,
              ...(activeFilter === "closed" ? styles.filterActive : {}),
            }}
          >
            History ({closedCases.length})
          </button>
        </div>

        <div style={styles.toolbar} className="cases-toolbar">
          <input
            placeholder="Search by requester, phone, city, status..."
            value={caseSearch}
            onChange={(event) => setCaseSearch(event.target.value)}
            style={styles.searchInput}
          />

          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value)}
            style={styles.sortSelect}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="urgency">Urgency</option>
          </select>
        </div>

        {error && <p style={styles.errorText}>{error}</p>}

        {activeCases.length === 0 && !error ? (
          <div style={styles.emptyState}>No cases match this view.</div>
        ) : (
          <div style={styles.casesList} className="cases-list">
            {activeCases.map((caseItem) => {

  const caseAssignments = assignments[caseItem.id] || [];



  const assignedTo =

    caseAssignments.length > 0

      ? caseAssignments

          .map(

            (assignment) =>

              assignment.volunteer_name ||

              assignment.full_name ||

              assignment.user_name ||

              "Volunteer"

          )

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

      style={styles.caseAccordionCard}

      className="case-accordion-card"

    >

      <button
  type="button"
  style={styles.caseAccordionHeader}
  className="case-accordion-header"
  onClick={() => setExpandedCaseId(isExpanded ? null : caseItem.id)}
>
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    
    <div style={styles.requesterName}>
      👤 {caseItem.requester_first_name} {caseItem.requester_last_name}
    </div>

    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        fontSize: "13px",
        color: "#6b625c",
      }}
    >
      <span>Phone: {caseItem.requester_phone || "—"}</span>

      <span>
        Opened: {cleanDate(caseItem.opened_at)}
      </span>

      <span
        style={getUrgencyStyle(caseItem.urgency || "low")}
      >
        {caseItem.urgency || "low"}
      </span>

      <span
        style={getStatusStyle(caseItem.status || "open")}
      >
        {caseItem.status || "open"}
      </span>
      {caseItem.status === "closed" && (
  <>
    <span>Closed: {cleanDate(caseItem.closed_at)}</span>

    <span style={getStatusStyle("closed")}>
      Result: {getResultLabel(caseItem.result_status)}
    </span>
  </>
)}
    </div>
  </div>

  <span style={styles.arrowIcon}>
    {isExpanded ? "▲" : "▼"}
  </span>
</button>



      {isExpanded && (

        <div style={styles.caseAccordionBody}>

          <div style={styles.caseInfoGrid} className="case-info-grid">

            <div>

            <div style={styles.infoLabel}>Phone</div>
              <div style={styles.infoValue}>{caseItem.requester_phone || "—"}</div>
            </div>



            <div>

              <div style={styles.infoLabel}>City</div>

              <div style={styles.infoValue}>{caseItem.city || "—"}</div>

            </div>



            <div>

              <div style={styles.infoLabel}>Street</div>

              <div style={styles.infoValue}>

                {caseItem.street || "—"} {caseItem.house_number || ""}

              </div>

            </div>



            <div>

              <div style={styles.infoLabel}>Urgency</div>

              <div style={styles.infoValue}>{caseItem.urgency || "low"}</div>

            </div>



            <div>

              <div style={styles.infoLabel}>Status</div>

              <div style={styles.infoValue}>{caseItem.status || "open"}</div>

            </div>



            <div>

              <div style={styles.infoLabel}>Complexity</div>

              <div style={styles.infoValue}>{caseItem.case_complexity || "simple"}</div>

            </div>



            <div>

              <div style={styles.infoLabel}>Opened</div>

              <div style={styles.infoValue}>{formatDate(caseItem.opened_at)}</div>

            </div>



            <div>

              <div style={styles.infoLabel}>Closed At</div>

              <div style={styles.infoValue}>

                {caseItem.status === "closed" ? cleanDate(caseItem.closed_at) : "—"}

              </div>

            </div>
            {caseItem.status === "closed" && (
  <div>
    <div style={styles.infoLabel}>Result Status</div>
    <div style={styles.infoValue}>
      {getResultLabel(caseItem.result_status)}
    </div>
  </div>
)}


            <div>

              <div style={styles.infoLabel}>Assigned To</div>

              <div style={styles.infoValue}>{assignedTo}</div>

            </div>

          </div>



          <div style={styles.caseDescriptionLine} className="case-description-line">

            <strong>Notes / Description:</strong>{" "}

            {caseItem.location_description || "No description provided."}

          </div>



          <div style={styles.caseInlineActions} className="case-inline-actions">

            {caseItem.status !== "closed" ? (

              <>

                <button

                  onClick={() => openAssignModal(caseItem)}

                  style={styles.assignButton}

                >

                  Assign Volunteer

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
              <h2 style={styles.modalTitle}>Assign Volunteer</h2>
              <p style={styles.modalSubtitle}>
                Choose the best available volunteer.
              </p>
            </div>

            <div style={styles.headerActions}>
              <button
                style={styles.modalAssignButton}
                disabled={!modalState.userId || assigning}
                onClick={handleAssignFromModal}
              >
                {assigning ? "Assigning..." : "Assign"}
              </button>

              <button onClick={closeAssignModal} style={styles.iconButton}>
                ×
              </button>
            </div>
          </div>

          <div style={styles.assignModalGrid} className="assign-modal-grid">
            <div style={styles.assignLeftPanel}>
              <label style={styles.label}>Select user</label>

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
                  filteredUsersForModal.map((user) => (
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
                      <strong>{user.full_name || user.email}</strong>
                      <span>
                        {user.phone || "No phone"} · {user.city || "No city"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div style={styles.assignRightPanel}>
              <div style={styles.recommendationBox}>
                <div style={styles.recommendationHeader}>
                  <strong>Recommendation System</strong>

                  <button
                    type="button"
                    onClick={() => handleGetRecommendations(currentModalCase)}
                    style={styles.recommendButton}
                  >
                    Get Recommendations
                  </button>
                </div>

                {recommendations && recommendations.length > 0 && (
                  <div style={styles.recommendationList}>
                    {recommendations.slice(0, 3).map((volunteer) => (
                      <button
                        key={volunteer.id}
                        type="button"
                        onClick={() =>
                          setModalState((state) => ({
                            ...state,
                            userId: volunteer.id,
                          }))
                        }
                        style={{
                          ...styles.recommendationItem,
                          ...(modalState.userId === volunteer.id
                            ? styles.userOptionActive
                            : {}),
                        }}
                      >
                        {volunteer.full_name || volunteer.email} — Score:{" "}
                        {volunteer.recommendationScore}
                      </button>
                    ))}
                  </div>
                )}

                {recommendations && recommendations.length === 0 && (
                  <p style={styles.emptyText}>No available volunteers found.</p>
                )}

                <div style={styles.mapPreviewBox} className="assign-map-box">
                  <div style={styles.mapHeader}>
                    <strong>Volunteer Map</strong>
                    <span style={styles.mapLegend}>📍 Case • 🟢 Volunteers</span>
                  </div>

                  <VolunteerRecommendationMap
                    caseData={currentModalCase}
                    volunteers={recommendations || filteredUsersForModal}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={styles.assignBottomPanel} className="assign-bottom-panel">
            <div>
              <label style={styles.label}>Required equipment</label>

              <div style={styles.equipmentList}>
                {PRESET_EQUIPMENT.map((equipment) => (
                  <label key={equipment} style={styles.equipmentItem}>
                    <input
                      type="checkbox"
                      checked={(modalState.selected || []).includes(equipment)}
                      onChange={(event) => {
                        const checked = event.target.checked;

                        setModalState((state) => ({
                          ...state,
                          selected: checked
                            ? [...(state.selected || []), equipment]
                            : (state.selected || []).filter(
                                (item) => item !== equipment
                              ),
                        }));
                      }}
                    />
                    {equipment}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={styles.label}>Other equipment</label>

              <input
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
    color: "#2b160c",
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

  main: {
    padding: "28px",
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
    textAlign: "center",
  },

  title: {
    margin: "0 0 4px",
    color: "#f57c00",
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
    borderRadius: "12px",
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
  },

  sortSelect: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #eadfd2",
    background: "white",
    fontWeight: "800",
    color: "#3d332b",
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
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px 40px",
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
    borderRadius: "999px",
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
    borderRadius: "9px",
    padding: "7px 11px",
    fontWeight: "800",
    cursor: "pointer",
  },

  closeButton: {
    border: "1px solid #fecaca",
    background: "white",
    color: "#dc2626",
    borderRadius: "9px",
    padding: "7px 11px",
    fontWeight: "800",
    cursor: "pointer",
  },

  reopenButton: {
    border: "1px solid #bbf7d0",
    background: "#ecfdf3",
    color: "#16a34a",
    borderRadius: "9px",
    padding: "7px 11px",
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
  maxWidth: "980px",
  height: "82vh",
  overflow: "hidden",
  background: "white",
  borderRadius: "18px",
  padding: "22px",
  border: "1px solid #f0e5d8",
},
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
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
    fontSize: "14px",
  },

  iconButton: {
    border: "none",
    background: "#fff8ef",
    color: "#d95f00",
    borderRadius: "10px",
    width: "34px",
    height: "34px",
    fontSize: "22px",
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

  equipmentItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#fff8ef",
    border: "1px solid #f3c49a",
    borderRadius: "9px",
    padding: "8px 10px",
    textTransform: "capitalize",
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
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  height: "360px",
},

assignLeftPanel: {
  minHeight: 0,
  overflow: "hidden",
},
modalAssignButton: {
  border: "none",
  background: "#16a34a",
  color: "white",
  borderRadius: "10px",
  padding: "10px 16px",
  fontWeight: "800",
  cursor: "pointer",
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
  background: "white",
  border: "1px solid #eadfd2",
  borderRadius: "14px",
  overflow: "hidden",
  marginBottom: "10px",
},

caseAccordionHeader: {
  width: "100%",
  border: "none",
  background: "white",
  padding: "16px 18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
},

caseAccordionBody: {
  borderTop: "1px solid #eadfd2",
  padding: "18px",
},

arrowIcon: {
  color: "#0f5f7a",
  fontSize: "18px",
  fontWeight: "900",
},
};

export default CasesView;