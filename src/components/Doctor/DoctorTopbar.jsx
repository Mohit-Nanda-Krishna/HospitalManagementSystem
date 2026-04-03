import { Link } from "react-router-dom";

function DoctorTopbar({
  activeLabel,
  doctorName,
  doctorEmail,
  notificationCount,
  showMenu,
  setShowMenu,
  setSidebarOpen,
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
    <header className="dd-topbar">
      <button
        className="dd-hamburger"
        onClick={() => setSidebarOpen((current) => !current)}
        type="button"
        aria-label="Toggle doctor dashboard menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <h1 className="dd-topbar-title">{activeLabel}</h1>

      <div className="dd-topbar-actions">
        <div className="dd-notification-chip">
          <span>Today</span>
          <strong>{notificationCount}</strong>
        </div>

        <Link className="dd-home-link" to="/">
          Back to Home
        </Link>

        <div className="dd-user-wrap">
          <button className="dd-user-avatar" onClick={() => setShowMenu((current) => !current)} type="button">
            {initials || "DR"}
          </button>

          {showMenu ? (
            <div className="dd-user-menu">
              <strong>{doctorName || "Doctor"}</strong>
              <p>{doctorEmail || "No email available"}</p>
              <button className="dd-menu-button" onClick={onLogout} type="button">
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default DoctorTopbar;
