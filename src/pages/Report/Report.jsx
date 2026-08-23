import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  Download,
  ArrowLeft,
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Dumbbell,
  HeartPulse,
  Clock,
  Video,
  UploadCloud,
} from "lucide-react";

import Layout from "../../components/layout/Layout";
import { useAnalysis } from "../../context/AnalysisContext";
import { getReportPdfUrl } from "../../services/api";
import "../../styles/dashboard.css";

export default function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { analysisResult, loadAnalysisById } = useAnalysis();
  const [data, setData] = useState(analysisResult);
  const [loading, setLoading] = useState(false);

  const queryId = searchParams.get("id");

  useEffect(() => {
    if (queryId) {
      setLoading(true);
      loadAnalysisById(queryId).then((res) => {
        if (res) {
          setData(res);
        }
        setLoading(false);
      });
      return;
    }

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
      console.error("Failed to parse analysisResult for report:", e);
    }
  }, [analysisResult, queryId, loadAnalysisById]);

  if (loading) {
    return (
      <Layout>
        <section className="dashboard">
          <div className="dashboard-header">
            <span>LOADING REPORT</span>
            <h1>Loading Analysis Report...</h1>
          </div>
        </section>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <section className="dashboard">
          <div className="dashboard-header">
            <span>ATHLETE REPORT</span>
            <h1>No Analysis Report Available</h1>
            <p>
              Please upload and analyze an athlete's movement video to generate
              a comprehensive biomechanical report.
            </p>
          </div>

          <div className="video-card" style={{ textAlign: "center", padding: "60px 20px" }}>
            <UploadCloud size={60} color="#2563EB" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ marginBottom: "15px" }}>Upload a Video to Begin</h2>
            <p style={{ color: "#64748B", marginBottom: "30px" }}>
              Our AI analyzes athlete kinematics and generates detailed reports.
            </p>
            <button
              className="export-btn"
              onClick={() => navigate("/upload")}
              style={{ margin: "0 auto" }}
            >
              Go to Upload
            </button>
          </div>
        </section>
      </Layout>
    );
  }

  const analysisId = data.analysis_id || "ACL_SESSION";
  const filename = data.filename || "athlete_video.mp4";
  const createdAt = data.created_at || new Date().toLocaleString();
  const frames = data.frames || 0;
  const fps = data.fps || 0;
  const duration = data.duration || 0;

  const risk = data.risk || {};
  const riskLabel = String(risk.risk_level || risk.label || risk.risk || "Low").toUpperCase();
  const isHighRisk = riskLabel.includes("HIGH") || riskLabel.includes("MODERATE");
  const riskScore = Math.round(risk.risk_score || risk.risk_percentage || 0);
  const confidence = Math.round(risk.confidence || 0);

  const features = data.landing_features?.knee_flexion != null
    ? data.landing_features
    : (data.features || {});

  const kneeFlexion = features.knee_flexion != null ? Math.round(features.knee_flexion) : "--";
  const kneeValgus = features.knee_valgus != null ? Math.round(features.knee_valgus) : "--";
  const hipFlexion = features.hip_flexion != null ? Math.round(features.hip_flexion) : "--";
  const trunkAngle = features.trunk_inclination != null ? Math.round(features.trunk_inclination) : "--";
  const ankleFlexion = features.ankle_dorsiflexion != null ? Math.round(features.ankle_dorsiflexion) : "--";
  const symmetry = features.landing_symmetry != null ? Math.round(features.landing_symmetry) : 50;

  const landing = data.landing || {};
  const landingFrame = landing.landing_frame || "--";
  const landingTime = landing.landing_timestamp != null ? `${landing.landing_timestamp} ms` : "--";
  const maxFlexion = landing.maximum_knee_flexion != null ? `${Math.round(landing.maximum_knee_flexion)}°` : "--";

  const handleDownloadPdf = () => {
    if (analysisId) {
      window.open(getReportPdfUrl(analysisId), "_blank");
    } else {
      window.print();
    }
  };

  return (
    <Layout>
      <section className="dashboard">

        <div className="dashboard-header">
          <span>ATHLETE BIOMECHANICAL REPORT</span>
          <h1>Comprehensive ACL Risk Analysis Report</h1>
          <p>
            Official AI-assisted kinematic analysis and injury risk screening
            report based on 3D joint tracking.
          </p>
        </div>

        {/* Action Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#EEF5FF",
              color: "#2563EB",
              border: "none",
              padding: "12px 20px",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div style={{ display: "flex", gap: "15px" }}>
            <button
              onClick={handleDownloadPdf}
              className="export-btn"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Download size={18} />
              Download PDF Report
            </button>
          </div>
        </div>

        {/* Session Metadata Card */}
        <div className="video-card" style={{ marginBottom: "35px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <FileText size={28} color="#2563EB" />
            <h2 style={{ fontSize: "24px" }}>Analysis Session Overview</h2>
          </div>

          <div className="video-info" style={{ marginTop: "0" }}>
            <div>
              <h4>Session ID</h4>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                {analysisId}
              </span>
            </div>

            <div>
              <h4>Date / Time</h4>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                {createdAt}
              </span>
            </div>

            <div>
              <h4>Video Source</h4>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                {filename}
              </span>
            </div>
          </div>

          <div className="video-info" style={{ marginTop: "15px" }}>
            <div>
              <h4>Total Frames</h4>
              <span>{frames}</span>
            </div>

            <div>
              <h4>Frame Rate</h4>
              <span>{fps} FPS</span>
            </div>

            <div>
              <h4>Video Duration</h4>
              <span>{duration} sec</span>
            </div>
          </div>
        </div>

        {/* Risk Banner & Cards */}
        <div className="dashboard-grid">
          <div className="video-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "15px" }}>
              <ShieldAlert size={36} color={isHighRisk ? "#DC2626" : "#16A34A"} />
              <div>
                <h4 style={{ color: "#64748B", fontSize: "15px" }}>Risk Classification</h4>
                <h1 style={{ fontSize: "36px", color: isHighRisk ? "#DC2626" : "#16A34A" }}>
                  {riskLabel} RISK
                </h1>
              </div>
            </div>
            <p style={{ color: "#64748B", lineHeight: "26px" }}>
              The machine learning risk model calculated an estimated ACL injury risk score
              of <b>{riskScore}%</b> with <b>{confidence}%</b> classification confidence.
            </p>
          </div>

          <RiskPanel />
        </div>

        {/* Biomechanical Kinematics Table / Metrics */}
        <div className="recommendation-panel" style={{ marginTop: "40px" }}>
          <h2>Landing Phase Kinematics</h2>
          <MetricsSection />

          <div className="video-info" style={{ marginTop: "25px" }}>
            <div>
              <h4>Trunk Inclination</h4>
              <span>{trunkAngle}°</span>
            </div>

            <div>
              <h4>Impact Landing Frame</h4>
              <span>Frame #{landingFrame}</span>
            </div>

            <div>
              <h4>Peak Knee Flexion</h4>
              <span>{maxFlexion}</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <ChartsSection />

        {/* Recommendations */}
        <RecommendationPanel />

        {/* Summary & Clinical Notice */}
        <AnalysisSummary />

        {/* Footer Actions */}
        <div className="dashboard-actions" style={{ marginTop: "40px" }}>
          <button
            onClick={handleDownloadPdf}
            className="export-btn"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Download size={18} />
            Download PDF Report
          </button>
        </div>

      </section>
    </Layout>
  );
}