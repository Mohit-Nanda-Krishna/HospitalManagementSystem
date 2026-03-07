function Features() {
  return (
    <section id="features" style={styles.section}>
      <h2>Why Use HMS?</h2>

      <div style={styles.grid}>
        <div>⚡ Fast Appointment Booking</div>
        <div>🔒 Secure Medical Records</div>
        <div>👨‍⚕️ Doctor Management</div>
        <div>📊 Admin Dashboard</div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    background: "#F8FAFC",
    padding: "60px",
    textAlign: "center",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 200px)",
    justifyContent: "center",
    gap: "20px",
    marginTop: "30px",
  },
};

export default Features;