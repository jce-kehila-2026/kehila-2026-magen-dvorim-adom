import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import VolunteerDashboardView from "../components/views/VolunteerDashboardView";
import { getVolunteerAssignmentStats } from "../services/assignmentService";
import { logoutUser } from "../services/authService";

function VolunteerDashboard() {
  const { userProfile } = useAuth();

  const [stats, setStats] = useState({
    openCases: 0,
    completedRescues: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userProfile?.uid) return;
    loadStats();
  }, [userProfile]);

  const loadStats = async () => {
    setLoading(true);
    setError("");

    try {
      const { assignedCases, completedRescues } =
        await getVolunteerAssignmentStats(userProfile.uid);

      setStats({
        openCases: assignedCases,
        completedRescues,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
      setError(err.message || "Unable to load dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <VolunteerDashboardView
      userProfile={userProfile}
      stats={stats}
      loading={loading}
      error={error}
      handleLogout={handleLogout}
    />
  );
}

export default VolunteerDashboard;