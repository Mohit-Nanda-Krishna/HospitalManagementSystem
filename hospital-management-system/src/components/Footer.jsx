function Footer() {
  return (
    <footer style={styles.footer}>
      <p>Hospital Management System</p>
      <p>VIT Vellore Project</p>
      <p>© 2026</p>
    </footer>
  );
}

const styles = {
  footer: {
    textAlign: "center",
    padding: "20px",
    background: "#1F2937",
    color: "white",
  },
};

export default Footer;