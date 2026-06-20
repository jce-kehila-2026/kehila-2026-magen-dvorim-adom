import { serverTimestamp } from "firebase/firestore";

// Allowed user roles in the system
export const USER_ROLES = {
  ADMIN: "admin",
  COORDINATOR: "coordinator",
  VOLUNTEER: "volunteer",
};

// Allowed volunteer experience levels
export const EXPERIENCE_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  EXPERIENCED: "experienced",
};


// Default user profile structure in Firestore
export const DEFAULT_USER_PROFILE = {
  full_name: "",
  email: "",
  phone: "",
  occupation: "",
  city: "",
  profile_picture_url: "",

  role: USER_ROLES.VOLUNTEER,
  experience_level: EXPERIENCE_LEVELS.BEGINNER,

  licenses: {
    height_work: false,
  },

  equipment: {
    protective_suit: false,
    bee_box: false,
    ladder: false,
    smoker: false,
  },

  // Cached statistics.
  // Should be updated only by trusted logic:
  // Firestore transactions or backend/cloud functions.
  stats: {
    total_rescues: 0,
    current_active_cases: 0,
  },

  rating_stats: {
    average: 0,
    count: 0,
  },

  is_available: true,
  is_active: true,

  created_at: null,
  updated_at: null,
  last_login_at: null,
};

export function isValidUserRole(role) {
  return Object.values(USER_ROLES).includes(role);
}

export function isValidExperienceLevel(level) {
  return Object.values(EXPERIENCE_LEVELS).includes(level);
}

export function buildUserProfile(data = {}) {
  return {
    full_name: data.full_name?.trim() || "",
    email: data.email?.trim().toLowerCase() || "",
    phone: data.phone?.trim() || "",
    occupation: data.occupation?.trim() || "",
    city: data.city?.trim() || "",
    profile_picture_url: data.profile_picture_url?.trim() || "",

    role: isValidUserRole(data.role)
      ? data.role
      : USER_ROLES.VOLUNTEER,

    experience_level: isValidExperienceLevel(data.experience_level)
      ? data.experience_level
      : EXPERIENCE_LEVELS.BEGINNER,

    licenses: {
      height_work: Boolean(data.licenses?.height_work),
    },

    equipment: {
      protective_suit: Boolean(data.equipment?.protective_suit),
      bee_box: Boolean(data.equipment?.bee_box),
      ladder: Boolean(data.equipment?.ladder),
      smoker: Boolean(data.equipment?.smoker),
    },

    stats: {
      total_rescues: Math.max(
        0,
        Number(data.stats?.total_rescues) || 0
      ),
      current_active_cases: Math.max(
        0,
        Number(data.stats?.current_active_cases) || 0
      ),
    },

    rating_stats: {
      average: Math.min(
        5,
        Math.max(0, Number(data.rating_stats?.average) || 0)
      ),
      count: Math.max(0, Number(data.rating_stats?.count) || 0),
    },

    is_available:
      typeof data.is_available === "boolean" ? data.is_available : true,

    is_active:
      typeof data.is_active === "boolean" ? data.is_active : true,

    created_at: data.created_at || serverTimestamp(),
    updated_at: serverTimestamp(),
    last_login_at: data.last_login_at || null,
  };
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isValidEmail(value) {
  return (
    typeof value === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

function isValidPhone(value) {
  if (!value) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  const compactPhone = value.replace(/[\s-]/g, "");

  return /^\+?[0-9]{7,15}$/.test(compactPhone);
}

export function validateUserProfile(user = {}) {
  const errors = {};

  if (!isNonEmptyString(user.full_name)) {
    errors.full_name = "Full name is required.";
  }

  if (!isNonEmptyString(user.email)) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(user.email)) {
    errors.email = "Invalid email format.";
  }

  if (!isValidPhone(user.phone)) {
    errors.phone = "Invalid phone number format.";
  }

  if (!isValidUserRole(user.role)) {
    errors.role = "Invalid user role.";
  }

  if (
    user.experience_level &&
    !isValidExperienceLevel(user.experience_level)
  ) {
    errors.experience_level = "Invalid experience level.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

