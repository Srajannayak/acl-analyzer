import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Activity, Menu, X, Sun, Moon } from "lucide-react";
import "../../styles/navbar.css";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("aclTheme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("aclTheme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("aclTheme", "light");
    }
  }, [darkMode]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <header className="navbar">
      <NavLink to="/" className="nav-logo" onClick={closeMobileMenu}>
        <Activity size={28} />
        <span>ACL Analyzer</span>
      </NavLink>

      {/* Desktop Navigation */}
      <nav className="desktop-nav">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/upload">Upload</NavLink>
        <NavLink to="/dashboard">Results</NavLink>
        <NavLink to="/report">Report</NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/about">About</NavLink>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            padding: "6px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#475569",
            fontSize: "13px",
            fontWeight: 600,
          }}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun size={16} color="#F59E0B" /> : <Moon size={16} color="#2563EB" />}
          <span>{darkMode ? "Light" : "Dark"}</span>
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
          <NavLink to="/upload" onClick={closeMobileMenu}>Upload</NavLink>
          <NavLink to="/dashboard" onClick={closeMobileMenu}>Results</NavLink>
          <NavLink to="/report" onClick={closeMobileMenu}>Report</NavLink>
          <NavLink to="/history" onClick={closeMobileMenu}>History</NavLink>
          <NavLink to="/about" onClick={closeMobileMenu}>About</NavLink>
          <button
            onClick={() => {
              toggleTheme();
              closeMobileMenu();
            }}
            style={{
              background: "#EEF5FF",
              border: "none",
              borderRadius: "10px",
              padding: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#2563EB",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            {darkMode ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#2563EB" />}
            <span>{darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;