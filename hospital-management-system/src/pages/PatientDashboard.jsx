import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/patientDashboard.css";

const doctorsBySpecialty = {
  Cardiology: ["Dr. Rajesh Kumar", "Dr. Emily Carter"],
  Neurology: ["Dr. Meera Iyer", "Dr. Michael Hughes"],
  Orthopedics: ["Dr. Vikram Singh", "Dr. Olivia Brown"],
  Pediatrics: ["Dr. Neha Joshi", "Dr. Daniel Lee"],
  Dermatology: ["Dr. Aisha Khan", "Dr. Sophia Taylor"],
};

const mockPrescriptions = [
  {
    id: "RX-2026-101",
    doctor: "Dr. Rajesh Kumar",
    date: "2026-02-22",
    summary: "Hypertension follow-up",
    medicines: [
      "Amlodipine 5mg - once daily",
      "Telmisartan 40mg - once daily",
      "Reduce sodium intake and regular walking",
    ],
  },
  {
    id: "RX-2026-074",
    doctor: "Dr. Aisha Khan",
    date: "2026-01-30",
    summary: "Skin allergy treatment",
    medicines: [
      "Cetirizine 10mg - once at night",
      "Hydrocortisone cream - apply twice daily",
      "Avoid known irritants and harsh soaps",
    ],
  },
];

const mockHistory = [
  {
    id: "VIS-8821",
    date: "2026-02-22",
    doctor: "Dr. Rajesh Kumar",
    diagnosis: "Stage 1 Hypertension",
    treatment: "Medication adjustment and diet plan",
    report: "ECG: Normal sinus rhythm",
  },
  {
    id: "VIS-8654",
    date: "2026-01-30",
    doctor: "Dr. Aisha Khan",
    diagnosis: "Contact dermatitis",
    treatment: "Topical steroids and antihistamines",
    report: "Patch test: Mild reaction to fragrance compounds",
  },
  {
    id: "VIS-8427",
    date: "2025-12-12",
    doctor: "Dr. Meera Iyer",
    diagnosis: "Tension headache",
    treatment: "Hydration protocol and sleep hygiene",
    report: "Blood panel: Within normal range",
  },
];

const initialAppointments = [
  {
    id: "APT-3001",
    doctor: "Dr. Rajesh Kumar",
    specialty: "Cardiology",
    date: "2026-03-15",
    time: "10:30",
    status: "confirmed",
  },
  {
    id: "APT-3002",
    doctor: "Dr. Meera Iyer",
    specialty: "Neurology",
    date: "2026-03-19",
    time: "16:00",
    status: "pending",
  },
  {
    id: "APT-2944",
    doctor: "Dr. Aisha Khan",
    specialty: "Dermatology",
    date: "2026-02-01",
    time: "12:15",
    status: "cancelled",
  },
  {
    id: "APT-2880",
    doctor: "Dr. Vikram Singh",
    specialty: "Orthopedics",
    date: "2025-12-12",
    time: "09:45",
    status: "confirmed",
  },
];

function formatDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PatientDashboard() {
  const [profile, setProfile] = useState({
    fullName: "Aarav Sharma",
    age: "34",
    gender: "Male",
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
    address: "Bengaluru, Karnataka",
    bloodGroup: "B+",
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [draftProfile, setDraftProfile] = useState(profile);

  const [appointments, setAppointments] = useState(initialAppointments);
  const [appointmentForm, setAppointmentForm] = useState({
    specialty: "Cardiology",
    doctor: doctorsBySpecialty.Cardiology[0],
    date: "",
    time: "",
  });

  const [rescheduleDraft, setRescheduleDraft] = useState({});

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const first = new Date(`${a.date}T${a.time}`).getTime();
      const second = new Date(`${b.date}T${b.time}`).getTime();
      return second - first;
    });
  }, [appointments]);

  const today = new Date();

  const upcomingAppointments = sortedAppointments.filter((appointment) => {
    const visitDate = new Date(`${appointment.date}T${appointment.time}`);
    return visitDate >= today;
  });

  const pastAppointments = sortedAppointments.filter((appointment) => {
    const visitDate = new Date(`${appointment.date}T${appointment.time}`);
    return visitDate < today;
  });

  const dashboardStats = useMemo(
    () => [
      { label: "Upcoming Appointments", value: upcomingAppointments.length },
      { label: "Past Visits", value: pastAppointments.length },
      {
        label: "Active Prescriptions",
        value: mockPrescriptions.length,
      },
      { label: "Medical Records", value: mockHistory.length },
    ],
    [upcomingAppointments.length, pastAppointments.length]
  );

  const setAppointmentStatus = (id, nextStatus) => {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id
          ? {
              ...appointment,
              status: nextStatus,
            }
          : appointment
      )
    );
  };

  const handleProfileSave = (event) => {
    event.preventDefault();
    setProfile(draftProfile);
    setEditingProfile(false);
  };

  const handleProfileCancel = () => {
    setDraftProfile(profile);
    setEditingProfile(false);
  };

  const handleSpecialtyChange = (specialty) => {
    setAppointmentForm({
      specialty,
      doctor: doctorsBySpecialty[specialty][0],
      date: "",
      time: "",
    });
  };

  const handleBookAppointment = (event) => {
    event.preventDefault();

    const newAppointment = {
      id: `APT-${Math.floor(Math.random() * 9000) + 1000}`,
      specialty: appointmentForm.specialty,
      doctor: appointmentForm.doctor,
      date: appointmentForm.date,
      time: appointmentForm.time,
      status: "pending",
    };

    setAppointments((current) => [newAppointment, ...current]);
    setAppointmentForm({
      specialty: "Cardiology",
      doctor: doctorsBySpecialty.Cardiology[0],
      date: "",
      time: "",
    });
  };

  const handleReschedule = (appointmentId) => {
    const draft = rescheduleDraft[appointmentId];

    if (!draft?.date || !draft?.time) {
      return;
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === appointmentId
          ? {
              ...appointment,
              date: draft.date,
              time: draft.time,
              status: "pending",
            }
          : appointment
      )
    );

    setRescheduleDraft((current) => ({
      ...current,
      [appointmentId]: { date: "", time: "" },
    }));
  };

  const handlePrescriptionDownload = (prescription) => {
    const lines = [
      `Prescription ID: ${prescription.id}`,
      `Date: ${formatDate(prescription.date)}`,
      `Doctor: ${prescription.doctor}`,
      `Visit Summary: ${prescription.summary}`,
      "",
      "Medicines / Advice:",
      ...prescription.medicines.map((medicine, index) => `${index + 1}. ${medicine}`),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${prescription.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handlePrescriptionPrint = () => {
    window.print();
  };

  return (
    <main className="patient-dashboard-page">
      <header className="patient-dashboard-header">
        <div>
          <p className="patient-dashboard-eyebrow">Patient Portal</p>
          <h1>Patient Dashboard</h1>
          <p className="patient-dashboard-subtitle">
            View profile, manage appointments, check prescriptions, and track
            medical history.
          </p>
        </div>
        <Link to="/" className="patient-dashboard-home-link">
          Home
        </Link>
      </header>

      <section className="patient-overview-grid">
        {dashboardStats.map((item) => (
          <article className="overview-card" key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <nav className="patient-dashboard-nav">
        <a href="#profile-booking">Profile & Booking</a>
        <a href="#appointments">Appointments</a>
        <a href="#prescriptions-history">Prescriptions & History</a>
      </nav>

      <section id="profile-booking" className="patient-grid two-column">
        <article className="patient-card">
          <div className="patient-card-head">
            <h2>View Profile</h2>
            {!editingProfile ? (
              <button
                type="button"
                className="patient-btn secondary"
                onClick={() => {
                  setDraftProfile(profile);
                  setEditingProfile(true);
                }}
              >
                Edit Profile
              </button>
            ) : null}
          </div>

          {!editingProfile ? (
            <div className="profile-grid">
              <p>
                <strong>Name:</strong> {profile.fullName}
              </p>
              <p>
                <strong>Age:</strong> {profile.age}
              </p>
              <p>
                <strong>Gender:</strong> {profile.gender}
              </p>
              <p>
                <strong>Email:</strong> {profile.email}
              </p>
              <p>
                <strong>Phone:</strong> {profile.phone}
              </p>
              <p>
                <strong>Address:</strong> {profile.address}
              </p>
              <p>
                <strong>Blood Group:</strong> {profile.bloodGroup}
              </p>
            </div>
          ) : (
            <form className="form-grid" onSubmit={handleProfileSave}>
              <label htmlFor="fullName">Name</label>
              <input
                id="fullName"
                type="text"
                value={draftProfile.fullName}
                onChange={(event) =>
                  setDraftProfile((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                required
              />

              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                min="1"
                value={draftProfile.age}
                onChange={(event) =>
                  setDraftProfile((current) => ({
                    ...current,
                    age: event.target.value,
                  }))
                }
                required
              />

              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={draftProfile.gender}
                onChange={(event) =>
                  setDraftProfile((current) => ({
                    ...current,
                    gender: event.target.value,
                  }))
                }
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={draftProfile.email}
                onChange={(event) =>
                  setDraftProfile((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
              />

              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                value={draftProfile.phone}
                onChange={(event) =>
                  setDraftProfile((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                required
              />

              <label htmlFor="address">Address</label>
              <input
                id="address"
                type="text"
                value={draftProfile.address}
                onChange={(event) =>
                  setDraftProfile((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
                required
              />

              <label htmlFor="bloodGroup">Blood Group</label>
              <input
                id="bloodGroup"
                type="text"
                value={draftProfile.bloodGroup}
                onChange={(event) =>
                  setDraftProfile((current) => ({
                    ...current,
                    bloodGroup: event.target.value,
                  }))
                }
                required
              />

              <div className="action-row">
                <button className="patient-btn primary" type="submit">
                  Save Changes
                </button>
                <button
                  className="patient-btn secondary"
                  type="button"
                  onClick={handleProfileCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </article>

        <article className="patient-card">
          <div className="patient-card-head">
            <h2>Book Appointments</h2>
          </div>

          <form className="form-grid" onSubmit={handleBookAppointment}>
            <label htmlFor="specialty">Specialty</label>
            <select
              id="specialty"
              value={appointmentForm.specialty}
              onChange={(event) => handleSpecialtyChange(event.target.value)}
            >
              {Object.keys(doctorsBySpecialty).map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>

            <label htmlFor="doctor">Doctor</label>
            <select
              id="doctor"
              value={appointmentForm.doctor}
              onChange={(event) =>
                setAppointmentForm((current) => ({
                  ...current,
                  doctor: event.target.value,
                }))
              }
            >
              {doctorsBySpecialty[appointmentForm.specialty].map((doctor) => (
                <option key={doctor} value={doctor}>
                  {doctor}
                </option>
              ))}
            </select>

            <label htmlFor="visitDate">Date</label>
            <input
              id="visitDate"
              type="date"
              value={appointmentForm.date}
              onChange={(event) =>
                setAppointmentForm((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
              required
            />

            <label htmlFor="visitTime">Time</label>
            <input
              id="visitTime"
              type="time"
              value={appointmentForm.time}
              onChange={(event) =>
                setAppointmentForm((current) => ({
                  ...current,
                  time: event.target.value,
                }))
              }
              required
            />

            <button className="patient-btn primary" type="submit">
              Confirm Booking
            </button>
          </form>
        </article>
      </section>

      <section id="appointments" className="patient-card">
        <div className="patient-card-head">
          <h2>View Appointments</h2>
        </div>

        <div className="appointments-layout">
          <div>
            <h3>Upcoming</h3>
            {upcomingAppointments.length === 0 ? (
              <p className="muted">No upcoming appointments.</p>
            ) : (
              <div className="appointment-list">
                {upcomingAppointments.map((appointment) => (
                  <div className="appointment-item" key={appointment.id}>
                    <div>
                      <p className="appointment-title">
                        {appointment.specialty} with {appointment.doctor}
                      </p>
                      <p className="muted">
                        {formatDate(appointment.date)} at {appointment.time}
                      </p>
                      <span className={`status-pill ${appointment.status}`}>
                        {appointment.status}
                      </span>
                    </div>

                    <div className="appointment-actions">
                      {appointment.status !== "confirmed" ? (
                        <button
                          type="button"
                          className="patient-btn small"
                          onClick={() =>
                            setAppointmentStatus(appointment.id, "confirmed")
                          }
                        >
                          Confirm
                        </button>
                      ) : null}

                      {appointment.status !== "cancelled" ? (
                        <button
                          type="button"
                          className="patient-btn small danger"
                          onClick={() =>
                            setAppointmentStatus(appointment.id, "cancelled")
                          }
                        >
                          Cancel
                        </button>
                      ) : null}

                      {appointment.status !== "cancelled" ? (
                        <div className="reschedule-wrap">
                          <input
                            type="date"
                            value={rescheduleDraft[appointment.id]?.date || ""}
                            onChange={(event) =>
                              setRescheduleDraft((current) => ({
                                ...current,
                                [appointment.id]: {
                                  ...current[appointment.id],
                                  date: event.target.value,
                                },
                              }))
                            }
                          />
                          <input
                            type="time"
                            value={rescheduleDraft[appointment.id]?.time || ""}
                            onChange={(event) =>
                              setRescheduleDraft((current) => ({
                                ...current,
                                [appointment.id]: {
                                  ...current[appointment.id],
                                  time: event.target.value,
                                },
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="patient-btn small secondary"
                            onClick={() => handleReschedule(appointment.id)}
                          >
                            Reschedule
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3>Past</h3>
            {pastAppointments.length === 0 ? (
              <p className="muted">No past appointments.</p>
            ) : (
              <div className="appointment-list">
                {pastAppointments.map((appointment) => (
                  <div className="appointment-item" key={appointment.id}>
                    <div>
                      <p className="appointment-title">
                        {appointment.specialty} with {appointment.doctor}
                      </p>
                      <p className="muted">
                        {formatDate(appointment.date)} at {appointment.time}
                      </p>
                    </div>
                    <span className={`status-pill ${appointment.status}`}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="prescriptions-history" className="patient-grid two-column">
        <article className="patient-card">
          <div className="patient-card-head">
            <h2>View Prescriptions</h2>
            <button
              type="button"
              className="patient-btn secondary"
              onClick={handlePrescriptionPrint}
            >
              Print
            </button>
          </div>

          <div className="stack-list">
            {mockPrescriptions.map((prescription) => (
              <div className="stack-item" key={prescription.id}>
                <p className="appointment-title">
                  {prescription.summary} ({formatDate(prescription.date)})
                </p>
                <p className="muted">
                  {prescription.id} | {prescription.doctor}
                </p>
                <ul>
                  {prescription.medicines.map((medicine) => (
                    <li key={medicine}>{medicine}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="patient-btn small"
                  onClick={() => handlePrescriptionDownload(prescription)}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="patient-card">
          <div className="patient-card-head">
            <h2>Medical History</h2>
          </div>

          <div className="stack-list">
            {mockHistory.map((visit) => (
              <div className="stack-item" key={visit.id}>
                <p className="appointment-title">
                  {formatDate(visit.date)} | {visit.doctor}
                </p>
                <p>
                  <strong>Diagnosis:</strong> {visit.diagnosis}
                </p>
                <p>
                  <strong>Treatment:</strong> {visit.treatment}
                </p>
                <p>
                  <strong>Lab/Test Report:</strong> {visit.report}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

export default PatientDashboard;
