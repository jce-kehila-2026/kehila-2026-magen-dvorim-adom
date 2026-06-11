import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { createCase } from "../services/caseService";
import {
  getValidIntakeFormForRequester,
  markIntakeFormSubmitted,
} from "../services/intakeFormService";
import { getUserById } from "../services/userService";

function normalizePhone(phone) {
  return phone.replace(/\D/g, "");
}

const ISRAELI_CITIES = [
  "Jerusalem", "Tel Aviv", "Haifa", "Rishon LeZion", "Petah Tikva",
  "Ashdod", "Netanya", "Beer Sheva", "Bnei Brak", "Holon",
  "Bat Yam", "Ramat Gan", "Ashkelon", "Rehovot", "Herzliya",
  "Kfar Saba", "Modi'in", "Hadera", "Nazareth", "Lod",
  "Ramla", "Ra'anana", "Nahariya", "Givatayim", "Hod HaSharon",
  "Rosh HaAyin", "Acre", "Afula", "Nes Ziona", "Eilat",
  "Tiberias", "Safed", "Dimona", "Kiryat Gat", "Kiryat Ata",
  "Kiryat Bialik", "Kiryat Motzkin", "Kiryat Ono", "Kiryat Yam",
  "Netivot", "Ofakim", "Or Yehuda", "Yehud", "Azur",
  "Tayibe", "Umm al-Fahm", "Shfaram", "Sakhnin", "Tamra",
  "Arraba", "Maghar", "Tira", "Qalansawe", "Kafr Qasim",
  "Kafr Manda", "Nof HaGalil", "Ma'alot-Tarshiha", "Shlomi",
  "Tirat Carmel", "Nesher", "Yokneam", "Zichron Yaakov",
  "Caesarea", "Pardes Hanna", "Binyamina", "Or Akiva",
  "Migdal HaEmek", "Bet She'an", "Bet Shemesh", "Modi'in Illit",
  "Beitar Illit", "Ariel", "Maale Adumim",
];

function SubmitCase() {
  const [searchParams] = useSearchParams();
  const coordinatorIdFromUrl = searchParams.get("coordinator");

  const [coordinatorName, setCoordinatorName] = useState("");

  useEffect(() => {
  if (!coordinatorIdFromUrl) return;

  const loadCoordinator = async () => {
    try {
      const user = await getUserById(coordinatorIdFromUrl);
      if (user) {
        setCoordinatorName(user.full_name || user.email);
      }
    } catch (err) {
      console.error("Failed to load coordinator:", err);
    }
  };

  loadCoordinator();
}, [coordinatorIdFromUrl]);

  const [formData, setFormData] = useState({
    requester_first_name: "",
    requester_last_name: "",
    requester_phone: "",
    city: "",
    street: "",
    house_number: "",
    location_description: "",
    height_from_ground: "",
    floor: "",
    navigation_link: "",
    urgency: "",
    first_seen: "",
    coordinator_phone: "",
    agreeToTerms: false,
  });

  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const isRequired = (field) => {
    const required = [
      "requester_first_name", "requester_last_name", "requester_phone",
      "city", "street", "location_description",
      "height_from_ground", "floor", "urgency",
    ];
    // coordinator_phone only required if no coordinator in URL
    if (!coordinatorIdFromUrl) required.push("coordinator_phone");
    return required.includes(field);
  };

  const fieldError = (field) => {
    if (!touched[field]) return null;
    const val = formData[field];
    if (isRequired(field) && !val) return "This field is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const allRequired = [
      "requester_first_name", "requester_last_name", "requester_phone",
      "city", "street", "location_description",
      "height_from_ground", "floor", "urgency",
    ];
    if (!coordinatorIdFromUrl) allRequired.push("coordinator_phone");

    const newTouched = {};
    allRequired.forEach((f) => (newTouched[f] = true));
    setTouched((prev) => ({ ...prev, ...newTouched }));

    const requesterPhone = normalizePhone(formData.requester_phone);

    if (
      !formData.requester_first_name || !formData.requester_last_name ||
      !requesterPhone || !formData.city || !formData.street ||
      !formData.location_description || !formData.height_from_ground ||
      !formData.floor || !formData.urgency
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!coordinatorIdFromUrl && !formData.coordinator_phone) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("You must agree to the terms to continue.");
      return;
    }

    setLoading(true);

    try {
      // Use coordinator_id from URL if available, otherwise use phone
      const intakeForm = await getValidIntakeFormForRequester({
        requester_phone: requesterPhone,
        coordinator_id: coordinatorIdFromUrl || undefined,
        coordinator_phone: coordinatorIdFromUrl
          ? undefined
          : normalizePhone(formData.coordinator_phone),
      });

      if (!intakeForm) {
        setError("No valid request form found. It may not exist, have expired, or already been used.");
        setLoading(false);
        return;
      }

      const caseId = await createCase({
        requester_first_name: formData.requester_first_name,
        requester_last_name: formData.requester_last_name,
        requester_phone: requesterPhone,
        city: formData.city,
        street: formData.street,
        house_number: formData.house_number,
        location_description: formData.location_description,
        height_from_ground: Number(formData.height_from_ground),
        floor: formData.floor,
        navigation_link: formData.navigation_link.trim() || null,
        urgency: formData.urgency,
        first_seen: formData.first_seen || null,
        // pass coordinator_id directly if from URL, otherwise use phone
        ...(coordinatorIdFromUrl
          ? { coordinator_id: coordinatorIdFromUrl, coordinator_phone: "" }
          : { coordinator_phone: normalizePhone(formData.coordinator_phone) }),
      });

      await markIntakeFormSubmitted(intakeForm.id, caseId);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Thank you screen ──────────────────────────────────────────
  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.thankYouCard}>
          <div style={s.beeIcon}>🐝</div>
          <h1 style={s.thankYouTitle}>Thank you!</h1>
          <p style={s.thankYouText}>
            Your request has been received. Our team will be in touch with you shortly.
          </p>
          <div style={s.thankYouNote}>
            You can close this page now.
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.cardHeader}>
          <div style={s.headerBee}>🐝</div>
          <h1 style={s.title}>Magen Dvorim Adom - Bee Rescue Request</h1>
          <p style={s.subtitle}>
            Please fill in the details below so our team can help rescue the bees.
          </p>
        </div>
        {coordinatorName && (
          <div style={{
            background: "#FAEEDA",
            border: "1px solid #EF9F27",
            padding: "8px 12px",
            borderRadius: "10px",
            fontSize: "13px",
            color: "#854F0B",
            marginTop: "10px",
            textAlign: "center",
          }}>
            This form was sent by <strong>{coordinatorName}</strong>
          </div>
        )}


        {error && (
          <div style={s.errorBox}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <fieldset disabled={loading} style={{ border: "none", padding: 0, margin: 0 }}>

            {/* ── Section 1: About You ── */}
            <div style={s.section}>
              <div style={s.sectionHeader}>
                <span style={s.sectionIcon}>👤</span>
                <h2 style={s.sectionTitle}>About You</h2>
              </div>

              <div style={s.row}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>First name <span style={s.req}>*</span></label>
                  <input
                    name="requester_first_name"
                    value={formData.requester_first_name}
                    onChange={handleChange}
                    onBlur={() => handleBlur("requester_first_name")}
                    placeholder="Your first name"
                    style={{
                      ...s.input,
                      borderColor: fieldError("requester_first_name") ? "#e74c3c" : "#e0d4b8",
                    }}
                  />
                  {fieldError("requester_first_name") && (
                    <span style={s.fieldError}>{fieldError("requester_first_name")}</span>
                  )}
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>Last name <span style={s.req}>*</span></label>
                  <input
                    name="requester_last_name"
                    value={formData.requester_last_name}
                    onChange={handleChange}
                    onBlur={() => handleBlur("requester_last_name")}
                    placeholder="Your last name"
                    style={{
                      ...s.input,
                      borderColor: fieldError("requester_last_name") ? "#e74c3c" : "#e0d4b8",
                    }}
                  />
                  {fieldError("requester_last_name") && (
                    <span style={s.fieldError}>{fieldError("requester_last_name")}</span>
                  )}
                </div>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Your phone number <span style={s.req}>*</span></label>
                <input
                  name="requester_phone"
                  value={formData.requester_phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur("requester_phone")}
                  placeholder="05X-XXX-XXXX"
                  type="tel"
                  style={{
                    ...s.input,
                    borderColor: fieldError("requester_phone") ? "#e74c3c" : "#e0d4b8",
                  }}
                />
                {fieldError("requester_phone") && (
                  <span style={s.fieldError}>{fieldError("requester_phone")}</span>
                )}
              </div>
            </div>

            {/* ── Section 2: Location ── */}
            <div style={s.section}>
              <div style={s.sectionHeader}>
                <span style={s.sectionIcon}>📍</span>
                <h2 style={s.sectionTitle}>Location of the Bees</h2>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>City <span style={s.req}>*</span></label>
                <div style={{ position: "relative" }}>
                  <input
                    value={citySearch || formData.city}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      setShowCityDropdown(true);
                      setTouched((prev) => ({ ...prev, city: true }));
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setShowCityDropdown(false), 150);
                      setTouched((prev) => ({ ...prev, city: true }));
                    }}
                    placeholder="Search your city..."
                    style={{
                      ...s.input,
                      borderColor: (touched.city && !formData.city) ? "#e74c3c" : "#e0d4b8",
                    }}
                  />
                  {showCityDropdown && (
                    <div style={s.dropdown}>
                      {ISRAELI_CITIES
                        .filter((c) => c.toLowerCase().includes((citySearch || "").toLowerCase()))
                        .map((city) => (
                          <div
                            key={city}
                            onMouseDown={() => {
                              setFormData((prev) => ({ ...prev, city }));
                              setCitySearch("");
                              setShowCityDropdown(false);
                            }}
                            style={s.dropdownItem}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#fff8ec"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                          >
                            {city}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {touched.city && !formData.city && (
                  <span style={s.fieldError}>This field is required</span>
                )}
                {formData.city && (
                  <span style={s.selectedHint}>Selected: <strong>{formData.city}</strong></span>
                )}
              </div>

              <div style={s.row}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Street <span style={s.req}>*</span></label>
                  <input
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    onBlur={() => handleBlur("street")}
                    placeholder="Street name"
                    style={{
                      ...s.input,
                      borderColor: fieldError("street") ? "#e74c3c" : "#e0d4b8",
                    }}
                  />
                  {fieldError("street") && <span style={s.fieldError}>{fieldError("street")}</span>}
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>House number</label>
                  <input
                    name="house_number"
                    value={formData.house_number}
                    onChange={handleChange}
                    placeholder="e.g. 12"
                    style={s.input}
                  />
                </div>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>
                  Description of bee location <span style={s.req}>*</span>
                </label>
                <p style={s.hint}>Where exactly are the bees? e.g. "on the third floor balcony railing"</p>
                <textarea
                  name="location_description"
                  value={formData.location_description}
                  onChange={handleChange}
                  onBlur={() => handleBlur("location_description")}
                  placeholder="Describe exactly where the bees are..."
                  rows={3}
                  style={{
                    ...s.input,
                    resize: "vertical",
                    minHeight: "80px",
                    borderColor: fieldError("location_description") ? "#e74c3c" : "#e0d4b8",
                  }}
                />
                {fieldError("location_description") && (
                  <span style={s.fieldError}>{fieldError("location_description")}</span>
                )}
              </div>

              <div style={s.row}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Height from ground (meters) <span style={s.req}>*</span></label>
                  <input
                    name="height_from_ground"
                    value={formData.height_from_ground}
                    onChange={handleChange}
                    onBlur={() => handleBlur("height_from_ground")}
                    placeholder="e.g. 3"
                    type="number"
                    min="0"
                    style={{
                      ...s.input,
                      borderColor: fieldError("height_from_ground") ? "#e74c3c" : "#e0d4b8",
                    }}
                  />
                  {fieldError("height_from_ground") && (
                    <span style={s.fieldError}>{fieldError("height_from_ground")}</span>
                  )}
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>Floor <span style={s.req}>*</span></label>
                  <input
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    onBlur={() => handleBlur("floor")}
                    placeholder="e.g. 2 or Ground"
                    style={{
                      ...s.input,
                      borderColor: fieldError("floor") ? "#e74c3c" : "#e0d4b8",
                    }}
                  />
                  {fieldError("floor") && <span style={s.fieldError}>{fieldError("floor")}</span>}
                </div>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Navigation link <span style={s.optional}>(optional)</span></label>
                <p style={s.hint}>Paste a Google Maps or Waze link to help us find the location</p>
                <input
                  name="navigation_link"
                  value={formData.navigation_link}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                  style={s.input}
                />
              </div>
            </div>

            {/* ── Section 3: About the Bees ── */}
            <div style={s.section}>
              <div style={s.sectionHeader}>
                <span style={s.sectionIcon}>🐝</span>
                <h2 style={s.sectionTitle}>About the Bees</h2>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Urgency <span style={s.req}>*</span></label>
                <p style={s.hint}>How urgent is this situation?</p>
                <div style={s.urgencyRow}>
                  {[
                    { value: "low", label: "Low", desc: "Not an immediate danger", color: "#27500A", bg: "#EAF3DE", border: "#a8d08a" },
                    { value: "medium", label: "Medium", desc: "Should be handled soon", color: "#854F0B", bg: "#FAEEDA", border: "#EF9F27" },
                    { value: "high", label: "High", desc: "Immediate danger", color: "#791F1F", bg: "#FCEBEB", border: "#F09595" },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, urgency: opt.value }));
                        setTouched((prev) => ({ ...prev, urgency: true }));
                      }}
                      style={{
                        ...s.urgencyOption,
                        background: formData.urgency === opt.value ? opt.bg : "white",
                        borderColor: formData.urgency === opt.value ? opt.border : "#e0d4b8",
                        color: formData.urgency === opt.value ? opt.color : "#4a5e52",
                      }}
                    >
                      <strong style={{ fontSize: "15px" }}>{opt.label}</strong>
                      <span style={{ fontSize: "11px", marginTop: "2px", opacity: 0.8 }}>{opt.desc}</span>
                    </div>
                  ))}
                </div>
                {touched.urgency && !formData.urgency && (
                  <span style={s.fieldError}>Please select urgency</span>
                )}
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>How long have the bees been there? <span style={s.optional}>(optional)</span></label>
                <select
                  name="first_seen"
                  value={formData.first_seen}
                  onChange={handleChange}
                  style={{ ...s.input, color: formData.first_seen ? "#2d4a3a" : "#999" }}
                >
                  <option value="">I'm not sure</option>
                  <option value="1_day">About 1 day</option>
                  <option value="2_days">About 2 days</option>
                  <option value="3_days">About 3 days</option>
                  <option value="4_plus_days">4 or more days</option>
                </select>
              </div>
            </div>

            {/* ── Section 4: Coordinator (only shown if no URL param) ── */}
            {!coordinatorIdFromUrl && (
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <span style={s.sectionIcon}>📞</span>
                  <h2 style={s.sectionTitle}>Coordinator</h2>
                </div>
                <p style={s.hint}>Enter the phone number of the coordinator who sent you this form.</p>

                <div style={s.fieldGroup}>
                  <label style={s.label}>Coordinator phone number <span style={s.req}>*</span></label>
                  <input
                    name="coordinator_phone"
                    value={formData.coordinator_phone}
                    onChange={handleChange}
                    onBlur={() => handleBlur("coordinator_phone")}
                    placeholder="05X-XXX-XXXX"
                    type="tel"
                    style={{
                      ...s.input,
                      borderColor: fieldError("coordinator_phone") ? "#e74c3c" : "#e0d4b8",
                    }}
                  />
                  {fieldError("coordinator_phone") && (
                    <span style={s.fieldError}>{fieldError("coordinator_phone")}</span>
                  )}
                </div>
              </div>
            )}

            {/* ── Agreement ── */}
            <label style={s.agreeLabel}>
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                style={{ accentColor: "#BA7517", width: "18px", height: "18px" }}
              />
              <span>
                I agree that the information I provided is accurate and consent to being contacted
                regarding this bee rescue request.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...s.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submitting..." : "Submit Request 🐝"}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #fffdf5 0%, #fff8e8 100%)",
    padding: "24px 16px 60px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    maxWidth: "600px",
    margin: "0 auto",
    background: "white",
    borderRadius: "24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
    border: "1px solid #f0e6cc",
    overflow: "hidden",
  },
  cardHeader: {
    background: "linear-gradient(135deg, #BA7517 0%, #EF9F27 100%)",
    padding: "32px 28px 28px",
    textAlign: "center",
  },
  headerBee: { fontSize: "48px", marginBottom: "8px" },
  title: { margin: 0, fontSize: "26px", fontWeight: 700, color: "white" },
  subtitle: { margin: "8px 0 0", fontSize: "15px", color: "rgba(255,255,255,0.88)", lineHeight: 1.5 },
  form: { padding: "24px 20px", display: "flex", flexDirection: "column", gap: "20px" },
  section: {
    background: "#fffdf8", border: "1px solid #f0e6cc", borderRadius: "16px",
    padding: "18px 16px", display: "flex", flexDirection: "column", gap: "14px",
  },
  sectionHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  sectionIcon: { fontSize: "22px" },
  sectionTitle: { margin: 0, fontSize: "17px", fontWeight: 700, color: "#2d4a3a" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "13px", fontWeight: 600, color: "#2d4a3a" },
  req: { color: "#e74c3c" },
  optional: { color: "#999", fontSize: "12px", fontWeight: 400 },
  hint: { margin: 0, fontSize: "12px", color: "#888", lineHeight: 1.4 },
  input: {
    width: "100%", padding: "12px 14px", borderRadius: "12px",
    border: "1px solid #e0d4b8", fontSize: "15px", outline: "none",
    background: "white", color: "#2d4a3a", boxSizing: "border-box", WebkitAppearance: "none",
  },
  fieldError: { fontSize: "11px", color: "#e74c3c" },
  selectedHint: { fontSize: "12px", color: "#6a7f73" },
  dropdown: {
    position: "absolute", top: "100%", left: 0, right: 0, background: "white",
    border: "1px solid #e0d4b8", borderRadius: "12px", maxHeight: "200px",
    overflowY: "auto", zIndex: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
  },
  dropdownItem: {
    padding: "12px 14px", cursor: "pointer", color: "#2d4a3a",
    fontSize: "14px", borderBottom: "1px solid #f5f0e8", background: "white",
  },
  urgencyRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" },
  urgencyOption: {
    padding: "12px 8px", borderRadius: "12px", border: "2px solid #e0d4b8",
    cursor: "pointer", textAlign: "center", display: "flex",
    flexDirection: "column", gap: "4px", transition: "all 0.15s",
  },
  agreeLabel: {
    display: "flex", alignItems: "flex-start", gap: "12px",
    fontSize: "13px", color: "#4a5e52", lineHeight: 1.5, cursor: "pointer",
  },
  submitBtn: {
    width: "100%", padding: "16px", borderRadius: "14px", border: "none",
    background: "linear-gradient(135deg, #BA7517 0%, #EF9F27 100%)",
    color: "white", fontSize: "17px", fontWeight: 700, cursor: "pointer",
    boxShadow: "0 8px 24px rgba(186,117,23,0.3)",
  },
  errorBox: {
    margin: "0 20px", padding: "14px 16px", borderRadius: "12px",
    background: "#FCEBEB", border: "1px solid #F09595",
    color: "#791F1F", fontSize: "14px", marginTop: "16px",
  },
  thankYouCard: {
    maxWidth: "440px", margin: "60px auto 0", background: "white",
    borderRadius: "24px", padding: "48px 32px", textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)", border: "1px solid #f0e6cc",
  },
  beeIcon: { fontSize: "64px", marginBottom: "16px" },
  thankYouTitle: { margin: "0 0 12px", fontSize: "28px", fontWeight: 700, color: "#2d4a3a" },
  thankYouText: { margin: "0 0 20px", fontSize: "16px", color: "#4a5e52", lineHeight: 1.6 },
  thankYouNote: {
    fontSize: "13px", color: "#999", background: "#f5f0e8",
    borderRadius: "10px", padding: "10px 16px",
  },
};

export default SubmitCase;
