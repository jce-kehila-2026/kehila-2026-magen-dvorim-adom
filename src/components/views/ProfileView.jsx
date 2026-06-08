
export default function ProfileView({
  userProfile,
  formData,
  setFormData,
  citySearch,
  setCitySearch,
  showCityDropdown,
  setShowCityDropdown,
  loading,
  error,
  success,
  handleSubmit,
  ISRAELI_CITIES,
}) {
  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
  <div style={styles.layout}>
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.logoBox}>🐝</div>
        <div>
          <h2 style={styles.brandTitle}>Magen Dvorim<br />Adom</h2>
          <p style={styles.role}>{userProfile?.role}</p>
        </div>
      </div>

      <nav style={styles.nav}>
        <button style={styles.navItem} onClick={() => (window.location.href = "/dashboard")}>Dashboard</button>
        <button style={styles.navItem} onClick={() => (window.location.href = "/cases")}>Cases</button>
        <button style={styles.navItem} onClick={() => (window.location.href = "/users")}>Users</button>
        <button style={styles.navItem} onClick={() => (window.location.href = "/my-cases")}>My Cases</button>
        <button style={{ ...styles.navItem, ...styles.activeNav }}>Profile</button>
      </nav>

      <button style={styles.logoutButton} onClick={() => (window.location.href = "/")}>
        Logout
      </button>
    </aside>

    <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>My Profile</h1>
          <p style={styles.subtitle}>
            Manage your personal information and availability.
          </p>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label>Full Name</label>
                <input
                  value={userProfile?.full_name || ""}
                  disabled
                  style={styles.disabledInput}
                />
              </div>

              <div style={styles.field}>
                <label>Email</label>
                <input
                  value={userProfile?.email || ""}
                  disabled
                  style={styles.disabledInput}
                />
              </div>

              <div style={styles.field}>
                <label>Phone</label>
                <input
                  value={userProfile?.phone || ""}
                  disabled
                  style={styles.disabledInput}
                />
              </div>

              <div style={styles.field}>
                <label>Role</label>
                <input
                  value={userProfile?.role || ""}
                  disabled
                  style={styles.disabledInput}
                />
              </div>
            </div>

            <div style={styles.section}>
              <label>City</label>

              <div style={{ position: "relative" }}>
                <input
                  value={citySearch || formData.city}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowCityDropdown(false), 150)
                  }
                  placeholder="Search city..."
                  style={styles.input}
                />

                {showCityDropdown && (
                  <div style={styles.dropdown}>
                    {ISRAELI_CITIES.filter((city) =>
                      city
                        .toLowerCase()
                        .includes((citySearch || "").toLowerCase())
                    ).map((city) => (
                      <div
                        key={city}
                        style={styles.dropdownItem}
                        onMouseDown={() => {
                          setFormData((prev) => ({
                            ...prev,
                            city,
                          }));

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

            <div style={styles.section}>
              <label style={{ fontWeight: "600" }}>
                Availability
              </label>

              <div style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_available: e.target.checked,
                    }))
                  }
                />

                <span>
                  {formData.is_available
                    ? "🟢 Available"
                    : "🔴 Not Available"}
                </span>
              </div>
            </div>

            <div style={styles.actions}>
              <button
                type="submit"
                disabled={loading}
                style={styles.button}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
  minHeight: "100vh",
  padding: "38px",
  background: "#fffdf8",
},

  card: {
    maxWidth: "900px",
    margin: "0 auto",
    background: "white",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 14px 35px rgba(20,64,48,0.12)",
  },

  title: {
    margin: 0,
    color: "#173b2f",
    fontSize: "36px",
  },

  subtitle: {
    color: "#5f6f68",
    marginBottom: "25px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "24px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  disabledInput: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
  },

  section: {
    marginBottom: "24px",
  },

  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "12px",
    maxHeight: "200px",
    overflowY: "auto",
    zIndex: 10,
  },

  dropdownItem: {
    padding: "10px",
    cursor: "pointer",
  },

  checkboxRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginTop: "10px",
  },

  actions: {
    display: "flex",
    justifyContent: "center",
    marginTop: "24px",
  },
layout: {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  background: "#fffdf8",
  fontFamily: "Arial, sans-serif",
},

sidebar: {
  height: "100vh",
  position: "sticky",
  top: 0,
  background: "#fff8ef",
  borderRight: "1px solid #f0e5d8",
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

logoBox: {
  width: "44px",
  height: "44px",
  borderRadius: "14px",
  display: "grid",
  placeItems: "center",
  background: "#fff",
  border: "1px solid #f0e5d8",
},

brandTitle: {
  margin: 0,
  color: "#2b160c",
  fontSize: "16px",
  fontWeight: "900",
  lineHeight: 1.1,
},

role: {
  margin: "6px 0 0",
  color: "#e85d04",
  fontSize: "13px",
  textTransform: "capitalize",
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
  borderRadius: "14px",
  textAlign: "left",
  fontWeight: "800",
  cursor: "pointer",
},

activeNav: {
  background: "#fff1df",
  color: "#e85d04",
},

logoutButton: {
  marginTop: "auto",
  border: "1px solid #ffb077",
  background: "#f04f0a",
  color: "white",
  borderRadius: "14px",
  padding: "14px",
  fontWeight: "800",
  cursor: "pointer",
},
  button: {
    border: "none",
    padding: "14px 28px",
    borderRadius: "14px",
    background: "#f97316",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  },

  successBox: {
    background: "#dcfce7",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "16px",
  },

  errorBox: {
    background: "#fee2e2",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "16px",
  },
};