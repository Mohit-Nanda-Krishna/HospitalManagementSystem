import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

const PREDEFINED_SPECIALTIES = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Dermatology",
  "Oncology",
  "Radiology",
  "General Medicine",
];

function DoctorForm({ onDoctorAdded, editDoctor, onDoctorUpdated }) {
  const [formData, setFormData] = useState({
    name: "",
    specialization: [],
    email: "",
    phone: "",
    availability: "",
    timeSlots: [],
  });

  const [customSpec, setCustomSpec] = useState("");
  const [showCustomSpec, setShowCustomSpec] = useState(false);
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editDoctor) {
      // Ensure specialization is an array
      const specs = Array.isArray(editDoctor.specialization) 
        ? editDoctor.specialization 
        : (editDoctor.specialization ? editDoctor.specialization.split(", ") : []);
      setFormData({ ...editDoctor, specialization: specs });
    } else {
      setFormData({
        name: "",
        specialization: [],
        email: "",
        phone: "",
        availability: "",
        timeSlots: [],
      });
    }
  }, [editDoctor]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleSpecialty = (spec) => {
    setFormData((prev) => {
      const current = prev.specialization || [];
      if (current.includes(spec)) {
        return { ...prev, specialization: current.filter((s) => s !== spec) };
      } else {
        return { ...prev, specialization: [...current, spec] };
      }
    });
  };

  const addCustomSpecialty = () => {
    if (customSpec.trim()) {
      if (!formData.specialization.includes(customSpec.trim())) {
        setFormData((prev) => ({
          ...prev,
          specialization: [...prev.specialization, customSpec.trim()],
        }));
      }
      setCustomSpec("");
      setShowCustomSpec(false);
    }
  };

  const handleAddTimeSlot = () => {
    if (fromTime && toTime) {
      if (toTime <= fromTime) {
        alert("To time must be after From time.");
        return;
      }
      const newSlot = `${formatTime(fromTime)} - ${formatTime(toTime)}`;
      if (!formData.timeSlots.includes(newSlot)) {
        setFormData((prev) => ({
          ...prev,
          timeSlots: [...prev.timeSlots, newSlot],
        }));
      }
      setFromTime("");
      setToTime("");
    }
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    return `${displayH}:${minutes} ${ampm}`;
  };

  const handleRemoveTimeSlot = (index) => {
    setFormData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.specialization.length === 0) {
      alert("Please select at least one specialization.");
      return;
    }
    setLoading(false); // Reset in case of early return

    setLoading(true);
    try {
      // Store specialization as a comma-separated string for compatibility or keep as array
      // Keeping as array is better for future-proofing
      const dataToSave = {
        ...formData,
        updatedAt: new Date(),
      };

      if (editDoctor && editDoctor.id) {
        const docRef = doc(db, "doctors", editDoctor.id);
        await updateDoc(docRef, dataToSave);
        onDoctorUpdated();
      } else {
        await addDoc(collection(db, "doctors"), {
          ...dataToSave,
          createdAt: new Date(),
        });
        onDoctorAdded();
      }

      setFormData({
        name: "",
        specialization: [],
        email: "",
        phone: "",
        availability: "",
        timeSlots: [],
      });
    } catch (error) {
      console.error("Error saving doctor:", error);
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
          <label>Specialization *</label>
          <div className="spec-chips">
            {PREDEFINED_SPECIALTIES.map((spec) => (
              <button
                key={spec}
                type="button"
                className={`spec-chip ${formData.specialization.includes(spec) ? "active" : ""}`}
                onClick={() => toggleSpecialty(spec)}
              >
                {spec}
              </button>
            ))}
            {formData.specialization
              .filter((s) => !PREDEFINED_SPECIALTIES.includes(s))
              .map((spec) => (
                <button
                  key={spec}
                  type="button"
                  className="spec-chip active custom"
                  onClick={() => toggleSpecialty(spec)}
                >
                  {spec} <span>×</span>
                </button>
              ))}
            <button
              type="button"
              className="spec-chip add-btn"
              onClick={() => setShowCustomSpec(!showCustomSpec)}
            >
              {showCustomSpec ? "Cancel" : "+ Other"}
            </button>
          </div>
          {showCustomSpec && (
            <div className="custom-spec-input">
              <input
                type="text"
                value={customSpec}
                onChange={(e) => setCustomSpec(e.target.value)}
                placeholder="Enter specialization"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSpecialty())}
              />
              <button type="button" onClick={addCustomSpecialty}>Add</button>
            </div>
          )}
        </div>

        <div className="form-row">
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
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
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
          <label>Time Slots</label>
          <div className="time-slot-pickers">
            <div className="picker-group">
              <span>From:</span>
              <input
                type="time"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
              />
            </div>
            <div className="picker-group">
              <span>To:</span>
              <input
                type="time"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
              />
            </div>
            <button type="button" className="add-slot-btn" onClick={handleAddTimeSlot}>
              Add Slot
            </button>
          </div>
          {formData.timeSlots.length > 0 && (
            <div className="time-slots-list">
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
