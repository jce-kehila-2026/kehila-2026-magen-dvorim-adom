import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import ProfileView from "../components/views/ProfileView";
import { updateUserProfile } from "../services/userService";
import { changeUserPassword, logoutUser } from "../services/authService";

const ISRAELI_CITIES = [
  "Jerusalem",
  "Tel Aviv",
  "Haifa",
  "Beer Sheva",
  "Ashdod",
  "Netanya",
  "Rishon LeZion",
  "Petah Tikva",
  "Holon",
  "Bat Yam",
  "Herzliya",
  "Rehovot",
  "Modi'in",
  "Nazareth",
  "Eilat",
];

function Profile() {
  const { userProfile, refreshUserProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    city: "",
    is_available: true,
    photo_url: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    if (!userProfile) return;

    setFormData({
      full_name: userProfile.full_name || "",
      phone: userProfile.phone || "",
      city: userProfile.city || "",
      is_available:
        typeof userProfile.is_available === "boolean"
          ? userProfile.is_available
          : true,
      photo_url: userProfile.photo_url || "",
    });
  }, [userProfile]);

  const currentUserName =
    userProfile?.full_name ||
    userProfile?.displayName ||
    userProfile?.email ||
    "User";

  const handleLogout = async () => {
    await logoutUser();
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setFormData((prev) => ({
      ...prev,
      photo_url: previewUrl,
      photo_file: file,
    }));
  };

  const openPasswordModal = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setPasswordError("");
    setPasswordSuccess("");
    setPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (passwordLoading) return;

    setPasswordModalOpen(false);
    setPasswordError("");
    setPasswordSuccess("");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        throw new Error("New passwords do not match.");
      }

      await changeUserPassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      setPasswordSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      console.error(err);
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
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
      console.error(err);
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

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
      passwordModalOpen={passwordModalOpen}
      passwordData={passwordData}
      setPasswordData={setPasswordData}
      passwordLoading={passwordLoading}
      passwordError={passwordError}
      passwordSuccess={passwordSuccess}
      handleSubmit={handleSubmit}
      handlePasswordSubmit={handlePasswordSubmit}
      openPasswordModal={openPasswordModal}
      closePasswordModal={closePasswordModal}
      handleLogout={handleLogout}
      handlePhotoChange={handlePhotoChange}
      ISRAELI_CITIES={ISRAELI_CITIES}
    />
  );
}

export default Profile;
