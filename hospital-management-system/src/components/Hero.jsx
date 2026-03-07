function Hero() {
  return (
    <section style={styles.hero}>
      <div style={styles.left}>
        <h1>Hospital Management System</h1>
        <p>
          A modern platform to manage patients, doctors, appointments
          and medical records efficiently.
        </p>

        <button style={styles.btn}>Get Started</button>
      </div>

      <div>
        <img
          src="https://cdn-icons-png.flaticon.com/512/3774/3774299.png"
          width="350"
        />
      </div>
    </section>
  );
}

const styles = {
  hero: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    padding: "80px 20px",
    background: "linear-gradient(to right,#DBEAFE,#F8FAFC)",
  },

  left: {
    maxWidth: "500px",
  },

  btn: {
    marginTop: "20px",
    padding: "12px 25px",
    background: "#2563EB",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default Hero;