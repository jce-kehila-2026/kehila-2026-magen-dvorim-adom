import { Navigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { getDashboardPathByRole } from "../utils/routes";

function ProtectedRoute({ allowedRoles, children }) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <span style={styles.loadingText}>🐝 Loading...</span>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return (
      <Navigate to={getDashboardPathByRole(userProfile.role)} replace />
    );
  }

  return children;
}

const styles = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #fff7df 0%, #eef7f2 100%)",
    fontFamily: "Arial, sans-serif",
  },
  loadingText: {
    fontSize: "20px",
    color: "#173b2f",
    fontWeight: "bold",
  },
};

export default ProtectedRoute;
