// User profile page.
// Allows users to view and update their personal information.

import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

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
  handleSubmit,
  handleLogout,
  handlePhotoChange,
  ISRAELI_CITIES,
}) {
  const navigate = useNavigate();

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  const profileImage = formData.photo_url;
  const initials = (currentUserName || "U").charAt(0).toUpperCase();

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <img src={logo} alt="Magen Dvorim Adom" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSub}>{currentUserName}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          <button style={styles.navItem} onClick={() => navigate("/dashboard")}>
             Dashboard
          </button>

          {(userProfile?.role === "admin" ||
            userProfile?.role === "coordinator") && (
            <>
              <button
                style={styles.navItem}
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
            </>
          )}

          {userProfile?.role === "admin" && (
            <button
              style={styles.navItem}
              onClick={() => navigate("/reports")}
            >
              Reports
            </button>
          )}

          <button
            style={{ ...styles.navItem, ...styles.activeNav }}
          >
            Profile
          </button>
        </nav>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main style={styles.page}>
        <section style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>My Profile</h1>

            <div style={styles.profileTop}>
              <div style={styles.avatarContainer}>
                {profileImage ? (
                  <img src={profileImage} alt="Profile" style={styles.avatarImage} />
                ) : (
                  <div style={styles.avatarFallback}>{initials}</div>
                )}

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

              <div style={styles.photoActions}>
                <label style={styles.photoButton}>
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: "none" }}
                  />
                </label>

                {profileImage && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        photo_url: "",
                        photo_file: null,
                      }))
                    }
                    style={styles.removePhotoButton}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.sectionTitle}>Personal Information</div>

            <div style={styles.grid}>
              <div style={styles.field}>
                <label>Full Name</label>
                <input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label>Email</label>
                <input value={userProfile.email || ""} disabled style={styles.disabledInput} />
              </div>

              <div style={styles.field}>
                <label>Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label>Role</label>
                <input value={userProfile.role || ""} disabled style={styles.disabledInput} />
              </div>
            </div>

            <div style={styles.sectionTitle}>Location & Availability</div>

            <div style={styles.field}>
              <label>City</label>
              <div style={{ position: "relative" }}>
                <input
                  value={citySearch || formData.city}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
                  placeholder="Search city..."
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

            <div style={styles.availabilityCard}>
              <div>
                <strong>Availability</strong>
                <p style={styles.smallText}>
                  Control whether coordinators can assign you to active cases.
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
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? "Saving..." : "Save Changes"}
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
  border: "none",
  background: "#f97316",
  color: "white",
  borderRadius: "14px",
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
    borderRadius: "26px",
    padding: "30px",
    boxShadow: "0 20px 70px rgba(43, 22, 12, 0.06)",
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
    color: "#173b2f",
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

  avatarImage: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #f0e5d8",
  },

  avatarFallback: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#fff1df",
    color: "#e85d04",
    fontSize: "38px",
    fontWeight: "900",
    border: "1px solid #f3c49a",
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

  photoActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  photoButton: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#e85d04",
    cursor: "pointer",
  },

  removePhotoButton: {
    border: "none",
    background: "transparent",
    color: "#dc2626",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  sectionTitle: {
    margin: "22px 0 14px",
    color: "#2b160c",
    fontSize: "16px",
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
    borderRadius: "12px",
    border: "1px solid #eadfd2",
    background: "#fffdf8",
    fontSize: "14px",
  },

  disabledInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#6b7280",
    fontSize: "14px",
  },

  dropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #eadfd2",
    borderRadius: "12px",
    maxHeight: "200px",
    overflowY: "auto",
    zIndex: 10,
    boxShadow: "0 12px 25px rgba(43, 22, 12, 0.08)",
  },

  dropdownItem: {
    padding: "11px 14px",
    cursor: "pointer",
    color: "#2b160c",
  },

  availabilityCard: {
    marginTop: "10px",
    padding: "16px",
    borderRadius: "18px",
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
    marginTop: "24px",
  },

  button: {
    border: "none",
    padding: "13px 24px",
    borderRadius: "14px",
    background: "#f97316",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
  },

  successBox: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "16px",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "16px",
  },
};