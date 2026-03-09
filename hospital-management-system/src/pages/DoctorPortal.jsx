function DoctorPortal() {
  const items = [
    {
      title: "Review Schedules",
      text: "See your upcoming appointments and organize consultations by date and time.",
    },
    {
      title: "Patient History",
      text: "Access visit summaries, diagnosis notes, and prior treatment context quickly.",
    },
    {
      title: "Daily Consultation Updates",
      text: "Track consultation progress and stay aligned with day-to-day clinical updates.",
    },
  ];

  return (
    <main style={{ maxWidth: "980px", margin: "0 auto", padding: "3rem 1.4rem" }}>
      <h1 style={{ marginTop: 0 }}>Doctor Portal</h1>
      <p style={{ color: "#51607a", maxWidth: "68ch" }}>
        Review schedules, patient history, and daily consultation updates.
      </p>

      <section
        style={{
          marginTop: "1.4rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {items.map((item) => (
          <article
            key={item.title}
            style={{
              background: "#ffffff",
              border: "1px solid #d9e3f4",
              borderRadius: "14px",
              padding: "1rem",
              boxShadow: "0 10px 24px rgba(10, 43, 92, 0.08)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>{item.title}</h3>
            <p style={{ marginBottom: 0, color: "#51607a", lineHeight: 1.6 }}>{item.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default DoctorPortal;
