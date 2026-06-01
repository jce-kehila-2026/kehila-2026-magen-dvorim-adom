import { NavLink, useNavigate } from "react-router-dom";

import { logoutUser } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import { USER_ROLES } from "../services/userSchema";

function Navbar() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!userProfile) {
    return null;
  }

  const activeLink = ({ isActive }) => ({
    color: isActive ? "#173b2f" : "#1f5a46",
    background: isActive ? "#dff4e5" : "transparent",
    padding: "10px 16px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 600,
    display: "inline-block",
  });

  return (
    <header style={styles.header}>
      <div style={styles.brand}>
        <span style={styles.logo}>🐝</span>
        <div>
          <strong style={styles.brandName}>Magen Dvorim Adom</strong>
          <div style={styles.userMeta}>
            {userProfile.full_name} • {userProfile.role}
          </div>
        </div>
      </div>

      <nav style={styles.nav}>
        <NavLink to="/dashboard" style={activeLink}>
          Dashboard
        </NavLink>

        {(userProfile.role === USER_ROLES.ADMIN ||
          userProfile.role === USER_ROLES.COORDINATOR) && (
          <>
            <NavLink to="/cases" style={activeLink}>
              Cases
            </NavLink>
          </>
        )}

        {(userProfile.role === USER_ROLES.ADMIN ||
          userProfile.role === USER_ROLES.COORDINATOR) && (
          <>
            <NavLink to="/users" style={activeLink}>
              Users
            </NavLink>
          </>
        )}

        <NavLink to="/my-cases" style={activeLink}>
          My Cases
        </NavLink>

        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </nav>
    </header>
  );
}

const styles = {
  header: {
    width: "100%",
    padding: "18px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    background: "#f2f9f2",
    borderBottom: "1px solid #d9e8d8",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  logo: {
    fontSize: "28px",
  },
  brandName: {
    display: "block",
    fontSize: "18px",
    color: "#173b2f",
  },
  userMeta: {
    fontSize: "13px",
    color: "#4d6f5c",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  logoutButton: {
    border: "none",
    borderRadius: "12px",
    padding: "10px 18px",
    background: "#f39c12",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
};

export default Navbar;
