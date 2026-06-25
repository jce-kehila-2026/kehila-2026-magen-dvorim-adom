import { useState, useEffect } from "react";
import logo from "../../assets/logo.png";
import creativeImage from "../../assets/creative.png";

export default function LoginView({
  email, setEmail, password, setPassword, message, messageType, loading, handleLogin, handleForgotPassword,
  language, setLanguage 
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const texts = {
  en: {
    welcome: "Welcome back",
    subtitle: "Sign in to manage rescue cases, volunteers, and field activity.",
    email: "Enter email address",
    password: "Enter password",
    login: "Login",
    checking: "Checking...",
    forgot: "Forgot password?"
  },
  he: {
    welcome: "ברוך שובך",
    subtitle: "התחבר לניהול קריאות חילוץ, מתנדבים ופעילות בשטח.",
    email: "הכנס אימייל",
    password: "הכנס סיסמה",
    login: "התחבר",
    checking: "בודק...",
    forgot: "שכחת סיסמה?"
  }
};

const t = texts[language];
  return (
    <div style={styles.page}>
      <img src={creativeImage} alt="Background" style={styles.bgImage} />
      
      <div style={{ ...styles.card, padding: isMobile ? "20px" : "40px", width: isMobile ? "90%" : "500px" }}>
        
        <div style={styles.logoRow}>
          <img src={logo} alt="logo" style={styles.logo} />
          <div>
            <h2 style={styles.brandTitle}>Magen Dvorim Adom</h2>
            <p style={styles.brandSubtitle}>BEE RESCUE PLATFORM</p>
          </div>
        </div>

        <h1 style={{
          ...styles.title,
          direction: language === "he" ? "rtl" : "ltr",
          textAlign: language === "he" ? "right" : "left"
        }}>
          {t.welcome}
        </h1>
        
        <p style={{
          ...styles.subtitle,
          direction: language === "he" ? "rtl" : "ltr",
          textAlign: language === "he" ? "right" : "left"
        }}>
          {t.subtitle}
        </p>


        {message && (
         <div
          style={{
            ...styles.message,
            ...(messageType === "success" ? styles.success : styles.error),
            direction: language === "he" ? "rtl" : "ltr",
            textAlign: language === "he" ? "right" : "left",
            backdropFilter: "blur(10px)",
            background: "rgba(255,255,255,0.25)",
            border: "1px solid rgba(255,255,255,0.3)"
          }}
        >
          <>
            <div>
              {language === "he" ? message?.he : message?.en}
            </div>
          </>
        </div>
        )}

        <form onSubmit={handleLogin}>
          <input type="email" placeholder={t.email} value={email} disabled={loading} onChange={(e) => setEmail(e.target.value)}style={{
  ...styles.input,
  textAlign: language === "he" ? "right" : "left"
}}
 />
          <input type="password" placeholder={t.password} value={password} disabled={loading} onChange={(e) => setPassword(e.target.value)} style={{
  ...styles.input,
  textAlign: language === "he" ? "right" : "left"
}} />
          <button type="submit" disabled={loading} style={styles.loginButton}>
            {loading ? t.checking : t.login}
          </button>
        </form>


<button
  type="button"
  onClick={handleForgotPassword}
  style={{
    ...styles.forgotButton,
    textAlign: "center",
    width: "100%",
    direction: language === "he" ? "rtl" : "ltr"
  }}
>
  {t.forgot}
</button>


        <div style={styles.languageRow}>
          <button onClick={() => setLanguage("en")} style={{ ...styles.langButton, ...(language === "en" ? styles.langActive : {}) }}>EN</button>
          <button onClick={() => setLanguage("he")} style={{ ...styles.langButton, ...(language === "he" ? styles.langActive : {}) }}>HE</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { 
    position: "fixed", top: 0, left: 0, height: "100vh", width: "100vw",
    display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden",
    backgroundColor: "#2b160c" 
  },
  bgImage: {
    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
    objectFit: "cover", objectPosition: "center", zIndex: 0 
  },
  card: { 
    display: "flex", flexDirection: "column", justifyContent: "center", 
    boxSizing: "border-box", zIndex: 1,
    backgroundColor: "transparent",
    backdropFilter: "none",
    borderRadius: "0",
    border: "none",
    boxShadow: "none",
    maxHeight: "90vh"
  },
  logoRow: { display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" },
  logo: { 
    width: "80px", height: "80px", borderRadius: "15px", 
    borderWidth: "1px", borderStyle: "solid", borderColor: "#2b160c", 
    flexShrink: 0 
  },
  brandTitle: { margin: 0, fontSize: "18px", color: "#2b160c", textShadow: "0 0 5px rgba(255,255,255,0.5)" },
  brandSubtitle: { margin: 0, color: "#f97316", fontWeight: "700", fontSize: "12px", letterSpacing: "2px" },
  languageRow: { marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" },
  langButton: { 
    padding: "5px 15px", borderRadius: "20px", 
    borderWidth: "1px", borderStyle: "solid", borderColor: "#2b160c", 
    background: "none", cursor: "pointer", fontWeight: "bold", color: "#2b160c" 
  },
  langActive: { borderColor: "#f04f0a", color: "#f04f0a", background: "rgba(255,255,255,0.3)" },
  title: { fontSize: "40px", color: "#2b160c", margin: "10px 0", textShadow: "0 0 5px rgba(255,255,255,0.5)" },
  subtitle: { color: "#4a352a", fontSize: "18px", marginBottom: "20px", fontWeight: "500", textShadow: "0 0 5px rgba(255,255,255,0.3)" },
  input: { 
    width: "100%", padding: "15px", borderRadius: "12px", 
    borderWidth: "1px", borderStyle: "solid", borderColor: "#2b160c", 
    marginBottom: "15px", boxSizing: "border-box", backgroundColor: "rgba(255,255,255,0.3)" 
  },
  loginButton: { width: "100%", padding: "15px", borderRadius: "12px", border: "none", background: "#2b160c", color: "white", cursor: "pointer", fontSize: "18px" },
  forgotButton: { background: "none", border: "none", color: "#f97316", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  message: { padding: "10px", borderRadius: "8px", marginBottom: "15px" },
 success: { color: "#166534" },
error: { color: "#b91c1c" }

};