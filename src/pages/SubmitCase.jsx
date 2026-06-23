import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { createCase } from "../services/caseService";
import {
  getValidIntakeFormForRequester,
  markIntakeFormSubmitted,
} from "../services/intakeFormService";
import { getUserById } from "../services/userService";
import logo from "../assets/logo.png";
import { uploadImage } from "../services/imageService";


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
];

function SubmitCase() {
  const [searchParams] = useSearchParams();
  const coordinatorIdFromUrl = searchParams.get("coordinator");
  const [images, setImages] = useState([]);
  const [coordinatorName, setCoordinatorName] = useState("");
  const [language, setLanguage] = useState("he");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
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
  const fileInputRef = useRef(null);

  const texts = {
    he: {
      title: "בקשת חילוץ נחיל דבורים",
      subtitle: "אנא מלא/י את הפרטים - נגיע בהקדם",
      coordinatorNote: "הטופס נשלח על ידי",
      aboutYou: "פרטי המבקש/ת",
      firstName: "שם פרטי",
      lastName: "שם משפחה",
      phone: "טלפון ליצירת קשר",
      location: "מיקום הנחיל",
      city: "ישוב",
      street: "רחוב",
      houseNumber: "מספר בית",
      locationDesc: "תיאור מדויק של המיקום",
      height: "גובה מהקרקע (מטרים)",
      floor: "קומה",
      navLink: "קישור לניווט",
      navHint: "הדבק/י קישור מ-Google Maps או Waze",
      aboutBees: "פרטי הנחיל",
      firstSeen: "כמה זמן הנחיל נמצא?",
      firstSeenUnknown: "לא בטוח/ה",
      firstSeen1d: "בערך יום",
      firstSeen2d: "בערך יומיים",
      firstSeen3d: "בערך 3 ימים",
      firstSeen4d: "4 ימים או יותר",
      coordinator: "רכז/ת",
      coordinatorHint: "יש להזין את מספר הטלפון של הרכז/ת ששלח/ה לך טופס זה",
      coordinatorPhone: "טלפון הרכז/ת",
      photos: "תמונות",
      photosHint: "ניתן להוסיף עד 2 תמונות של הנחיל והסביבה",
      addPhotos: "הוספת תמונות",
      agreeText: "ידוע לי שאם יתברר שהפינוי כרוך בפירוק / הסרה / פגיעה בקיר/תריס/תקרת עץ וכיו\"ב, שבסמוך לנחיל והוסכם על דעת הפונה והמתנדב על ביצוע הפינוי הנ\"ל, אין למתנדב ו/או לעמותת \"מגן דבורים אדום\" כל התחייבות להחזיר את המצב לקדמותו או לתקן את הנפגע. כמו כן אין ולא תהיה שום אחריות למתנדב ו/או לעמותת \"מגן דבורים אדום\" לגבי כל פגיעה בנפש לפונה או כל צד ג' במהלך הפינוי.",
      agreeCheckbox: "אני מסכים/ה לתנאים",
      submit: "שליחת בקשה",
      submitting: "שולח...",
      required: "שדה חובה",
      thankYou: "הבקשה התקבלה!",
      thankYouText: "צוות המתנדבים שלנו יצור איתך קשר בהקדם. תודה על העזרה בהצלת הדבורים.",
      thankYouNote: "ניתן לסגור דף זה",
      errorFillAll: "אנא מלא/י את כל השדות הנדרשים",
      errorAgree: "יש לאשר את התנאים להמשך",
      errorGeneral: "משהו השתבש. אנא נסה/י שוב",
      noValidForm: "לא נמצא טופס תקף. ייתכן שהטופס פג תוקף או כבר נעשה בו שימוש.",
    },
    en: {
      title: "Bee Rescue Request",
      subtitle: "Please fill in the details - we'll arrive shortly",
      coordinatorNote: "This form was sent by",
      aboutYou: "About You",
      firstName: "First name",
      lastName: "Last name",
      phone: "Phone number",
      location: "Bee Location",
      city: "City",
      street: "Street",
      houseNumber: "House number",
      locationDesc: "Describe exact location",
      height: "Height from ground (meters)",
      floor: "Floor",
      navLink: "Navigation link",
      navHint: "Paste a Google Maps or Waze link",
      aboutBees: "About the Bees",
      firstSeen: "How long have the bees been there?",
      firstSeenUnknown: "I'm not sure",
      firstSeen1d: "About 1 day",
      firstSeen2d: "About 2 days",
      firstSeen3d: "About 3 days",
      firstSeen4d: "4 or more days",
      coordinator: "Coordinator",
      coordinatorHint: "Enter the phone number of the coordinator who sent you this form",
      coordinatorPhone: "Coordinator phone",
      photos: "Photos",
      photosHint: "You can add up to 2 photos of the bees",
      addPhotos: "Add photos",
      agreeText: "I understand that if the removal involves dismantling/removing/damaging a wall/shutter/wooden ceiling etc. near the hive, the volunteer and 'Magen Dvorim Adom' association are not obligated to restore or repair damage. There will be no liability for any injury during removal.",
      agreeCheckbox: "I agree to the terms",
      submit: "Submit Request",
      submitting: "Submitting...",
      required: "Required",
      thankYou: "Request Received!",
      thankYouText: "Our volunteer team will contact you shortly. Thank you for helping save the bees.",
      thankYouNote: "You can close this page now",
      errorFillAll: "Please fill in all required fields",
      errorAgree: "You must agree to the terms",
      errorGeneral: "Something went wrong. Please try again.",
      noValidForm: "No valid request form found.",
    },
  };

  const t = texts[language];

  useEffect(() => {
    if (!coordinatorIdFromUrl) return;
    const loadCoordinator = async () => {
      try {
        const user = await getUserById(coordinatorIdFromUrl);
        if (user) setCoordinatorName(user.full_name || user.email);
      } catch (err) {
        console.error(err);
      }
    };
    loadCoordinator();
  }, [coordinatorIdFromUrl]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (name) => setTouched(prev => ({ ...prev, [name]: true }));

  const isRequired = (field) => {
    const required = ["requester_first_name", "requester_last_name", "requester_phone", "city", "street", "location_description", "height_from_ground", "floor" ];
    if (!coordinatorIdFromUrl) required.push("coordinator_phone");
    return required.includes(field);
  };

  const fieldError = (field) => {
    if (!touched[field]) return null;
    if (isRequired(field) && !formData[field]) return t.required;
    return null;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 2) {
      setError("You can upload up to 2 images only.");
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => setImages(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const allRequired = ["requester_first_name", "requester_last_name", "requester_phone", "city", "street", "location_description", "height_from_ground", "floor" ];
    if (!coordinatorIdFromUrl) allRequired.push("coordinator_phone");

    const newTouched = {};
    allRequired.forEach(f => newTouched[f] = true);


    setTouched(prev => ({
      ...prev,
      ...newTouched,
      agreeToTerms: true, 
    }));


    const requesterPhone = normalizePhone(formData.requester_phone);
    if (!formData.requester_first_name || !formData.requester_last_name || !requesterPhone || !formData.city || !formData.street || !formData.location_description || !formData.height_from_ground || !formData.floor ) {
      setError(t.errorFillAll);
      return;
    }
    if (!coordinatorIdFromUrl && !formData.coordinator_phone) {
      setError(t.errorFillAll);
      return;
    }
    if (!formData.agreeToTerms) {
      setError(t.errorAgree);
      return;
    }

    setLoading(true);
    try {
      const intakeForm = await getValidIntakeFormForRequester({
        requester_phone: requesterPhone,
        coordinator_id: coordinatorIdFromUrl || undefined,
        coordinator_phone: coordinatorIdFromUrl ? undefined : normalizePhone(formData.coordinator_phone),
      });
      if (!intakeForm) {
        setError(t.noValidForm);
        setLoading(false);
        return;
      }


      const uploadedUrls = [];

      for (const img of images) {
        const url = await uploadImage(img);
        uploadedUrls.push(url);
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
        first_seen: formData.first_seen || null,
        image_urls: uploadedUrls,
        ...(coordinatorIdFromUrl
          ? { coordinator_id: coordinatorIdFromUrl, coordinator_phone: "" }
          : { coordinator_phone: normalizePhone(formData.coordinator_phone) }),
      });
      await markIntakeFormSubmitted(intakeForm.id, caseId);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err.message || t.errorGeneral);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{  ...styles.page, fontFamily: language === "he" ? "'Arial', sans-serif" : "'Georgia', serif", }}>
        <div style={styles.thankYouCard}>
          <h1 style={styles.thankYouTitle}>{t.thankYou}</h1>
          <p style={styles.thankYouText}>{t.thankYouText}</p>
          <div style={styles.thankYouNote}>{t.thankYouNote}</div>
        </div>
      </div>
    );
  }

  return (
    
    <div
      style={styles.page}
      dir={language === "he" ? "rtl" : "ltr"}
    >

      <div style={styles.bgPattern}></div>
      
      <div style={styles.card}>
        <div style={styles.langWrapper}>
          <button 
            onClick={() => setShowLanguageMenu(!showLanguageMenu)} 
            style={styles.langButton}
          >
            <span>🌾</span> {language === 'he' ? 'עברית' : 'English'} <span>▼</span>
          </button>
          {showLanguageMenu && (
            <div style={styles.langMenu}>
              <button 
                onClick={() => { setLanguage('he'); setShowLanguageMenu(false); }} 
                style={{...styles.langOption, background: language === 'he' ? '#FEF3E2' : '#FFFFFF'}}
              >
                🇮🇱 עברית
              </button>
              <button 
                onClick={() => { setLanguage('en'); setShowLanguageMenu(false); }} 
                style={{...styles.langOption, background: language === 'en' ? '#FEF3E2' : '#FFFFFF'}}
              >
                🇬🇧 English
              </button>
            </div>
          )}
        </div>

        <div style={styles.cardHeader}>
          <img
            src={logo}
            alt="Magen Dvorim Adom"
            style={styles.logo}
          />
          <h1 style={styles.title}>{t.title}</h1>
          <p style={styles.subtitle}>{t.subtitle}</p>
        </div>

        {coordinatorName && (
          <div style={styles.coordinatorNote}>
             {t.coordinatorNote} <strong>{coordinatorName}</strong>
          </div>
        )}

        
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* About You */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>

              <h2 style={styles.sectionTitle}>{t.aboutYou}</h2>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t.firstName} <span style={styles.req}>*</span></label>
                <input 
                  name="requester_first_name" 
                  value={formData.requester_first_name} 
                  onChange={handleChange} 
                  onBlur={() => handleBlur("requester_first_name")} 
                  placeholder={t.firstName} 
                  style={{ ...styles.input, borderColor: fieldError("requester_first_name") ? "#E85D04" : "#E8DEC0" }} 
                />
                {fieldError("requester_first_name") && <span style={styles.fieldError}>{fieldError("requester_first_name")}</span>}
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t.lastName} <span style={styles.req}>*</span></label>
                <input 
                  name="requester_last_name" 
                  value={formData.requester_last_name} 
                  onChange={handleChange} 
                  onBlur={() => handleBlur("requester_last_name")} 
                  placeholder={t.lastName} 
                  style={{ ...styles.input, borderColor: fieldError("requester_last_name") ? "#E85D04" : "#E8DEC0" }} 
                />
                {fieldError("requester_last_name") && <span style={styles.fieldError}>{fieldError("requester_last_name")}</span>}
              </div>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>{t.phone} <span style={styles.req}>*</span></label>
              <input 
                name="requester_phone" 
                value={formData.requester_phone} 
                onChange={handleChange} 
                onBlur={() => handleBlur("requester_phone")} 
                placeholder="05X-XXX-XXXX" 
                type="tel" 
                style={{ ...styles.input, borderColor: fieldError("requester_phone") ? "#E85D04" : "#E8DEC0" }} 
              />
              {fieldError("requester_phone") && <span style={styles.fieldError}>{fieldError("requester_phone")}</span>}
            </div>
          </div>

          {/* Location */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>

              <h2 style={styles.sectionTitle}>{t.location}</h2>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>{t.city} <span style={styles.req}>*</span></label>
              <div style={{ position: "relative" }}>
                <input 
                  value={citySearch || formData.city} 
                  onChange={(e) => { setCitySearch(e.target.value); setShowCityDropdown(true); setTouched(prev => ({ ...prev, city: true })); }} 
                  onFocus={() => setShowCityDropdown(true)} 
                  onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)} 
                  placeholder={language === 'he' ? "חיפוש ישוב..." : "Search city..."} 
                  style={{ ...styles.input, borderColor: (touched.city && !formData.city) ? "#E85D04" : "#E8DEC0" }} 
                />
                {showCityDropdown && (
                  <div style={styles.dropdown}>
                    {ISRAELI_CITIES
                      .filter(c => c.toLowerCase().includes((citySearch || "").toLowerCase()))
                      .map(city => (
                        <div 
                          key={city} 
                          onMouseDown={() => { setFormData(prev => ({ ...prev, city })); setCitySearch(""); setShowCityDropdown(false); }} 
                          style={styles.dropdownItem}
                        >
                          {city}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {touched.city && !formData.city && <span style={styles.fieldError}>{t.required}</span>}
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t.street} <span style={styles.req}>*</span></label>
                <input 
                  name="street" 
                  value={formData.street} 
                  onChange={handleChange} 
                  onBlur={() => handleBlur("street")} 
                  placeholder={t.street} 
                  style={{ ...styles.input, borderColor: fieldError("street") ? "#E85D04" : "#E8DEC0" }} 
                />
                {fieldError("street") && <span style={styles.fieldError}>{fieldError("street")}</span>}
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t.houseNumber}</label>
                <input 
                  name="house_number" 
                  value={formData.house_number} 
                  onChange={handleChange} 
                  placeholder={t.houseNumber} 
                  style={styles.input} 
                />
              </div>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>{t.locationDesc} <span style={styles.req}>*</span></label>
              <textarea 
                name="location_description" 
                value={formData.location_description} 
                onChange={handleChange} 
                onBlur={() => handleBlur("location_description")} 
                placeholder={t.locationDesc} 
                rows={3} 
                style={{ ...styles.input, resize: "vertical", minHeight: "80px", borderColor: fieldError("location_description") ? "#E85D04" : "#E8DEC0" }} 
              />
              {fieldError("location_description") && <span style={styles.fieldError}>{fieldError("location_description")}</span>}
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t.height} <span style={styles.req}>*</span></label>
                <input 
                  name="height_from_ground" 
                  value={formData.height_from_ground} 
                  onChange={handleChange} 
                  onBlur={() => handleBlur("height_from_ground")} 
                  placeholder="e.g. 0, 2.5"
                  type="number" 
                  step="0.1"
                  min="0" 
                  style={{ ...styles.input, borderColor: fieldError("height_from_ground") ? "#E85D04" : "#E8DEC0" }} 
                />
                {fieldError("height_from_ground") && <span style={styles.fieldError}>{fieldError("height_from_ground")}</span>}
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t.floor} <span style={styles.req}>*</span></label>
                <input 
                  name="floor" 
                  value={formData.floor} 
                  onChange={handleChange} 
                  onBlur={() => handleBlur("floor")} 
                  placeholder="e.g. 2, Ground" 
                  style={{ ...styles.input, borderColor: fieldError("floor") ? "#E85D04" : "#E8DEC0" }} 
                />
                {fieldError("floor") && <span style={styles.fieldError}>{fieldError("floor")}</span>}
              </div>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>{t.navLink}</label>
              <p style={styles.hint}>{t.navHint}</p>
              <input 
                name="navigation_link" 
                value={formData.navigation_link} 
                onChange={handleChange} 
                placeholder="https://maps.google.com/..." 
                style={styles.input} 
              />
            </div>
          </div>

          {/* About Bees */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>

              <h2 style={styles.sectionTitle}>{t.aboutBees}</h2>
            </div>
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>{t.firstSeen}</label>
              <select 
                name="first_seen" 
                value={formData.first_seen} 
                onChange={handleChange} 
                style={{ ...styles.input, color: formData.first_seen ? "#3D1A00" : "#999" }}
              >
                <option value="">{t.firstSeenUnknown}</option>
                <option value="1_day">{t.firstSeen1d}</option>
                <option value="2_days">{t.firstSeen2d}</option>
                <option value="3_days">{t.firstSeen3d}</option>
                <option value="4_plus_days">{t.firstSeen4d}</option>
              </select>
            </div>
          </div>

          {/* Coordinator */}
          {!coordinatorIdFromUrl && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionIcon}>👥</span>
                <h2 style={styles.sectionTitle}>{t.coordinator}</h2>
              </div>
              <p style={styles.hint}>{t.coordinatorHint}</p>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t.coordinatorPhone} <span style={styles.req}>*</span></label>
                <input 
                  name="coordinator_phone" 
                  value={formData.coordinator_phone} 
                  onChange={handleChange} 
                  onBlur={() => handleBlur("coordinator_phone")} 
                  placeholder="05X-XXX-XXXX" 
                  type="tel" 
                  style={{ ...styles.input, borderColor: fieldError("coordinator_phone") ? "#E85D04" : "#E8DEC0" }} 
                />
                {fieldError("coordinator_phone") && <span style={styles.fieldError}>{fieldError("coordinator_phone")}</span>}
              </div>
            </div>
          )}

          {/* Photos */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>

              <h2 style={styles.sectionTitle}>{t.photos}</h2>
            </div>
            <p style={styles.hint}>{t.photosHint}</p>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              disabled={images.length >= 2} 
              style={{ display: "none" }} 
            />
            <div style={styles.uploadBox} onClick={() => fileInputRef.current?.click()}>
              <div style={styles.uploadContent}>

                <div style={styles.uploadText}>
                  <strong>{t.addPhotos}</strong>
                  <span style={{ fontSize: "11px", color: "#A8B89A" }}>{images.length}/2</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
              {images.map((img, index) => (
                <div key={index} style={styles.imageBox}>
                  <img src={URL.createObjectURL(img)} alt="preview" style={styles.image} />
                  <button type="button" onClick={() => removeImage(index)} style={styles.removeBtn}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Agreement */}
          <div style={styles.section}>
            <p style={styles.agreementText}>{t.agreeText}</p>

        <label style={styles.agreeLabel}>
          <div
            style={{
              border: touched.agreeToTerms && !formData.agreeToTerms
                ? "2px solid #E85D04"   // 🔴 red when error
                : "2px solid #E8DEC0", // ✅ normal border
              borderRadius: "6px",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
    <input
      type="checkbox"
      name="agreeToTerms"
      checked={formData.agreeToTerms}
      onChange={handleChange}
      style={{
        accentColor: "#E85D04",
        width: "18px",
        height: "18px",
        cursor: "pointer",
      }}
    />
  </div>

  <span>{t.agreeCheckbox}</span>
</label>

            {/* (error message) */}
            {touched.agreeToTerms && !formData.agreeToTerms && (
              <span style={styles.fieldError}>{t.required}</span>
            )}
          </div>


          {error && (
            <div style={{
              ...styles.errorBox,
              marginTop: "8px",
              textAlign: "center"
            }}>
               {error}
            </div>
          )}


          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              ...styles.submitBtn, 
              opacity: loading ? 0.7 : 1, 
              cursor: loading ? "not-allowed" : "pointer" 
            }}
          >
            {loading ? t.submitting : t.submit} 🐝
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#FCF9F0",
    padding: "20px 16px 40px",
    position: "relative",


  },
  bgPattern: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 5 L61 20 L50 35 L39 20 Z' fill='%23F5EED8' opacity='0.4'/%3E%3C/svg%3E")`,
    backgroundSize: "60px 60px",
    opacity: 0.3,
    pointerEvents: "none",
    zIndex: 0,
  },
  langWrapper: {
    position: "relative",
    display: "flex",
    justifyContent: "flex-end",
    maxWidth: "560px",
    margin: "0 auto 12px",
    zIndex: 10,
  },
  langButton: {
    background: "#FFFFFF",
    border: "1px solid #E8DEC0",
    borderRadius: "40px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#6B5B3A",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",

  },
  langMenu: {
    position: "absolute",
    top: "44px",
    right: 0,
    background: "#FFFFFF",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    border: "1px solid #E8DEC0",
    overflow: "hidden",
    zIndex: 20,
  },
  langOption: {
    padding: "10px 24px",
    border: "none",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    color: "#5A4A2A",
    transition: "background 0.2s",

  },
  card: {
    maxWidth: "560px",
    margin: "0 auto",
    background: "#FFFFFF",
    borderRadius: "40px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)",
    border: "1px solid #EFE6D0",
    overflow: "hidden",
    position: "relative",
    zIndex: 1,
  },
  cardHeader: {
    background: "#FDF8EF",
    padding: "32px 24px 28px",
    textAlign: "center",
    borderBottom: "1px solid #EFE6D0",
  },
  logo: {
    height: "70px",
    marginBottom: "16px",
    objectFit: "contain",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 600,
    color: "#3D1A00",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#9B8B6B",
  },
  coordinatorNote: {
    background: "#F9F5EA",
    borderLeft: "4px solid #E8B85A",
    padding: "12px 16px",
    fontSize: "13px",
    color: "#6B5B3A",
    margin: "16px 20px 0",
    borderRadius: "16px",
  },
  form: {
    padding: "24px 20px 32px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  section: {
    background: "#FFFFFF",
    border: "1px solid #EFE6D0",
    borderRadius: "28px",
    padding: "20px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "2px",
  },
  sectionIcon: {
    fontSize: "22px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
    color: "#3D1A00",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#5A4A2A",
  },
  req: {
    color: "#E85D04",
  },
  hint: {
    margin: 0,
    fontSize: "11px",
    color: "#B0A088",
    lineHeight: 1.4,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "20px",
    border: "1.5px solid #E8DEC0",
    fontSize: "15px",
    outline: "none",
    background: "#FFFFFF",
    color: "#3D1A00",
    boxSizing: "border-box",
    transition: "all 0.2s",
  },
  fieldError: {
    fontSize: "11px",
    color: "#E85D04",
    marginTop: "2px",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#FFFFFF",
    border: "1px solid #E8DEC0",
    borderRadius: "16px",
    maxHeight: "200px",
    overflowY: "auto",
    zIndex: 300,
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    marginTop: "4px",
  },
  dropdownItem: {
    padding: "12px 16px",
    cursor: "pointer",
    color: "#5A4A2A",
    fontSize: "14px",
    borderBottom: "1px solid #F5F0E8",
    transition: "background 0.15s",
  },
 
  agreeLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    fontSize: "13px",
    color: "#5A4A2A",
    lineHeight: 1.5,
    cursor: "pointer",
  },
  submitBtn: {
    width: "100%",
    padding: "16px",
    borderRadius: "40px",
    border: "none",
    background: "linear-gradient(135deg, #E85D04 0%, #F48C06 100%)",
    color: "white",
    fontSize: "17px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 6px 20px rgba(232,93,4,0.25)",
  },
  errorBox: {
    margin: "16px 20px 0",
    padding: "14px 16px",
    borderRadius: "20px",
    background: "#FEF0F0",
    border: "1px solid #E07A7A",
    color: "#C13B3B",
    fontSize: "13px",
  },
  thankYouCard: {
    maxWidth: "440px",
    margin: "80px auto 0",
    background: "#FFFFFF",
    borderRadius: "40px",
    padding: "48px 32px",
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
    border: "1px solid #EFE6D0",
  },
  beeIcon: {
    fontSize: "72px",
    marginBottom: "16px",
  },
  thankYouTitle: {
    margin: "0 0 12px",
    color: "#3D1A00",
    fontSize: "30px",
    fontWeight: 700,
  },
  thankYouText: {
    margin: "0 0 20px",
    fontSize: "15px",
    color: "#6B6B6B",
    lineHeight: 1.6,
  },
  thankYouNote: {
    fontSize: "13px",
    color: "#A8B89A",
    background: "#F9F6EF",
    borderRadius: "20px",
    padding: "12px 16px",
  },
  imageBox: {
    position: "relative",
  },
  image: {
    width: "80px",
    height: "80px",
    objectFit: "cover",
    borderRadius: "16px",
    border: "2px solid #EFE6D0",
  },
  removeBtn: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    background: "#E85D04",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "22px",
    height: "22px",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
  uploadBox: {
    border: "2px dashed #E8DEC0",
    borderRadius: "24px",
    padding: "16px",
    background: "#FDFAF3",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  uploadContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },
  uploadIcon: {
    fontSize: "24px",
  },
  uploadText: {
    display: "flex",
    flexDirection: "column",
    fontSize: "13px",
    color: "#A8B89A",
    textAlign: "left",
  },
  agreementText: {
    fontSize: "11px",
    color: "#9B8B6B",
    lineHeight: 1.6,
    background: "#F9F6EF",
    padding: "12px",
    borderRadius: "20px",
    border: "1px solid #EFE6D0",
    margin: 0,
  },
};

export default SubmitCase;