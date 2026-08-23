import { Activity, Mail, Phone, MapPin } from "lucide-react";
import "../../styles/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-section">
          <div className="footer-logo">
            <Activity size={28} />
            <h2>ACL Analyzer</h2>
          </div>

          <p>
            AI-powered biomechanical analysis for ACL injury prediction using
            pose estimation and machine learning.
          </p>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>

          <ul>
            <li>Home</li>
            <li>Upload</li>
            <li>Results</li>
            <li>Visualization</li>
            <li>About</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>

          <p>
            <Mail size={16} /> support@aclanalyzer.com
          </p>

          <p>
            <Phone size={16} /> +91 9876543210
          </p>

          <p>
            <MapPin size={16} /> Karnataka, India
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 ACL Analyzer. All Rights Reserved.
      </div>
    </footer>
  );
}