import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { auth, db } from "../firebase";
import "../styles/admin.css";

const initialBeds = [
  { id: "BED-01", ward: "ICU", patient: "Kabir Patel", status: "Occupied", bedType: "Critical Care" },
  { id: "BED-02", ward: "ICU", patient: "", status: "Available", bedType: "Critical Care" },
  { id: "BED-03", ward: "General", patient: "Aarav Sharma", status: "Occupied", bedType: "Standard" },
  { id: "BED-04", ward: "General", patient: "", status: "Available", bedType: "Standard" },
  { id: "BED-05", ward: "Pediatrics", patient: "Anaya Singh", status: "Occupied", bedType: "Pediatric" },
  { id: "BED-06", ward: "Private", patient: "", status: "Maintenance", bedType: "Premium" },
  { id: "BED-07", ward: "Private", patient: "Rohan Verma", status: "Occupied", bedType: "Premium" },
  { id: "BED-08", ward: "General", patient: "", status: "Available", bedType: "Standard" },
];

const inventoryData = [
  { item: "N95 Masks", remaining: 42, threshold: 60, vendor: "MediSafe Supplies" },
  { item: "Syringes", remaining: 110, threshold: 120, vendor: "CareLine Pharma" },
  { item: "IV Fluids", remaining: 26, threshold: 40, vendor: "VitalMed" },
  { item: "Antibiotic Vials", remaining: 18, threshold: 25, vendor: "HealthBridge Labs" },
];

const patientGrowthData = [
  { month: "Nov", patients: 220 },
  { month: "Dec", patients: 248 },
  { month: "Jan", patients: 286 },
  { month: "Feb", patients: 312 },
  { month: "Mar", patients: 348 },
  { month: "Apr", patients: 389 },
];

const appointmentAnalyticsData = [
  { name: "Cardiology", appointments: 32 },
  { name: "Neurology", appointments: 24 },
  { name: "Orthopedics", appointments: 28 },
  { name: "Pediatrics", appointments: 30 },
  { name: "Dermatology", appointments: 18 },
];

const bedChartColors = ["#0b63f6", "#58a6ff", "#b8d7ff"];

const navigationItems = [
  { id: "overview", label: "Dashboard" },
  { id: "doctors", label: "Doctors" },
  { id: "patients", label: "Patients" },
  { id: "appointments", label: "Appointments" },
  { id: "beds", label: "Beds" },
  { id: "billing", label: "Billing" },
  { id: "inventory", label: "Inventory" },
];

function formatDisplayDate(dateValue) {
  if (!dateValue) {
    return "Not set";
  }
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSpecialization(specialization) {
  if (Array.isArray(specialization)) {
    return specialization.join(", ");
  }

  return specialization || "General";
}

function getDoctorDepartment(doctor) {
  if (!doctor) {
    return "";
  }

  return Array.isArray(doctor.specialization)
    ? doctor.specialization[0] || ""
    : doctor.specialization || "";
}

function getPatientDisplayName(patient) {
  return patient?.name || patient?.fullName || "Unnamed patient";
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="admin-section-head">
      <div>
        <p className="admin-section-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <article className="admin-stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{helper}</span>
    </article>
  );
}

function DataTable({ title, columns, rows, emptyText }) {
  return (
    <article className="admin-panel-card">
      <div className="admin-card-top">
        <h3>{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="admin-empty-state">{emptyText}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function AdminPanel() {
  const todayDate = new Date().toISOString().slice(0, 10);
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [beds, setBeds] = useState([]);
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    specialization: "",
    email: "",
    phone: "",
    availability: "",
    timeSlots: "",
    accessKey: "",
  });
  const [patientForm, setPatientForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    address: "",
    bloodGroup: "",
    condition: "",
  });
  const [appointmentForm, setAppointmentForm] = useState({
    patientUid: "",
    patientName: "",
    doctorId: "",
    doctorName: "",
    department: "",
    date: "",
    time: "",
  });
  const [bedForm, setBedForm] = useState({ bedId: "", status: "Available", patient: "" });
  const [doctorError, setDoctorError] = useState("");
  const [patientError, setPatientError] = useState("");
  const [appointmentError, setAppointmentError] = useState("");
  const [bedError, setBedError] = useState("");

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
          setAuthLoading(false);
        } else {
          navigate("/admin-login");
        }
      } catch (error) {
        console.error("Auth error", error);
        navigate("/admin-login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (authLoading) {
      return undefined;
    }

    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const [doctorSnap, patientSnap, appointmentSnap] = await Promise.all([
          getDocs(collection(db, "doctors")),
          getDocs(collection(db, "patients")),
          getDocs(collection(db, "appointments")),
        ]);

        if (!isMounted) {
          return;
        }

        const doctorData = doctorSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        const patientData = patientSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
          admittedOn:
            item.data().admittedOn ||
            item.data().createdAt?.toDate?.().toISOString().slice(0, 10) ||
            "",
        }));
        const appointmentData = appointmentSnap.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            ...data,
            patient: data.patientName || data.patient || "Unknown patient",
            doctor: data.doctor || data.doctorName || "Unknown doctor",
            department:
              data.department ||
              data.specialty ||
              data.specialization ||
              "General",
            status: data.status || "pending",
          };
        });

        setDoctors(doctorData);
        setPatients(patientData);
        setAppointments(appointmentData);
        setBeds(initialBeds);
      } catch (error) {
        console.error("Failed to load admin dashboard data", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [authLoading]);

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return patients;
    }
    return patients.filter((patient) =>
      [
        getPatientDisplayName(patient),
        patient.condition,
        patient.phone,
        patient.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [patients, searchTerm]);

  const filteredAppointments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return appointments;
    }
    return appointments.filter((appointment) =>
      [appointment.patient, appointment.doctor, appointment.department, appointment.status]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [appointments, searchTerm]);

  const totalBeds = beds.length;
  const availableBeds = beds.filter((bed) => bed.status === "Available").length;
  const occupiedBeds = beds.filter((bed) => bed.status === "Occupied").length;
  const maintenanceBeds = beds.filter((bed) => bed.status === "Maintenance").length;
  const appointmentsToday = appointments.filter(
    (appointment) => appointment.date === todayDate
  ).length;

  const stats = [
    { label: "Total Doctors", value: doctors.length, helper: "Across core hospital departments" },
    { label: "Total Patients", value: patients.length, helper: "Active patient records in the system" },
    { label: "Total Beds", value: totalBeds, helper: "Including ICU, general, and private wards" },
    { label: "Available Beds", value: availableBeds, helper: "Beds ready for immediate allocation" },
    { label: "Appointments Today", value: appointmentsToday, helper: "Confirmed and pending visits for today" },
  ];

  const bedOccupancyData = [
    { name: "Occupied", value: occupiedBeds },
    { name: "Available", value: availableBeds },
    { name: "Maintenance", value: maintenanceBeds },
  ];

  const lowStockAlerts = inventoryData.filter((item) => item.remaining <= item.threshold);
  const bedAlerts = availableBeds <= 2
    ? [{ title: "Low bed availability", note: `${availableBeds} beds are currently open for admissions.` }]
    : [{ title: "Bed capacity stable", note: `${availableBeds} beds remain available across wards.` }];

  const patientOptions = useMemo(
    () =>
      patients.map((patient) => ({
        id: patient.uid || patient.id,
        name: getPatientDisplayName(patient),
      })),
    [patients]
  );
  const doctorOptions = useMemo(
    () =>
      doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        department: getDoctorDepartment(doctor),
        timeSlots: Array.isArray(doctor.timeSlots) ? doctor.timeSlots : [],
      })),
    [doctors]
  );

  const handleDoctorSubmit = async (event) => {
    event.preventDefault();
    const {
      name,
      specialization,
      email,
      phone,
      availability,
      timeSlots,
      accessKey,
    } =
      doctorForm;
    const parsedTimeSlots = timeSlots
      .split(",")
      .map((slot) => slot.trim())
      .filter(Boolean);

    if (
      !name.trim() ||
      !specialization.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !availability.trim() ||
      !/^\d{4}$/.test(accessKey.trim()) ||
      parsedTimeSlots.length === 0
    ) {
      setDoctorError(
        "Enter doctor details, a 4 digit access key, and at least one time slot."
      );
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        specialization: [specialization.trim()],
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        availability: availability.trim(),
        timeSlots: parsedTimeSlots,
        accessKey: accessKey.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const addedDoctor = await addDoc(collection(db, "doctors"), payload);

      setDoctors((current) => [
        {
          id: addedDoctor.id,
          ...payload,
          specialization: payload.specialization,
          patientsToday: 0,
        },
        ...current,
      ]);
      setDoctorForm({
        name: "",
        specialization: "",
        email: "",
        phone: "",
        availability: "",
        timeSlots: "",
        accessKey: "",
      });
      setDoctorError("");
    } catch (error) {
      console.error("Failed to add doctor", error);
      setDoctorError("Unable to save doctor to Firestore.");
    }
  };

  const handlePatientSubmit = async (event) => {
    event.preventDefault();
    const { name, age, gender, phone, address, bloodGroup, condition } =
      patientForm;

    if (
      !name.trim() ||
      !age ||
      !phone.trim() ||
      !address.trim() ||
      !bloodGroup.trim() ||
      !condition.trim()
    ) {
      setPatientError(
        "Complete patient name, age, phone, address, blood group, and condition."
      );
      return;
    }

    try {
      const patientRef = doc(collection(db, "patients"));
      const payload = {
        uid: patientRef.id,
        name: name.trim(),
        age: Number(age),
        gender,
        phone: phone.trim(),
        address: address.trim(),
        bloodGroup: bloodGroup.trim().toUpperCase(),
        condition: condition.trim(),
        vitalsCompleted: false,
        role: "patient",
        admittedOn: todayDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(patientRef, payload);

      setPatients((current) => [{ id: patientRef.id, ...payload }, ...current]);
      setPatientForm({
        name: "",
        age: "",
        gender: "Male",
        phone: "",
        address: "",
        bloodGroup: "",
        condition: "",
      });
      setPatientError("");
    } catch (error) {
      console.error("Failed to add patient", error);
      setPatientError("Unable to save patient to Firestore.");
    }
  };

  const handleAppointmentPatientChange = (patientUid) => {
    const selectedPatient = patientOptions.find((patient) => patient.id === patientUid);
    setAppointmentForm((current) => ({
      ...current,
      patientUid,
      patientName: selectedPatient?.name || "",
    }));
  };

  const handleAppointmentDoctorChange = (doctorId) => {
    const selectedDoctor = doctorOptions.find((doctor) => doctor.id === doctorId);
    setAppointmentForm((current) => ({
      ...current,
      doctorId,
      doctorName: selectedDoctor?.name || "",
      department: selectedDoctor?.department || "",
      time: "",
    }));
  };

  const handleAppointmentSubmit = async (event) => {
    event.preventDefault();
    const { patientUid, patientName, doctorId, doctorName, department, date, time } =
      appointmentForm;

    if (!patientUid || !doctorId || !department || !date || !time) {
      setAppointmentError("Select patient, doctor, date, and time before booking.");
      return;
    }

    try {
      const payload = {
        patientUid,
        patientName,
        doctorId,
        doctor: doctorName,
        specialty: department,
        date,
        time,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      const addedAppointment = await addDoc(collection(db, "appointments"), payload);

      setAppointments((current) => [
        {
          id: addedAppointment.id,
          ...payload,
          patient: patientName,
          department,
        },
        ...current,
      ]);
      setAppointmentForm({
        patientUid: "",
        patientName: "",
        doctorId: "",
        doctorName: "",
        department: "",
        date: "",
        time: "",
      });
      setAppointmentError("");
    } catch (error) {
      console.error("Failed to book appointment", error);
      setAppointmentError("Unable to save appointment to Firestore.");
    }
  };

  const handleBedSubmit = (event) => {
    event.preventDefault();
    const { bedId, status, patient } = bedForm;
    if (!bedId) {
      setBedError("Choose a bed to update.");
      return;
    }
    if (status === "Occupied" && !patient) {
      setBedError("Select a patient when assigning an occupied bed.");
      return;
    }
    setBeds((current) =>
      current.map((bed) =>
        bed.id === bedId
          ? { ...bed, status, patient: status === "Occupied" ? patient : "" }
          : bed
      )
    );
    setBedForm({ bedId: "", status: "Available", patient: "" });
    setBedError("");
  };

  const handleDeleteDoctor = async (doctor) => {
    const confirmed = window.confirm(
      `Delete ${doctor.name} and all linked appointments?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const appointmentQuery = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctor.id)
      );
      const appointmentSnap = await getDocs(appointmentQuery);
      await Promise.all(appointmentSnap.docs.map((item) => deleteDoc(item.ref)));

      const userQuery = query(
        collection(db, "users"),
        where("email", "==", (doctor.email || "").toLowerCase())
      );
      const userSnap = await getDocs(userQuery);
      await Promise.all(userSnap.docs.map((item) => deleteDoc(item.ref)));

      await deleteDoc(doc(db, "doctors", doctor.id));

      setDoctors((current) => current.filter((item) => item.id !== doctor.id));
      setAppointments((current) =>
        current.filter((item) => item.doctorId !== doctor.id)
      );
    } catch (error) {
      console.error("Failed to delete doctor", error);
      setDoctorError("Unable to delete doctor from Firestore.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin-login");
  };

  if (authLoading || loading) {
    return (
      <main className="admin-dashboard-page">
        <section className="admin-loading-shell">
          <p className="admin-section-eyebrow">Hospital Administration</p>
          <h1>Preparing the admin dashboard</h1>
          <p>Loading doctors, patients, appointments, and bed summaries.</p>
          <div className="admin-loading-bar">
            <span />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <p>Hospital Management</p>
            <h1>Admin Dashboard</h1>
            <span>Operations, admissions, and daily monitoring</span>
          </div>

          <nav className="admin-sidebar-nav">
            {navigationItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} className={activeNav === item.id ? "active" : ""} onClick={() => setActiveNav(item.id)}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="admin-sidebar-note">
            <p className="admin-section-eyebrow">Shift Summary</p>
            <strong>Morning Admin Team</strong>
            <span>Admissions are steady and outpatient volume is highest in cardiology and pediatrics.</span>
          </div>
        </aside>

        <section className="admin-main">
          <header className="admin-topbar">
            <div>
              <p className="admin-section-eyebrow">Central Command</p>
              <h2>Good morning, Admin</h2>
              <p>Monitor hospital activity, manage teams, and respond to capacity changes.</p>
            </div>

            <div className="admin-topbar-tools">
              <label className="admin-search">
                <span>Search records</span>
                <input type="search" placeholder="Search patients, appointments, or departments" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
              </label>

              <div className="admin-profile-card">
                <strong>Ananya Rao</strong>
                <span>Super Admin</span>
                <small>ananya.rao@hms.com</small>
                <button type="button" className="admin-profile-action" onClick={handleLogout}>
                  Sign Out
                </button>
                <Link to="/" className="admin-home-link">
                  Back to Home
                </Link>
              </div>
            </div>
          </header>

          <section id="overview" className="admin-page-section">
            <SectionHeader eyebrow="Live Overview" title="Hospital performance snapshot" description="Core metrics, trend views, and watchlist items for today’s operations." />

            <div className="admin-stats-grid">
              {stats.map((item) => (
                <StatCard key={item.label} {...item} />
              ))}
            </div>

            <div className="admin-chart-grid">
              <article className="admin-panel-card">
                <div className="admin-card-top">
                  <h3>Patient growth</h3>
                  <span>Last six months</span>
                </div>
                <div className="admin-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={patientGrowthData}>
                      <XAxis dataKey="month" stroke="#5a6d8a" />
                      <YAxis stroke="#5a6d8a" />
                      <Tooltip />
                      <Line type="monotone" dataKey="patients" stroke="#0b63f6" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="admin-panel-card">
                <div className="admin-card-top">
                  <h3>Appointments analytics</h3>
                  <span>Department wise activity</span>
                </div>
                <div className="admin-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentAnalyticsData}>
                      <XAxis dataKey="name" stroke="#5a6d8a" />
                      <YAxis stroke="#5a6d8a" />
                      <Tooltip />
                      <Bar dataKey="appointments" fill="#1e84ff" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="admin-panel-card">
                <div className="admin-card-top">
                  <h3>Bed occupancy</h3>
                  <span>Current utilization</span>
                </div>
                <div className="admin-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={bedOccupancyData} cx="50%" cy="50%" innerRadius={56} outerRadius={88} paddingAngle={4} dataKey="value">
                        {bedOccupancyData.map((entry, index) => (
                          <Cell key={entry.name} fill={bedChartColors[index % bedChartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </div>

            <div className="admin-data-grid">
              <DataTable
                title="Recent patients"
                emptyText="No patient entries match the current search."
                columns={[
                  {
                    key: "name",
                    label: "Patient",
                    render: (row) => getPatientDisplayName(row),
                  },
                  { key: "condition", label: "Condition" },
                  { key: "phone", label: "Phone" },
                  {
                    key: "admittedOn",
                    label: "Admitted",
                    render: (row) => formatDisplayDate(row.admittedOn),
                  },
                ]}
                rows={[...filteredPatients]
                  .sort((a, b) => new Date(b.admittedOn) - new Date(a.admittedOn))
                  .slice(0, 5)}
              />

              <DataTable
                title="Upcoming appointments"
                emptyText="No appointment records match the current search."
                columns={[
                  { key: "patient", label: "Patient" },
                  { key: "doctor", label: "Doctor" },
                  { key: "department", label: "Department" },
                  {
                    key: "schedule",
                    label: "Schedule",
                    render: (row) => `${formatDisplayDate(row.date)} at ${row.time}`,
                  },
                ]}
                rows={[...filteredAppointments]
                  .sort(
                    (a, b) =>
                      new Date(`${a.date}T${a.time}`) -
                      new Date(`${b.date}T${b.time}`)
                  )
                  .slice(0, 6)}
              />
            </div>

            <div className="admin-alert-grid">
              <article className="admin-panel-card">
                <div className="admin-card-top">
                  <h3>Low stock warnings</h3>
                </div>
                <div className="admin-alert-list">
                  {lowStockAlerts.map((item) => (
                    <div className="admin-alert-item warning" key={item.item}>
                      <strong>{item.item}</strong>
                      <span>
                        {item.remaining} units remaining. Reorder threshold is {item.threshold}.
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-panel-card">
                <div className="admin-card-top">
                  <h3>Bed availability alerts</h3>
                </div>
                <div className="admin-alert-list">
                  {bedAlerts.map((item) => (
                    <div className="admin-alert-item info" key={item.title}>
                      <strong>{item.title}</strong>
                      <span>{item.note}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section id="doctors" className="admin-page-section">
            <SectionHeader
              eyebrow="Doctor Management"
              title="Add and review doctors"
              description="Register doctors with their department and consultation availability."
            />

            <div className="admin-management-grid">
              <article className="admin-panel-card">
                <div className="admin-card-top">
                  <h3>Add doctor</h3>
                </div>
                <form className="admin-form-grid" onSubmit={handleDoctorSubmit}>
                  <label htmlFor="doctor-name">Doctor name</label>
                  <input
                    id="doctor-name"
                    type="text"
                    value={doctorForm.name}
                    onChange={(event) =>
                      setDoctorForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Enter full name"
                  />

                  <label htmlFor="doctor-specialization">Specialization</label>
                  <input
                    id="doctor-specialization"
                    type="text"
                    value={doctorForm.specialization}
                    onChange={(event) =>
                      setDoctorForm((current) => ({
                        ...current,
                        specialization: event.target.value,
                      }))
                    }
                    placeholder="Cardiology"
                  />

                  <label htmlFor="doctor-email">Email</label>
                  <input
                    id="doctor-email"
                    type="email"
                    value={doctorForm.email}
                    onChange={(event) =>
                      setDoctorForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="doctor@hospital.com"
                  />

                  <label htmlFor="doctor-phone">Phone</label>
                  <input
                    id="doctor-phone"
                    type="tel"
                    value={doctorForm.phone}
                    onChange={(event) =>
                      setDoctorForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="+91 98765 43210"
                  />

                  <label htmlFor="doctor-access-key">Doctor access key</label>
                  <input
                    id="doctor-access-key"
                    type="password"
                    inputMode="numeric"
                    maxLength="4"
                    value={doctorForm.accessKey}
                    onChange={(event) =>
                      setDoctorForm((current) => ({
                        ...current,
                        accessKey: event.target.value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    placeholder="4 digit key"
                  />

                  <label htmlFor="doctor-availability">Availability</label>
                  <input
                    id="doctor-availability"
                    type="text"
                    value={doctorForm.availability}
                    onChange={(event) =>
                      setDoctorForm((current) => ({
                        ...current,
                        availability: event.target.value,
                      }))
                    }
                    placeholder="Mon - Fri, 10:00 - 16:00"
                  />

                  <label htmlFor="doctor-time-slots">Time slots</label>
                  <input
                    id="doctor-time-slots"
                    type="text"
                    value={doctorForm.timeSlots}
                    onChange={(event) =>
                      setDoctorForm((current) => ({
                        ...current,
                        timeSlots: event.target.value,
                      }))
                    }
                    placeholder="09:00 AM - 11:00 AM, 11:30 AM - 01:30 PM"
                  />

                  {doctorError ? <p className="admin-form-error">{doctorError}</p> : null}

                  <button className="admin-btn primary" type="submit">
                    Save doctor
                  </button>
                </form>
              </article>

              <DataTable
                title="Doctor directory"
                emptyText="No doctors available."
                columns={[
                  { key: "name", label: "Doctor" },
                  {
                    key: "specialization",
                    label: "Specialization",
                    render: (row) => formatSpecialization(row.specialization),
                  },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "availability", label: "Availability" },
                  {
                    key: "patientsToday",
                    label: "Patients today",
                    render: (row) =>
                      appointments.filter((appointment) => appointment.doctorId === row.id)
                        .length,
                  },
                  {
                    key: "accessKey",
                    label: "Access key",
                    render: () => "Protected",
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (row) => (
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger"
                        onClick={() => handleDeleteDoctor(row)}
                      >
                        Delete
                      </button>
                    ),
                  },
                ]}
                rows={doctors}
              />
            </div>
          </section>

          <section id="patients" className="admin-page-section">
            <SectionHeader
              eyebrow="Patient Registry"
              title="Add and manage patient records"
              description="Capture essential admission details and keep recent records visible."
            />

            <div className="admin-management-grid">
              <article className="admin-panel-card">
                <div className="admin-card-top">
                  <h3>Add patient</h3>
                </div>
                <form className="admin-form-grid" onSubmit={handlePatientSubmit}>
                  <label htmlFor="patient-name">Patient name</label>
                  <input
                    id="patient-name"
                    type="text"
                    value={patientForm.name}
                    onChange={(event) =>
                      setPatientForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Enter patient name"
                  />

                  <label htmlFor="patient-age">Age</label>
                  <input
                    id="patient-age"
                    type="number"
                    min="0"
                    value={patientForm.age}
                    onChange={(event) =>
                      setPatientForm((current) => ({ ...current, age: event.target.value }))
                    }
                    placeholder="34"
                  />

                  <label htmlFor="patient-gender">Gender</label>
                  <select
                    id="patient-gender"
                    value={patientForm.gender}
                    onChange={(event) =>
                      setPatientForm((current) => ({ ...current, gender: event.target.value }))
                    }
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>

                  <label htmlFor="patient-phone">Phone</label>
                  <input
                    id="patient-phone"
                    type="tel"
                    value={patientForm.phone}
                    onChange={(event) =>
                      setPatientForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    placeholder="+91 98765 43210"
                  />

                  <label htmlFor="patient-address">Address</label>
                  <input
                    id="patient-address"
                    type="text"
                    value={patientForm.address}
                    onChange={(event) =>
                      setPatientForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    placeholder="City, State"
                  />

                  <label htmlFor="patient-blood-group">Blood Group</label>
                  <input
                    id="patient-blood-group"
                    type="text"
                    value={patientForm.bloodGroup}
                    onChange={(event) =>
                      setPatientForm((current) => ({
                        ...current,
                        bloodGroup: event.target.value,
                      }))
                    }
                    placeholder="B+"
                  />

                  <label htmlFor="patient-condition">Condition</label>
                  <input
                    id="patient-condition"
                    type="text"
                    value={patientForm.condition}
                    onChange={(event) =>
                      setPatientForm((current) => ({
                        ...current,
                        condition: event.target.value,
                      }))
                    }
                    placeholder="Condition or reason for admission"
                  />

                  {patientError ? <p className="admin-form-error">{patientError}</p> : null}

                  <button className="admin-btn primary" type="submit">
                    Add patient
                  </button>
                </form>
              </article>

              <DataTable
                title="Patient list"
                emptyText="No patients found."
                columns={[
                  {
                    key: "name",
                    label: "Patient",
                    render: (row) => getPatientDisplayName(row),
                  },
                  { key: "age", label: "Age" },
                  { key: "gender", label: "Gender" },
                  { key: "condition", label: "Condition" },
                  { key: "phone", label: "Phone" },
                ]}
                rows={filteredPatients}
              />
            </div>
          </section>

          <section id="appointments" className="admin-page-section">
            <SectionHeader
              eyebrow="Appointments"
              title="Book and monitor appointments"
              description="Schedule visits using active patients and doctors already in the system."
            />

            <div className="admin-management-grid">
              <article className="admin-panel-card">
                <div className="admin-card-top">
                  <h3>Book appointment</h3>
                </div>
                <form className="admin-form-grid" onSubmit={handleAppointmentSubmit}>
                  <label htmlFor="appointment-patient">Patient</label>
                  <select
                    id="appointment-patient"
                    value={appointmentForm.patientUid}
                    onChange={(event) =>
                      handleAppointmentPatientChange(event.target.value)
                    }
                  >
                    <option value="">Select patient</option>
                    {patientOptions.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="appointment-doctor">Doctor</label>
                  <select
                    id="appointment-doctor"
                    value={appointmentForm.doctorId}
                    onChange={(event) => handleAppointmentDoctorChange(event.target.value)}
                  >
                    <option value="">Select doctor</option>
                    {doctorOptions.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="appointment-department">Department</label>
                  <input
                    id="appointment-department"
                    type="text"
                    value={appointmentForm.department}
                    readOnly
                    placeholder="Auto-filled from doctor"
                  />

                  <label htmlFor="appointment-date">Date</label>
                  <input
                    id="appointment-date"
                    type="date"
                    value={appointmentForm.date}
                    onChange={(event) =>
                      setAppointmentForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                  />

                  <label htmlFor="appointment-time">Time</label>
                  <select
                    id="appointment-time"
                    value={appointmentForm.time}
                    onChange={(event) =>
                      setAppointmentForm((current) => ({
                        ...current,
                        time: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select available slot</option>
                    {doctorOptions
                      .find((doctor) => doctor.id === appointmentForm.doctorId)
                      ?.timeSlots?.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                  </select>

                  {appointmentError ? (
                    <p className="admin-form-error">{appointmentError}</p>
                  ) : null}

                  <button className="admin-btn primary" type="submit">
                    Book appointment
                  </button>
                </form>
              </article>

              <DataTable
                title="Appointment schedule"
                emptyText="No appointments found."
                columns={[
                  { key: "patient", label: "Patient" },
                  { key: "doctor", label: "Doctor" },
                  { key: "department", label: "Department" },
                  {
                    key: "date",
                    label: "Date",
                    render: (row) => formatDisplayDate(row.date),
                  },
                  { key: "time", label: "Time" },
                  { key: "status", label: "Status" },
                ]}
                rows={filteredAppointments}
              />
            </div>
          </section>

          <section id="beds" className="admin-page-section">
            <SectionHeader
              eyebrow="Bed Management"
              title="Track occupancy and assign beds"
              description="Update bed status for admissions, discharge readiness, and maintenance handling."
            />

            <div className="admin-management-grid">
              <article className="admin-panel-card">
                <div className="admin-card-top">
                  <h3>Update bed status</h3>
                </div>
                <form className="admin-form-grid" onSubmit={handleBedSubmit}>
                  <label htmlFor="bed-id">Bed</label>
                  <select
                    id="bed-id"
                    value={bedForm.bedId}
                    onChange={(event) =>
                      setBedForm((current) => ({
                        ...current,
                        bedId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select bed</option>
                    {beds.map((bed) => (
                      <option key={bed.id} value={bed.id}>
                        {bed.id} - {bed.ward}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="bed-status">Status</label>
                  <select
                    id="bed-status"
                    value={bedForm.status}
                    onChange={(event) =>
                      setBedForm((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>

                  <label htmlFor="bed-patient">Assigned patient</label>
                  <select
                    id="bed-patient"
                    value={bedForm.patient}
                    onChange={(event) =>
                      setBedForm((current) => ({
                        ...current,
                        patient: event.target.value,
                      }))
                    }
                    disabled={bedForm.status !== "Occupied"}
                  >
                    <option value="">Select patient</option>
                    {patientOptions.map((patient) => (
                      <option key={patient.id} value={patient.name}>
                        {patient.name}
                      </option>
                    ))}
                  </select>

                  {bedError ? <p className="admin-form-error">{bedError}</p> : null}

                  <button className="admin-btn primary" type="submit">
                    Update bed
                  </button>
                </form>
              </article>

              <DataTable
                title="Bed overview"
                emptyText="No beds found."
                columns={[
                  { key: "id", label: "Bed ID" },
                  { key: "ward", label: "Ward" },
                  { key: "bedType", label: "Type" },
                  {
                    key: "patient",
                    label: "Patient",
                    render: (row) => row.patient || "Unassigned",
                  },
                  { key: "status", label: "Status" },
                ]}
                rows={beds}
              />
            </div>
          </section>

          <section id="billing" className="admin-page-section">
            <SectionHeader
              eyebrow="Billing"
              title="Revenue snapshot"
              description="A quick operational summary for collections, pending invoices, and discharge billing."
            />

            <div className="admin-stats-grid compact">
              <StatCard label="Invoices Raised" value="126" helper="Generated this month" />
              <StatCard
                label="Collected Revenue"
                value="Rs. 18.4L"
                helper="Across inpatient and outpatient billing"
              />
              <StatCard
                label="Pending Payments"
                value="Rs. 2.6L"
                helper="Awaiting insurance and direct settlements"
              />
            </div>
          </section>

          <section id="inventory" className="admin-page-section">
            <SectionHeader
              eyebrow="Inventory"
              title="Critical supplies watchlist"
              description="Review low stock items and vendors to keep care delivery uninterrupted."
            />

            <DataTable
              title="Inventory status"
              emptyText="Inventory data unavailable."
              columns={[
                { key: "item", label: "Item" },
                { key: "remaining", label: "Remaining" },
                { key: "threshold", label: "Threshold" },
                { key: "vendor", label: "Vendor" },
              ]}
              rows={inventoryData.map((item) => ({ ...item, id: item.item }))}
            />
          </section>
        </section>
      </div>
    </main>
  );
}

export default AdminPanel;
