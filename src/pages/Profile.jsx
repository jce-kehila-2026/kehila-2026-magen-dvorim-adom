import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { updateUserProfile } from "../services/userService";

function Profile() {
  const { userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    city: "",
    is_available: true,
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        city: userProfile.city || "",
        is_available:
          typeof userProfile.is_available === "boolean"
            ? userProfile.is_available
            : true,
      });
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await updateUserProfile(userProfile.uid, {
        city: formData.city.trim(),
        is_available: Boolean(formData.is_available),
      });

      await refreshUserProfile();
      setSuccess("Profile updated successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.panel}>
          <div style={styles.header}>
            <h1 style={styles.title}>My Profile 🐝</h1>
            <p style={styles.subtitle}>
              Manage your profile and availability.
            </p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Basic Info */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Basic Information</h2>

              {["full_name", "email", "phone", "role"].map((field) => (
                <div key={field} style={styles.formGroup}>
                  <label style={styles.label}>
                    {field.replace("/", " ").replace("_", " ")}
                  </label>
                  <input
                    value={userProfile[field] || ""}
                    disabled
                    style={styles.inputDisabled}
                  />
                </div>
              ))}
            </div>

            {/* Location */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Location</h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>City</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter your city"
                  style={styles.input}
                />
              </div>
            </div>

            {/* Availability */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Availability</h2>

              <label style={styles.toggleContainer}>
                <div
                  style={{
                    ...styles.toggleSwitch,
                    background: formData.is_available
                      ? "#f4c542"
                      : "#ddd",
                  }}
                >
                  <div
                    style={{
                      ...styles.toggleCircle,
                      transform: formData.is_available
                        ? "translateX(24px)"
                        : "translateX(0)",
                    }}
                  />
                </div>

                <span style={styles.toggleLabel}>
                  {formData.is_available
                    ? "Available ✅"
                    : "Not Available ❌"}
                </span>

                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_available: e.target.checked,
                    }))
                  }
                  style={{ display: "none" }}
                />
              </label>
            </div>

            {/* Submit */}
            <div style={styles.actions}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.button,
                  opacity: loading ? 0.7 : 1,
                }}
              >
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
  page: {
    padding: "24px",
    maxWidth: "900px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    background: "linear-gradient(180deg, #fffdf5, #f7fbe7)",
    minHeight: "100vh",
  },

  panel: {
    background: "white",
    borderRadius: "30px",
    padding: "36px",
    boxShadow: "0 20px 70px rgba(0,0,0,0.08)",
    border: "1px solid #f3e7c9",
  },

  header: {
    marginBottom: "30px",
  },

  title: {
    fontSize: "30px",
    color: "#2d4a3a",
    margin: 0,
  },

  subtitle: {
    color: "#6a7f73",
  },

  section: {
    marginBottom: "20px",
    padding: "20px",
    borderRadius: "18px",
    background: "#fffaf0",
    border: "1px solid #f3e7c9",
  },

  sectionTitle: {
    marginBottom: "16px",
    fontWeight: 700,
    color: "#2d4a3a",
  },

  formGroup: {
    marginBottom: "16px",
  },

  label: {
    fontWeight: 600,
    fontSize: "14px",
    marginBottom: "6px",
    display: "block",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #f0dba8",
    background: "#fffdf5",
  },

  inputDisabled: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #eee",
    background: "#f8f8f8",
    color: "#888",
  },

  toggleContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
  },

  toggleSwitch: {
    width: "50px",
    height: "26px",
    borderRadius: "999px",
    position: "relative",
  },

  toggleCircle: {
    width: "20px",
    height: "20px",
    background: "white",
    borderRadius: "50%",
    position: "absolute",
    top: "3px",
    left: "3px",
    transition: "0.2s",
  },

  toggleLabel: {
    fontWeight: 600,
    color: "#2d4a3a",
  },

  button: {
    padding: "14px 24px",
    background: "#f4c542",
    border: "none",
    borderRadius: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(244,197,66,0.3)",
  },

  actions: {
    marginTop: "20px",
  },

  successBox: {
    background: "#fff7d6",
    border: "1px solid #f4c542",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "20px",
  },

  errorBox: {
    background: "#fdecea",
    border: "1px solid #f5c6cb",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
};

export default Profile;