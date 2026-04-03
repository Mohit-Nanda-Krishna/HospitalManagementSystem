import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import "../styles/auth.css";

const ADMIN_EMAIL = "admin@hms.com";
const ADMIN_PASSWORD = "admin123";

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (sessionStorage.getItem("hmsAdminSession") === "active") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleLogin = (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Enter admin email and password.");
      return;
    }

    setLoading(true);

    window.setTimeout(() => {
      if (
        email.trim().toLowerCase() === ADMIN_EMAIL &&
        password === ADMIN_PASSWORD
      ) {
        sessionStorage.setItem("hmsAdminSession", "active");
        navigate("/admin/dashboard");
        return;
      }

      setError("Invalid admin credentials. Use the demo admin account.");
      setLoading(false);
    }, 500);
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-brand-panel">
          <p className="auth-eyebrow">Admin Access</p>
          <h1>Hospital Operations Control</h1>
          <p>
            Sign in to review capacity, manage doctors and patients, and monitor
            hospital operations in one place.
          </p>
          <ul>
            <li>Live operational dashboard</li>
            <li>Centralized appointments and bed tracking</li>
            <li>Inventory and billing watchlists</li>
          </ul>
        </aside>

        <div className="auth-card">
          <h2>Admin Login</h2>
          <p className="auth-subtext">
            Use the hospital administrator credentials to continue.
          </p>

          <form onSubmit={handleLogin} className="auth-form">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              placeholder="admin@hms.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="auth-btn primary" type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="auth-switch">
            <strong>Demo Admin Access</strong>
            <p>Email: {ADMIN_EMAIL}</p>
            <p>Password: {ADMIN_PASSWORD}</p>
          </div>

          <Link className="auth-back" to="/">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default AdminLogin;
