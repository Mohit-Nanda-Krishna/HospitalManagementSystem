import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import "../styles/auth.css";

function PatientLogin() {
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const routeAfterLogin = async (user) => {
    // Check if user exists in the core users collection
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // First-time Google login: Create both 'users' and 'patients' docs and bypass vitals
      await setDoc(userRef, {
        email: user.email || "",
        name: user.displayName || "Patient",
        role: "patient",
        profileCompleted: true,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "patients", user.uid), {
        uid: user.uid,
        name: user.displayName || "Patient",
        email: user.email || "",
        role: "patient",
        vitalsCompleted: false,
        createdAt: serverTimestamp(),
      });

      navigate("/patient-vitals");
      return;
    }

    const userData = userSnap.data();
    if (userData.role && userData.role !== "patient") {
      setError("This account is not registered as a Patient. Please use the correct portal.");
      return;
    }

    if (!userData.role) {
      await setDoc(
        userRef,
        {
          email: user.email || "",
          name: user.displayName || userData.name || "Patient",
          role: "patient",
          profileCompleted: userData.profileCompleted ?? true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    // Existing patient routing based on vitals status
    const patientRef = doc(db, "patients", user.uid);
    const patientSnap = await getDoc(patientRef);
    
    if (patientSnap.exists() && patientSnap.data()?.vitalsCompleted) {
      navigate("/patient-dashboard");
    } else {
      navigate("/patient-vitals");
    }
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
        <aside className="auth-brand-panel">
          <p className="auth-eyebrow">Patient Access</p>
          <h1>Welcome Back</h1>
          <p>
            Sign in to manage your appointments, prescriptions, and health
            records securely.
          </p>
          <ul>
            <li>Fast appointment booking</li>
            <li>Secure medical history</li>
            <li>Simple doctor follow-ups</li>
          </ul>
        </aside>

        <div className="auth-card">
          <h2>Patient Login</h2>
          <p className="auth-subtext">Use your registered email and password.</p>

          <form onSubmit={handleLogin} className="auth-form">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
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

            <button className="auth-btn primary" type="submit" disabled={loading}>
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
            New patient? <Link to="/patient-signup">Create an account</Link>
          </p>
          <Link className="auth-back" to="/">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default PatientLogin;
