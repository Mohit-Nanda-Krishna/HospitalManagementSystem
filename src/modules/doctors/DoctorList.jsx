import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../firebase";

function DoctorList({ refreshTrigger, onEditDoctor }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const doctorsCollection = collection(db, "doctors");
      const doctorsSnapshot = await getDocs(doctorsCollection);
      const doctorsList = doctorsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDoctors(doctorsList);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      alert("Failed to fetch doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [refreshTrigger]);

  const handleDelete = async (doctor) => {
    if (confirm("Are you sure you want to delete this doctor?")) {
      try {
        const doctorId = doctor.id;
        // Delete appointments
        const aptQuery = query(collection(db, "appointments"), where("doctorId", "==", doctorId));
        const aptSnap = await getDocs(aptQuery);
        const deletePromises = aptSnap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);

        // Delete user doc
        const userQuery = query(collection(db, "users"), where("email", "==", doctor.email));
        const userSnap = await getDocs(userQuery);
        const userDeletePromises = userSnap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(userDeletePromises);

        // Delete doctor doc
        await deleteDoc(doc(db, "doctors", doctorId));
        
        setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
        alert("Doctor and associated data deleted successfully!");
      } catch (error) {
        console.error("Error deleting doctor:", error);
        alert("Failed to delete doctor. Please try again.");
      }
    }
  };

  const handleEdit = (doctor) => {
    onEditDoctor(doctor);
  };

  return (
    <div className="doctor-list">
      <h2>Doctors List</h2>
      {loading && <p className="loading">Loading doctors...</p>}
      {!loading && doctors.length === 0 && (
        <p className="no-doctors">No doctors found. Add a new doctor to get started!</p>
      )}
      {doctors.length > 0 && (
        <div className="doctors-table-container">
          <table className="doctors-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialization</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Availability</th>
                <th>Time Slots</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>{doctor.name}</td>
                  <td>{Array.isArray(doctor.specialization) ? doctor.specialization.join(", ") : (doctor.specialization || "General")}</td>
                  <td>{doctor.email}</td>
                  <td>{doctor.phone}</td>
                  <td>{doctor.availability}</td>
                  <td>
                    <div className="time-slots-display">
                      {doctor.timeSlots && doctor.timeSlots.length > 0 ? (
                        doctor.timeSlots.map((slot, index) => (
                          <span key={index} className="slot-badge">
                            {slot}
                          </span>
                        ))
                      ) : (
                        <span className="no-slots">No slots</span>
                      )}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(doctor)}
                      title="Edit Doctor"
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(doctor)}
                      title="Delete Doctor"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DoctorList;
