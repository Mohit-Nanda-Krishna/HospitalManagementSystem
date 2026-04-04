import Home from "./pages/Home";
import PatientLogin from "./pages/PatientLogin";
import PatientSignup from "./pages/PatientSignup";
import PatientVitals from "./pages/PatientVitals";
import PatientDashboard from "./pages/PatientDashboard";
import AdminPanel from "./pages/Admin";
import DoctorLogin from "./pages/DoctorLogin";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Navigate, Routes, Route } from "react-router-dom";

function ProtectedRoleRoute({ children, requiredRole, redirectTo }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) {
          setStatus("denied");
        }
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (active) {
          if (!userSnap.exists()) {
            setStatus("denied");
            return;
          }

          const userData = userSnap.data();
          const isApprovedDoctor =
            requiredRole !== "doctor" ||
            (userData.role === "doctor" && userData.approved === true);

          setStatus(userData.role === requiredRole && isApprovedDoctor ? "allowed" : "denied");
        }
      } catch (error) {
        if (active) {
          setStatus("denied");
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [requiredRole]);

  if (status === "checking") {
    return <div style={{ padding: "2rem" }}>Checking access...</div>;
  }

  return status === "allowed" ? children : <Navigate to={redirectTo} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/patient-login" element={<PatientLogin />} />
      <Route path="/patient-signup" element={<PatientSignup />} />
      <Route path="/patient-vitals" element={<PatientVitals />} />
      <Route
        path="/patient-dashboard"
        element={
          <ProtectedRoleRoute requiredRole="patient" redirectTo="/patient-login">
            <PatientDashboard />
          </ProtectedRoleRoute>
        }
      />
      <Route path="/admin" element={<Navigate to="/admin-login" replace />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-signup" element={<AdminSignup />} />
      <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoleRoute requiredRole="admin" redirectTo="/admin-login">
            <AdminPanel />
          </ProtectedRoleRoute>
        }
      />
      <Route path="/doctor-portal" element={<Navigate to="/doctor-login" replace />} />
      <Route path="/doctor-login" element={<DoctorLogin />} />
      <Route path="/doctor-signup" element={<Navigate to="/doctor-login" replace />} />
      <Route
        path="/doctor-dashboard"
        element={
          <ProtectedRoleRoute requiredRole="doctor" redirectTo="/doctor-login">
            <DoctorDashboard />
          </ProtectedRoleRoute>
        }
      />
    </Routes>
  );
}

export default App;
