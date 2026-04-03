import { Link } from "react-router-dom";

function PortalCards() {
  return (
    <section id="portal" className="portal-section">
      <div className="section-head">
        <h2>Choose Your Portal</h2>
        <p>Role-specific access for patients, doctors, and administrators.</p>
      </div>

      <div className="portal-grid">
        <article className="portal-card">
          <h3>Patient Portal</h3>
          <p>Book appointments, track prescriptions, and manage profile details.</p>
          <Link to="/patient-login" className="card-action">
            Enter Portal
          </Link>
        </article>

        <article className="portal-card">
          <h3>Doctor Portal</h3>
          <p>Review schedules, patient history, and daily consultation updates.</p>
          <Link to="/doctor-login" className="card-action">
            Enter Portal
          </Link>
        </article>

        <article className="portal-card">
          <h3>Admin Portal</h3>
          <p>Monitor system activity, add doctors, and operational performance.</p>
          <Link to="/admin" className="card-action">
            Enter Portal
          </Link>
        </article>
      </div>
    </section>
  );
}

export default PortalCards;

