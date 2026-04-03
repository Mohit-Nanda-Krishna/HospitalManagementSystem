import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { collection, doc, serverTimestamp, setDoc, getDoc, getDocs } from "firebase/firestore";
import "../styles/auth.css";

function DoctorSignup() {
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const findDoctorProfileByEmail = async (emailAddress) => {
    const doctorSnap = await getDocs(collection(db, "doctors"));
    const normalizedEmail = (emailAddress || "").trim().toLowerCase();
    return doctorSnap.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .find(
        (doctor) => doctor.email && doctor.email.toLowerCase() === normalizedEmail
      );
  };

  const routeAfterLogin = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const doctorProfile = await findDoctorProfileByEmail(user.email);

    if (!doctorProfile) {
      setError("No admin-approved doctor profile was found for this email.");
      return;
    }

    if (doctorProfile.accessKey !== accessKey.trim()) {
      setError("Invalid 4 digit doctor access key.");
      return;
    }

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email || "",
        name: doctorProfile.name || user.displayName || "Doctor",
        role: "doctor",
        profileCompleted: true,
        createdAt: serverTimestamp(),
      });
      navigate("/doctor-portal");
      return;
    }

    const userData = userSnap.data();
    if (userData.role !== "doctor") {
      setError("This email is registered under a different role. Please use the correct portal.");
      return;
    }
    navigate("/doctor-portal");
  };

  const handleGoogleLogin = async () => {
    setError("");
    if (!/^\d{4}$/.test(accessKey.trim())) {
      setError("Enter the 4 digit doctor access key.");
      return;
    }
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

    if (!/^\d{4}$/.test(accessKey.trim())) {
      setError("Enter the 4 digit doctor access key.");
      return;
    }

    setLoading(true);

    try {
      const doctorProfile = await findDoctorProfileByEmail(email);
      if (!doctorProfile) {
        setError("Admin must create your doctor profile before signup.");
        return;
      }

      if (doctorProfile.accessKey !== accessKey.trim()) {
        setError("Invalid 4 digit doctor access key.");
        return;
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", user.uid), {
        email: user.email || email,
        name: doctorProfile.name || fullName,
        role: "doctor",
        profileCompleted: false,
        createdAt: serverTimestamp(),
      });
      navigate("/doctor-portal");
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
          <p className="auth-eyebrow">Doctor Registration</p>
          <h1>Join the Platform</h1>
          <p>
            Create your doctor account to connect with patients, process appointments, and provide expert care.
          </p>
          <ul>
            <li>Streamlined scheduling</li>
            <li>Verified medical profiles</li>
            <li>Secure patient data</li>
          </ul>
        </aside>

        <div className="auth-card">
          <h2>Doctor Signup</h2>
          <p className="auth-subtext">Register to access the exclusive doctor portal.</p>

          <form onSubmit={handleSignup} className="auth-form">
            <label htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              type="email"
              placeholder="doctor@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="signup-name">Full Name (with Title)</label>
            <input
              id="signup-name"
              type="text"
              placeholder="e.g., Dr. Rajesh Kumar"
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

            <label htmlFor="signup-access-key">4 Digit Access Key</label>
            <input
              id="signup-access-key"
              type="password"
              inputMode="numeric"
              maxLength="4"
              placeholder="Enter the key given by admin"
              value={accessKey}
              onChange={(e) =>
                setAccessKey(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              required
            />

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="auth-btn primary" type="submit" disabled={loading} style={{background: '#1e293b'}}>
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
            Already registered? <Link to="/doctor-login">Sign in</Link>
          </p>
          <Link className="auth-back" to="/">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default DoctorSignup;
