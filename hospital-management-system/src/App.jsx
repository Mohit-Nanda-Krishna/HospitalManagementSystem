import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import PatientLogin from "./pages/PatientLogin";
import PatientSignup from "./pages/PatientSignup";
import PatientVitals from "./pages/PatientVitals";
import PatientDashboard from "./pages/PatientDashboard";
import AdminPanel from "./pages/Admin";
import DoctorPortal from "./pages/DoctorPortal";
import { Navigate, Routes, Route } from "react-router-dom";

function ProtectedAdminRoute({ children }) {
  const hasAdminSession =
    typeof window !== "undefined" &&
    window.sessionStorage.getItem("hmsAdminSession") === "active";

  return hasAdminSession ? children : <Navigate to="/admin" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/patient-login" element={<PatientLogin />} />
      <Route path="/patient-signup" element={<PatientSignup />} />
      <Route path="/patient-vitals" element={<PatientVitals />} />
      <Route path="/patient-dashboard" element={<PatientDashboard />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminPanel />
          </ProtectedAdminRoute>
        }
      />
      <Route path="/doctor-portal" element={<DoctorPortal />} />
    </Routes>
  );
}

export default App;

