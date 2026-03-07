function PortalCards() {
  return (
    <section id="portal" style={styles.container}>
      <h2>Choose Your Portal</h2>

      <div style={styles.cards}>

        <div style={styles.card}>
          <h3>👤 Patient</h3>
          <p>Book appointments and view prescriptions</p>
          <button>Enter</button>
        </div>

        <div style={styles.card}>
          <h3>🩺 Doctor</h3>
          <p>Manage patients and appointments</p>
          <button>Enter</button>
        </div>

        <div style={styles.card}>
          <h3>⚙ Admin</h3>
          <p>Control system and manage users</p>
          <button>Enter</button>
        </div>

      </div>
    </section>
  );
}

const styles = {
  container: {
    textAlign: "center",
    padding: "60px 20px",
  },

  cards: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    marginTop: "30px",
  },

  card: {
    background: "white",
    padding: "30px",
    width: "250px",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
};

export default PortalCards;