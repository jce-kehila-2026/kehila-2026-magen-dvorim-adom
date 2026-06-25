import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";

import { auth } from "../firebase";
import { loginUser } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import { USER_ROLES } from "../services/userSchema";
import { getDashboardPathByRole } from "../utils/routes";
import LoginView from "../components/views/LoginView";

function Login() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("en");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const showMessage = (text, type) => {
  const translations = {
    "Please fill in all required fields.": {
      en: "Please fill in all required fields.",
      he: "אנא מלא את כל השדות הנדרשים"
    },
    "Login successful. Welcome back!": {
      en: "Login successful. Welcome back!",
      he: "התחברת בהצלחה, ברוך שובך!"
    },
    "Login failed. Please try again.": {
      en: "Login failed. Please try again.",
      he: "ההתחברות נכשלה, נסה שוב"
    },
    "Please enter your email first.": {
      en: "Please enter your email first.",
      he: "אנא הכנס אימייל קודם"
    },
    "Password reset email sent. Please check your inbox.": {
      en: "Password reset email sent. Please check your inbox.",
      he: "נשלח מייל לאיפוס סיסמה, בדוק את המייל שלך"
    },
    "Could not send reset email. Please try again.": {
      en: "Could not send reset email. Please try again.",
      he: "לא ניתן לשלוח מייל איפוס, נסה שוב"
    }
  };

  const translated = translations[text] || { en: text, he: text };

  setMessage(translated);
  setMessageType(type);
};
  useEffect(() => {
    if (userProfile) {
      navigate(getDashboardPathByRole(userProfile.role));
    }
  }, [navigate, userProfile]);

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

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showMessage("Please fill in all required fields.", "error");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const { profile } = await loginUser(email, password);

      showMessage("Login successful. Welcome back!", "success");
      redirectByRole(profile.role);
    } catch (error) {
      console.error("Login failed:", error);
      showMessage("Login failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showMessage("Please enter your email first.", "error");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

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
    <LoginView
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      message={message}
      messageType={messageType}
      loading={loading}
      handleLogin={handleLogin}
      handleForgotPassword={handleForgotPassword}
      language={language}
      setLanguage={setLanguage}
    />
  );
}

export default Login;