import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "../styles/auth.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setError("Account missing in directory. Please contact support.");
        return;
      }

      const userData = userSnap.data();
      if (userData.role !== "admin") {
        setError("RESTRICTED: This account does not have administrative privileges.");
        return;
      }

      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-brand-panel" style={{background: 'linear-gradient(135deg, #7f1d1d, #450a0a)'}}>
          <p className="auth-eyebrow">Admin Access</p>
          <h1>System Administrator</h1>
          <p>
            Secure portal for hospital administration, doctor management, and system operations.
          </p>
          <ul>
            <li>Manage medical staff</li>
            <li>Monitor appointment flows</li>
            <li>Maintain system integrity</li>
          </ul>
        </aside>

        <div className="auth-card">
          <h2>Admin Login</h2>
          <p className="auth-subtext">Restricted Area. Authorized personnel only.</p>

          <form onSubmit={handleLogin} className="auth-form">
            <label htmlFor="login-email">Admin Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="admin@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="auth-btn primary" type="submit" disabled={loading} style={{background: '#7f1d1d'}}>
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>

          <p className="auth-switch" style={{marginTop: '2rem'}}>
            Need admin access? <Link to="/admin-signup">Register Admin</Link>
          </p>
          <Link className="auth-back" to="/">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default AdminLogin;
