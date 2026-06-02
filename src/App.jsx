import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import AdminUsers from "./pages/AdminUsers";
import SubmitCase from "./pages/SubmitCase";
import CoordinatorCases from "./pages/CoordinatorCases";
import CoordinatorSendForm from "./pages/CoordinatorSendForm";
import MyCases from "./pages/MyCases";
import Profile from "./pages/Profile";

import { useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { USER_ROLES } from "./services/userSchema";
import { getDashboardPathByRole } from "./utils/routes";

function App() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <span style={styles.loadingText}>🐝 Loading...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {userProfile?.role === USER_ROLES.VOLUNTEER ? (
                <VolunteerDashboard />
              ) : (
                <Dashboard />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator-dashboard"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.COORDINATOR]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/volunteer-dashboard"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.VOLUNTEER]}>
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.COORDINATOR]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cases"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.COORDINATOR]}>
              <CoordinatorCases />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-cases"
          element={
            <ProtectedRoute>
              <MyCases />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/send-form"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.COORDINATOR]}>
              <CoordinatorSendForm />
            </ProtectedRoute>
          }
        />

        <Route path="/submit-case" element={<SubmitCase />} />

        <Route
          path="*"
          element={
            userProfile ? (
              <Navigate to={getDashboardPathByRole(userProfile.role)} replace />
            ) : (
              <Navigate to="/" replace />
            )
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