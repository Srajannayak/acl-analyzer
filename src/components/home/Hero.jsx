import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Activity,
  ShieldAlert,
  Scale,
  TrendingDown,
  Layers,
  CheckCircle2,
  Video,
} from "lucide-react";
import "../../styles/hero.css";

export default function Hero() {
  const navigate = useNavigate();
  const [activeJointHover, setActiveJointHover] = useState(null);

  return (
    <section className="hero">
      <div className="hero-container">
        {/* LEFT COLUMN: Medical AI & Biomechanics Headline */}
        <div className="hero-left">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            <Sparkles size={14} color="#0284c7" />
            <span>ACL ANALYZER • BIOMECHANICAL ANALYSIS LAB</span>
          </div>

          <h1 className="hero-title">
            AI-Powered <span className="highlight-text">Biomechanical Landing</span> Analysis &amp; ACL Risk Prevention
          </h1>

          <p className="hero-subtitle">
            Advanced computer vision pose estimation, dynamic 3D joint kinematics, and machine-learning risk stratification to identify vulnerable landing movement patterns before injury occurs.
          </p>

          <div className="hero-cta-group">
            <button
              className="primary-cta-btn"
              onClick={() => navigate("/upload")}
              id="hero-start-analysis-btn"
            >
              <span>START ANALYSIS</span>
              <div className="btn-icon-wrapper">
                <ArrowRight size={18} />
              </div>
            </button>

            <button
              className="secondary-cta-btn"
              onClick={() => navigate("/dashboard")}
              id="hero-view-dashboard-btn"
            >
              <Video size={16} color="#0284c7" />
              <span>View Clinical Dashboard</span>
            </button>
          </div>

          <div className="hero-trust-bar">
            <div className="trust-item">
              <CheckCircle2 size={16} color="#0284c7" />
              <span>33-Point MediaPipe Pose</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={16} color="#0284c7" />
              <span>Calibrated Random Forest ML</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={16} color="#0284c7" />
              <span>Real-Time Joint Kinematics</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Pseudo-3D Athlete Landing Visualization */}
        <div className="hero-right">
          <div className="hero-viz-card">
            {/* Background Glow Orbs */}
            <div className="viz-glow-orb cyan" />
            <div className="viz-glow-orb blue" />

            {/* Central SVG Skeleton & Biomechanical Tracking Vectors */}
            <div className="viz-stage">
              <svg
                viewBox="0 0 460 420"
                className="hero-skeleton-svg"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="boneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                  <linearGradient id="dangerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <filter id="jointGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.6" />
                  </filter>
                  <filter id="dangerGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ef4444" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* Ground Impact Grid Lines */}
                <ellipse cx="230" cy="385" rx="160" ry="25" fill="none" stroke="#bae6fd" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
                <ellipse cx="230" cy="385" rx="100" ry="16" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                <line x1="70" y1="385" x2="390" y2="385" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5" />
                <text x="230" y="412" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontWeight="700" letterSpacing="0.08em">
                  IMPACT ABSORPTION PLANE
                </text>

                {/* Head */}
                <circle cx="230" cy="70" r="22" fill="#ffffff" stroke="#0284c7" strokeWidth="3.5" filter="url(#jointGlow)" />
                <circle cx="230" cy="70" r="14" fill="#e0f2fe" />

                {/* Spine / Torso Axis */}
                <line x1="230" y1="92" x2="230" y2="185" stroke="url(#boneGrad)" strokeWidth="8" strokeLinecap="round" />

                {/* Shoulders */}
                <line x1="165" y1="110" x2="295" y2="110" stroke="url(#boneGrad)" strokeWidth="6" strokeLinecap="round" />
                {/* Arms */}
                <line x1="165" y1="110" x2="135" y2="160" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                <line x1="135" y1="160" x2="120" y2="210" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                <line x1="295" y1="110" x2="325" y2="160" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                <line x1="325" y1="160" x2="340" y2="210" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />

                {/* Pelvic Axis */}
                <line x1="180" y1="185" x2="280" y2="185" stroke="#0369a1" strokeWidth="8" strokeLinecap="round" />

                {/* Left Thigh (Stiff angle) */}
                <line x1="180" y1="185" x2="165" y2="275" stroke="url(#dangerGrad)" strokeWidth="8" strokeLinecap="round" />
                {/* Left Shank */}
                <line x1="165" y1="275" x2="155" y2="370" stroke="url(#dangerGrad)" strokeWidth="7" strokeLinecap="round" />

                {/* Right Thigh */}
                <line x1="280" y1="185" x2="295" y2="275" stroke="url(#boneGrad)" strokeWidth="8" strokeLinecap="round" />
                {/* Right Shank */}
                <line x1="295" y1="275" x2="305" y2="370" stroke="url(#boneGrad)" strokeWidth="7" strokeLinecap="round" />

                {/* Feet */}
                <ellipse cx="150" cy="374" rx="20" ry="7" fill="#334155" />
                <ellipse cx="310" cy="374" rx="20" ry="7" fill="#334155" />

                {/* Joint Tracking Points */}
                {/* Shoulder Joints */}
                <circle cx="165" cy="110" r="6" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                <circle cx="295" cy="110" r="6" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />

                {/* Hip Joints */}
                <circle cx="180" cy="185" r="7" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />
                <circle cx="280" cy="185" r="7" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />

                {/* Left Knee (Vulnerable Joint Highlighted) */}
                <circle
                  cx="165"
                  cy="275"
                  r="10"
                  fill="#fee2e2"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                  filter="url(#dangerGlow)"
                  className="pulsing-joint"
                />
                <circle cx="165" cy="275" r="4" fill="#ef4444" />

                {/* Right Knee */}
                <circle cx="295" cy="275" r="8" fill="#ffffff" stroke="#0284c7" strokeWidth="3" filter="url(#jointGlow)" />

                {/* Ankles */}
                <circle cx="155" cy="370" r="6" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                <circle cx="305" cy="370" r="6" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />

                {/* Knee Kinematic Angle Indicator Arc */}
                <path
                  d="M 175,250 A 30 30 0 0 1 170,295"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeDasharray="3 3"
                />
                <text x="186" y="278" fill="#ef4444" fontSize="11" fontWeight="800">
                  θ = 16.5° (Stiff)
                </text>
              </svg>
            </div>

            {/* FLOATING INFORMATION CARDS (PROMPT SPECIFIED) */}
            {/* Card 1: POSE ESTIMATION */}
            <div className="floating-metric-card card-top-left">
              <div className="floating-icon-box primary">
                <Activity size={17} />
              </div>
              <div className="floating-metric-body">
                <span className="metric-label">POSE ESTIMATION</span>
                <span className="metric-val primary">33 Landmark Points</span>
                <span className="metric-status primary">Live Skeletal Tracking</span>
              </div>
            </div>

            {/* Card 2: BIOMECHANICAL ANALYSIS */}
            <div className="floating-metric-card card-top-right">
              <div className="floating-icon-box success">
                <Scale size={17} />
              </div>
              <div className="floating-metric-body">
                <span className="metric-label">BIOMECHANICAL ANALYSIS</span>
                <span className="metric-val success">Joint Motion Tracking</span>
                <span className="metric-status success">Kinematic Deceleration</span>
              </div>
            </div>

            {/* Card 3: ACL RISK ANALYSIS */}
            <div className="floating-metric-card card-bottom-right">
              <div className="floating-icon-box amber">
                <ShieldAlert size={17} />
              </div>
              <div className="floating-metric-body">
                <span className="metric-label">ACL RISK ANALYSIS</span>
                <span className="metric-val amber">AI Risk Assessment</span>
                <span className="metric-status amber">Random Forest Stratification</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}