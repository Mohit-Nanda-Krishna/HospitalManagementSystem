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

function DoctorLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        const docSnap = await getDoc(doc(db, "users", user.uid));

        if (!docSnap.exists()) {
          await signOut(auth);
          return;
        }

        const userData = docSnap.data();

        if (userData.role === "admin") {
          return;
        }

        if (userData.role === "doctor" && userData.approved === true) {
          navigate("/doctor-dashboard", { replace: true });
          return;
        }

        await signOut(auth);
      } catch (err) {
        console.error("Doctor session check failed", err);
        await signOut(auth);
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
      const docSnap = await getDoc(doc(db, "users", user.uid));

      if (!docSnap.exists()) {
        await signOut(auth);
        setError("Access denied. Not authorized doctor.");
        return;
      }

      const userData = docSnap.data();

      
      if (userData.role === "doctor" && userData.approved === true) {
        navigate("/doctor-dashboard", { replace: true });
        return;
      }

      await signOut(auth);
      setError("Access denied. Not authorized doctor.");
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
          <aside className="auth-brand-panel" style={{background: 'linear-gradient(135deg, #0f3d2e, #1f6f5b)'}}>
            <p className="auth-eyebrow">Doctor Access</p>
            <h1>Welcome Doctor</h1>
            <p>
              Sign in to manage your consultations, patient histories, and appointments.
            </p>
          </aside>

          <div className="auth-card">
            <h2>Doctor Login</h2>
            <p className="auth-subtext">Checking your session...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-brand-panel" style={{background: 'linear-gradient(135deg, #0f3d2e, #1f6f5b)'}}>
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
            <div className="auth-password-field">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="auth-btn primary" type="submit" disabled={loading} style={{background: '#0f3d2e'}}>
              {loading ? "Signing In..." : "Sign In"}
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

export default DoctorLogin;
