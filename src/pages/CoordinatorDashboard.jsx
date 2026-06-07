import Navbar from "../components/Navbar";
import AssignedCasesMap from "../components/AssignedCasesMap";

function CoordinatorDashboard() {
  return (
    <div>
      <Navbar />
      <div
        style={{
          maxWidth: "1100px",
          margin: "40px auto",
          padding: "32px",
          background: "#fffdf4",
          borderRadius: "24px",
        }}
      >
        <h1 style={{ color: "#f57c00" }}>Coordinator Dashboard</h1>
        <p style={{ color: "#6b4f00" }}>
          Assigned cases map will help coordinators monitor active assigned cases by location.
        </p>

        <AssignedCasesMap />
      </div>
    </div>
  );
}

export default CoordinatorDashboard;