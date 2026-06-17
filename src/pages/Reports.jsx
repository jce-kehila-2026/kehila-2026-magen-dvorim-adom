import { useEffect, useState } from "react";
import ReportsView from "../components/views/ReportsView";
import { getReportsStats } from "../services/reportService";
import { useAuth } from "../contexts/AuthContext";

function Reports() {
  const { userProfile } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getReportsStats();
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