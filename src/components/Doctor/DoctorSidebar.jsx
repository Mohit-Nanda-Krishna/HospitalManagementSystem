const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: "Dx" },
  { id: "appointments", label: "Appointments", icon: "Ap" },
  { id: "patients", label: "Patients", icon: "Pt" },
  { id: "prescriptions", label: "Prescriptions", icon: "Rx" },
  { id: "profile", label: "Profile", icon: "Dr" },
];

function DoctorSidebar({
  activeTab,
  doctorName,
  sidebarOpen,
  setSidebarOpen,
  onNavigate,
  onLogout,
}) {
  const initials = (doctorName || "Doctor")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <>
      {sidebarOpen ? (
        <div className="dd-overlay" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside className={`dd-sidebar ${sidebarOpen ? "dd-sidebar-open" : ""}`}>
        <div className="dd-sidebar-brand">
          <div className="dd-brand-dot">+</div>
          <span>VIT HMS</span>
        </div>

        <div className="dd-sidebar-doctor">
          <div className="dd-sidebar-avatar">{initials || "DR"}</div>
          <div>
            <p className="dd-sidebar-name">{doctorName || "Doctor"}</p>
            <p className="dd-sidebar-role">Doctor Dashboard</p>
          </div>
        </div>

        <nav className="dd-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`dd-nav-item ${activeTab === item.id ? "dd-nav-active" : ""}`}
              onClick={() => {
                onNavigate(item.id);
                setSidebarOpen(false);
              }}
              type="button"
            >
              <span className="dd-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="dd-sidebar-footer">
          <button className="dd-nav-item dd-nav-logout" onClick={onLogout} type="button">
            <span className="dd-nav-icon">Out</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default DoctorSidebar;
