import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";

import { auth } from "../firebase";
import { loginUser } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import { USER_ROLES } from "../services/userSchema";
import { getDashboardPathByRole } from "../utils/routes";

function Login() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  // Display success/error message
  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
  };

  useEffect(() => {
    if (userProfile) {
      navigate(getDashboardPathByRole(userProfile.role));
    }
  }, [navigate, userProfile]);

  // Redirect user according to role
  const redirectByRole = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        navigate("/admin-dashboard");
        break;

      case USER_ROLES.COORDINATOR:
        navigate("/coordinator-dashboard");
        break;

      case USER_ROLES.VOLUNTEER:
        navigate("/volunteer-dashboard");
        break;

      default:
        navigate("/dashboard");
    }
  };

  // Handle login submit
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showMessage("Please fill in all required fields.", "error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const { profile } = await loginUser(email, password);

      showMessage("Login successful. Welcome back!", "success");

      // Redirect based on user role
      redirectByRole(profile.role);
    } catch (error) {
      console.error("Login failed:", error);
      showMessage(error.message || "Login failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleForgotPassword = async () => {
    if (!email) {
      showMessage("Please enter your email first.", "error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await sendPasswordResetEmail(auth, email.trim().toLowerCase());

      showMessage(
        "Password reset email sent. Please check your inbox.",
        "success"
      );
    } catch (error) {
      console.error("Password reset failed:", error);
      showMessage("Could not send reset email. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.honeycombOne}></div>
      <div style={styles.honeycombTwo}></div>

      <div style={styles.leftPanel}>
        <div style={styles.badge}>🐝 Bee Rescue Platform</div>

        <h1 style={styles.heroTitle}>Magen Dvorim Adom</h1>

        <p style={styles.heroText}>
          A smart volunteer system for managing bee rescue cases, coordinators,
          and field volunteers.
        </p>
      </div>

      <div style={styles.card}>
        <div style={styles.beeIcon}>🐝</div>

        <h2 style={styles.title}>Welcome Back</h2>

        <p style={styles.subtitle}>Sign in to continue your rescue mission</p>

        {message && (
          <div
            style={{
              ...styles.message,
              ...(messageType === "success"
                ? styles.successMessage
                : styles.errorMessage),
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email address"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            style={{
              ...styles.loginButton,
              ...(loading ? styles.disabledButton : {}),
            }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Checking..." : "Login"}
          </button>
        </form>

        <button
          style={styles.forgotButton}
          type="button"
          onClick={handleForgotPassword}
          disabled={loading}
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "70px",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
    background:
      "linear-gradient(135deg, #fff7df 0%, #f6faf5 45%, #e8f3ef 100%)",
    position: "relative",
    overflow: "hidden",
  },

  honeycombOne: {
    position: "absolute",
    width: "260px",
    height: "260px",
    top: "-70px",
    right: "80px",
    background:
      "radial-gradient(circle, rgba(245,181,37,0.35) 0%, rgba(245,181,37,0.08) 60%, transparent 70%)",
    borderRadius: "50%",
  },

  honeycombTwo: {
    position: "absolute",
    width: "360px",
    height: "360px",
    bottom: "-120px",
    left: "-90px",
    background:
      "radial-gradient(circle, rgba(31,122,92,0.22) 0%, rgba(31,122,92,0.08) 55%, transparent 70%)",
    borderRadius: "50%",
  },

  leftPanel: {
    maxWidth: "430px",
    zIndex: 1,
  },

  badge: {
    display: "inline-block",
    padding: "10px 16px",
    borderRadius: "999px",
    backgroundColor: "#fff3c4",
    color: "#7a4a00",
    fontWeight: "bold",
    marginBottom: "20px",
  },

  heroTitle: {
    fontSize: "54px",
    lineHeight: "1.05",
    margin: "0 0 20px",
    color: "#173b2f",
  },

  heroText: {
    fontSize: "18px",
    lineHeight: "1.7",
    color: "#4f5f58",
  },

  card: {
    width: "390px",
    padding: "36px",
    borderRadius: "28px",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    boxShadow: "0 24px 60px rgba(20, 64, 48, 0.18)",
    textAlign: "center",
    zIndex: 1,
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.8)",
  },

  beeIcon: {
    width: "64px",
    height: "64px",
    margin: "0 auto 18px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #ffd166, #f6b73c)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
    boxShadow: "0 10px 22px rgba(246, 183, 60, 0.35)",
  },

  title: {
    margin: "0 0 8px",
    fontSize: "32px",
    color: "#173b2f",
  },

  subtitle: {
    marginBottom: "24px",
    color: "#66736d",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  input: {
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #d8dfdc",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },

  loginButton: {
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #1f7a5c, #145943)",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(31, 122, 92, 0.25)",
  },

  disabledButton: {
    opacity: 0.7,
    cursor: "not-allowed",
  },

  forgotButton: {
    marginTop: "18px",
    border: "none",
    background: "none",
    color: "#1f7a5c",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },

  message: {
    marginBottom: "18px",
    padding: "12px",
    borderRadius: "14px",
    fontSize: "14px",
  },

  successMessage: {
    backgroundColor: "#e5f6ec",
    color: "#146c43",
  },

  errorMessage: {
    backgroundColor: "#fde8e8",
    color: "#b42318",
  },
};

export default Login;