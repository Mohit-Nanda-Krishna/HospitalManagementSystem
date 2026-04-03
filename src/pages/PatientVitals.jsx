import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "../styles/auth.css";
import "../styles/patientVitals.css";

const initialForm = {
  fullName: "",
  age: "",
  gender: "",
  phone: "",
  address: "",
  bloodGroup: "",
  heightCm: "",
  weightKg: "",
  allergies: "",
  chronicConditions: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

function PatientVitals() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/patient-login");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          navigate("/patient-signup");
          return;
        }

        const patientRef = doc(db, "patients", user.uid);
        const patientSnap = await getDoc(patientRef);

        if (patientSnap.exists()) {
          const data = patientSnap.data();
          if (data?.vitalsCompleted) {
            navigate("/patient-dashboard");
            return;
          }

          setForm((current) => ({
            ...current,
            fullName: data.name || "",
            age: data.age || "",
            gender: data.gender || "",
            phone: data.phone || "",
            address: data.address || "",
            bloodGroup: data.bloodGroup || "",
            heightCm: data.vitals?.heightCm || "",
            weightKg: data.vitals?.weightKg || "",
            allergies: data.vitals?.allergies || "",
            chronicConditions: data.vitals?.chronicConditions || "",
            emergencyContactName: data.vitals?.emergencyContactName || "",
            emergencyContactPhone: data.vitals?.emergencyContactPhone || "",
          }));
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    const user = auth.currentUser;
    if (!user) {
      navigate("/patient-login");
      return;
    }

    try {
      const patientRef = doc(db, "patients", user.uid);
      const patientSnap = await getDoc(patientRef);

      await setDoc(
        patientRef,
        {
          uid: user.uid,
          email: user.email || "",
          name: form.fullName,
          age: form.age,
          gender: form.gender,
          phone: form.phone,
          address: form.address,
          bloodGroup: form.bloodGroup,
          vitals: {
            heightCm: form.heightCm,
            weightKg: form.weightKg,
            allergies: form.allergies,
            chronicConditions: form.chronicConditions,
            emergencyContactName: form.emergencyContactName,
            emergencyContactPhone: form.emergencyContactPhone,
          },
          vitalsCompleted: true,
          updatedAt: serverTimestamp(),
          ...(patientSnap.exists()
            ? {}
            : { role: "patient", createdAt: serverTimestamp() }),
        },
        { merge: true }
      );

      await updateDoc(doc(db, "users", user.uid), {
        profileCompleted: true,
      });
      navigate("/patient-dashboard");
    } catch (err) {
      console.error(err);
      setError("Unable to save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="auth-page">
        <section className="auth-shell">
          <aside className="auth-brand-panel">
            <p className="auth-eyebrow">Patient Details</p>
            <h1>Setting Up Your Profile</h1>
            <p>We are preparing your patient record.</p>
          </aside>
          <div className="auth-card">
            <p className="auth-subtext">Loading your profile...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page vitals-page">
      <section className="auth-shell vitals-shell">
        <aside className="auth-brand-panel">
          <p className="auth-eyebrow">Patient Details</p>
          <h1>Complete Your Vital Information</h1>
          <p>
            We need a few health details to personalize your care plan. This is a
            one-time setup for your patient record.
          </p>
          <ul>
            <li>Securely stored in your profile</li>
            <li>Helps doctors respond faster</li>
            <li>Editable later from the dashboard</li>
          </ul>
        </aside>

        <div className="auth-card vitals-card">
          <h2>Patient Vitals</h2>
          <p className="auth-subtext">
            Fill in your basic details and current health metrics.
          </p>

          <form className="vitals-form" onSubmit={handleSubmit}>
            <div className="vitals-grid">
              <div>
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="1"
                  value={form.age}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setForm((current) => ({ ...current, phone: val }));
                  }}
                  required
                />
              </div>

              <div className="vitals-full">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="bloodGroup">Blood Group</label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label htmlFor="heightCm">Height (cm)</label>
                <input
                  id="heightCm"
                  name="heightCm"
                  type="number"
                  min="30"
                  value={form.heightCm}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="weightKg">Weight (kg)</label>
                <input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  min="1"
                  value={form.weightKg}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="vitals-full">
                <label htmlFor="allergies">Allergies (if any)</label>
                <textarea
                  id="allergies"
                  name="allergies"
                  rows="2"
                  value={form.allergies}
                  onChange={handleChange}
                />
              </div>

              <div className="vitals-full">
                <label htmlFor="chronicConditions">Chronic Conditions</label>
                <textarea
                  id="chronicConditions"
                  name="chronicConditions"
                  rows="2"
                  value={form.chronicConditions}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="emergencyContactName">Emergency Contact (Optional)</label>
                <input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  type="text"
                  value={form.emergencyContactName}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[0-9]/g, "");
                    setForm((current) => ({ ...current, emergencyContactName: val }));
                  }}
                />
              </div>

              <div>
                <label htmlFor="emergencyContactPhone">Emergency Phone (Optional)</label>
                <input
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  type="tel"
                  value={form.emergencyContactPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setForm((current) => ({ ...current, emergencyContactPhone: val }));
                  }}
                />
              </div>
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="auth-btn primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save and Continue"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default PatientVitals;
