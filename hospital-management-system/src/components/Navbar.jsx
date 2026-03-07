function Navbar() {
  return (
    <nav style={styles.nav}>
      <h2>🏥 HMS</h2>

      <div style={styles.links}>
        <a href="#">Home</a>
        <a href="#features">Features</a>
        <a href="#portal">Login</a>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 40px",
    background: "white",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
  },
  links: {
    display: "flex",
    gap: "20px",
  },
};

export default Navbar;