function Features() {
  const featureItems = [
    {
      title: "Fast Appointment Booking",
      text: "Reduce waiting time with a streamlined scheduling flow.",
    },
    {
      title: "Secure Medical Records",
      text: "Keep patient data protected with structured access control.",
    },
    {
      title: "Doctor Management",
      text: "Manage doctor availability, consultations, and follow-ups.",
    },
    {
      title: "Admin Dashboard",
      text: "Track system activity and operational metrics in one place.",
    },
  ];

  return (
    <section id="features" className="features-section">
      <div className="section-head">
        <h2>Why Use our HMS</h2>
        <p>Everything required to run hospital workflows with efficiency and control.</p>
      </div>

      <div className="feature-grid">
        {featureItems.map((item) => (
          <article className="feature-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Features;
