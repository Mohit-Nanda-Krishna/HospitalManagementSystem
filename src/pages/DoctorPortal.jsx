import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

function DoctorPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("schedules");
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    let unsubscribeApt = null;
    let unsubscribeUser = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/doctor-login");
        return;
      }
      try {
        const userRef = doc(db, "users", user.uid);
        unsubscribeUser = onSnapshot(userRef, async (userSnap) => {
          if (userSnap.exists() && userSnap.data().role === "doctor") {
            const emailQuery = user.email || userSnap.data().email;
            
            // Fetch doctors to safely find by email case-insensitively
            const querySnapshot = await getDocs(collection(db, "doctors"));
            const doctorsList = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            const doctorMatch = doctorsList.find(d => d.email && d.email.toLowerCase() === emailQuery.toLowerCase());
            
            if (doctorMatch) {
              setDoctorProfile(doctorMatch);

              // Subscribe to appointments
              const aptQuery = query(collection(db, "appointments"), where("doctorId", "==", doctorMatch.id));
              unsubscribeApt = onSnapshot(aptQuery, (snapshot) => {
                const aptData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                aptData.sort((a,b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
                setAppointments(aptData);
              });
              setLoading(false);
            } else {
              console.warn("No doctor profile found for this email. Waiting for admin creation.");
              setLoading(false);
            }
          } else if (userSnap.exists() && userSnap.data().role !== "doctor") {
            navigate("/doctor-login");
          } else {
            // Keep loading if the user document is in the process of being created
            setLoading(true);
          }
        });
      } catch (err) {
        console.error("Auth error", err);
        navigate("/doctor-login");
      }
    });
    
    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeApt) unsubscribeApt();
    };
  }, [navigate]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const aptRef = doc(db, "appointments", id);
      await updateDoc(aptRef, { status: newStatus });
    } catch (err) {
      console.error("Error updating appointment", err);
      alert("Failed to update status.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) return <div style={{padding: "2rem"}}>Verifying credentials...</div>;

  if (!doctorProfile) return (
    <div style={{padding: "2rem"}}>
      <h2>Account Pending</h2>
      <p>Your account is registered but hasn't been linked to a doctor profile by the Admin.</p>
      <button onClick={handleLogout} style={{padding: '0.5rem 1rem'}}>Logout</button>
    </div>
  );

  const [patientHistory, setPatientHistory] = useState([]);
  
  useEffect(() => {
    if (appointments.length > 0 && activeTab === "history") {
      const fetchPatientRecords = async () => {
        const uniquePatientUids = [...new Set(appointments.map(a => a.patientUid))];
        const patientData = [];
        for (const uid of uniquePatientUids) {
          const pRef = doc(db, "patients", uid);
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            patientData.push({ id: uid, ...pSnap.data() });
          }
        }
        setPatientHistory(patientData);
      };
      fetchPatientRecords();
    }
  }, [appointments, activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "schedules":
        return (
          <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <h2 style={{ marginTop: 0 }}>Upcoming Appointments</h2>
            {appointments.length === 0 && <p>No appointments scheduled.</p>}
            {appointments.map(s => (
              <div key={s.id} style={{ padding: "1rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", gap: '1rem' }}>
                <div style={{flex: 1}}>
                  <strong style={{ display: "block", fontSize: "1.1rem", marginBottom: "0.2rem" }}>{s.patientName || s.patientId}</strong>
                  <span style={{ color: "#666", fontSize: "0.9em", backgroundColor: "#f1f5f9", padding: "0.2rem 0.6rem", borderRadius: "12px" }}>{s.specialty || "Consultation"}</span>
                </div>
                <div style={{ color: "#334155", fontWeight: "500" }}>
                  <div style={{ marginBottom: "0.2rem" }}>{s.date}</div>
                  <div style={{ color: "#0ea5e9" }}>{s.time}</div>
                </div>
                <div style={{minWidth: '100px', textAlign: 'right'}}>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
                    background: s.status === 'approved' ? '#dcfce7' : s.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                    color: s.status === 'approved' ? '#166534' : s.status === 'rejected' ? '#991b1b' : '#854d0e',
                  }}>{s.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        );
      case "history":
        return (
          <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <h2 style={{ marginTop: 0 }}>My Patient History</h2>
            {patientHistory.length === 0 && <p>No detailed patient history available yet.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {patientHistory.map(p => (
                <div key={p.id} style={{ padding: "1.2rem", border: "1.5px solid #e2e8f0", borderRadius: "10px", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>
                    <strong style={{ fontSize: "1.2rem" }}>{p.name}</strong>
                    <span style={{ color: "#64748b" }}>Age: {p.age} | Blood: {p.bloodGroup}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div>
                      <h4 style={{ margin: "0 0 0.4rem", color: "#0f172a", fontSize: "0.9rem", textTransform: "uppercase" }}>Vitals Summary</h4>
                      <p style={{ margin: 0, fontSize: "0.95rem" }}>Height: {p.vitals?.heightCm}cm | Weight: {p.vitals?.weightKg}kg</p>
                    </div>
                    <div>
                      <h4 style={{ margin: "0 0 0.4rem", color: "#e11d48", fontSize: "0.9rem", textTransform: "uppercase" }}>Allergies / Conditions</h4>
                      <p style={{ margin: 0, fontSize: "0.95rem", color: "#be123c" }}>{p.vitals?.allergies || "None reported"}</p>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "#64748b" }}>Chronic: {p.vitals?.chronicConditions || "None"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "updates":
        const pendingApts = appointments.filter(a => a.status === 'pending');
        const approvedCount = appointments.filter(a => a.status === 'approved').length;
        const totalRelevant = appointments.filter(a => a.status !== 'rejected').length;
        
        return (
          <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <h2 style={{ marginTop: 0 }}>Consultation & Approval Pipeline</h2>
            
            <div style={{ padding: "1.5rem", border: "1px solid #bae6fd", background: "#f0f9ff", borderRadius: "12px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ fontSize: "2.5rem" }}>📈</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong style={{ fontSize: "1.1rem", color: "#0369a1" }}>Daily Progress</strong>
                  <span style={{ fontWeight: "700", color: "#0ea5e9" }}>{Math.round((approvedCount / (totalRelevant || 1)) * 100)}% Complete</span>
                </div>
                <div style={{ height: "10px", background: "#e0f2fe", borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{ width: `${(approvedCount / (totalRelevant || 1)) * 100}%`, height: "100%", background: "#0ea5e9", transition: "width 0.4s ease" }}></div>
                </div>
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", color: "#0ea5e9" }}>{approvedCount} Approved | {pendingApts.length} Pending Actions</p>
              </div>
            </div>

            <h3 style={{ borderBottom: "2px solid #f1f5f9", paddingBottom: "0.5rem" }}>Pending Approvals</h3>
            {pendingApts.length === 0 ? <p style={{ color: "#64748b", fontStyle: "italic" }}>All caught up! No pending consultation requests.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {pendingApts.map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                    <div>
                      <strong style={{ display: "block" }}>{a.patientName}</strong>
                      <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{a.date} at {a.time}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                       <button 
                         onClick={() => handleStatusUpdate(a.id, 'approved')} 
                         style={{ background: "#22c55e", color: "white", border: "none", padding: "0.6rem 1rem", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                       >
                         Approve
                       </button>
                       <button 
                         onClick={() => handleStatusUpdate(a.id, 'rejected')} 
                         style={{ background: "#ef4444", color: "white", border: "none", padding: "0.6rem 1rem", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                       >
                         Reject
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ background: "#1e293b", color: "#fff", padding: "1.2rem 2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "600", letterSpacing: "-0.5px" }}>Doctor Portal - {doctorProfile.name}</h1>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "0.6rem 1.2rem", borderRadius: "6px", cursor: "pointer" }}>Sign Out</button>
          <Link to="/" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", textDecoration: "none", fontWeight: "600", padding: "0.6rem 1.2rem", borderRadius: "6px", transition: "all 0.2s" }} onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.2)"} onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}>← Home</Link>
        </div>
      </header>

      <main style={{ maxWidth: "1100px", margin: "3rem auto", padding: "0 1.5rem", display: "grid", gridTemplateColumns: "250px 1fr", gap: "2.5rem" }}>
        <aside>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button 
              onClick={() => setActiveTab("schedules")} 
              style={{ padding: "1rem 1.2rem", textAlign: "left", background: activeTab === "schedules" ? "#e2e8f0" : "transparent", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", color: "#1e293b", transition: "background 0.2s" }}
            >
              📅 Review Schedules
            </button>
            <button 
              onClick={() => setActiveTab("history")} 
              style={{ padding: "1rem 1.2rem", textAlign: "left", background: activeTab === "history" ? "#e2e8f0" : "transparent", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", color: "#1e293b", transition: "background 0.2s" }}
            >
              📋 Patient History
            </button>
            <button 
              onClick={() => setActiveTab("updates")} 
              style={{ padding: "1rem 1.2rem", textAlign: "left", background: activeTab === "updates" ? "#e2e8f0" : "transparent", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", color: "#1e293b", transition: "background 0.2s" }}
            >
              ⏱ Consultation Updates
            </button>
          </div>
        </aside>
        
        <section>
          {renderContent()}
        </section>
      </main>
    </div>
  );
}

export default DoctorPortal;
