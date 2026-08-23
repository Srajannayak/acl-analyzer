import { useNavigate } from "react-router-dom";
import {
  Activity,
  Brain,
  ShieldCheck,
  Target,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";

import Layout from "../../components/layout/Layout";
import "../../styles/dashboard.css";

export default function About() {
  const navigate = useNavigate();

  return (
    <Layout>
      <section className="dashboard">

        <div className="dashboard-header">
          <span>ABOUT ACL ANALYZER</span>
          <h1>AI-Assisted Biomechanical Risk Analysis</h1>
          <p>
            ACL Analyzer uses state-of-the-art computer vision, 33-point skeletal pose
            estimation, and machine learning to evaluate athlete movement kinematics and
            screen for non-contact anterior cruciate ligament (ACL) injury risk factors.
          </p>
        </div>

        {/* Core Pillars Grid */}
        <div className="dashboard-grid" style={{ marginBottom: "35px" }}>
          <div className="video-card">
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "15px" }}>
              <Brain size={32} color="#2563EB" />
              <h2 style={{ fontSize: "22px" }}>Computer Vision & Pose Tracking</h2>
            </div>
            <p style={{ color: "#64748B", lineHeight: "26px" }}>
              Our analysis pipeline processes standard 2D video at native frame rates without
              requiring wearable sensors or specialized motion-capture markers. Using Google
              MediaPipe Pose Landmarker models, the system tracks 33 full-body anatomical
              landmarks frame-by-frame with high spatial fidelity.
            </p>
          </div>

          <div className="video-card">
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "15px" }}>
              <Cpu size={32} color="#2563EB" />
              <h2 style={{ fontSize: "22px" }}>Biomechanical Kinematics</h2>
            </div>
            <p style={{ color: "#64748B", lineHeight: "26px" }}>
              During deceleration and landing phases, the pipeline calculates real-time 3D joint
              angles including knee flexion, dynamic knee valgus, hip flexion, trunk inclination,
              ankle dorsiflexion, and bilateral load symmetry.
            </p>
          </div>
        </div>

        {/* Biomechanical Risk Factors Panel */}
        <div className="recommendation-panel" style={{ marginTop: "10px", marginBottom: "35px" }}>
          <h2>Key Biomechanical Risk Factors Analyzed</h2>

          <div className="recommendation-list">
            <div className="recommendation-item success">
              <Target size={24} />
              <div>
                <h4>Dynamic Knee Valgus (Inward Knee Collapse)</h4>
                <p>
                  Excessive inward collapse of the knee joint in the frontal plane during landing
                  or cutting places substantial tensile strain on the anterior cruciate ligament.
                </p>
              </div>
            </div>

            <div className="recommendation-item success">
              <Activity size={24} />
              <div>
                <h4>Stiff Landing Patterns (Reduced Sagittal Flexion)</h4>
                <p>
                  Landing with an extended knee (&lt; 45° knee flexion) reduces soft-tissue energy
                  absorption, transmitting excessive ground reaction forces directly into the knee joint.
                </p>
              </div>
            </div>

            <div className="recommendation-item success">
              <TrendingUp size={24} />
              <div>
                <h4>Bilateral Landing Asymmetry</h4>
                <p>
                  Unequal load distribution between the left and right lower extremities during
                  bilateral landing tasks overloads the dominant or compromised limb.
                </p>
              </div>
            </div>

            <div className="recommendation-item success">
              <Layers size={24} />
              <div>
                <h4>Trunk Inclination & Neuromuscular Control</h4>
                <p>
                  Lateral and anterior trunk displacement alters the center of mass, exacerbating
                  knee abduction moments and dynamic valgus angles during rapid decelerations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Responsible AI Notice */}
        <div className="video-card" style={{ marginBottom: "40px", borderLeft: "6px solid #2563EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
            <ShieldCheck size={28} color="#2563EB" />
            <h2 style={{ fontSize: "20px" }}>Responsible AI & Scope of Use</h2>
          </div>
          <p style={{ color: "#64748B", lineHeight: "26px" }}>
            ACL Analyzer is designed as an AI-assisted movement screening and training support
            platform. It is intended for athletic trainers, coaches, and sports scientists to
            quantitatively monitor movement quality and target neuromuscular training. It does not
            provide medical diagnosis or guarantee injury prevention. Athletes with symptoms or
            suspected injuries should always seek comprehensive clinical evaluation by qualified
            medical professionals.
          </p>
        </div>

        {/* CTA */}
        <div className="dashboard-actions" style={{ marginTop: "20px" }}>
          <button
            onClick={() => navigate("/upload")}
            className="export-btn"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            Start Athlete Analysis
            <ArrowRight size={18} />
          </button>
        </div>

      </section>
    </Layout>
  );
}