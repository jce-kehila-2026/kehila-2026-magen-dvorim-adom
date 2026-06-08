import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardView from "../components/views/DashboardView";

import { logoutUser } from "../services/authService";
import { getAllCases, getCasesForCoordinatorById } from "../services/caseService";
import { getUsersByRole } from "../services/userService";
import { USER_ROLES } from "../services/userSchema";
import { useAuth } from "../contexts/AuthContext";
import { getVolunteerAssignmentStats } from "../services/assignmentService";


function Dashboard() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    openCases: 0,
    volunteers: 0,
    completedRescues: 0,
  });
  const [allCases, setAllCases] = useState([]);
  const [sendFormOpen, setSendFormOpen] = useState(false);


  useEffect(() => {
    if (!userProfile) return;
    const loadStats = async () => {
      try {
        if (userProfile?.role === USER_ROLES.ADMIN) {
          const [cases, volunteerUsers] = await Promise.all([
            getAllCases(),
            getUsersByRole(USER_ROLES.VOLUNTEER),
          ]);
          setAllCases(cases);
          setStats({
            openCases: cases.filter((c) => c.status !== "closed").length,
            volunteers: volunteerUsers.length,
            completedRescues: cases.filter((c) => c.status === "closed").length,
          });
        } else if (userProfile?.role === USER_ROLES.COORDINATOR) {
          const [myCases, volunteerStats] = await Promise.all([
           getCasesForCoordinatorById(userId),
           getVolunteerAssignmentStats(userId),
          ]);
          setAllCases(myCases);
          setStats({
            openCases: myCases.filter((c) => c.status !== "closed").length,
            volunteers: volunteerStats.assignedCases,
            completedRescues: myCases.filter((c) => c.status === "closed").length,
          });
        }
      } catch (err) {
        console.error("Dashboard stats load failed:", err);
      }
    };
    loadStats();
  }, [userProfile]);
  const handleLogout = async () => {
    try {
      setError("");
      await logoutUser();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Logout failed. Please try again.");
    }
  };

return (
  <DashboardView
    userProfile={userProfile}
    stats={stats}
    allCases={allCases}
    error={error}
    sendFormOpen={sendFormOpen}
    setSendFormOpen={setSendFormOpen}
    onLogout={handleLogout}
  />
);
}

export default Dashboard;
