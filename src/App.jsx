import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import {
  subscribeToAuthChanges,
  getCurrentUserProfile,
} from "./services/authService";

import { USER_ROLES } from "./services/userSchema";

// Decide default route after login based on role
function getDashboardPathByRole(role) {
  switch (role) {
    case USER_ROLES.ADMIN:
      return "/admin-dashboard";
    case USER_ROLES.COORDINATOR:
      return "/coordinator-dashboard";
    case USER_ROLES.VOLUNTEER:
      return "/volunteer-dashboard";
    default:
      return "/dashboard";
  }
}

// Protect private pages
function ProtectedRoute({ userProfile, allowedRoles, children }) {
  // Not logged in
  if (!userProfile) {
    return <Navigate to="/" replace />;
  }

  // Block inactive users
  if (userProfile.is_active === false) {
    return <Navigate to="/" replace />;
  }

  // Block users with wrong role
  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to={getDashboardPathByRole(userProfile.role)} replace />;
  }

  return children;
}

function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = subscribeToAuthChanges(async (authUser) => {
      try {
        if (!authUser) {
          setUserProfile(null);
          return;
        }

        // Fetch full user profile from Firestore
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error("Auth state change failed:", error);
        setUserProfile(null);
      } finally {
        // Always stop loading, even if profile fetch fails
        setCheckingAuth(false);
      }
    });

    // Cleanup listener when App unmounts
    return () => unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <div style={styles.loadingPage}>
        <span style={styles.loadingText}>🐝 Loading...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public login page.
            If user is already logged in, redirect to correct dashboard. */}
        <Route
          path="/"
          element={
            userProfile ? (
              <Navigate to={getDashboardPathByRole(userProfile.role)} replace />
            ) : (
              <Login />
            )
          }
        />

        {/* General protected dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute userProfile={userProfile}>
              <Dashboard userProfile={userProfile} />
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute
              userProfile={userProfile}
              allowedRoles={[USER_ROLES.ADMIN]}
            >
              <Dashboard userProfile={userProfile} />
            </ProtectedRoute>
          }
        />

        {/* Coordinator dashboard */}
        <Route
          path="/coordinator-dashboard"
          element={
            <ProtectedRoute
              userProfile={userProfile}
              allowedRoles={[USER_ROLES.COORDINATOR]}
            >
              <Dashboard userProfile={userProfile} />
            </ProtectedRoute>
          }
        />

        {/* Volunteer dashboard */}
        <Route
          path="/volunteer-dashboard"
          element={
            <ProtectedRoute
              userProfile={userProfile}
              allowedRoles={[USER_ROLES.VOLUNTEER]}
            >
              <Dashboard userProfile={userProfile} />
            </ProtectedRoute>
          }
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                userProfile
                  ? getDashboardPathByRole(userProfile.role)
                  : "/"
              }
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
    background:
      "linear-gradient(135deg, #fff7df 0%, #eef7f2 100%)",
  },

  loadingText: {
    fontSize: "20px",
    color: "#173b2f",
    fontWeight: "bold",
  },
};

export default App;