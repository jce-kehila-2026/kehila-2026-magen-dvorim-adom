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
    setMessage(text);
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
      setMessage("");

      const { profile } = await loginUser(email, password);

      showMessage("Login successful. Welcome back!", "success");
      redirectByRole(profile.role);
    } catch (error) {
      console.error("Login failed:", error);
      showMessage(error.message || "Login failed. Please try again.", "error");
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