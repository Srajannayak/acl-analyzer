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
} from "lucide-react";

import Layout from "../../components/layout/Layout";
import VideoPanel from "../../components/visualization/VideoPanel";
import RiskPanel from "../../components/visualization/RiskPanel";
import AclRiskHeatmap from "../../components/visualization/AclRiskHeatmap";
import MovementScoreRadar from "../../components/visualization/MovementScoreRadar";
import JointRiskBreakdown from "../../components/visualization/JointRiskBreakdown";
import MovementQuality from "../../components/visualization/MovementQuality";
import MetricsSection from "../../components/visualization/MetricsSection";
import ChartsSection from "../../components/visualization/ChartsSection";
import RecommendationPanel from "../../components/visualization/RecommendationPanel";
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
        <div className="dashboard-header">
          <span>AI BIOMECHANICAL ANALYSIS</span>
          <h1>Athlete Kinematic Intelligence Dashboard</h1>
          <p>
            Computer vision 3D pose estimation, landing-frame risk heatmap, dynamic joint kinematics, and machine-learning ACL injury risk prediction.
          </p>
        </div>

        {!data ? (
          <div className="athlete-overview-card" style={{ justifyContent: "center", textAlign: "center", padding: "60px 20px" }}>
            <div>
              <UploadCloud size={60} color="#2563EB" style={{ margin: "0 auto 20px" }} />
              <h2 style={{ marginBottom: "12px", fontSize: "24px" }}>No Analysis Session Active</h2>
              <p style={{ color: "#64748B", marginBottom: "26px", maxWidth: "500px" }}>
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
            <div className="athlete-overview-card">
              <div className="overview-left">
                <div className="overview-avatar">
                  <Video size={26} />
                </div>
                <div className="overview-details">
                  <h3>{filename}</h3>
                  <div className="overview-meta">
                    <span><b>Session ID:</b> {analysisId}</span>
                    <span>•</span>
                    <span><b>Frames Analyzed:</b> {data.frames ?? data.total_frames ?? "--"}</span>
                    <span>•</span>
                    <span><b>Status:</b> Completed</span>
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

            {/* SECTION 1: Full Video MediaPipe Pose Analysis ("HOW THE AI TRACKED THE ATHLETE") */}
            <div className="dashboard-grid">
              <VideoPanel />
              <RiskPanel />
            </div>

            {/* SECTION 2: Dedicated Biomechanical ACL Risk Heatmap ("WHERE AND HOW IS THE ATHLETE AT RISK?") */}
            <AclRiskHeatmap />

            {/* Movement Quality Score, Radar Profile, & Phases */}
            <MovementScoreRadar />

            {/* Bilateral Left vs Right Symmetry Breakdown */}
            <JointRiskBreakdown />

            {/* Movement Quality Assessment */}
            <MovementQuality />

            {/* 6 Biomechanical Kinematics Cards */}
            <MetricsSection />

            {/* Dynamic Joint Angle Charts */}
            <ChartsSection />

            {/* AI Performance Recommendations */}
            <RecommendationPanel />

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