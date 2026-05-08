import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "10px", background: "#eee" }}>
      <Link to="/submit-case">Submit Case</Link>{" | "}
      <Link to="/login">Login</Link>{" | "}
      <Link to="/volunteer">Volunteer</Link>{" | "}
      <Link to="/coordinator">Coordinator</Link>{" | "}
      <Link to="/admin">Admin</Link>
    </nav>
  );
}

export default Navbar;