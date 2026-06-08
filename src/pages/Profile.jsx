import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import ProfileView from "../components/views/ProfileView";
import { updateUserProfile } from "../services/userService";

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

  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [formData, setFormData] = useState({
    city: "",
    is_available: true,
  });

  useEffect(() => {
    if (!userProfile) return;

    setFormData({
      city: userProfile.city || "",
      is_available:
        typeof userProfile.is_available === "boolean"
          ? userProfile.is_available
          : true,
    });
  }, [userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userProfile) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateUserProfile(userProfile.uid, {
        city: formData.city,
        is_available: formData.is_available,
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
      ISRAELI_CITIES={ISRAELI_CITIES}
    />
  );
}

export default Profile;