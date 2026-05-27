import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "../firebase";

import {
  createUserProfile,
  getUserById,
  updateLastLogin,
} from "./userService";

// Firebase Authentication error messages
const AUTH_ERROR_MESSAGES = {
  "auth/email-already-in-use": "This email is already in use.",
  "auth/invalid-email": "Invalid email address.",
  "auth/weak-password": "Password is too weak.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed":
    "Network error. Please check your connection.",
};

// Normalize email format
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// Convert Firebase error into user-friendly message
function getAuthErrorMessage(error) {
  return (
    AUTH_ERROR_MESSAGES[error.code] ||
    error.message ||
    "Authentication failed."
  );
}

// Basic validation before auth requests
function validateEmailAndPassword(email, password) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }
}

// Register new user
// 1. Create Firebase Auth account
// 2. Create Firestore user profile
export async function registerUser(email, password, userData = {}) {
  let userCredential = null;

  try {
    validateEmailAndPassword(email, password);

    const normalizedEmail = normalizeEmail(email);

    // Create Firebase Authentication account
    userCredential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    const uid = userCredential.user.uid;

    // Create Firestore user profile
    const profile = await createUserProfile(uid, {
      ...userData,
      email: normalizedEmail,
    });

    return {
      authUser: userCredential.user,
      profile,
    };
  } catch (error) {
    // Rollback:
    // If Firestore profile creation fails,
    // remove the Firebase Auth account
    if (userCredential?.user) {
      await userCredential.user.delete().catch((deleteError) => {
        console.error(
          "Rollback auth user delete failed:",
          deleteError
        );
      });
    }

    console.error("Register user failed:", error);

    throw new Error(getAuthErrorMessage(error));
  }
}

// Login existing user
export async function loginUser(email, password) {
  try {
    validateEmailAndPassword(email, password);

    const normalizedEmail = normalizeEmail(email);

    // Login using Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    const uid = userCredential.user.uid;

    // Fetch Firestore profile
    const profile = await getUserById(uid);

    // If profile does not exist -> logout immediately
    if (!profile) {
      await signOut(auth);
      throw new Error("User profile not found.");
    }

    // Block inactive users
    if (profile.is_active === false) {
      await signOut(auth);
      throw new Error("User account is inactive.");
    }

    // Update last login timestamp
    await updateLastLogin(uid);

    return {
      authUser: userCredential.user,
      profile,
    };
  } catch (error) {
    console.error("Login user failed:", error);

    throw new Error(getAuthErrorMessage(error));
  }
}

// Logout current user
export async function logoutUser() {
  try {
    await signOut(auth);

    return true;
  } catch (error) {
    console.error("Logout user failed:", error);

    throw new Error("Logout failed. Please try again.");
  }
}

// Get current Firebase authenticated user
export function getCurrentAuthUser() {
  return auth.currentUser;
}

// Listen for authentication state changes
// Firebase returns an unsubscribe function
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}

// Get current user's Firestore profile
export async function getCurrentUserProfile() {
  try {
    const currentUser = auth.currentUser;

    // No logged in user
    if (!currentUser) {
      return null;
    }

    // Fetch Firestore profile
    return await getUserById(currentUser.uid);
  } catch (error) {
    console.error(
      "Fetch current user profile failed:",
      error
    );

    return null;
  }
}