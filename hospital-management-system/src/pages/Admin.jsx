import { useState } from "react";
import DoctorForm from "../modules/doctors/DoctorForm";
import DoctorList from "../modules/doctors/DoctorList";
import "../styles/admin.css";

function AdminPanel() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editDoctor, setEditDoctor] = useState(null);

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
    <div className="admin-panel">
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
