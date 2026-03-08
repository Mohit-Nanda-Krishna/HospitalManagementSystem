import { useState } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

function DoctorForm({ onDoctorAdded, editDoctor, onDoctorUpdated }) {
  const [formData, setFormData] = useState(
    editDoctor || {
      name: "",
      specialization: "",
      email: "",
      phone: "",
      availability: "",
      timeSlots: [],
    }
  );

  const [timeSlotInput, setTimeSlotInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTimeSlot = () => {
    if (timeSlotInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        timeSlots: [...prev.timeSlots, timeSlotInput],
      }));
      setTimeSlotInput("");
    }
  };

  const handleRemoveTimeSlot = (index) => {
    setFormData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editDoctor && editDoctor.id) {
        // Update existing doctor
        const docRef = doc(db, "doctors", editDoctor.id);
        await updateDoc(docRef, {
          name: formData.name,
          specialization: formData.specialization,
          email: formData.email,
          phone: formData.phone,
          availability: formData.availability,
          timeSlots: formData.timeSlots,
          updatedAt: new Date(),
        });
        console.log("Doctor updated successfully!");
        onDoctorUpdated();
      } else {
        // Add new doctor
        const docRef = await addDoc(collection(db, "doctors"), {
          name: formData.name,
          specialization: formData.specialization,
          email: formData.email,
          phone: formData.phone,
          availability: formData.availability,
          timeSlots: formData.timeSlots,
          createdAt: new Date(),
        });
        console.log("Doctor added successfully with ID:", docRef.id);
        onDoctorAdded();
      }

      setFormData({
        name: "",
        specialization: "",
        email: "",
        phone: "",
        availability: "",
        timeSlots: [],
      });
    } catch (error) {
      console.error("Error adding/updating doctor:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      alert(`Failed to save doctor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-form">
      <h2>{editDoctor ? "Edit Doctor" : "Add New Doctor"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Dr. John Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="specialization">Specialization *</label>
          <input
            type="text"
            id="specialization"
            name="specialization"
            value={formData.specialization}
            onChange={handleInputChange}
            required
            placeholder="e.g., Cardiologist, Surgeon"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="doctor@hospital.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            placeholder="+1-XXX-XXX-XXXX"
          />
        </div>

        <div className="form-group">
          <label htmlFor="availability">Availability *</label>
          <select
            id="availability"
            name="availability"
            value={formData.availability}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Availability</option>
            <option value="Monday to Friday">Monday to Friday</option>
            <option value="Monday to Saturday">Monday to Saturday</option>
            <option value="Available Daily">Available Daily</option>
            <option value="Weekends Only">Weekends Only</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="timeSlot">Time Slots</label>
          <div className="time-slot-input">
            <input
              type="text"
              id="timeSlot"
              value={timeSlotInput}
              onChange={(e) => setTimeSlotInput(e.target.value)}
              placeholder="e.g., 9:00 AM - 10:00 AM"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTimeSlot();
                }
              }}
            />
            <button type="button" onClick={handleAddTimeSlot}>
              Add Slot
            </button>
          </div>
          {formData.timeSlots.length > 0 && (
            <div className="time-slots-list">
              <h4>Added Time Slots:</h4>
              {formData.timeSlots.map((slot, index) => (
                <div key={index} className="time-slot-tag">
                  {slot}
                  <button
                    type="button"
                    onClick={() => handleRemoveTimeSlot(index)}
                    className="remove-slot"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Saving..." : editDoctor ? "Update Doctor" : "Add Doctor"}
        </button>
      </form>
    </div>
  );
}

export default DoctorForm;
