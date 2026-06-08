import loginImage from "../../assets/creative.png";
import logo from "../../assets/עברית-logo.png";

export default function LoginView({
  email,
  setEmail,
  password,
  setPassword,
  message,
  messageType,
  loading,
  handleLogin,
  handleForgotPassword,
}) {
  return (
    <div style={styles.page}>
      {/* Left Side */}

      <div style={styles.left}>
        <div style={styles.logoRow}>
          <img
  src={logo}
  alt="logo"
  style={styles.logo}
/>

          <div>
            <h2 style={styles.brandTitle}>
              Magen Dvorim Adom
            </h2>

            <p style={styles.brandSubtitle}>
              BEE RESCUE PLATFORM
            </p>
          </div>
        </div>

        <h1 style={styles.title}>Welcome back</h1>

        <p style={styles.subtitle}>
          Sign in to manage rescue cases,
          volunteers, and field activity.
        </p>

        {message && (
          <div
            style={{
              ...styles.message,
              ...(messageType === "success"
                ? styles.success
                : styles.error),
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.loginButton}
          >
            {loading ? "Checking..." : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleForgotPassword}
          style={styles.forgotButton}
        >
          Forgot password?
        </button>
        <div style={styles.languageRow}>
  <button style={{ ...styles.langButton, ...styles.langActive }}>English</button>
  <button style={styles.langButton}>עברית</button>
  <button style={styles.langButton}>العربية</button>
</div>
      </div>
    
      {/* Right Side */}

      <div style={styles.right}>
        <img
        src={loginImage}
        alt="Bee Rescue"
        className="floating-image"
        style={styles.sideImage}
/>
      </div>
    </div>
  );
}

const styles = {
 page: {
  height: "100vh",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  background: "#fffdf8",
  overflow: "hidden",
},
 left: {
  height: "100vh",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: "38px 90px",
},

  right: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background: "#fffaf0",
  },

 sideImage: {
  width: "100%",
  height: "100vh",
  objectFit: "cover",
},

  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "50px",
  },

  logo: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
  },

  brandTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#2b160c",
    fontWeight: "800",
  },

  brandSubtitle: {
    color: "#f97316",
    letterSpacing: "3px",
    fontWeight: "700",
  },
  languageRow: {
  marginTop: "30px",
  display: "flex",
  justifyContent: "center",
  gap: "28px",
},

langButton: {
  border: "none",
  background: "transparent",
  color: "#6b625c",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
  paddingBottom: "8px",
},

langActive: {
  color: "#f04f0a",
  borderBottom: "3px solid #f04f0a",
},

 title: {
  fontSize: "48px",
  lineHeight: 1.05,
  color: "#2b160c",
  margin: "34px 0 14px",
  fontWeight: "900",
},

subtitle: {
  color: "#6b7280",
  fontSize: "21px",
  lineHeight: 1.45,
  maxWidth: "440px",
  marginBottom: "28px",
},

  input: {
    width: "100%",
    padding: "20px",
    borderRadius: "18px",
    border: "1px solid #ddd",
    marginBottom: "20px",
    fontSize: "18px",
    boxSizing: "border-box",
  },

  loginButton: {
    width: "100%",
    padding: "18px",
    borderRadius: "18px",
    border: "none",
    background: "#2b160c",
    color: "white",
    fontSize: "22px",
    fontWeight: "700",
    cursor: "pointer",
  },

  forgotButton: {
    marginTop: "25px",
    background: "none",
    border: "none",
    color: "#f97316",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "18px",
  },

  message: {
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "20px",
  },

  success: {
    background: "#dcfce7",
    color: "#166534",
  },

  error: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
};