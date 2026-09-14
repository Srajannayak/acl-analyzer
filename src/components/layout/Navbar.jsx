import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Activity, Menu, X, Sparkles, ArrowRight } from "lucide-react";
import "../../styles/navbar.css";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure body is clean clinical white theme
    document.body.classList.remove("dark-theme");
    localStorage.setItem("aclTheme", "light");
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar">
      <NavLink to="/" className="nav-logo" onClick={closeMobileMenu}>
        <div className="nav-logo-icon">
          <Activity size={22} color="#ffffff" />
        </div>
        <div className="nav-logo-text">
          <span className="logo-title">ACL ANALYZER</span>
          <span className="logo-subtitle">BIOMECHANICS LAB</span>
        </div>
      </NavLink>

      {/* Desktop Navigation */}
      <nav className="desktop-nav">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/upload">Upload</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/report">Clinical Report</NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/about">About</NavLink>

        <button
          className="nav-cta-btn"
          onClick={() => navigate("/upload")}
          title="Start Biomechanical Analysis"
        >
          <Sparkles size={15} />
          <span>Start Analysis</span>
        </button>
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="mobile-dropdown-menu">
          <NavLink to="/" end onClick={closeMobileMenu}>Home</NavLink>
          <NavLink to="/upload" onClick={closeMobileMenu}>Upload Video</NavLink>
          <NavLink to="/dashboard" onClick={closeMobileMenu}>Dashboard</NavLink>
          <NavLink to="/report" onClick={closeMobileMenu}>Clinical Report</NavLink>
          <NavLink to="/history" onClick={closeMobileMenu}>History</NavLink>
          <NavLink to="/about" onClick={closeMobileMenu}>About</NavLink>
          <button
            className="nav-cta-btn mobile-cta"
            onClick={() => {
              closeMobileMenu();
              navigate("/upload");
            }}
          >
            <Sparkles size={16} />
            <span>Start Analysis</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;