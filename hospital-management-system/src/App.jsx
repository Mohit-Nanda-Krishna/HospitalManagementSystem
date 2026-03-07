import Home from "./pages/Home";
import PatientLogin from "./pages/PatientLogin";
import PatientSignup from "./pages/PatientSignup";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/patient-login" element={<PatientLogin />} />
      <Route path="/patient-signup" element={<PatientSignup />} />
    </Routes>
  );
}

export default App;