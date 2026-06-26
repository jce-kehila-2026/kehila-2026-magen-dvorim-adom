import { useEffect, useState } from "react";
import ReportsView from "../components/views/ReportsView";
import { getReportsStats } from "../services/reportService";
import { useAuth } from "../contexts/AuthContext";
import { USER_ROLES } from "../services/userSchema";

function Reports() {
  const { userProfile } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUserId = userProfile?.uid || null;
  const currentUserRole = userProfile?.role || "";

  useEffect(() => {
    if (!currentUserId) return;
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, currentUserRole]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const coordinatorId =
        currentUserRole === USER_ROLES.COORDINATOR ? currentUserId : null;

      const data = await getReportsStats(coordinatorId);
      setStats(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReportsView
      userProfile={userProfile}
      stats={stats}
      loading={loading}
      error={error}
      onRefresh={loadReports}
    />
  );
}

export default Reports;