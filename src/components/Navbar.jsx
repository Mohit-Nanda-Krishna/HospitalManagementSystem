function Navbar() {
  return (
    <header className="home-header">
      <nav className="home-nav">
        <a className="home-brand" href="#">
          <span className="home-brand-dot">+</span>
          VIT Hospital Management System
        </a>

        <div className="home-nav-links">
          <a href="#">Home</a>
          <a href="#features">Features</a>
          <a href="#portal">Portals</a>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
