import { Link } from "react-router-dom";
import { Activity, Mail, Phone, MapPin, ShieldCheck } from "lucide-react";
import "../../styles/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Column 1: Brand & Clinical Description */}
        <div className="footer-section brand-column">
          <div className="footer-logo">
            <div className="footer-logo-icon">
              <Activity size={20} color="#ffffff" />
            </div>
            <div>
              <h2>ACL Analyzer</h2>
              <span>SPORTS BIOMECHANICS LAB</span>
            </div>
          </div>

          <p className="footer-brand-desc">
            AI-powered kinematic screening and biomechanical analysis for ACL injury
            prevention in competitive athletics, utilizing 33-point pose tracking and machine learning.
          </p>

          <div className="footer-compliance-badge">
            <ShieldCheck size={14} color="#2F6FAF" />
            <span>Sports Science &amp; Clinical Kinematics AI</span>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="footer-section links-column">
          <h3>Quick Links</h3>
          <ul className="footer-links-list">
            <li>
              <Link to="/">Home Overview</Link>
            </li>
            <li>
              <Link to="/upload">Upload Athlete Video</Link>
            </li>
            <li>
              <Link to="/dashboard">Clinical Dashboard</Link>
            </li>
            <li>
              <Link to="/report">Biomechanical Report</Link>
            </li>
            <li>
              <Link to="/about">About Kinematics Lab</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Clinical Lab Contact */}
        <div className="footer-section contact-column">
          <h3>Contact &amp; Support</h3>

          <div className="footer-contact-item">
            <div className="contact-icon-box">
              <Mail size={15} />
            </div>
            <span>support@aclanalyzer.com</span>
          </div>

          <div className="footer-contact-item">
            <div className="contact-icon-box">
              <Phone size={15} />
            </div>
            <span>+91 98765 43210</span>
          </div>

          <div className="footer-contact-item">
            <div className="contact-icon-box">
              <MapPin size={15} />
            </div>
            <span>Department of Sports Medicine, Karnataka, India</span>
          </div>
        </div>
      </div>

      {/* Full-width Copyright Row */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>© 2026 ACL Analyzer. All Rights Reserved.</p>
          <p className="footer-subtext">
            Biomechanical Assessment &amp; ACL Injury Prevention Platform
          </p>
        </div>
      </div>
    </footer>
  );
}