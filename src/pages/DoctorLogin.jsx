import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import "../styles/auth.css";

function DoctorLogin() {
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const routeAfterLogin = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // If a doctor signs in with Google without an account, we create it.
      // But an admin needs to configure their availability later or they do it themselves
      await setDoc(userRef, {
        email: user.email || "",
        name: user.displayName || "Doctor",
        role: "doctor",
        profileCompleted: true,
        createdAt: serverTimestamp(),
      });
      // Also ensure they have a doctors record
      // Using email to merge if admin pre-created, but for simplicity, we let Admin link or we just use their UID
      navigate("/doctor-portal");
      return;
    }

    const userData = userSnap.data();
    if (userData.role !== "doctor") {
      setError("This account is not authorized as a Doctor. Please use the Patient Portal.");
      return;
    }

    navigate("/doctor-portal");
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const { user } = await signInWithPopup(auth, provider);
      await routeAfterLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await routeAfterLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-brand-panel" style={{background: 'linear-gradient(135deg, #0f172a, #334155)'}}>
          <p className="auth-eyebrow">Doctor Access</p>
          <h1>Welcome Doctor</h1>
          <p>
            Sign in to manage your consultations, patient histories, and appointments.
          </p>
          <ul>
            <li>Manage daily appointments</li>
            <li>Write digital prescriptions</li>
            <li>Access patient records globally</li>
          </ul>
        </aside>

        <div className="auth-card">
          <h2>Doctor Login</h2>
          <p className="auth-subtext">Use your registered email and password.</p>

          <form onSubmit={handleLogin} className="auth-form">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="doctor@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="auth-btn primary" type="submit" disabled={loading} style={{background: '#1e293b'}}>
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <button
              className="auth-btn secondary"
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>
          </form>

          <p className="auth-switch">
            Not registered? <Link to="/doctor-signup">Claim your account</Link>
          </p>
          <Link className="auth-back" to="/">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default DoctorLogin;
