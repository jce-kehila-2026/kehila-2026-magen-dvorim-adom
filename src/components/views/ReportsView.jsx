// Reports and analytics dashboard.
// Displays system statistics, charts, and performance insights.

import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/logo.png";
import { USER_ROLES } from "../../services/userSchema";
import { logoutUser } from "../../services/authService";
import "./ReportsView.css";
import { useLanguage } from "../../contexts/LanguageContext";

const CITY_COLORS = ["#ea580c", "#f59e0b", "#16a34a", "#374151", "#8b5cf6", "#dc2626", "#0ea5e9", "#a855f7"];
function ReportsView({ userProfile, stats, loading, error }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Freeze any incoming nav state (e.g. a case linking here) so it survives
  // even after we clear it from history right below.
  const [focusState] = useState(() => location.state || {});
  const focusCaseId = focusState.focusCaseId || null;
  const feedbackCardRefs = useRef({});

  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [modalType, setModalType] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cases = stats?.casesList || [];
  const users = stats?.usersList || [];

  const { language, setLanguage } = useLanguage();
const isHebrew = language === "he";

const navTexts = {
requests: isHebrew ? "פניות" : "Requests",

  users: isHebrew ? "משתמשים" : "Users",
  reports: isHebrew ? "דוחות" : "Reports",
  backup: isHebrew ? "גיבוי" : "Backup",
  profile: isHebrew ? "פרופיל" : "Profile",
  logout: isHebrew ? "התנתק" : "Logout",
};


  const handleLogout = async () => {
    await logoutUser();
  };

  const getCaseYear = (caseItem) => {
    const value =
      caseItem.opened_at ||
      caseItem.created_at ||
      caseItem.closed_at;

    if (!value) return null;

    if (value.toDate) {
      return value.toDate().getFullYear();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getFullYear())) {
      return null;
    }

    return date.getFullYear();
  };

  const years = [
    ...new Set(cases.map((caseItem) => getCaseYear(caseItem)).filter(Boolean)),
  ].sort((a, b) => b - a);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const text = `${c.requester_first_name || ""} ${
        c.requester_last_name || ""
      } ${c.city || ""} ${c.status || ""}`.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;

      const year = getCaseYear(c);

      const matchesYear =
        selectedYear === "all" || String(year) === String(selectedYear);

      return matchesSearch && matchesStatus && matchesYear;
    });
  }, [cases, search, statusFilter, selectedYear]);

  const filteredStats = useMemo(() => {
    const total = filteredCases.length;

    return {
      totalCases: total,
      openCases: filteredCases.filter((c) => c.status === "open").length,
      assignedCases: filteredCases.filter((c) => c.status === "assigned").length,
      closedCases: filteredCases.filter((c) => c.status === "closed").length,
    };
  }, [filteredCases]);

  const filteredCityStats = useMemo(() => {
    const result = {};

    filteredCases.forEach((caseItem) => {
      const city = caseItem.city || "Unknown";

      if (!result[city]) {
        result[city] = {
          city,
          total: 0,
          open: 0,
          assigned: 0,
          closed: 0,
          urgent: 0,
        };
      }

      result[city].total += 1;

      if (caseItem.status === "open") result[city].open += 1;
      if (caseItem.status === "assigned") result[city].assigned += 1;
      if (caseItem.status === "closed") result[city].closed += 1;
      if (caseItem.urgency === "high") result[city].urgent += 1;
    });

    return Object.values(result).sort((a, b) => b.total - a.total);
  }, [filteredCases]);

  // If we arrived from a case's "View in Reports" link and that case's
  // feedback isn't in the latest-10 carousel, pull it in from the full
  // lookup so the link always lands on something real.
  const displayFeedbacks = useMemo(() => {
    const base = stats?.recentFeedbacks || [];

    if (!focusCaseId) return base;
    if (base.some((feedback) => feedback.case_id === focusCaseId)) return base;

    const focused = stats?.feedbackByCaseId?.[focusCaseId];
    return focused ? [focused, ...base] : base;
  }, [stats, focusCaseId]);

  useEffect(() => {
    if (!focusCaseId) return;
    const el = feedbackCardRefs.current[focusCaseId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [focusCaseId, displayFeedbacks]);
  if (loading) {
    return (
      <div style={styles.page}>
        <main style={styles.main}>
          <div style={styles.loading}>Loading reports...</div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.page} className="reports-page">
      <button
        type="button"
        className="mobile-menu-button print-hide"
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
        className={`reports-sidebar print-hide ${mobileMenuOpen ? "mobile-open" : ""}`}
      >
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />

          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{userProfile?.full_name || "Admin"}</p>
          </div>
        </div>

        <nav style={styles.nav}>

  {/* ✅ ADMIN */}
  {userProfile?.role === USER_ROLES.ADMIN && (
    <>
      <button
        style={styles.navItem}
        onClick={() => {
          navigate("/requests");
          setMobileMenuOpen(false);
        }}
      >
        {navTexts.requests}
      </button>

      <button
        style={styles.navItem}
        onClick={() => {
          navigate("/users");
          setMobileMenuOpen(false);
        }}
      >
        {navTexts.users}
      </button>

      <button style={{ ...styles.navItem, ...styles.navItemActive }}>
        {navTexts.reports}
      </button>

      <button
        style={styles.navItem}
        onClick={() => {
          navigate("/backup");
          setMobileMenuOpen(false);
        }}
      >
        {navTexts.backup}
      </button>
    </>
  )}

  {/* ✅ COORDINATOR */}
  {userProfile?.role === USER_ROLES.COORDINATOR && (
    <>
      <button
        style={styles.navItem}
        onClick={() => {
          navigate("/requests");
          setMobileMenuOpen(false);
        }}
      >
        {navTexts.requests}
      </button>

      <button
        style={styles.navItem}
        onClick={() => {
          navigate("/users");
          setMobileMenuOpen(false);
        }}
      >
        {navTexts.users}
      </button>

      <button style={{ ...styles.navItem, ...styles.navItemActive }}>
        {navTexts.reports}
      </button>
    </>
  )}

  {/* ✅ VOLUNTEER (unchanged) */}
  {userProfile?.role === USER_ROLES.VOLUNTEER && (
    <>
      <button
        style={styles.navItem}
        onClick={() => {
          navigate("/dashboard");
          setMobileMenuOpen(false);
        }}
      >
        {navTexts.dashboard}
      </button>
    </>
  )}

  {/* PROFILE (always visible) */}
  <button
    style={styles.navItem}
    onClick={() => {
      navigate("/profile");
      setMobileMenuOpen(false);
    }}
  >
    {navTexts.profile}
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

  <button
    style={styles.logoutButton}
    onClick={() => {
      setMobileMenuOpen(false);
      handleLogout();
    }}
  >
    {navTexts.logout}
  </button>
</div>
      </aside>

      <main style={styles.main} className="reports-main">
        <header style={styles.header}>
          <div style={styles.headerRow} className="reports-header-row">
            <div />
            <div>
              <h1 style={styles.title}>Reports & Statistics</h1>
              <p style={styles.subtitle}>
                Analyze rescue activity, users, cities, urgency, and yearly trends.
              </p>
            </div>
            <button
              className="print-hide reports-print-button"
              style={styles.printButton}
              onClick={() => window.print()}
            >
              Print / Export PDF
            </button>
          </div>
        </header>

        {error && <div style={styles.errorBox}>{error}</div>}

        <section style={styles.filtersBar} className="print-hide reports-filters">
          <input
            placeholder="Search by requester, city, status..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={styles.searchInput}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={styles.select}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            style={styles.select}
          >
            <option value="all">All Years</option>

            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </section>

        {/* ───────────────── Feedback & Satisfaction (primary focus) ───────────────── */}

        <section style={styles.sectionHeader}>
          <h2 style={styles.sectionHeadingTitle}>Feedback & Satisfaction</h2>
        </section>

        <section style={styles.cards} className="reports-cards">
          <StatCard
            title="Average Rating"
            value={`${stats?.averageRating || 0} / 4`}
            color="#f59e0b"
          />
          <StatCard
            title="Total Feedbacks"
            value={stats?.totalFeedbacks || 0}
            color="#ea580c"
          />
          <StatCard
            title="Positive Feedback"
            value={`${stats?.positiveFeedbackRate || 0}%`}
            color="#16a34a"
          />
          <StatCard
            title="Low Ratings"
            value={stats?.negativeFeedbackCount || 0}
            color="#dc2626"
          />
          <StatCard
            title="Response Rate"
            value={`${stats?.responseRate || 0}%`}
            color="#8b5cf6"
            note="% of closed cases that received feedback"
          />
        </section>

        <section style={styles.analyticsGrid} className="reports-analytics-grid">
          <div style={styles.chartPanel}>
            <h2 style={styles.panelTitle}>Rating Breakdown</h2>

            {!stats?.totalFeedbacks ? (
              <p style={styles.emptyText}>No feedback submitted yet.</p>
            ) : (
              (stats?.ratingBreakdown || []).map((item) => (
                <StarBreakdownRow
                  key={item.star}
                  star={item.star}
                  count={item.count}
                  total={stats?.totalFeedbacks || 0}
                />
              ))
            )}
          </div>

          <div
            style={{
              ...styles.chartPanel,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <h2 style={{ ...styles.panelTitle, alignSelf: "flex-start" }}>
              Positive vs Low Rating
            </h2>

            {!stats?.totalFeedbacks ? (
              <p style={styles.emptyText}>No feedback submitted yet.</p>
            ) : (
              <>
                <DonutChart
                  positive={stats?.positiveFeedbackCount || 0}
                  negative={stats?.negativeFeedbackCount || 0}
                />

                <div style={styles.donutLegend}>
                  <span>
                    <span style={{ ...styles.legendDot, background: "#16a34a" }} />
                    Positive ({stats?.positiveFeedbackCount || 0})
                  </span>
                  <span>
                    <span style={{ ...styles.legendDot, background: "#e7e1d9" }} />
                    Low rating ({stats?.negativeFeedbackCount || 0})
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        <section style={styles.chartPanel}>
          <h2 style={styles.panelTitle}>Latest Feedback</h2>

          {!displayFeedbacks.length ? (
            <p style={styles.emptyText}>No feedback submitted yet.</p>
          ) : (
            <div style={styles.feedbackScroll} className="feedback-scroll">
              {displayFeedbacks.map((feedback) => {
                const isFocused = feedback.case_id === focusCaseId;

                return (
                  <div
                    key={feedback.id || feedback.case_id}
                    ref={(el) => { if (el) feedbackCardRefs.current[feedback.case_id] = el; }}
                    style={{ ...styles.feedbackCard, ...(isFocused ? styles.feedbackCardFocused : {}) }}
                    onClick={() => navigate("/requests", { state: { focusCaseId: feedback.case_id } })}
                    title="View this case"
                  >
                    <div style={styles.starsLine}>
                      {"★".repeat(feedback.overallRating)}
                      {"☆".repeat(4 - feedback.overallRating)}
                    </div>

                    <p style={styles.feedbackComment}>
                      {feedback.comments || "No comment provided."}
                    </p>

                    <p style={styles.feedbackMeta}>
                      {feedback.caseCity} · {feedback.caseRequesterName}
                      {feedback.closureRound > 1 && ` · Round ${feedback.closureRound}`}
                    </p>

                    <span style={styles.feedbackCardLink} className="print-hide">View case →</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ───────────────── Case Overview (secondary) ───────────────── */}

        <section style={styles.sectionHeader}>
          <h2 style={styles.sectionHeadingTitle}>Case Overview</h2>
        </section>

        <section style={styles.cards} className="reports-cards">
          <StatCard title="Total Cases" value={filteredStats.totalCases} />
          <StatCard
            title="Open Cases"
            value={filteredStats.openCases}
            color="#f59e0b"
          />
          <StatCard
            title="Assigned Cases"
            value={filteredStats.assignedCases}
            color="#16a34a"
          />
          <StatCard
            title="Closed Cases"
            value={filteredStats.closedCases}
            color="#374151"
          />

          <StatCard
            title="Success Rate"
            value={`${stats?.successRate || 0}%`}
            color="#8b5cf6"
            note="% of closed cases with a successful rescue outcome"
          />
        </section>

        <section style={styles.grid} className="reports-grid">
          <button
            style={styles.panelButton}
            onClick={() => setModalType("cities")}
          >
            <h2 style={styles.panelTitle}>Cases by City</h2>

            {!filteredCityStats.length ? (
              <p style={styles.emptyText}>No city data available.</p>
            ) : (
              <div style={styles.pieRow}>
                <CityPieChart data={filteredCityStats} />

                <div style={styles.pieLegend}>
                  {filteredCityStats.slice(0, 5).map((item, index) => (
                    <span key={item.city} style={styles.pieLegendItem}>
                      <span
                        style={{
                          ...styles.legendDot,
                          background: CITY_COLORS[index % CITY_COLORS.length],
                        }}
                      />
                      {item.city} ({item.total})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <span style={styles.clickHint} className="print-hide">
              Click to view full breakdown →
            </span>
          </button>

          <button
            style={styles.panelButton}
            onClick={() => setModalType("users")}
          >
            <h2 style={styles.panelTitle}>Users Summary</h2>

            <UsersSummaryBar
              admins={stats?.admins || 0}
              coordinators={stats?.coordinators || 0}
              volunteers={stats?.volunteers || 0}
            />

            <span style={styles.clickHint} className="print-hide">
              Click to view full users table →
            </span>
          </button>
        </section>
      </main>

      {modalType && (
        <div style={styles.modalOverlay} onClick={() => setModalType(null)}>
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <button
              style={styles.closeButton}
              onClick={() => setModalType(null)}
            >
              ×
            </button>

            {modalType === "users" && (
              <>
                <h2 style={styles.modalTitle}>Users Summary</h2>

                <div style={styles.tableHeader}>
                  <span>Name</span>
                  <span>Role</span>
                  <span>Phone</span>
                  <span>City</span>
                  <span>Available</span>
                </div>

                {users.map((user) => (
                  <div key={user.id} style={styles.tableRow}>
                    <strong>{user.full_name || user.email || "Unknown"}</strong>
                    <span>{user.role || "—"}</span>
                    <span>{user.phone || "No phone"}</span>
                    <span>{user.city || "No city"}</span>
                    <span>
                      {user.is_available === false ? "Unavailable" : "Available"}
                    </span>
                  </div>
                ))}
              </>
            )}

            {modalType === "cities" && (
              <>
                <h2 style={styles.modalTitle}>Cases by City</h2>

                <div style={styles.cityTableHeader}>
                  <span>City</span>
                  <span>Total</span>
                  <span>Open</span>
                  <span>Assigned</span>
                  <span>Closed</span>
                  <span>Urgent</span>
                </div>

                {filteredCityStats.map((item) => (
                  <div key={item.city} style={styles.cityTableRow}>
                    <strong>{item.city}</strong>
                    <span>{item.total}</span>
                    <span>{item.open}</span>
                    <span>{item.assigned}</span>
                    <span>{item.closed}</span>
                    <span>{item.urgent}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color = "#ea580c", note }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statTitle}>{title}</p>
      <h2 style={{ ...styles.statValue, color }}>{value}</h2>
      {note && <p style={styles.statNote}>{note}</p>}
    </div>
  );
}

function StarBreakdownRow({ star, count, total }) {
  const width = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div style={styles.barRow}>
      <div style={styles.barTop}>
        <span style={{ color: "#f59e0b", letterSpacing: "1px" }}>
          {"★".repeat(star)}
          {"☆".repeat(4 - star)}
        </span>
        <strong>{count}</strong>
      </div>

      <div style={styles.barTrack}>
        <div
          style={{
            ...styles.barFill,
            width: `${width}%`,
            background: "#f59e0b",
          }}
        />
      </div>
    </div>
  );
}

function DonutChart({ positive, negative }) {
  const total = positive + negative;
  const positivePercent = total > 0 ? (positive / total) * 100 : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const positiveLength = (positivePercent / 100) * circumference;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#e7e1d9" strokeWidth="16" />
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke="#16a34a"
        strokeWidth="16"
        strokeDasharray={`${positiveLength} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
      />
      <text
        x="70"
        y="70"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: "20px", fontWeight: "900", fill: "#2b160c" }}
      >
        {Math.round(positivePercent)}%
      </text>
    </svg>
  );
}

function CityPieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.total, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <svg width="120" height="120" viewBox="0 0 140 140">
      {total === 0 ? (
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e7e1d9" strokeWidth="16" />
      ) : (
        data.map((item, index) => {
          const sliceLength = (item.total / total) * circumference;
          const offset = cumulative;
          cumulative += sliceLength;

          return (
            <circle
              key={item.city}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={CITY_COLORS[index % CITY_COLORS.length]}
              strokeWidth="16"
              strokeDasharray={`${sliceLength} ${circumference - sliceLength}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
        })
      )}
    </svg>
  );
}

function UsersSummaryBar({ admins, coordinators, volunteers }) {
  const total = admins + coordinators + volunteers;

  const segments = [
    { label: "Admins", value: admins, color: "#8b5cf6" },
    { label: "Coordinators", value: coordinators, color: "#16a34a" },
    { label: "Volunteers", value: volunteers, color: "#ea580c" },
  ];

  return (
    <div>
      <div style={styles.stackedBarTrack}>
        {segments.map((segment) => {
          const width = total > 0 ? (segment.value / total) * 100 : 0;
          if (width === 0) return null;

          return (
            <div
              key={segment.label}
              style={{
                ...styles.stackedBarSegment,
                width: `${width}%`,
                background: segment.color,
              }}
            />
          );
        })}
      </div>

      <div style={styles.pieLegend}>
        {segments.map((segment) => (
          <span key={segment.label} style={styles.pieLegendItem}>
            <span style={{ ...styles.legendDot, background: segment.color }} />
            {segment.label} ({segment.value})
          </span>
        ))}
      </div>
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
    width: "52px",
    height: "52px",
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
    padding: "12px",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },
  main: {
    padding: "26px 30px",
    boxSizing: "border-box",
    minWidth: 0,
    overflowX: "hidden",
  },
  header: {
    marginBottom: "18px",
  },
  headerRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "12px",
  },
  title: {
    margin: 0,
    color: "#6a2300",
    fontSize: "28px",
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b625c",
    fontSize: "14px",
    textAlign: "center",
  },
  printButton: {
    justifySelf: "end",
    border: "1px solid #6a2300",
    background: "white",
    color: "#6a2300",
    borderRadius: "8px",
    padding: "9px 14px",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  filtersBar: {
    display: "grid",
    gridTemplateColumns: "1fr 180px 160px",
    gap: "10px",
    marginBottom: "16px",
  },
  searchInput: {
    padding: "11px 14px",
    borderRadius: "12px",
    border: "1px solid #eadfd2",
    background: "white",
    fontSize: "13px",
  },
  select: {
    padding: "11px 14px",
    borderRadius: "12px",
    border: "1px solid #eadfd2",
    background: "white",
    fontWeight: "800",
    fontSize: "13px",
    color: "#3d332b",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
    marginBottom: "14px",
  },
  statCard: {
    background: "white",
    border: "1px solid #f0e5d8",
    borderRadius: "14px",
    padding: "14px",
    textAlign: "center",
  },
  statTitle: {
    margin: 0,
    color: "#6b625c",
    fontSize: "12px",
    fontWeight: "800",
  },
  statValue: {
    margin: "6px 0 0",
    fontSize: "26px",
    fontWeight: "900",
  },
  statNote: {
    margin: "6px 0 0",
    color: "#9a8f86",
    fontSize: "10px",
    lineHeight: "1.4",
  },
  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "14px",
  },
  chartPanel: {
    background: "white",
    border: "1px solid #f0e5d8",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  panelButton: {
    background: "white",
    border: "1px solid #f0e5d8",
    borderRadius: "16px",
    padding: "16px",
    textAlign: "left",
    cursor: "pointer",
  },
  panelTitle: {
    margin: "0 0 10px",
    color: "#2b160c",
    fontSize: "16px",
    fontWeight: "900",
  },
  clickHint: {
    display: "inline-block",
    marginTop: "10px",
    color: "#6a2300",
    fontWeight: "900",
    fontSize: "12px",
  },
  barRow: {
    marginBottom: "10px",
  },
  barTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
    color: "#3d332b",
    fontSize: "13px",
    fontWeight: "800",
  },
  barTrack: {
    height: "8px",
    background: "#f3eee8",
    borderRadius: "999px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: "999px",
  },
  emptyText: {
    color: "#6b625c",
    fontSize: "13px",
  },
  errorBox: {
    padding: "12px",
    borderRadius: "12px",
    backgroundColor: "#fde8e8",
    color: "#b42318",
    fontSize: "14px",
    marginBottom: "16px",
  },
  loading: {
    padding: "30px",
    color: "#6b625c",
    fontWeight: "800",
  },
  sectionHeader: {
    marginTop: "4px",
    marginBottom: "8px",
  },
  sectionHeadingTitle: {
    margin: 0,
    color: "#2b160c",
    fontSize: "18px",
    fontWeight: "900",
  },
  donutLegend: {
    display: "flex",
    gap: "14px",
    marginTop: "10px",
    fontSize: "12px",
    color: "#3d332b",
    fontWeight: "700",
  },
  legendDot: {
    display: "inline-block",
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    marginRight: "5px",
  },
  pieRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  pieLegend: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginTop: "10px",
  },
  pieLegendItem: {
    fontSize: "12px",
    color: "#3d332b",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
  },
  stackedBarTrack: {
    display: "flex",
    height: "14px",
    borderRadius: "999px",
    overflow: "hidden",
    background: "#f3eee8",
    marginBottom: "4px",
  },
  stackedBarSegment: {
    height: "100%",
  },
  feedbackScroll: {
    display: "flex",
    gap: "12px",
    overflowX: "auto",
    paddingBottom: "6px",
  },

  starsLine: {
    color: "#f59e0b",
    fontSize: "18px",
    letterSpacing: "2px",
    marginBottom: "6px",
  },
  feedbackComment: {
    margin: "0 0 8px",
    color: "#2b160c",
    fontSize: "14px",
  },
  feedbackMeta: {
    margin: 0,
    color: "#6b625c",
    fontSize: "12px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modal: {
    width: "90%",
    maxWidth: "820px",
    maxHeight: "82vh",
    overflowY: "auto",
    background: "white",
    borderRadius: "22px",
    padding: "28px",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    border: "none",
    background: "#fff1df",
    color: "#6a2300",
    borderRadius: "10px",
    width: "34px",
    height: "34px",
    fontSize: "22px",
    cursor: "pointer",
  },
  modalTitle: {
    margin: "0 0 20px",
    color: "#2b160c",
    fontSize: "24px",
    fontWeight: "900",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr",
    gap: "12px",
    padding: "12px 14px",
    background: "#fff8ef",
    borderRadius: "12px",
    fontWeight: "900",
    color: "#3d332b",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr",
    gap: "12px",
    padding: "14px",
    borderBottom: "1px solid #f1ebe5",
    color: "#3d332b",
    fontSize: "14px",
  },
  cityTableHeader: {
    display: "grid",
    gridTemplateColumns: "1.4fr repeat(5, 1fr)",
    gap: "12px",
    padding: "12px 14px",
    background: "#fff8ef",
    borderRadius: "12px",
    fontWeight: "900",
    color: "#3d332b",
  },
  cityTableRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr repeat(5, 1fr)",
    gap: "12px",
    padding: "14px",
    borderBottom: "1px solid #f1ebe5",
    color: "#3d332b",
    fontSize: "14px",
  },
  bottomSection: {
  marginTop: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
},

languageButton: {
  padding: "13px",
  borderRadius: "14px",
  border: "1px solid #eadfd2",
  background: "#fffaf4",
  color: "#2b160c",
  fontWeight: "800",
  cursor: "pointer",
},
feedbackCard: {
    flex: "0 0 260px",
    background: "#fff8ef",
    border: "1px solid #f0e5d8",
    borderRadius: "14px",
    padding: "14px",
    cursor: "pointer",
  },
  feedbackCardFocused: {
    border: "1px solid #6a2300",
    boxShadow: "0 0 0 2px rgba(106, 35, 0, 0.15)",
  },
  feedbackCardLink: {
    display: "inline-block",
    marginTop: "8px",
    color: "#6a2300",
    fontWeight: "900",
    fontSize: "11px",
  },
};

export default ReportsView;