import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getAppointmentSortValue } from "../utils/appointmentSlots";
import DoctorSidebar from "../components/Doctor/DoctorSidebar";
import DoctorTopbar from "../components/Doctor/DoctorTopbar";
import {
  DoctorAppointmentsSection,
  DoctorOverview,
  DoctorPatientsSection,
  DoctorPrescriptionsSection,
  DoctorProfileSection,
} from "../components/Doctor/DoctorSections";
import { auth, db } from "../services/firebase";
import "../styles/doctorDashboard.css";

const TAB_LABELS = {
  overview: "Dashboard",
  appointments: "Appointments",
  patients: "Patients",
  prescriptions: "Prescriptions",
  profile: "Profile",
};

function normalizeSpecialization(specialization) {
  if (Array.isArray(specialization)) {
    return specialization
      .map((item) =>
        String(item || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ")
          .replace(/\b\w/g, (match) => match.toUpperCase())
      )
      .join(", ");
  }

  return String(specialization || "General")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function normalizePhoneNumber(phoneValue) {
  return String(phoneValue || "").replace(/\D/g, "").slice(0, 10);
}

function sortByDateTime(items) {
  return [...items].sort((first, second) => {
    const firstValue = getAppointmentSortValue(first.date, first.time);
    const secondValue = getAppointmentSortValue(second.date, second.time);
    return secondValue - firstValue;
  });
}

function DoctorDashboard() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointmentFilter, setAppointmentFilter] = useState("today");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [prescriptionSaving, setPrescriptionSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: "",
    medicines: "",
    notes: "",
  });
  const [profileForm, setProfileForm] = useState({
    name: "",
    specialization: "",
    phone: "",
    availability: "",
  });

  useEffect(() => {
    let unsubscribeAppointments = null;
    let unsubscribePrescriptions = null;
    let cancelled = false;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/doctor-login", { replace: true });
        return;
      }

      setLoading(true);
      setError("");

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (
          !userSnap.exists() ||
          userSnap.data().role !== "doctor" ||
          userSnap.data().approved !== true
        ) {
          await signOut(auth);
          navigate("/doctor-login", { replace: true });
          return;
        }

        const userData = userSnap.data();
        let doctorId = userData.doctorId || "";
        let doctorData = null;

        if (doctorId) {
          const doctorDocSnap = await getDoc(doc(db, "doctors", doctorId));
          if (doctorDocSnap.exists()) {
            doctorData = { id: doctorDocSnap.id, ...doctorDocSnap.data() };
          }
        }

        if (!doctorData) {
          const normalizedEmail = (user.email || userData.email || "").trim().toLowerCase();
          const doctorQuery = query(collection(db, "doctors"), where("email", "==", normalizedEmail));
          const doctorSnap = await getDocs(doctorQuery);
          const doctorDoc = doctorSnap.docs[0];

          if (!doctorDoc) {
            if (!cancelled) {
              setDoctorProfile(null);
              setLoading(false);
              setError("No doctor profile was found for this account.");
            }
            return;
          }

          doctorData = { id: doctorDoc.id, ...doctorDoc.data() };
          doctorId = doctorDoc.id;

          await updateDoc(userRef, {
            doctorId,
            email: normalizedEmail,
            name: doctorData.name || userData.name || "Doctor",
            updatedAt: serverTimestamp(),
          });
        }

        if (cancelled) {
          return;
        }

        const nextDoctorProfile = {
          ...doctorData,
          specializationLabel: normalizeSpecialization(doctorData.specialization),
        };

        setDoctorProfile(nextDoctorProfile);
        setProfileForm({
          name: nextDoctorProfile.name || "",
          specialization: nextDoctorProfile.specializationLabel || "",
          phone: nextDoctorProfile.phone || "",
          availability: nextDoctorProfile.availability || "",
        });

        if (unsubscribeAppointments) {
          unsubscribeAppointments();
        }
        if (unsubscribePrescriptions) {
          unsubscribePrescriptions();
        }

        const appointmentQuery = query(collection(db, "appointments"), where("doctorId", "==", doctorId));
        unsubscribeAppointments = onSnapshot(appointmentQuery, (snapshot) => {
          const appointmentData = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
            status: (item.data().status || "pending").toLowerCase(),
          }));
          setAppointments(sortByDateTime(appointmentData));
          setLoading(false);
        });

        const prescriptionQuery = query(collection(db, "prescriptions"), where("doctorId", "==", doctorId));
        unsubscribePrescriptions = onSnapshot(prescriptionQuery, (snapshot) => {
          const prescriptionData = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }));
          setPrescriptions(sortByDateTime(prescriptionData));
        });
      } catch (fetchError) {
        console.error("Doctor dashboard load failed", fetchError);
        if (!cancelled) {
          setError("Unable to load the doctor dashboard right now.");
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribeAuth();
      if (unsubscribeAppointments) {
        unsubscribeAppointments();
      }
      if (unsubscribePrescriptions) {
        unsubscribePrescriptions();
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (!appointments.length) {
      setPatients([]);
      setSelectedPatient(null);
      return;
    }

    let cancelled = false;

    async function loadPatients() {
      try {
        const uniquePatientIds = [...new Set(appointments.map((item) => item.patientUid).filter(Boolean))];
        const patientData = [];

        for (const patientId of uniquePatientIds) {
          const patientSnap = await getDoc(doc(db, "patients", patientId));
          if (patientSnap.exists()) {
            patientData.push({
              id: patientSnap.id,
              ...patientSnap.data(),
            });
          }
        }

        if (!cancelled) {
          setPatients(patientData);
          setSelectedPatient((current) => {
            if (!current) {
              return patientData[0] || null;
            }

            return patientData.find((item) => item.id === current.id) || patientData[0] || null;
          });
        }
      } catch (patientError) {
        console.error("Failed to load doctor patients", patientError);
      }
    }

    loadPatients();

    return () => {
      cancelled = true;
    };
  }, [appointments]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/doctor-login", { replace: true });
  };

  const handleStatusUpdate = async (appointmentId, nextStatus) => {
    try {
      setActionLoadingId(appointmentId);
      if (nextStatus === "cancelled") {
        await deleteDoc(doc(db, "appointments", appointmentId));
        return;
      }

      await updateDoc(doc(db, "appointments", appointmentId), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (updateError) {
      console.error("Failed to update appointment status", updateError);
      setError("Unable to update appointment status.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleSavePrescription = async (event) => {
    event.preventDefault();

    if (!doctorProfile?.id) {
      return;
    }

    try {
      setPrescriptionSaving(true);
      const selectedPrescriptionPatient = patients.find((item) => item.id === prescriptionForm.patientId);

      await addDoc(collection(db, "prescriptions"), {
        patientId: prescriptionForm.patientId,
        patientName:
          selectedPrescriptionPatient?.name ||
          selectedPrescriptionPatient?.fullName ||
          "Patient",
        doctorId: doctorProfile.id,
        medicines: prescriptionForm.medicines.trim(),
        notes: prescriptionForm.notes.trim(),
        date: today,
        createdAt: serverTimestamp(),
      });

      setPrescriptionForm({
        patientId: "",
        medicines: "",
        notes: "",
      });
    } catch (saveError) {
      console.error("Failed to save prescription", saveError);
      setError("Unable to save prescription.");
    } finally {
      setPrescriptionSaving(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!doctorProfile?.id || !auth.currentUser) {
      return;
    }

    try {
      setProfileSaving(true);
      const normalizedPhone = normalizePhoneNumber(profileForm.phone);

      if (normalizedPhone && normalizedPhone.length !== 10) {
        setError("Doctor phone number must contain exactly 10 digits.");
        return;
      }

      const nextDoctorProfile = {
        name: profileForm.name.trim(),
        phone: normalizedPhone,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "doctors", doctorProfile.id), nextDoctorProfile);

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        name: profileForm.name.trim(),
        updatedAt: serverTimestamp(),
      });

      setDoctorProfile((current) =>
        current
          ? {
              ...current,
              ...nextDoctorProfile,
              specializationLabel: normalizeSpecialization(nextDoctorProfile.specialization),
            }
          : current
      );
      setProfileForm((current) => ({
        ...current,
        name: profileForm.name.trim(),
        phone: normalizedPhone,
      }));
      setError("");
    } catch (saveError) {
      console.error("Failed to update doctor profile", saveError);
      setError("Unable to update doctor profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const queryValue = patientSearch.trim().toLowerCase();
    if (!queryValue) {
      return true;
    }

    return `${patient.name || patient.fullName || ""}`.toLowerCase().includes(queryValue);
  });

  const filteredAppointments = appointments.filter((appointment) => {
    const status = (appointment.status || "pending").toLowerCase();
    if (appointmentFilter === "today") {
      return appointment.date === today && status !== "completed" && status !== "cancelled";
    }
    if (appointmentFilter === "upcoming") {
      return appointment.date > today && status !== "completed" && status !== "cancelled";
    }
    return status === "completed";
  });

  const stats = {
    totalPatients: patients.length,
    todayAppointments: appointments.filter(
      (item) =>
        item.date === today &&
        !["completed", "cancelled"].includes((item.status || "pending").toLowerCase())
    ).length,
    upcomingAppointments: appointments.filter(
      (item) =>
        item.date > today &&
        !["completed", "cancelled"].includes((item.status || "pending").toLowerCase())
    ).length,
    completedConsultations: appointments.filter(
      (item) => (item.status || "pending").toLowerCase() === "completed"
    ).length,
  };

  const highlightedAppointments = appointments.filter(
    (item) => item.date === today && (item.status || "pending").toLowerCase() === "pending"
  );

  const renderContent = () => {
    if (!doctorProfile && !loading) {
      return (
        <div className="dd-card">
          <h2>Doctor Profile Not Found</h2>
          <p className="dd-muted">
            This account is authenticated, but there is no linked doctor record in Firestore yet.
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case "appointments":
        return (
          <DoctorAppointmentsSection
            actionLoadingId={actionLoadingId}
            appointmentFilter={appointmentFilter}
            appointments={filteredAppointments}
            loading={loading}
            onUpdateStatus={handleStatusUpdate}
            setAppointmentFilter={setAppointmentFilter}
          />
        );
      case "patients":
        return (
          <DoctorPatientsSection
            loading={loading}
            onSelectPatient={setSelectedPatient}
            patients={filteredPatients}
            searchValue={patientSearch}
            selectedPatient={selectedPatient}
            setSearchValue={setPatientSearch}
          />
        );
      case "prescriptions":
        return (
          <DoctorPrescriptionsSection
            patients={patients}
            prescriptionForm={prescriptionForm}
            prescriptions={prescriptions}
            saving={prescriptionSaving}
            setPrescriptionForm={setPrescriptionForm}
            onSubmitPrescription={handleSavePrescription}
          />
        );
      case "profile":
        return (
          <DoctorProfileSection
            doctorProfile={doctorProfile}
            profileForm={profileForm}
            saving={profileSaving}
            setProfileForm={setProfileForm}
            onSaveProfile={handleSaveProfile}
          />
        );
      default:
        return (
          <DoctorOverview
            doctorProfile={doctorProfile}
            highlightedAppointments={highlightedAppointments}
            onQuickNavigate={setActiveTab}
            recentPatients={patients}
            stats={stats}
          />
        );
    }
  };

  return (
    <div className="dd-layout">
      <DoctorSidebar
        activeTab={activeTab}
        doctorName={doctorProfile?.name}
        onLogout={handleLogout}
        onNavigate={setActiveTab}
        setSidebarOpen={setSidebarOpen}
        sidebarOpen={sidebarOpen}
      />

      <div className="dd-main">
        <DoctorTopbar
          activeLabel={TAB_LABELS[activeTab]}
          doctorEmail={doctorProfile?.email}
          doctorName={doctorProfile?.name}
          notificationCount={highlightedAppointments.length}
          onLogout={handleLogout}
          setShowMenu={setShowUserMenu}
          setSidebarOpen={setSidebarOpen}
          showMenu={showUserMenu}
        />

        <main className="dd-content">
          {error ? <div className="dd-alert">{error}</div> : null}
          {loading && !doctorProfile ? <div className="dd-card">Loading doctor dashboard...</div> : renderContent()}
        </main>
      </div>
    </div>
  );
}

export default DoctorDashboard;
