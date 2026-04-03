import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import DoctorForm from "../modules/doctors/DoctorForm";
import DoctorList from "../modules/doctors/DoctorList";
import "../styles/admin.css";

function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/admin-login");
        return;
      }
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().role === "admin") {
          setLoading(false);
        } else {
          navigate("/admin-login");
        }
      } catch (err) {
        console.error("Auth error", err);
        navigate("/admin-login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editDoctor, setEditDoctor] = useState(null);

  if (loading) return <div style={{padding: "2rem", color: "#fff"}}>Verifying credentials...</div>;

  const handleDoctorAdded = () => {
    alert("Doctor added successfully!");
    setRefreshTrigger((prev) => prev + 1);
    setEditDoctor(null);
  };

  const handleDoctorUpdated = () => {
    alert("Doctor updated successfully!");
    setRefreshTrigger((prev) => prev + 1);
    setEditDoctor(null);
  };

  const handleEditDoctor = (doctor) => {
    setEditDoctor(doctor);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditDoctor(null);
  };

  return (
    <div className="admin-panel" style={{ position: 'relative' }}>
      <Link to="/" style={{ position: 'absolute', top: '20px', right: '30px', color: '#fff', textDecoration: 'none', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', padding: '10px 15px', borderRadius: '8px', zIndex: 10 }}>← Back to Home</Link>
      <div className="admin-header">
        <h1>Hospital Admin Panel</h1>
        <p>Manage doctors, appointments, and hospital operations</p>
      </div>

      <div className="admin-container">
        <div className="admin-grid">
          <div className="form-section">
            <DoctorForm
              onDoctorAdded={handleDoctorAdded}
              editDoctor={editDoctor}
              onDoctorUpdated={handleDoctorUpdated}
            />
            {editDoctor && (
              <button
                className="cancel-edit-btn"
                onClick={handleCancelEdit}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="list-section">
            <DoctorList
              refreshTrigger={refreshTrigger}
              onEditDoctor={handleEditDoctor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
