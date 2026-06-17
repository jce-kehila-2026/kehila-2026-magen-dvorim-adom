// User management page logic.
// Handles user retrieval, filtering, and CRUD operations.

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AdminUsersView from "../components/views/AdminUsersView";
import { registerUser, logoutUser } from "../services/authService";

import {
  getAllUsers,
  updateUserProfileAdmin,
  deleteUserProfile,
  activateUser,
} from "../services/userService";

import {
  USER_ROLES,
  buildUserProfile,
  validateUserProfile,
} from "../services/userSchema";

const ISRAELI_CITIES = [
  "Jerusalem", "Tel Aviv", "Haifa", "Rishon LeZion", "Petah Tikva",
  "Ashdod", "Netanya", "Beer Sheva", "Bnei Brak", "Holon",
  "Bat Yam", "Ramat Gan", "Ashkelon", "Rehovot", "Herzliya",
  "Kfar Saba", "Modi'in", "Hadera", "Nazareth", "Lod",
  "Ramla", "Ra'anana", "Nahariya", "Nes Ziona", "Eilat",
  "Tayibe", "Umm al-Fahm", "Shfaram", "Sakhnin", "Tamra",
  "Acre", "Afula", "Tiberias", "Safed", "Other",
];
function AdminUsers() {
  const { userProfile } = useAuth();
  const canManageUsers = userProfile?.role === USER_ROLES.ADMIN;
  const currentUserName =
    userProfile?.full_name ||
    userProfile?.displayName ||
    userProfile?.email ||
    "User";

  const handleLogout = async () => {
    await logoutUser();
  };

  const [users, setUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("active");

  const [roleFilter, setRoleFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");

  const [formMode, setFormMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    occupation: "",
    city: "",
    role: USER_ROLES.VOLUNTEER,
    is_available: true,
    password: "",
    experience_level: "beginner",
    height_work: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAllUsers(100);
      const allUsers = result.users || [];

      setUsers(allUsers.filter((user) => user.is_active !== false));
      setDeletedUsers(allUsers.filter((user) => user.is_active === false));
    } catch (err) {
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setFormMode("create");
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      occupation: "",
      city: "",
      role: USER_ROLES.VOLUNTEER,
      is_available: true,
      password: "",
      experience_level: "beginner",
      height_work: false,
    });
    setCitySearch("");
    setShowCityDropdown(false);
    setMessage("");
    setError("");
  };

  const openUserModal = (mode = "create", user = null) => {
    resetForm();

    if (mode === "edit" && user) {
      setSelectedUser(user);
      setFormMode("edit");
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        occupation: user.occupation || "",
        city: user.city || "",
        role: user.role || USER_ROLES.VOLUNTEER,
        is_available: Boolean(user.is_available),
        password: "",
        experience_level: user.experience_level || "beginner",
        height_work: Boolean(user.height_work),
      });
    }

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
const canEditUser = () => {
return canManageUsers;
};

  const isFormValid = () => {
    if (!formData.full_name.trim()) return false;
    if (!formData.email.trim()) return false;
    if (!formData.phone.trim()) return false;
    if (!formData.city.trim()) return false;
    if (formMode === "create" && !formData.password) return false;

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const profilePayload = buildUserProfile({
  full_name: formData.full_name.trim(),
  email: formData.email.trim(),
  phone: formData.phone.trim(),
  occupation: formData.occupation.trim(),
  city: formData.city.trim(),
  role: formData.role,
  is_available: formData.is_available,
  experience_level: formData.experience_level,
  height_work: formData.height_work,
    });

    const validation = validateUserProfile(profilePayload);
    

    if (!validation.isValid) {
      setError(Object.values(validation.errors).join(" "));
      return;
    }

    if (formMode === "edit" && selectedUser && !canEditUser(selectedUser)) {
  setError("You do not have permission to edit this user.");
  return;
}
    setSaving(true);

    try {
      if (formMode === "create") {
        await registerUser(formData.email, formData.password, profilePayload);
        setMessage("New user created successfully.");
      } else if (selectedUser) {
       await updateUserProfileAdmin(selectedUser.uid, {
          full_name: profilePayload.full_name,
          email: profilePayload.email,
          phone: profilePayload.phone,
          occupation: profilePayload.occupation,
          city: profilePayload.city,
          role: profilePayload.role,
          is_available: profilePayload.is_available,
          experience_level: formData.experience_level,
          height_work: formData.height_work,
        });

        setMessage("User updated successfully.");
      }

      resetForm();
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.full_name || user.email}?`)) return;

    setSaving(true);

    try {
      await deleteUserProfile(user.uid);
      setMessage("User deactivated.");
      await loadUsers();
    } catch (err) {
      setError(err.message || "Could not delete user.");
    } finally {
      setSaving(false);
    }
  };

const handleRestore = async (user) => {
  setSaving(true);

  try {
    await activateUser(user.uid);

    await updateUserProfileAdmin(user.uid, {
      is_available: true,
      deleted_at: null,
    });

    setMessage("User restored.");
    await loadUsers();
  } catch (err) {
    setError(err.message || "Could not restore user.");
  } finally {
    setSaving(false);
  }
};
const filterUsersByPermission = (list) => {
  if (userProfile?.role === USER_ROLES.ADMIN) {
    return list;
  }

  if (userProfile?.role === USER_ROLES.COORDINATOR) {
    return list.filter(
      (user) =>
        user.role === USER_ROLES.VOLUNTEER ||
        user.uid === userProfile?.uid
    );
  }

  return [];
};

const visibleUsersByRole = useMemo(() => {
  return filterUsersByPermission(users);
}, [users, userProfile]);

const visibleDeletedUsersByRole = useMemo(() => {
  return filterUsersByPermission(deletedUsers);
}, [deletedUsers, userProfile]);

const filteredUsers = useMemo(() => {
  const baseList =
    viewMode === "deleted"
      ? visibleDeletedUsersByRole
      : visibleUsersByRole;

  const query = searchQuery.trim().toLowerCase();

  let list = baseList.filter((user) => {
    const matchesSearch =
      !query ||
      (user.full_name || "").toLowerCase().includes(query) ||
      (user.phone || "").toLowerCase().includes(query) ||
      (user.email || "").toLowerCase().includes(query) ||
      (user.city || "").toLowerCase().includes(query);

    const matchesRole =
      roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  list = [...list].sort((a, b) => {
    const getTime = (user) => {
      if (!user.created_at) return 0;
      if (user.created_at.toDate) return user.created_at.toDate().getTime();
      if (user.created_at.seconds) return user.created_at.seconds * 1000;
      return new Date(user.created_at).getTime();
    };

    return sortMode === "oldest"
      ? getTime(a) - getTime(b)
      : getTime(b) - getTime(a);
  });

  return list;
}, [
  searchQuery,
  viewMode,
  visibleDeletedUsersByRole,
  visibleUsersByRole,
  roleFilter,
  sortMode,
]);
const getDaysUntilPermanentDelete = (deletedAt) => {
  if (!deletedAt) return 30;

  const deletedDate = deletedAt.toDate
    ? deletedAt.toDate()
    : new Date(deletedAt.seconds * 1000);

  const expirationDate = new Date(deletedDate);
  expirationDate.setDate(expirationDate.getDate() + 30);

  const diff =
    expirationDate.getTime() - new Date().getTime();

  return Math.max(
    0,
    Math.ceil(diff / (1000 * 60 * 60 * 24))
  );
};
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString();

    return String(timestamp);
  };

  return (
    <AdminUsersView
      currentUserName={currentUserName}
      handleLogout={handleLogout}
      users={users}
      filteredUsers={filteredUsers}
      deletedUsers={deletedUsers}
      loading={loading}
      saving={saving}
      message={message}
      error={error}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      viewMode={viewMode}
      setViewMode={setViewMode}
      roleFilter={roleFilter}
      setRoleFilter={setRoleFilter}
      sortMode={sortMode}
      setSortMode={setSortMode}
      formMode={formMode}
      formData={formData}
      setFormData={setFormData}
      selectedUser={selectedUser}
      modalOpen={modalOpen}
      citySearch={citySearch}
      setCitySearch={setCitySearch}
      showCityDropdown={showCityDropdown}
      setShowCityDropdown={setShowCityDropdown}
      openUserModal={openUserModal}
      closeModal={closeModal}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      handleDelete={handleDelete}
      handleRestore={handleRestore}
      isFormValid={isFormValid}
      formatDate={formatDate}
      ISRAELI_CITIES={ISRAELI_CITIES}
      USER_ROLES={USER_ROLES}
      addMenuOpen={addMenuOpen}
      setAddMenuOpen={setAddMenuOpen}
      getDaysUntilPermanentDelete={getDaysUntilPermanentDelete}
      canManageUsers={canManageUsers}
    />
  );
}

export default AdminUsers;