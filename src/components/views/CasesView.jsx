// Case management interface.
// Displays rescue cases with filtering, assignment, and status actions.

import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import VolunteerRecommendationMap from "./VolunteerRecommendationMap";

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
  const navigate = useNavigate();

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
    <div style={styles.page}>
      <aside style={styles.sidebar}>
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
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>

          <button
            style={{ ...styles.navItem, ...styles.navItemActive }}
            onClick={() => navigate("/cases")}
          >
            Cases
          </button>

       <button
            style={styles.navItem}
            onClick={() => navigate("/users")}
          >
            Users
          </button>

          {currentUserRole === "admin" && (
            <button
              style={styles.navItem}
              onClick={() => navigate("/reports")}
            >
              Reports
            </button>
          )}

          <button
            style={styles.navItem}
            onClick={() => navigate("/profile")}
          >
            Profile
          </button>
        </nav>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main style={styles.main}>
        <section style={styles.contentCard}>
          <header style={styles.header}>
            <h1 style={styles.title}>{title}</h1>
            <p style={styles.subtitle}>{subtitle}</p>
          </header>

          <div style={styles.filters}>
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

          <div style={styles.toolbar}>
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
            <div style={styles.casesList}>
              <div style={styles.listHeader}>
                <span>Requester</span>
                <span>Phone</span>
                <span>Location</span>

                {activeFilter === "closed" ? (
                  <>
                    <span>Closed At</span>
                    <span>Result</span>
                  </>
                ) : (
                  <>
                    <span>Urgency</span>
                    <span>Status</span>
                  </>
                )}

                <span>Action</span>
              </div>

              {activeCases.map((caseItem) => (
                <div key={caseItem.id} style={styles.caseRow}>
                  <span style={styles.requesterName}>
                    {caseItem.requester_first_name} {caseItem.requester_last_name}
                  </span>

                  <span>{caseItem.requester_phone || "—"}</span>
                  <span>{caseItem.city || "—"}</span>

                  {activeFilter === "closed" ? (
                    <>
                      <span>{formatDate(caseItem.closed_at)}</span>
                      <span>{getResultLabel(caseItem.result_status)}</span>
                    </>
                  ) : (
                    <>
                      <span style={getUrgencyStyle(caseItem.urgency)}>
                        {caseItem.urgency || "low"}
                      </span>

                      <span style={getStatusStyle(caseItem.status)}>
                        {caseItem.status || "open"}
                      </span>
                    </>
                  )}

                  <button
                    onClick={() => setDetailsCase(caseItem)}
                    style={styles.primaryActionButton}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {detailsCase && (
        <div style={styles.modalOverlay} onClick={closeDetailsModal}>
          <div style={styles.detailsModal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Case Details</h2>
                <p style={styles.modalSubtitle}>
                  {detailsCase.requester_first_name} {detailsCase.requester_last_name}
                </p>
              </div>

              <button onClick={closeDetailsModal} style={styles.iconButton}>
                ×
              </button>
            </div>

            <div style={styles.detailsGrid}>
              <p><strong>Phone:</strong> {detailsCase.requester_phone || "—"}</p>
              <p><strong>City:</strong> {detailsCase.city || "—"}</p>
              <p>
                <strong>Street:</strong> {detailsCase.street || "—"}{" "}
                {detailsCase.house_number || ""}
              </p>
              <p><strong>Urgency:</strong> {detailsCase.urgency || "low"}</p>
              <p><strong>Status:</strong> {detailsCase.status || "open"}</p>
              <p><strong>Complexity:</strong> {detailsCase.case_complexity || "simple"}</p>
              <p><strong>Opened:</strong> {formatDate(detailsCase.opened_at)}</p>
              {detailsCase.status === "closed" && (
                <p><strong>Closed:</strong> {formatDate(detailsCase.closed_at)}</p>
              )}
            </div>

            <div style={styles.descriptionBox}>
              <strong>Notes / Description</strong>
              <p>{detailsCase.location_description || "No description provided."}</p>
            </div>

            {showCaseActions && (
              <div style={styles.modalActions}>
                <button
                  onClick={() => openAssignModal(detailsCase)}
                  style={styles.assignButton}
                >
                  Assign Volunteer
                </button>

                <button
                  onClick={() => beginCloseCase(detailsCase.id)}
                  style={styles.closeButton}
                >
                  Close Case
                </button>
              </div>
            )}

            {detailsCase.status === "closed" && (
              <div style={styles.modalActions}>
                <button
                  onClick={() => handleReopenCase(detailsCase.id)}
                  style={styles.reopenButton}
                >
                  Reopen Case
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {modalState.open && (
        <div style={styles.modalOverlay} onClick={closeAssignModal}>
          <div style={styles.assignModal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Assign Volunteer</h2>
                <p style={styles.modalSubtitle}>Choose the best available volunteer.</p>
              </div>

              <button onClick={closeAssignModal} style={styles.iconButton}>
                ×
              </button>
            </div>

            <label style={styles.label}>Select user</label>
            <input
              placeholder="Search by name..."
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              style={styles.searchInput}
            />

            <div style={styles.userList}>
              {filteredUsersForModal.length === 0 ? (
                <div style={styles.emptyState}>No users found.</div>
              ) : (
                filteredUsersForModal.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setModalState((state) => ({ ...state, userId: user.id }));
                      setUserSearch("");
                    }}
                    style={{
                      ...styles.userOption,
                      ...(modalState.userId === user.id ? styles.userOptionActive : {}),
                    }}
                  >
                    <strong>{user.full_name || user.email}</strong>
                    <span>{user.phone || "No phone"} · {user.city || "No city"}</span>
                  </button>
                ))
              )}
            </div>

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
           <div style={styles.mapPreviewBox}>
              <div style={styles.mapHeader}>
                <strong>Volunteer Map</strong>
                <span style={styles.mapLegend}>
                  📍 Case • 🟢 Volunteers
                </span>
              </div>

              <VolunteerRecommendationMap
                caseData={currentModalCase}
                volunteers={recommendations || filteredUsersForModal}
              />
            </div>
              {recommendations && recommendations.length === 0 && (
                <p style={styles.emptyText}>No available volunteers found.</p>
              )}
            </div>

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
                          : (state.selected || []).filter((item) => item !== equipment),
                      }));
                    }}
                  />
                  {equipment}
                </label>
              ))}
            </div>

            <label style={styles.label}>Other equipment</label>
            <input
              value={modalState.other}
              onChange={(event) =>
                setModalState((state) => ({ ...state, other: event.target.value }))
              }
              style={styles.searchInput}
            />

            <label style={styles.label}>Assignment notes</label>
            <textarea
              value={modalState.notes}
              onChange={(event) =>
                setModalState((state) => ({ ...state, notes: event.target.value }))
              }
              rows={3}
              style={styles.textarea}
            />

            <div style={styles.modalActions}>
              <button style={styles.viewButton} onClick={closeAssignModal}>
                Cancel
              </button>

              <button
                style={styles.assignButton}
                disabled={!modalState.userId || assigning}
                onClick={handleAssignFromModal}
              >
                {assigning ? "Assigning..." : "Assign"}
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
  listHeader: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 0.8fr 0.8fr",
    gap: "10px",
    padding: "12px 14px",
    background: "#fff8ef",
    color: "#51443a",
    fontWeight: "900",
    fontSize: "13px",
  },
  caseRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 0.8fr 0.8fr",
    gap: "10px",
    alignItems: "center",
    padding: "14px",
    borderTop: "1px solid #f1ebe5",
    color: "#1f2933",
    fontSize: "13px",
  },
  requesterName: {
    fontWeight: "800",
    color: "#2b160c",
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
  viewButton: {
    border: "1px solid #ddd6ce",
    background: "white",
    color: "#3d332b",
    borderRadius: "9px",
    padding: "7px 11px",
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
  detailsModal: {
    width: "100%",
    maxWidth: "620px",
    background: "white",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #f0e5d8",
  },
  assignModal: {
    width: "100%",
    maxWidth: "520px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "white",
    borderRadius: "18px",
    padding: "24px",
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
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 18px",
    color: "#2b160c",
    fontSize: "14px",
  },
  descriptionBox: {
    marginTop: "18px",
    padding: "14px",
    borderRadius: "14px",
    background: "#fff8ef",
    color: "#2b160c",
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
    maxHeight: "260px",
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
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #eadfd2",
    background: "#fffdf8",
    fontSize: "14px",
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
};

export default CasesView;