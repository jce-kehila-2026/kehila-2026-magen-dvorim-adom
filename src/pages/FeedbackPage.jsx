import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { submitFeedback, checkFeedbackStatus } from "../services/feedbackService";
import logo from "../assets/logo.png";

function FeedbackPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [language, setLanguage] = useState("he");
  const [showLangMenu, setShowLangMenu] = useState(false);

  const [form, setForm] = useState({
    administrative_rating: "",
    evacuation_rating: "",
    comments: "",
  });

const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkFeedbackStatus(token);
        if (status.feedback_submitted) {
          setSubmitted(true);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStatus();
  }, [token]);

  const t = {
    he: {
      title: "משוב",
      subtitle: "נשמח לשמוע על החוויה שלך",
      admin: "דירוג אדמיניסטרטיבי",
      adminHint: "איכות השירות, המענה האנושי ויעילות התיאום מול המשרד.",
      evac: "דירוג הפינוי",
      evacHint: "מקצועיות המטפל, מהירות הפינוי והצלחת המשימה בשטח.",
      hint: "1 = גרוע, 4 = מצוין",
      rating1: "גרוע",
      rating4: "מצוין",
      comments: "הערות (אופציונלי)",
      submit: "שלח משוב",
      submitting: "שולח...",
      error: "נא למלא את השדות החובה",
    },
    en: {
    title: "Feedback",
    subtitle: "Help us improve our service",
    admin: "Administrative rating",
    adminHint: "Service quality, communication, and coordination.",
    evac: "Evacuation rating",
    evacHint: "Rescuer professionalism, speed, and operation success.",
    hint: "1 = worst, 4 = best",
    rating1: "Poor",
    rating4: "Excellent",
    comments: "Comments (optional)",
    submit: "Submit Feedback",
    submitting: "Submitting...",
    error: "Please fill all required fields",
},
  };

const txt = t[language];

  if (checkingStatus) {
    return (
      <div style={styles.page} dir={language === "he" ? "rtl" : "ltr"}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <img src={logo} alt="logo" style={styles.logo} />
            <p style={styles.subtitle}>
              {language === "he" ? "טוען..." : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={styles.page} dir={language === "he" ? "rtl" : "ltr"}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <img src={logo} alt="logo" style={styles.logo} />
            <h1 style={styles.title}>
              {language === "he" ? "תודה על המשוב!" : "Thank you for your feedback!"}
            </h1>
            <p style={styles.subtitle}>
              {language === "he"
                ? "המשוב שלך התקבל בהצלחה."
                : "Your feedback has been received."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      administrative_rating: true,
      evacuation_rating: true,
    });

    if (!form.administrative_rating || !form.evacuation_rating) {
      setError(txt.error);
      return;
    }

    setError("");
    setLoading(true);
try {
      await submitFeedback({ token, data: form });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRating = (field) => (
    <div style={styles.ratingRow}>
      {[1, 2, 3, 4].map((n) => {
        const selected = form[field] === n;
        const hasError = touched[field] && !form[field];
        const label = n === 1 ? txt.rating1 : n === 4 ? txt.rating4 : "";

        return (
          <div
            key={n}
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                [field]: n
              }))
            }
            style={{
              ...styles.ratingBtn,
              background: selected ? "#FEF3E2" : "#fff",
              borderColor: hasError
                ? "#E85D04"
                : selected
                ? "#F48C06"
                : "#E8DEC0",
            }}
            onMouseEnter={(e) => {
              if (!selected) {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.borderColor = "#F48C06";
              }
            }}
            onMouseLeave={(e) => {
              if (!selected) {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.borderColor = "#E8DEC0";
              }
            }}
          >
            <strong>{n}</strong>
            {label && <span style={styles.ratingLabel}>{label}</span>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      style={styles.page}
      dir={language === "he" ? "rtl" : "ltr"}
    >
      <div style={styles.bgPattern}></div>

      <div style={styles.card}>
        {/* ✅ LANGUAGE */}
        <div style={styles.langWrapper}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            style={styles.langButton}
          >
            🌍 {language === "he" ? "עברית" : "English"} ▼
          </button>

          {showLangMenu && (
            <div
              style={{
                ...styles.langMenu,
                right: language === "he" ? "auto" : 0,
                left: language === "he" ? 0 : "auto",
              }}
            >
              <button
                onClick={() => {
                  setLanguage("he");
                  setShowLangMenu(false);
                }}
                style={styles.langOption}
              >
                עברית
              </button>

              <button
                onClick={() => {
                  setLanguage("en");
                  setShowLangMenu(false);
                }}
                style={styles.langOption}
              >
                English
              </button>
            </div>
          )}
        </div>

        {/* ✅ HEADER */}
        <div style={styles.cardHeader}>
          <img src={logo} alt="logo" style={styles.logo} />
          <h1 style={styles.title}>{txt.title}</h1>
          <p style={styles.subtitle}>{txt.subtitle}</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.section}>
            <label style={styles.label}>{txt.admin} *</label>
            <p style={styles.hint}>{txt.adminHint}</p>
            <p style={styles.hint}>{txt.hint}</p>
            {renderRating("administrative_rating")}

            <label style={styles.label}>{txt.evac} *</label>
            <p style={styles.hint}>{txt.evacHint}</p>
            <p style={styles.hint}>{txt.hint}</p>
            {renderRating("evacuation_rating")}

            <label style={styles.label}>{txt.comments}</label>
            <textarea
              value={form.comments}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  comments: e.target.value,
                }))
              }
              style={{
                ...styles.input,
                background: "#fff",
                color: "#3D1A00",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.submitBtn}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.02)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          >
            {loading ? txt.submitting : txt.submit}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ✅ FINAL STYLES */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#FCF9F0",
    padding: "20px",
    fontFamily: "'Georgia', serif",
  },

  bgPattern: {
    position: "fixed",
    inset: 0,
    opacity: 0.3,
    pointerEvents: "none",
  },

  card: {
    maxWidth: "560px",
    margin: "0 auto",
    background: "#fff",
    borderRadius: "40px",
    border: "1px solid #EFE6D0",
  },

  cardHeader: {
    background: "#FDF8EF",
    padding: "32px",
    textAlign: "center",
  },

  logo: {
    height: "70px",
    marginBottom: "16px",
  },

  title: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#3D1A00",
  },

  subtitle: {
    color: "#9B8B6B",
  },

  form: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  section: {
    border: "1px solid #EFE6D0",
    borderRadius: "28px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  label: {
    fontWeight: 600,
    color: "#5A4A2A",
  },

  hint: {
    fontSize: "12px",
    color: "#B0A088",
  },

  ratingRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
  },

  ratingBtn: {
    padding: "14px",
    borderRadius: "20px",
    border: "2px solid #E8DEC0",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },

  ratingLabel: {
    fontSize: "10px",
    color: "#B0A088",
    fontWeight: "normal",
  },

  input: {
    borderRadius: "20px",
    padding: "12px",
    border: "1px solid #E8DEC0",
  },

  submitBtn: {
    padding: "16px",
    borderRadius: "40px",
    border: "none",
    background: "linear-gradient(135deg, #E85D04, #F48C06)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    transition: "0.2s",
  },

  errorBox: {
    margin: "16px",
    padding: "12px",
    background: "#FEF0F0",
    border: "1px solid #E07A7A",
    borderRadius: "20px",
    color: "#C13B3B",
  },

  langWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "12px 20px",
    position: "relative",
    zIndex: 20,
  },
  

  langButton: {
    background: "#FFFFFF",
    border: "1px solid #E8DEC0",
    borderRadius: "40px",
    padding: "8px 16px",
    color: "#6B5B3A",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  },

  langMenu: {
    position: "absolute",
    top: "44px",
    minWidth: "140px",
    background: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E8DEC0",
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  },

  langOption: {
    padding: "12px 20px",
    border: "none",
    width: "100%",
    color: "#5A4A2A",
    background: "#FFFFFF",
    cursor: "pointer",
  },
};

export default FeedbackPage;