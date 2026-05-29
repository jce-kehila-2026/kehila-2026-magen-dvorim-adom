import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  limit,
  startAfter,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";
import {
  USER_ROLES,
  buildUserProfile,
  validateUserProfile,
  isValidUserRole,
} from "./userSchema";

// Firestore collection name
const USERS_COLLECTION = "users";

// Fields that should not be changed from normal profile update
const PROTECTED_FIELDS = [
  "uid",
  "email",
  "role",
  "created_at",
  "stats",
  "rating_stats",
];

// Convert Firestore document into normal user object
function mapUserDocument(docSnapshot) {
  return {
    uid: docSnapshot.id,
    ...docSnapshot.data(),
  };
}

// Make sure uid exists before using it
function validateUid(uid) {
  if (!uid) {
    throw new Error("User uid is required.");
  }
}

// Remove protected fields from update object
function sanitizeUserUpdates(updates = {}) {
  const sanitized = { ...updates };

  PROTECTED_FIELDS.forEach((field) => {
    delete sanitized[field];
  });

  return sanitized;
}

// Central error handler for all service functions
function handleServiceError(operation, error) {
  console.error(`${operation} failed:`, error);
  throw new Error(`${operation} failed. Please try again.`);
}

// Create a new user profile in Firestore
export async function createUserProfile(uid, userData) {
  try {
    validateUid(uid);

    // Clean and prepare data according to userSchema
    const preparedUser = buildUserProfile(userData);

    // Validate required fields and allowed values
    const validation = validateUserProfile(preparedUser);

    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // users/{uid}
    const userRef = doc(db, USERS_COLLECTION, uid);

    // Save the user profile
    await setDoc(userRef, preparedUser);

    return {
      uid,
      ...preparedUser,
    };
  } catch (error) {
    handleServiceError("Create user profile", error);
  }
}

// Alternative name for createUserProfile
export const addUser = createUserProfile;

// Get one user by uid
export async function getUserById(uid) {
  try {
    validateUid(uid);

    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return null;
    }

    return mapUserDocument(userSnapshot);
  } catch (error) {
    handleServiceError("Fetch user", error);
  }
}

// Get users with pagination
export async function getAllUsers(pageSize = 20, lastDoc = null) {
  try {
    const usersRef = collection(db, USERS_COLLECTION);

    const usersQuery = lastDoc
      ? query(usersRef, startAfter(lastDoc), limit(pageSize))
      : query(usersRef, limit(pageSize));

    const snapshot = await getDocs(usersQuery);

    return {
      users: snapshot.docs.map(mapUserDocument),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  } catch (error) {
    handleServiceError("Fetch users", error);
  }
}

// Get users by role: admin / coordinator / volunteer
export async function getUsersByRole(role) {
  try {
    if (!isValidUserRole(role)) {
      throw new Error("Invalid user role.");
    }

    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where("role", "==", role));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(mapUserDocument);
  } catch (error) {
    handleServiceError("Fetch users by role", error);
  }
}

// Get only active users
export async function getActiveUsers() {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where("is_active", "==", true));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(mapUserDocument);
  } catch (error) {
    handleServiceError("Fetch active users", error);
  }
}

// Get active and available volunteers
export async function getAvailableVolunteers() {
  try {
    const usersRef = collection(db, USERS_COLLECTION);

    const q = query(
      usersRef,
      where("role", "==", USER_ROLES.VOLUNTEER),
      where("is_active", "==", true),
      where("is_available", "==", true)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(mapUserDocument);
  } catch (error) {
    handleServiceError("Fetch available volunteers", error);
  }
}

// Update allowed user profile fields only
export async function updateUserProfile(uid, updates) {
  try {
    validateUid(uid);

    // Remove protected fields before updating
    const sanitizedUpdates = sanitizeUserUpdates(updates);

    if (Object.keys(sanitizedUpdates).length === 0) {
      throw new Error("No valid fields to update.");
    }

    const userRef = doc(db, USERS_COLLECTION, uid);

    await updateDoc(userRef, {
      ...sanitizedUpdates,
      updated_at: serverTimestamp(),
    });

    return true;
  } catch (error) {
    handleServiceError("Update user profile", error);
  }
}

// Update volunteer availability
export async function updateUserAvailability(uid, isAvailable) {
  return updateUserProfile(uid, {
    is_available: Boolean(isAvailable),
  });
}

// Update last login time
export async function updateLastLogin(uid) {
  try {
    validateUid(uid);

    const userRef = doc(db, USERS_COLLECTION, uid);

    await updateDoc(userRef, {
      last_login_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return true;
  } catch (error) {
    handleServiceError("Update last login", error);
  }
}

// Reactivate a previously disabled/deleted user
export async function activateUser(uid) {
  return updateUserProfile(uid, {
    is_active: true,
    deleted_at: null,
  });
}

// Disable user without deleting data
export async function deactivateUser(uid) {
  return updateUserProfile(uid, {
    is_active: false,
  });
}

// Soft delete: keep the document but mark it as deleted/inactive
export async function deleteUserProfile(uid) {
  try {
    validateUid(uid);

    const userRef = doc(db, USERS_COLLECTION, uid);

    await updateDoc(userRef, {
      is_active: false,
      is_available: false,
      deleted_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return true;
  } catch (error) {
    handleServiceError("Delete user profile", error);
  }
}