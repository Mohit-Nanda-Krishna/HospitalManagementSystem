import Home from "./pages/Home";
import PatientLogin from "./pages/PatientLogin";
import PatientSignup from "./pages/PatientSignup";
import PatientDashboard from "./pages/PatientDashboard";
import AdminPanel from "./pages/Admin";
import DoctorPortal from "./pages/DoctorPortal";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/patient-login" element={<PatientLogin />} />
      <Route path="/patient-signup" element={<PatientSignup />} />
      <Route path="/patient-dashboard" element={<PatientDashboard />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/doctor-portal" element={<DoctorPortal />} />
    </Routes>
  );
}

export default App;

