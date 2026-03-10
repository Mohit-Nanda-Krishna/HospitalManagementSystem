import doctorImg from "../assets/undraw_medicine_hqqg.svg";
function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <span className="hero-kicker">Trusted & Efficent Healthcare Operations Platform</span>
        <h1>Hospital Management System Built for Speed and Reliability</h1>
        <p>
          Unify patient records, appointments, doctor schedules, and admin workflows
          in one secure and intuitive workspace.
        </p>

        <div className="hero-actions">
          <a className="btn btn-primary" href="#portal">
            Get Started
          </a>
          <a className="btn btn-secondary" href="#features">
            Explore Features
          </a>
        </div>

        <div className="hero-metrics">
          <div>
            <strong>24/7</strong>
            <span>Operations Ready</span>
          </div>
          <div>
            <strong>Secure</strong>
            <span>Role-Based Access</span>
          </div>
          <div>
            <strong>Fast</strong>
            <span>Appointment Flow</span>
          </div>
        </div>
      </div>

      <div className="hero-visual" aria-hidden="true">
        <img src={doctorImg} alt="Doctors" />
      </div>
    </section>
  );
}

export default Hero;
