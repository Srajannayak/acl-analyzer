import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  Video,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Activity,
} from "lucide-react";

import Layout from "../../components/layout/Layout";
import VideoPanel from "../../components/visualization/VideoPanel";
import RiskPanel from "../../components/visualization/RiskPanel";
import LandingProblemMap from "../../components/visualization/LandingProblemMap";
import LandingComparison from "../../components/visualization/LandingComparison";
import AclRiskHeatmap from "../../components/visualization/AclRiskHeatmap";
import MovementScoreRadar from "../../components/visualization/MovementScoreRadar";
import JointRiskBreakdown from "../../components/visualization/JointRiskBreakdown";
import MovementQuality from "../../components/visualization/MovementQuality";
import MetricsSection from "../../components/visualization/MetricsSection";
import ChartsSection from "../../components/visualization/ChartsSection";
import RecommendationPanel from "../../components/visualization/RecommendationPanel";
import EducationalLanding from "../../components/visualization/EducationalLanding";
import AnalysisSummary from "../../components/visualization/AnalysisSummary";
import DataInspectorModal from "../../components/visualization/DataInspectorModal";
import { useAnalysis } from "../../context/AnalysisContext";

import "../../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { analysisResult } = useAnalysis();
  const [data, setData] = useState(analysisResult);

  useEffect(() => {
    if (analysisResult) {
      setData(analysisResult);
      return;
    }

    try {
      const stored = sessionStorage.getItem("analysisResult");
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse analysisResult for dashboard:", e);
    }
  }, [analysisResult]);

  const handleExportReport = () => {
    if (data?.analysis_id) {
      navigate(`/report?id=${data.analysis_id}`);
    } else {
      navigate("/report");
    }
  };

  // Top banner values
  const analysisId = data?.analysis_id || "ACL_SESSION";
  const filename = data?.filename || "athlete_movement.mp4";
  const rawRisk = data?.risk || {};
  const riskScore = Math.round(rawRisk.risk_score || rawRisk.risk_percentage || 0);
  const rawLabel = String(rawRisk.risk_level || rawRisk.label || rawRisk.risk || "LOW").toUpperCase();
  const isHigh = rawLabel.includes("HIGH") || riskScore > 60;
  const isModerate = rawLabel.includes("MODERATE") || (riskScore > 30 && riskScore <= 60);
  const pillClass = isHigh ? "high" : isModerate ? "moderate" : "low";
  const riskLabelText = isHigh ? "HIGH RISK" : isModerate ? "MODERATE RISK" : "LOW RISK";

  return (
    <Layout>
      <section className="dashboard">
        {/* DASHBOARD HERO SECTION */}
        <div className="dashboard-hero-section card-3d">
          <div className="hero-content-left">
            <div className="hero-badge-row">
              <span className="hero-medical-badge">
                <Sparkles size={14} color="#0284c7" />
                ACL ANALYZER
              </span>
              <span className="hero-version-badge">Clinical AI v3.2</span>
            </div>

            <h1 className="hero-headline">
              AI-Powered Landing Biomechanics &amp; ACL Risk Assessment
            </h1>

            <p className="hero-description">
              Computer vision 3D pose estimation, landing-frame risk heatmap, dynamic joint kinematics, and machine-learning ACL injury risk prediction.
            </p>

            <div className="hero-tech-pills">
              <span className="hero-pill">
                <Activity size={13} color="#0284c7" />
                MediaPipe 33-Point Pose
              </span>
              <span className="hero-pill">
                <ShieldAlert size={13} color="#0284c7" />
                Random Forest Classifier
              </span>
              <span className="hero-pill">
                <Calendar size={13} color="#0284c7" />
                Real-Time Kinematics
              </span>
            </div>
          </div>

          {/* Abstract Medical Biomechanical Visual Element */}
          <div className="hero-abstract-art" aria-hidden="true">
            <div className="abstract-glow-orb primary" />
            <div className="abstract-glow-orb cyan" />
            <div className="abstract-grid-pattern" />
          </div>
        </div>

        {!data ? (
          <div className="athlete-overview-card card-3d" style={{ justifyContent: "center", textAlign: "center", padding: "60px 20px" }}>
            <div>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "24px",
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  color: "#0284c7",
                }}
              >
                <UploadCloud size={44} />
              </div>
              <h2 style={{ marginBottom: "12px", fontSize: "24px", color: "#0f172a", fontWeight: 800 }}>
                No Analysis Session Active
              </h2>
              <p style={{ color: "#64748b", marginBottom: "26px", maxWidth: "520px", lineHeight: "1.6" }}>
                Upload an athlete landing or jump video to run automated pose tracking and generate real biomechanical analytics.
              </p>
              <button
                className="export-btn"
                onClick={() => navigate("/upload")}
                style={{ margin: "0 auto", display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                Upload Video
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Top Athlete Overview Banner */}
            <div className="athlete-overview-card card-3d">
              <div className="overview-left">
                <div className="overview-avatar">
                  <Video size={24} color="#0284c7" />
                </div>
                <div className="overview-details">
                  <h3>{filename}</h3>
                  <div className="overview-meta">
                    <span><b>Session ID:</b> {analysisId}</span>
                    <span>•</span>
                    <span><b>Frames Analyzed:</b> {data.frames ?? data.total_frames ?? "--"}</span>
                    <span>•</span>
                    <span className="overview-status-chip">
                      <span className="status-dot-active" />
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              <div className="overview-right">
                <div className={`risk-pill ${pillClass}`}>
                  <ShieldAlert size={18} />
                  <span>{riskLabelText} ({riskScore}%)</span>
                </div>
                <button
                  className="export-btn"
                  onClick={handleExportReport}
                  style={{ padding: "12px 24px", fontSize: "14px" }}
                >
                  <FileText size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                  View Report
                </button>
              </div>
            </div>

            {/* SECTION 1: Full Video MediaPipe Pose Analysis */}
            <div className="dashboard-grid">
              <VideoPanel />
              <RiskPanel />
            </div>

            {/* SECTION 2: Landing Problem Map & Kinematic Flaw Analysis */}
            <LandingProblemMap />

            {/* SECTION 3: Current vs Recommended Landing Mechanics */}
            <LandingComparison />

            {/* SECTION 4: Dedicated 3D Biomechanical ACL Risk Heatmap */}
            <AclRiskHeatmap />

            {/* 6 Biomechanical Kinematics Cards */}
            <MetricsSection />

            {/* Movement Quality Score, Radar Profile, & Phases */}
            <MovementScoreRadar />

            {/* Bilateral Left vs Right Symmetry Breakdown */}
            <JointRiskBreakdown />

            {/* Movement Quality Assessment */}
            <MovementQuality />

            {/* Dynamic Joint Angle Charts */}
            <ChartsSection />

            {/* AI Performance Recommendations */}
            <RecommendationPanel />

            {/* Understanding Your Landing - Educational Biomechanics Guide */}
            <EducationalLanding />

            {/* Clinical Biomechanics Summary */}
            <AnalysisSummary />

            {/* Raw Data Inspector & Export Data */}
            <DataInspectorModal />

            {/* Bottom Actions */}
            <div className="dashboard-actions">
              <button
                className="export-btn"
                onClick={handleExportReport}
              >
                <FileText size={18} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
                Export Full Biomechanical Report
              </button>
            </div>
          </>
        )}
      </section>
    </Layout>
  );
}