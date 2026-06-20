import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import ProfileView from "../components/views/ProfileView";
import { updateUserProfile } from "../services/userService";
import { logoutUser } from "../services/authService";

const ISRAELI_CITIES = [
  "Jerusalem", "Tel Aviv", "Haifa", "Beer Sheva", "Ashdod", 
  "Netanya", "Rishon LeZion", "Petah Tikva", "Holon", "Bat Yam", 
  "Herzliya", "Rehovot", "Modi'in", "Nazareth", "Eilat",
];

function Profile() {
  const { userProfile, refreshUserProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    city: "",
    is_available: true,
    photo_url: "",
  });

  useEffect(() => {
    if (!userProfile) return;
    setFormData({
      full_name: userProfile.full_name || "",
      phone: userProfile.phone || "",
      city: userProfile.city || "",
      is_available: typeof userProfile.is_available === "boolean" ? userProfile.is_available : true,
      photo_url: userProfile.photo_url || "",
    });
  }, [userProfile]);

  const currentUserName = userProfile?.full_name || userProfile?.displayName || userProfile?.email || "User";

  const handleLogout = async () => await logoutUser();

  const handlePasswordReset = async () => {
    setError("");
    setSuccess("");
    try {
      await sendPasswordResetEmail(auth, userProfile.email);
      setSuccess("Password reset link sent to your email!");
    } catch (err) {
      setError("Failed to send reset link: " + err.message);
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, photo_url: previewUrl, photo_file: file }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!userProfile) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await updateUserProfile(userProfile.uid, {
        full_name: formData.full_name,
        phone: formData.phone,
        city: formData.city,
        is_available: formData.is_available,
        photo_url: formData.photo_url,
      });
      await refreshUserProfile();
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) return <div>Loading...</div>;

  return (
    <ProfileView
      userProfile={userProfile}
      currentUserName={currentUserName}
      formData={formData}
      setFormData={setFormData}
      citySearch={citySearch}
      setCitySearch={setCitySearch}
      showCityDropdown={showCityDropdown}
      setShowCityDropdown={setShowCityDropdown}
      loading={loading}
      error={error}
      success={success}
      handleSubmit={handleSubmit}
      handleLogout={handleLogout}
      handlePasswordReset={handlePasswordReset}
      handlePhotoChange={handlePhotoChange}
      ISRAELI_CITIES={ISRAELI_CITIES}
    />
  );
}

export default Profile;