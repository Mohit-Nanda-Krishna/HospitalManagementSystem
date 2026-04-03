import Home from "./pages/Home";
import PatientLogin from "./pages/PatientLogin";
import PatientSignup from "./pages/PatientSignup";
import PatientVitals from "./pages/PatientVitals";
import PatientDashboard from "./pages/PatientDashboard";
import AdminPanel from "./pages/Admin";
import DoctorPortal from "./pages/DoctorPortal";
import DoctorLogin from "./pages/DoctorLogin";
import DoctorSignup from "./pages/DoctorSignup";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import { auth } from "./firebase";
import { Navigate, Routes, Route } from "react-router-dom";

function ProtectedAdminRoute({ children }) {
  return auth.currentUser ? children : <Navigate to="/admin-login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/patient-login" element={<PatientLogin />} />
      <Route path="/patient-signup" element={<PatientSignup />} />
      <Route path="/patient-vitals" element={<PatientVitals />} />
      <Route path="/patient-dashboard" element={<PatientDashboard />} />
      <Route path="/admin" element={<Navigate to="/admin-login" replace />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-signup" element={<AdminSignup />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminPanel />
          </ProtectedAdminRoute>
        }
      />
      <Route path="/doctor-portal" element={<DoctorPortal />} />
      <Route path="/doctor-login" element={<DoctorLogin />} />
      <Route path="/doctor-signup" element={<DoctorSignup />} />
    </Routes>
  );
}

export default App;
