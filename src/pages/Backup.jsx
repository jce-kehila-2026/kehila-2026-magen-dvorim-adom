import { useAuth } from "../contexts/AuthContext";
import { logoutUser } from "../services/authService";
import BackupView from "../components/views/BackupView";

function Backup() {
  const { userProfile } = useAuth();

  const currentUserName =
    userProfile?.full_name ||
    userProfile?.displayName ||
    userProfile?.email ||
    "User";

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <BackupView
      userProfile={userProfile}
      currentUserName={currentUserName}
      handleLogout={handleLogout}
    />
  );
}

export default Backup;
