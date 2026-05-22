import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Dashboard() {
  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>🐝</div>
        <h2 style={styles.brand}>Magen Dvorim Adom</h2>

        <nav style={styles.nav}>
          <button style={styles.navItem}>Dashboard</button>
          <button style={styles.navItem}>Cases</button>
          <button style={styles.navItem}>Volunteers</button>
          <button style={styles.navItem}>Reports</button>
        </nav>

        <button style={styles.logout} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>Welcome back. Here is today’s rescue overview.</p>
          </div>
        </header>

        <section style={styles.cards}>
          <div style={styles.card}>
            <span style={styles.icon}>📋</span>
            <h3>Open Cases</h3>
            <p style={styles.number}>12</p>
          </div>

          <div style={styles.card}>
            <span style={styles.icon}>🐝</span>
            <h3>Active Volunteers</h3>
            <p style={styles.number}>8</p>
          </div>

          <div style={styles.card}>
            <span style={styles.icon}>✅</span>
            <h3>Completed Rescues</h3>
            <p style={styles.number}>34</p>
          </div>
        </section>

        <section style={styles.panel}>
          <h2>Recent Activity</h2>
          <ul style={styles.list}>
            <li>New rescue request submitted in Jerusalem</li>
            <li>Volunteer assigned to Case #1024</li>
            <li>Case #1019 marked as completed</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "linear-gradient(135deg, #fff7df 0%, #eef7f2 100%)",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: "260px",
    padding: "28px",
    backgroundColor: "#173b2f",
    color: "white",
    display: "flex",
    flexDirection: "column",
  },
  logo: {
    fontSize: "42px",
    marginBottom: "12px",
  },
  brand: {
    fontSize: "22px",
    marginBottom: "36px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  navItem: {
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    textAlign: "left",
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "white",
    cursor: "pointer",
    fontSize: "15px",
  },
  logout: {
    marginTop: "auto",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#f6b73c",
    color: "#173b2f",
    fontWeight: "bold",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    padding: "40px",
  },
  header: {
    marginBottom: "30px",
  },
  title: {
    fontSize: "42px",
    color: "#173b2f",
    margin: 0,
  },
  subtitle: {
    color: "#5f6f68",
    fontSize: "17px",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginBottom: "28px",
  },
  card: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "22px",
    boxShadow: "0 14px 35px rgba(20,64,48,0.12)",
  },
  icon: {
    fontSize: "30px",
  },
  number: {
    fontSize: "38px",
    fontWeight: "bold",
    color: "#1f7a5c",
    margin: 0,
  },
  panel: {
    backgroundColor: "white",
    padding: "26px",
    borderRadius: "22px",
    boxShadow: "0 14px 35px rgba(20,64,48,0.12)",
  },
  list: {
    lineHeight: "2",
    color: "#4f5f58",
  },
};

export default Dashboard;