import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
   getAuth ,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import { auth, firebaseConfig, } from "../firebase";

import {
  createUserProfile,
  getUserById,
  getUserByEmail,
  updateLastLogin,
} from "./userService";

import { getApps, getApp, initializeApp } from "firebase/app";

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
  try {
    validateEmailAndPassword(email, password);

    const normalizedEmail = normalizeEmail(email);

    // ✅ Create secondary Firebase app
    
    const secondaryApp =
      getApps().find(app => app.name === "Secondary") ||
      initializeApp(firebaseConfig, "Secondary");

    const secondaryAuth = getAuth(secondaryApp);

    // ✅ Create user WITHOUT switching current session
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      normalizedEmail,
      password
    );

    const uid = userCredential.user.uid;

    // ✅ Now Firestore still sees YOU as admin
    await createUserProfile(uid, {
      ...userData,
      email: normalizedEmail,
    });

    // ✅ logout secondary (cleanup)
    await secondaryAuth.signOut();

    return {
      uid,
      email: normalizedEmail,
    };

  } catch (error) {
    console.error("Register user failed:", error);
    throw new Error(getAuthErrorMessage(error));
  }
}

async function findUserProfile(uid) {
  return await getUserById(uid);
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

    // Fetch Firestore profile by uid, 
    const profile = await findUserProfile(uid);

    if (!profile) {
      await signOut(auth);
      throw new Error(
        "User profile not found. Please ensure your Firestore user document uses your Firebase Auth UID as the document ID or includes the login email in the email field."
      );
    }

    await updateLastLogin(profile.uid);

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

// Change the current user's password after confirming their current password
export async function changeUserPassword(currentPassword, newPassword) {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser?.email) {
      throw new Error("No authenticated user found.");
    }

    validateEmailAndPassword(currentUser.email, currentPassword);

    if (!newPassword) {
      throw new Error("New password is required.");
    }

    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );

    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);

    return true;
  } catch (error) {
    console.error("Change password failed:", error);

    throw new Error(getAuthErrorMessage(error), { cause: error });
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
    const email = currentUser.email ? normalizeEmail(currentUser.email) : "";

    return await findUserProfile(currentUser.uid);
  } catch (error) {
    console.error(
      "Fetch current user profile failed:",
      error
    );

    return null;
  }
}
