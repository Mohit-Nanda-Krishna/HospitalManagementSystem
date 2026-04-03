import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "../styles/auth.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCheckingSession(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().role === "admin") {
          navigate("/admin/dashboard", { replace: true });
          return;
        }

        await signOut(auth);
        setError("Unauthorized access");
      } catch (err) {
        console.error("Admin session check failed", err);
        await signOut(auth);
        setError("Unable to verify admin access. Please try again.");
      } finally {
        setCheckingSession(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        setError("Unauthorized access");
        return;
      }

      const userData = userSnap.data();
      if (userData.role !== "admin") {
        await signOut(auth);
        setError("Unauthorized access");
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-email"
      ) {
        setError("Invalid credentials");
      } else {
        setError("Unable to sign in right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="auth-page">
        <section className="auth-shell">
          <aside className="auth-brand-panel" style={{ background: "linear-gradient(135deg, #7f1d1d, #450a0a)" }}>
            <p className="auth-eyebrow">Admin Access</p>
            <h1>System Administrator</h1>
            <p>
              Secure portal for hospital administration, doctor management, and system operations.
            </p>
          </aside>

          <div className="auth-card">
            <h2>Admin Login</h2>
            <p className="auth-subtext">Checking your session...</p>
          </div>
        </section>
      </main>
    );
  }

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

          <Link className="auth-back" to="/">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default AdminLogin;
