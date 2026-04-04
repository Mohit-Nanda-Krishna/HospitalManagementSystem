import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "../styles/patientDashboard.css";

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: "⊞" },
  { id: "appointments", label: "Appointments", icon: "📅" },
  { id: "records", label: "Medical Records", icon: "📁" },
  { id: "prescriptions", label: "Prescriptions", icon: "💊" },
  { id: "billing", label: "Billing", icon: "💳" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

function formatDate(dateValue) {
  if(!dateValue) return "";
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAppointmentDateValue(dateValue) {
  if (!dateValue) {
    return "";
  }

  if (typeof dateValue === "string") {
    return dateValue.slice(0, 10);
  }

  if (typeof dateValue?.toDate === "function") {
    const resolvedDate = dateValue.toDate();
    const year = resolvedDate.getFullYear();
    const month = String(resolvedDate.getMonth() + 1).padStart(2, "0");
    const day = String(resolvedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
}

function getAppointmentTimeValue(timeValue) {
  if (!timeValue) {
    return "00:00";
  }

  const rawTime = String(timeValue).split("-")[0].trim().toUpperCase();

  if (/^\d{1,2}:\d{2}$/.test(rawTime)) {
    const [hours, minutes] = rawTime.split(":");
    return `${hours.padStart(2, "0")}:${minutes}`;
  }

  const amPmMatch = rawTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (amPmMatch) {
    let hours = Number(amPmMatch[1]);
    const minutes = amPmMatch[2];
    const meridiem = amPmMatch[3];

    if (meridiem === "PM" && hours !== 12) {
      hours += 12;
    }

    if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  return "00:00";
}

function getAppointmentDateTime(appointment) {
  const dateValue = getAppointmentDateValue(appointment?.date);
  if (!dateValue) {
    return null;
  }

  return new Date(`${dateValue}T${getAppointmentTimeValue(appointment?.time)}:00`);
}

function getDayStart(dateValue) {
  if (!dateValue) {
    return null;
  }

  const resolvedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(resolvedDate.getTime())) {
    return null;
  }

  return resolvedDate;
}

function PatientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentUserUid, setCurrentUserUid] = useState(null);
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "Patient",
    age: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    bloodGroup: "",
  });

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/patient-login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const [doctors, setDoctors] = useState([]);
  const [doctorsBySpecialty, setDoctorsBySpecialty] = useState({});

  useEffect(() => {
    // Fetch doctors
    const fetchDoctors = async () => {
      const q = query(collection(db, "doctors"));
      const snapshot = await getDocs(q);
      const docsList = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      setDoctors(docsList);

      const bySpec = {};
      docsList.forEach(d => {
        const specs = Array.isArray(d.specialization) 
          ? d.specialization 
          : (d.specialization ? [d.specialization] : ["General"]);
        
        specs.forEach(spec => {
          if (!bySpec[spec]) bySpec[spec] = [];
          bySpec[spec].push(d);
        });
      });
      setDoctorsBySpecialty(bySpec);
      
      const firstSpec = Object.keys(bySpec)[0];
      if(firstSpec) {
        setAppointmentForm(prev => ({
          ...prev,
          specialty: firstSpec,
          doctorId: bySpec[firstSpec][0].id,
          doctorName: bySpec[firstSpec][0].name
        }));
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/patient-login");
        return;
      }
      setCurrentUserUid(user.uid);
      try {
        const patientRef = doc(db, "patients", user.uid);
        const patientSnap = await getDoc(patientRef);
        if (patientSnap.exists()) {
          const data = patientSnap.data();
          setProfile(curr => ({
            ...curr,
            fullName: data.name || data.fullName || "Patient",
            age: data.age || curr.age,
            gender: data.gender || curr.gender,
            phone: data.phone || curr.phone,
            address: data.address || curr.address,
            bloodGroup: data.bloodGroup || curr.bloodGroup,
            email: user.email || curr.email,
          }));
        } else {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if(userSnap.exists()){
                const d = userSnap.data();
                if(d.role !== 'patient') {
                   navigate("/patient-login");
                   return;
                }
                setProfile(curr => ({ ...curr, fullName: d.name || "Patient", email: d.email || curr.email }));
            }
        }
      } catch (err) {
        console.error("Error fetching patient", err);
      } finally {
        setProfileLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const [editingProfile, setEditingProfile] = useState(false);
  const [draftProfile, setDraftProfile] = useState(profile);

  const [appointments, setAppointments] = useState([]);
  const [appointmentForm, setAppointmentForm] = useState({
    specialty: "",
    doctorId: "",
    doctorName: "",
    date: "",
    time: "",
  });

  useEffect(() => {
    if (!currentUserUid) return;

    let appointmentsByUid = [];
    let appointmentsById = [];

    const syncAppointments = () => {
      const mergedAppointments = [...appointmentsByUid, ...appointmentsById].reduce(
        (result, appointment) => {
          result.set(appointment.id, appointment);
          return result;
        },
        new Map()
      );

      setAppointments([...mergedAppointments.values()]);
    };

    const unsubscribePatientUid = onSnapshot(
      query(collection(db, "appointments"), where("patientUid", "==", currentUserUid)),
      (snapshot) => {
        appointmentsByUid = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        syncAppointments();
      },
      (error) => {
        console.error("Appointment fetch error (patientUid):", error);
      }
    );

    const unsubscribePatientId = onSnapshot(
      query(collection(db, "appointments"), where("patientId", "==", currentUserUid)),
      (snapshot) => {
        appointmentsById = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        syncAppointments();
      },
      (error) => {
        console.error("Appointment fetch error (patientId):", error);
      }
    );

    return () => {
      unsubscribePatientUid();
      unsubscribePatientId();
    };
  }, [currentUserUid]);

  const [showBookForm, setShowBookForm] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [billingRecords, setBillingRecords] = useState([]);
  const [dashboardDataLoading, setDashboardDataLoading] = useState(true);
  const [dashboardDataError, setDashboardDataError] = useState("");

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const firstDate = getAppointmentDateValue(a?.date);
      const secondDate = getAppointmentDateValue(b?.date);
      const first = getDayStart(firstDate)?.getTime() || 0;
      const second = getDayStart(secondDate)?.getTime() || 0;
      return second - first;
    });
  }, [appointments]);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const upcomingAppointments = sortedAppointments.filter((a) => {
    if ((a.status || "").toLowerCase() === "completed") {
      return false;
    }

    const appointmentDate = getDayStart(getAppointmentDateValue(a?.date));
    if (!appointmentDate) {
      return false;
    }

    return appointmentDate >= todayStart;
  });

  const pastAppointments = sortedAppointments.filter((a) => {
    if ((a.status || "").toLowerCase() === "completed") {
      return true;
    }

    const appointmentDate = getDayStart(getAppointmentDateValue(a?.date));
    if (!appointmentDate) {
      return !a.date;
    }

    return appointmentDate < todayStart;
  });

  const medicalRecords = useMemo(() => {
    return pastAppointments.map((appointment) => ({
      id: appointment.id,
      date: appointment.date,
      doctor: appointment.doctor || appointment.doctorName || "Doctor",
      diagnosis: appointment.specialty || appointment.department || "General consultation",
      treatment: `Appointment status: ${appointment.status || "completed"}`,
      report: appointment.time ? `Consultation time: ${appointment.time}` : "Consultation completed",
    }));
  }, [pastAppointments]);

  useEffect(() => {
    if (!currentUserUid) return;

    setDashboardDataLoading(true);
    setDashboardDataError("");

    const prescriptionQuery = query(
      collection(db, "prescriptions"),
      where("patientId", "==", currentUserUid)
    );
    const billingQuery = query(
      collection(db, "billing"),
      where("patientId", "==", currentUserUid)
    );

    let prescriptionsLoaded = false;
    let billingLoaded = false;

    const finishLoading = () => {
      if (prescriptionsLoaded && billingLoaded) {
        setDashboardDataLoading(false);
      }
    };

    const unsubscribePrescriptions = onSnapshot(
      prescriptionQuery,
      (snapshot) => {
        const prescriptionData = snapshot.docs.map((item) => {
          const data = item.data();
          const rawMedicines = Array.isArray(data.medicines)
            ? data.medicines
            : String(data.medicines || "")
                .split("\n")
                .map((medicine) => medicine.trim())
                .filter(Boolean);

          return {
            id: item.id,
            ...data,
            doctor: data.doctor || data.doctorName || "Doctor",
            summary: data.summary || data.notes || "Prescription update",
            status: data.status || "active",
            medicines: rawMedicines,
          };
        });
        prescriptionData.sort((a, b) => new Date(`${b.date || "1970-01-01"}T00:00:00`) - new Date(`${a.date || "1970-01-01"}T00:00:00`));
        setPrescriptions(prescriptionData);
        prescriptionsLoaded = true;
        finishLoading();
      },
      (error) => {
        console.error("Prescription fetch error:", error);
        setDashboardDataError("Unable to load dashboard data.");
        prescriptionsLoaded = true;
        finishLoading();
      }
    );

    const unsubscribeBilling = onSnapshot(
      billingQuery,
      (snapshot) => {
        const billingData = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        billingData.sort((a, b) => new Date(`${b.date || "1970-01-01"}T00:00:00`) - new Date(`${a.date || "1970-01-01"}T00:00:00`));
        setBillingRecords(billingData);
        billingLoaded = true;
        finishLoading();
      },
      (error) => {
        console.error("Billing fetch error:", error);
        setDashboardDataError("Unable to load dashboard data.");
        billingLoaded = true;
        finishLoading();
      }
    );

    return () => {
      unsubscribePrescriptions();
      unsubscribeBilling();
    };
  }, [currentUserUid]);

  const setAppointmentStatus = async (id, nextStatus) => {
    try {
      if (nextStatus === "cancelled") {
        await deleteDoc(doc(db, "appointments", id));
        return;
      }

      await updateDoc(doc(db, "appointments", id), { status: nextStatus });
    } catch(err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    try {
      await updateDoc(doc(db, "patients", currentUserUid), draftProfile);
      setProfile(draftProfile);
      setEditingProfile(false);
    } catch(err) {
      console.error(err);
      alert("Failed to save profile.");
    }
  };

  const handleSpecialtyChange = (specialty) => {
    setAppointmentForm({ 
      specialty, 
      doctorId: doctorsBySpecialty[specialty][0].id, 
      doctorName: doctorsBySpecialty[specialty][0].name,
      date: "", 
      time: "" 
    });
  };

  const handleDoctorChange = (doctorId) => {
    const docObj = doctors.find(d => d.id === doctorId);
    setAppointmentForm(c => ({
      ...c,
      doctorId,
      doctorName: docObj ? docObj.name : "",
      time: "" // Reset time when doctor changes 
    }));
  };

  const handleBookAppointment = async (event) => {
    event.preventDefault();
    try {
      await addDoc(collection(db, "appointments"), {
        patientUid: currentUserUid,
        patientName: profile.fullName,
        doctorId: appointmentForm.doctorId,
        doctor: appointmentForm.doctorName, // for backward compatibility in UI
        specialty: appointmentForm.specialty,
        date: appointmentForm.date,
        time: appointmentForm.time,
        status: "confirmed",
        createdAt: serverTimestamp()
      });
      setShowBookForm(false);
      setAppointmentForm(prev => ({...prev, date: "", time: ""}));
    } catch(err) {
      console.error("Booking error:", err);
      alert("Failed to book appointment.");
    }
  };

  const handlePrescriptionDownload = (prescription) => {
    const medicines = Array.isArray(prescription.medicines)
      ? prescription.medicines
      : [];
    const lines = [
      `Date: ${formatDate(prescription.date)}`,
      `Doctor: ${prescription.doctor}`,
      `Visit Summary: ${prescription.summary}`,
      "",
      "Medicines / Advice:",
      ...medicines.map((m, i) => `${i + 1}. ${m}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Prescription-${formatDate(prescription.date) || "record"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [selectedReport, setSelectedReport] = useState(null);

  const handleReportDownload = (report) => {
    const lines = [
      `Date: ${formatDate(report.date)}`,
      `Doctor: ${report.doctor}`,
      `Diagnosis: ${report.diagnosis}`,
      `Treatment: ${report.treatment}`,
      `Lab / Test Report: ${report.report}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Medical-Report-${formatDate(report.date) || "record"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReceiptDownload = (bill) => {
    const lines = [
      `Date: ${formatDate(bill.date)}`,
      `Description: ${bill.description}`,
      `Amount: Rs. ${bill.amount.toLocaleString()}`,
      `Status: ${bill.status.toUpperCase()}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Receipt-${formatDate(bill.date) || "record"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => (
    <div className="pd-overview">
      <div className="pd-welcome-banner">
        <div className="pd-welcome-text">
          <p className="pd-eyebrow">Good morning 👋</p>
          <h2>Welcome back, {profile.fullName.split(" ")[0]}!</h2>
          <p className="pd-welcome-sub">Here's a summary of your health activity.</p>
        </div>
        <div className="pd-health-badge">
          <span className="pd-health-icon">❤️</span>
          <div>
            <p className="pd-health-label">Health Status</p>
            <p className="pd-health-value">Good</p>
          </div>
        </div>
      </div>

      <div className="pd-stats-grid">
        {[
          { label: "Upcoming Appointments", value: upcomingAppointments.length, icon: "📅", color: "blue", action: () => setActiveTab("appointments") },
          { label: "Past Visits", value: pastAppointments.length, icon: "🏥", color: "teal", action: () => setActiveTab("records") },
          { label: "Prescriptions", value: prescriptions.length, icon: "💊", color: "green", action: () => setActiveTab("prescriptions") },
          { label: "Pending Dues", value: `₹${billingRecords.filter(b => b.status === "pending").reduce((s, b) => s + (Number(b.amount) || 0), 0).toLocaleString()}`, icon: "💳", color: "amber", action: () => setActiveTab("billing") },
        ].map((stat) => (
          <button key={stat.label} className={`pd-stat-card pd-stat-${stat.color}`} onClick={stat.action}>
            <span className="pd-stat-icon">{stat.icon}</span>
            <strong className="pd-stat-value">{stat.value}</strong>
            <p className="pd-stat-label">{stat.label}</p>
          </button>
        ))}
      </div>

      <div className="pd-overview-grid">
        <div className="pd-card">
          <div className="pd-card-head">
            <h3>Upcoming Appointments</h3>
            <button className="pd-link-btn" onClick={() => setActiveTab("appointments")}>View all →</button>
          </div>
          {upcomingAppointments.length === 0 ? (
            <p className="pd-muted">No upcoming appointments.</p>
          ) : (
            <div className="pd-mini-list">
              {upcomingAppointments.slice(0, 3).map((a) => (
                <div key={a.id} className="pd-mini-item">
                  <div className="pd-mini-icon-wrap">
                    <span>🩺</span>
                  </div>
                  <div className="pd-mini-content">
                    <p className="pd-mini-title">{a.specialty} — {a.doctor}</p>
                    <p className="pd-mini-sub">{formatDate(a.date)} at {a.time}</p>
                  </div>
                  <span className={`pd-pill pd-pill-${a.status}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pd-card">
          <div className="pd-card-head">
            <h3>Prescriptions</h3>
            <button className="pd-link-btn" onClick={() => setActiveTab("prescriptions")}>View all →</button>
          </div>
          {dashboardDataLoading ? (
            <p className="pd-muted">Loading prescriptions...</p>
          ) : prescriptions.length === 0 ? (
            <p className="pd-muted">No active prescriptions.</p>
          ) : (
            <div className="pd-mini-list">
              {prescriptions.slice(0, 3).map((p) => (
                <div key={p.id} className="pd-mini-item">
                  <div className="pd-mini-icon-wrap pd-icon-green">
                    <span>💊</span>
                  </div>
                  <div className="pd-mini-content">
                    <p className="pd-mini-title">{p.summary}</p>
                    <p className="pd-mini-sub">{p.doctor} · {formatDate(p.date)}</p>
                  </div>
                  <span className="pd-pill pd-pill-active">active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pd-card">
          <div className="pd-card-head">
            <h3>Recent Medical History</h3>
            <button className="pd-link-btn" onClick={() => setActiveTab("records")}>View all →</button>
          </div>
          {medicalRecords.length === 0 ? (
            <p className="pd-muted">No recent medical history.</p>
          ) : (
            <div className="pd-mini-list">
              {medicalRecords.slice(0, 2).map((v) => (
                <div key={v.id} className="pd-mini-item">
                  <div className="pd-mini-icon-wrap pd-icon-purple">
                    <span>📋</span>
                  </div>
                  <div className="pd-mini-content">
                    <p className="pd-mini-title">{v.diagnosis}</p>
                    <p className="pd-mini-sub">{v.doctor} · {formatDate(v.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pd-card">
          <div className="pd-card-head">
            <h3>Billing Summary</h3>
            <button className="pd-link-btn" onClick={() => setActiveTab("billing")}>View all →</button>
          </div>
          {dashboardDataLoading ? (
            <p className="pd-muted">Loading billing data...</p>
          ) : billingRecords.length === 0 ? (
            <p className="pd-muted">No billing records available.</p>
          ) : (
            <div className="pd-mini-list">
              {billingRecords.slice(0, 3).map((b) => (
                <div key={b.id} className="pd-mini-item">
                  <div className="pd-mini-icon-wrap pd-icon-amber">
                    <span>🧾</span>
                  </div>
                  <div className="pd-mini-content">
                    <p className="pd-mini-title">{b.description}</p>
                    <p className="pd-mini-sub">₹{(Number(b.amount) || 0).toLocaleString()} · {formatDate(b.date)}</p>
                  </div>
                  <span className={`pd-pill pd-pill-${b.status}`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="pd-section">
      <div className="pd-section-head">
        <div>
          <h2>Appointments</h2>
          <p className="pd-muted">Manage your upcoming and past appointments.</p>
        </div>
        <button className="pd-btn pd-btn-primary" onClick={() => setShowBookForm(!showBookForm)}>
          {showBookForm ? "✕ Close" : "+ Book Appointment"}
        </button>
      </div>

      {showBookForm && (
        <div className="pd-card pd-book-form-card">
          <h3>Book New Appointment</h3>
          <form className="pd-form-grid" onSubmit={handleBookAppointment}>
            <div className="pd-field">
              <label htmlFor="specialty">Specialty</label>
              <select id="specialty" value={appointmentForm.specialty} onChange={(e) => handleSpecialtyChange(e.target.value)}>
                {Object.keys(doctorsBySpecialty).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="pd-field">
              <label htmlFor="doctor">Doctor</label>
              <select id="doctor" value={appointmentForm.doctorId} onChange={(e) => handleDoctorChange(e.target.value)}>
                {doctorsBySpecialty[appointmentForm.specialty]?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="pd-field">
              <label htmlFor="visitDate">Date</label>
              <input id="visitDate" type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm(c => ({ ...c, date: e.target.value }))} required />
            </div>
            <div className="pd-field">
              <label htmlFor="visitTime">Available Time Slots</label>
              <select 
                id="visitTime" 
                value={appointmentForm.time} 
                onChange={(e) => setAppointmentForm(c => ({ ...c, time: e.target.value }))} 
                required
              >
                <option value="">Select a Slot</option>
                {doctors.find(d => d.id === appointmentForm.doctorId)?.timeSlots?.map((slot, idx) => (
                  <option key={idx} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            <div className="pd-form-actions">
              <button className="pd-btn pd-btn-primary" type="submit">Confirm Booking</button>
              <button className="pd-btn pd-btn-secondary" type="button" onClick={() => setShowBookForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="pd-apt-columns">
        <div>
          <h3 className="pd-col-title">
            <span className="pd-dot pd-dot-blue"></span> Upcoming
          </h3>
          {upcomingAppointments.length === 0 ? (
            <div className="pd-empty">No upcoming appointments</div>
          ) : (
            <div className="pd-apt-list">
              {upcomingAppointments.map((a) => (
                <div key={a.id} className="pd-apt-card">
                  <div className="pd-apt-card-top">
                    <div>
                      <p className="pd-apt-title">{a.specialty}</p>
                      <p className="pd-apt-doctor">{a.doctor}</p>
                      <p className="pd-muted">{formatDate(a.date)} · {a.time}</p>
                    </div>
                    <span className={`pd-pill pd-pill-${a.status}`}>{a.status}</span>
                  </div>
                  <div className="pd-apt-actions">
                    {a.status !== "cancelled" && (
                      <button className="pd-btn pd-btn-sm pd-btn-danger" onClick={() => setAppointmentStatus(a.id, "cancelled")}>Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="pd-col-title">
            <span className="pd-dot pd-dot-gray"></span> Past Visits
          </h3>
          {pastAppointments.length === 0 ? (
            <div className="pd-empty">No past visits</div>
          ) : (
            <div className="pd-apt-list">
              {pastAppointments.map((a) => (
                <div key={a.id} className="pd-apt-card pd-apt-past">
                  <div className="pd-apt-card-top">
                    <div>
                      <p className="pd-apt-title">{a.specialty}</p>
                      <p className="pd-apt-doctor">{a.doctor}</p>
                      <p className="pd-muted">{formatDate(a.date)} · {a.time}</p>
                    </div>
                    <span className={`pd-pill pd-pill-${a.status}`}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRecords = () => (
    <div className="pd-section">
      <div className="pd-section-head">
        <div>
          <h2>Medical Records</h2>
          <p className="pd-muted">Your complete visit history and diagnostic reports.</p>
        </div>
      </div>
      <div className="pd-records-list">
        {medicalRecords.length === 0 ? (
          <div className="pd-empty">No medical records available</div>
        ) : medicalRecords.map((v) => (
          <div key={v.id} className="pd-record-card">
            <div className="pd-record-header">
              <div className="pd-record-date-badge">
                <span>{new Date(`${v.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                <span>{new Date(`${v.date}T00:00:00`).getFullYear()}</span>
              </div>
              <div className="pd-record-meta">
                <p className="pd-apt-title">{v.diagnosis}</p>
                <p className="pd-apt-doctor">{v.doctor}</p>
              </div>
            </div>
            <div className="pd-record-body">
              <div className="pd-record-field">
                <span className="pd-field-label">Treatment</span>
                <span>{v.treatment}</span>
              </div>
              <div className="pd-record-field">
                <span className="pd-field-label">Lab / Test Report</span>
                <span>{v.report}</span>
              </div>
            </div>
            <div className="pd-record-footer">
              <button className="pd-btn pd-btn-sm pd-btn-secondary" onClick={() => setSelectedReport(v)}>📄 View Full Report</button>
              <button className="pd-btn pd-btn-sm pd-btn-secondary" onClick={() => handleReportDownload(v)}>⬇ Download</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPrescriptions = () => (
    <div className="pd-section">
      <div className="pd-section-head">
        <div>
          <h2>Prescriptions</h2>
          <p className="pd-muted">Active and past prescriptions from your doctors.</p>
        </div>
        <button className="pd-btn pd-btn-secondary" onClick={() => window.print()}>🖨 Print All</button>
      </div>
      <div className="pd-rx-list">
        {dashboardDataLoading ? (
          <div className="pd-empty">Loading prescriptions...</div>
        ) : prescriptions.length === 0 ? (
          <div className="pd-empty">No prescriptions found</div>
        ) : prescriptions.map((p) => (
          <div key={p.id} className="pd-rx-card">
            <div className="pd-rx-header">
              <div className="pd-rx-icon">💊</div>
              <div>
                <p className="pd-apt-title">{p.summary}</p>
                <p className="pd-apt-doctor">{p.doctor} · {formatDate(p.date)}</p>
              </div>
              <span className="pd-pill pd-pill-active">Active</span>
            </div>
            <div className="pd-rx-medicines">
              {p.medicines.map((m, i) => (
                <div key={i} className="pd-medicine-item">
                  <span className="pd-medicine-num">{i + 1}</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
            <div className="pd-rx-footer">
              <button className="pd-btn pd-btn-sm" onClick={() => handlePrescriptionDownload(p)}>⬇ Download</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="pd-section">
      <div className="pd-section-head">
        <div>
          <h2>Billing & Payments</h2>
          <p className="pd-muted">Track payments and outstanding dues.</p>
        </div>
      </div>
      <div className="pd-billing-summary">
        <div className="pd-billing-stat">
          <p>Total Paid</p>
          <strong className="pd-billing-paid">₹{billingRecords.filter(b => b.status === "paid").reduce((s, b) => s + (Number(b.amount) || 0), 0).toLocaleString()}</strong>
        </div>
        <div className="pd-billing-stat">
          <p>Pending</p>
          <strong className="pd-billing-pending">₹{billingRecords.filter(b => b.status === "pending").reduce((s, b) => s + (Number(b.amount) || 0), 0).toLocaleString()}</strong>
        </div>
        <div className="pd-billing-stat">
          <p>Total Invoices</p>
          <strong>{billingRecords.length}</strong>
        </div>
      </div>
      <div className="pd-billing-table">
        <div className="pd-table-header">
          <span>Description</span>
          <span>Date</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {dashboardDataLoading ? (
          <div className="pd-empty">Loading billing records...</div>
        ) : billingRecords.length === 0 ? (
          <div className="pd-empty">No billing records found</div>
        ) : billingRecords.map((b) => (
          <div key={b.id} className="pd-table-row">
            <span>{b.description}</span>
            <span>{formatDate(b.date)}</span>
            <span className="pd-table-amount">₹{(Number(b.amount) || 0).toLocaleString()}</span>
            <span><span className={`pd-pill pd-pill-${b.status}`}>{b.status}</span></span>
            <span>
              {b.status === "pending" ? (
                <button className="pd-btn pd-btn-sm">Pay Now</button>
              ) : (
                <button className="pd-btn pd-btn-sm pd-btn-secondary" onClick={() => handleReceiptDownload(b)}>Receipt</button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="pd-section">
      <div className="pd-section-head">
        <div>
          <h2>Profile & Settings</h2>
          <p className="pd-muted">Manage your personal information and preferences.</p>
        </div>
        {!editingProfile && (
          <button className="pd-btn pd-btn-secondary" onClick={() => { setDraftProfile(profile); setEditingProfile(true); }}>✏️ Edit Profile</button>
        )}
      </div>

      {!editingProfile ? (
        <div className="pd-profile-view">
          <div className="pd-profile-avatar">
            <div className="pd-avatar-circle">{profile.fullName.split(" ").map(n => n[0]).join("")}</div>
            <div>
              <p className="pd-profile-name">{profile.fullName}</p>
              <p className="pd-muted">{profile.email}</p>
            </div>
          </div>
          <div className="pd-profile-grid">
            {[
              { label: "Full Name", value: profile.fullName },
              { label: "Age", value: `${profile.age} years` },
              { label: "Gender", value: profile.gender },
              { label: "Blood Group", value: profile.bloodGroup },
              { label: "Phone", value: profile.phone },
              { label: "Email", value: profile.email },
              { label: "Address", value: profile.address },
            ].map((f) => (
              <div key={f.label} className="pd-profile-field">
                <span className="pd-field-label">{f.label}</span>
                <span className="pd-field-value">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pd-card">
          <form className="pd-edit-form" onSubmit={handleProfileSave}>
            <div className="pd-form-grid">
              {[
                { id: "fullName", label: "Full Name", type: "text", key: "fullName" },
                { id: "age", label: "Age", type: "number", key: "age" },
                { id: "phone", label: "Phone", type: "tel", key: "phone" },
                { id: "email", label: "Email", type: "email", key: "email" },
                { id: "address", label: "Address", type: "text", key: "address" },
                { id: "bloodGroup", label: "Blood Group", type: "text", key: "bloodGroup" },
              ].map((f) => (
                <div key={f.id} className="pd-field">
                  <label htmlFor={f.id}>{f.label}</label>
                  <input id={f.id} type={f.type} value={draftProfile[f.key]} onChange={(e) => setDraftProfile(c => ({ ...c, [f.key]: e.target.value }))} required />
                </div>
              ))}
              <div className="pd-field">
                <label htmlFor="gender">Gender</label>
                <select id="gender" value={draftProfile.gender} onChange={(e) => setDraftProfile(c => ({ ...c, gender: e.target.value }))}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
            <div className="pd-form-actions">
              <button className="pd-btn pd-btn-primary" type="submit">Save Changes</button>
              <button className="pd-btn pd-btn-secondary" type="button" onClick={() => setEditingProfile(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "appointments": return renderAppointments();
      case "records": return renderRecords();
      case "prescriptions": return renderPrescriptions();
      case "billing": return renderBilling();
      case "settings": return renderSettings();
      default: return renderOverview();
    }
  };

  return (
    <div className="pd-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="pd-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`pd-sidebar ${sidebarOpen ? "pd-sidebar-open" : ""}`}>
        <div className="pd-sidebar-brand">
          <div className="pd-brand-dot">+</div>
          <span>VIT HMS</span>
        </div>

        <div className="pd-sidebar-patient">
          <div className="pd-sidebar-avatar">{profile.fullName.split(" ").map(n => n[0]).join("")}</div>
          <div className="pd-sidebar-patient-info">
            <p className="pd-sidebar-patient-name">{profile.fullName}</p>
            <p className="pd-sidebar-patient-tag">Patient</p>
          </div>
        </div>

        <nav className="pd-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`pd-nav-item ${activeTab === item.id ? "pd-nav-active" : ""}`}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            >
              <span className="pd-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pd-sidebar-footer">
          <button className="pd-nav-item pd-nav-logout" onClick={handleLogout}>
            <span className="pd-nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pd-main">
        {/* Top Header */}
        <header className="pd-topbar">
          <button className="pd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
            <span></span><span></span><span></span>
          </button>
          <h1 className="pd-topbar-title">{NAV_ITEMS.find(n => n.id === activeTab)?.label}</h1>
          <div className="pd-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>              
            <Link to="/" style={{ background: "rgba(9, 105, 218, 0.1)", color: "#0969da", textDecoration: "none", fontWeight: "600", padding: "0.5rem 1rem", borderRadius: "6px" }}>← Back to Home</Link>
            <div className="pd-topbar-user-wrap">
              <button className="pd-topbar-avatar" onClick={() => setShowLogoutDropdown(!showLogoutDropdown)}>
                {profile.fullName.split(" ").map(n => n[0]).join("")}
              </button>
              {showLogoutDropdown && (
                <div className="pd-topbar-dropdown">
                  <div className="pd-dropdown-header">
                    <strong>{profile.fullName}</strong>
                    <p>{profile.email}</p>
                  </div>
                  <button className="pd-dropdown-item" onClick={handleLogout}>
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pd-content">
          {dashboardDataError ? <p className="pd-muted">{dashboardDataError}</p> : null}
          {profileLoading ? <p>Loading...</p> : renderContent()}
        </main>
      </div>

      {/* Modal for Report */}
      {selectedReport && (
        <div className="pd-overlay" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="pd-card" style={{maxWidth: '500px', width: '100%', position: 'relative', margin: '0 1rem'}}>
            <button style={{position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}} onClick={() => setSelectedReport(null)}>×</button>
            <h3>Full Medical Report</h3>
            <p><strong>Diagnosis:</strong> {selectedReport.diagnosis}</p>
            <p><strong>Doctor:</strong> {selectedReport.doctor}</p>
            <p><strong>Date:</strong> {formatDate(selectedReport.date)}</p>
            <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginTop: '1rem'}}>
               <p style={{margin: '0 0 0.5rem 0'}}><strong>Treatment:</strong> {selectedReport.treatment}</p>
               <p style={{margin: 0}}><strong>Lab Report:</strong> {selectedReport.report}</p>
            </div>
            <div style={{marginTop: '1.5rem', textAlign: 'right'}}>
                <button className="pd-btn pd-btn-primary" onClick={() => handleReportDownload(selectedReport)}>Download File</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDashboard;
