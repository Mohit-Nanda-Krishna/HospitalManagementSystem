import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import "../styles/auth.css";

function PatientSignup() {
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const routeAfterLogin = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
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
    if (userData.role !== "patient") {
      setError("This account is not registered as a Patient.");
      return;
    }

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

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // Create user doc
      await setDoc(doc(db, "users", user.uid), {
        email: user.email || email,
        name: fullName,
        role: "patient",
        profileCompleted: false,
        createdAt: serverTimestamp(),
      });
      // Do NOT create patients doc yet, let PatientVitals do it, 
      // or we can create it here. PatientVitals assumes profileCompleted is in users, and vitalsCompleted in patients.
      // We will let PatientVitals create the patients doc.
      navigate("/patient-vitals");
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
          <p className="auth-eyebrow">Patient Registration</p>
          <h1>Create Your Account</h1>
          <p>
            Join HMS Care to book appointments quickly and keep your health
            records organized in one place.
          </p>
          <ul>
            <li>Easy onboarding flow</li>
            <li>Protected patient data</li>
            <li>Access from any device</li>
          </ul>
        </aside>

        <div className="auth-card">
          <h2>Patient Signup</h2>
          <p className="auth-subtext">Set up your secure patient account.</p>

          <form onSubmit={handleSignup} className="auth-form">
            <label htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <input
              id="signup-confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="auth-btn primary" type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
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
            Already have an account? <Link to="/patient-login">Sign in</Link>
          </p>
          <Link className="auth-back" to="/">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default PatientSignup;
