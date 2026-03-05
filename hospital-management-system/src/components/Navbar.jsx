import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{padding:"10px", background:"#eee"}}>

      <Link to="/">Dashboard</Link> |{" "}
      <Link to="/patients">Patients</Link> |{" "}
      <Link to="/doctors">Doctors</Link> |{" "}
      <Link to="/appointments">Appointments</Link>

    </nav>
  );
}

export default Navbar;