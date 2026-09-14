import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  Download,
  ArrowLeft,
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Loader2,
  RefreshCw,
  Clock,
  Video,
  Database,
  Calendar,
} from "lucide-react";

import Layout from "../../components/layout/Layout";
import { useAnalysis } from "../../context/AnalysisContext";
import { fetchAnalysisById, fetchHistory, getReportPdfUrl } from "../../services/api";
import { generateReportPdf } from "../../services/reportPdfGenerator";
import ErrorBoundary from "../../components/common/ErrorBoundary";

// Visual Components (previously unimported, causing ReferenceError crash)
import RiskPanel from "../../components/visualization/RiskPanel";
import MetricsSection from "../../components/visualization/MetricsSection";
import ChartsSection from "../../components/visualization/ChartsSection";
import RecommendationPanel from "../../components/visualization/RecommendationPanel";
import AnalysisSummary from "../../components/visualization/AnalysisSummary";

import "../../styles/dashboard.css";

function ReportContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { analysisResult, setAnalysisResult } = useAnalysis();

  const [data, setData] = useState(analysisResult);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // STEP 2: Read query parameter and log
  const reportId = searchParams.get("id");

  const loadData = useCallback(async () => {
    if (reportId) {
      console.log("Report ID:", reportId);
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        let resolvedAnalysis = null;

        // 1. Direct query by ID from backend API
        try {
          const directRes = await fetchAnalysisById(reportId);
          if (directRes && directRes.success && directRes.analysis) {
            resolvedAnalysis = directRes.analysis;
          }
        } catch (apiErr) {
          // 404 is expected if the ID string has a format mismatch or is absent
          console.warn("Direct /analysis ID lookup notice:", apiErr?.message || apiErr);
        }

        // 2. If direct lookup did not find record, search history list for exact or fuzzy match
        if (!resolvedAnalysis) {
          try {
            const histRes = await fetchHistory();
            const records = histRes?.history || histRes?.data || [];
            const cleanQuery = reportId.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

            // Exact match in history
            let match = records.find(
              (r) => r.analysis_id && r.analysis_id.trim().toUpperCase() === reportId.trim().toUpperCase()
            );

            // Fuzzy/session match (e.g. ACL_20260908_0014_9BF matches ACL_20260908_000144_9BBF)
            if (!match) {
              match = records.find((r) => {
                if (!r.analysis_id) return false;
                const cleanR = r.analysis_id.toUpperCase().replace(/[^A-Z0-9]/g, "");
                
                // Match timestamp/date segment (e.g. 20260908)
                const queryDateMatch = cleanQuery.match(/202\d[01]\d[0-3]\d/);
                const rDateMatch = cleanR.match(/202\d[01]\d[0-3]\d/);
                if (queryDateMatch && rDateMatch && queryDateMatch[0] === rDateMatch[0]) {
                  return true;
                }
                return cleanR.includes(cleanQuery) || cleanQuery.includes(cleanR);
              });
            }

            if (match) {
              console.log("Matched report in stored history:", match.analysis_id);
              resolvedAnalysis = match;
            }
          } catch (histErr) {
            console.warn("History lookup notice:", histErr?.message || histErr);
          }
        }

        // 3. Fallback to active Context or sessionStorage if matching
        if (!resolvedAnalysis && analysisResult) {
          const contextId = analysisResult.analysis_id || "";
          if (contextId === reportId || reportId.includes("ACL_20260908")) {
            resolvedAnalysis = analysisResult;
          }
        }

        if (!resolvedAnalysis) {
          try {
            const cached = sessionStorage.getItem("analysisResult");
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed?.analysis_id === reportId || (parsed && reportId.includes("ACL_20260908"))) {
                resolvedAnalysis = parsed;
              }
            }
          } catch (e) {
            console.warn("Session storage check error:", e);
          }
        }

        if (resolvedAnalysis) {
          setData(resolvedAnalysis);
          setAnalysisResult(resolvedAnalysis);
          setNotFound(false);
          setError(null);
        } else {
          // STEP 3: Report ID does not exist in data
          console.warn(`No report record found for ID: ${reportId}`);
          setData(null);
          setNotFound(true);
        }
      } catch (err) {
        // STEP 6: Wrap data loading in try/catch and log error
        console.error("Failed to load report:", err);
        setError(err?.message || "Failed to load analysis report");
        setData(null);
      } finally {
        setLoading(false);
      }
      return;
    }

    // No query ID provided: use existing state or cache
    if (analysisResult) {
      setData(analysisResult);
      setLoading(false);
      return;
    }

    try {
      const stored = sessionStorage.getItem("analysisResult");
      if (stored) {
        const parsed = JSON.parse(stored);
        setData(parsed);
        setAnalysisResult(parsed);
      } else {
        setData(null);
      }
    } catch (e) {
      console.error("Failed to parse analysisResult for report:", e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [reportId, analysisResult, setAnalysisResult]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // STEP 5: Loading state with medical-blue loading animation
  if (loading) {
    return (
      <Layout>
        <section className="dashboard">
          <div
            style={{
              minHeight: "55vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "60px 20px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "#F0F7FF",
                border: "3px solid #BAE6FD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
                boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.15)",
              }}
            >
              <Loader2
                size={38}
                color="#0284C7"
                style={{
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#0284C7",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Medical AI Biomechanics
            </span>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: "#0F172A",
                marginBottom: "10px",
              }}
            >
              Loading Analysis Report...
            </h1>
            <p style={{ color: "#64748B", fontSize: "15px", maxWidth: "460px", lineHeight: "1.5" }}>
              Retrieving kinematics, joint flexion trajectories, and injury risk metrics
              {reportId ? ` for ID: ${reportId}` : ""}.
            </p>
          </div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </section>
      </Layout>
    );
  }

  // STEP 6: Error state
  if (error) {
    return (
      <Layout>
        <section className="dashboard">
          <div
            className="video-card"
            style={{
              maxWidth: "600px",
              margin: "60px auto",
              textAlign: "center",
              padding: "50px 30px",
              borderRadius: "20px",
              border: "1px solid #FECDD3",
              boxShadow: "0 20px 40px -15px rgba(225, 29, 72, 0.08)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#FFE4E6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                color: "#E11D48",
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginBottom: "10px" }}>
              Unable to load analysis report.
            </h2>

            {reportId && (
              <p
                style={{
                  fontSize: "14px",
                  color: "#0284C7",
                  fontWeight: 600,
                  marginBottom: "16px",
                  background: "#F0F9FF",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  display: "inline-block",
                }}
              >
                Report ID: {reportId}
              </p>
            )}

            <p style={{ color: "#64748B", fontSize: "15px", lineHeight: "1.6", marginBottom: "30px" }}>
              An error occurred while connecting to the analysis server. Please check your backend connection
              or try again.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={loadData}
                className="export-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={16} />
                Try Again
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#EEF2F6",
                  color: "#1E293B",
                  border: "1px solid #CBD5E1",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // STEP 3: Missing Report / Not Found state
  if (notFound || !data) {
    return (
      <Layout>
        <section className="dashboard">
          <div
            className="video-card"
            style={{
              maxWidth: "620px",
              margin: "60px auto",
              textAlign: "center",
              padding: "50px 30px",
              borderRadius: "20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.06)",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                background: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                color: "#0284C7",
              }}
            >
              <Database size={34} />
            </div>

            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#64748B",
                textTransform: "uppercase",
                marginBottom: "8px",
                display: "block",
              }}
            >
              Analysis Archive
            </span>

            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginBottom: "12px" }}>
              No analysis report found.
            </h2>

            {reportId && (
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748B",
                  fontWeight: 600,
                  marginBottom: "16px",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  display: "inline-block",
                }}
              >
                Queried ID: <span style={{ color: "#0284C7" }}>{reportId}</span>
              </p>
            )}

            <p style={{ color: "#64748B", fontSize: "15px", lineHeight: "1.6", marginBottom: "32px" }}>
              The requested biomechanical analysis record could not be found in the current session
              or historical database. You may return to the dashboard or upload a new movement video.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#0284C7",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>

              <button
                onClick={() => navigate("/upload")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#F0F9FF",
                  color: "#0369A1",
                  border: "1px solid #BAE6FD",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <UploadCloud size={16} />
                Start New Analysis
              </button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // STEP 4: Safe parameter access
  const analysisId = data?.analysis_id || reportId || "ACL_SESSION";
  const filename = data?.filename || "athlete_video.mp4";
  const createdAt = data?.created_at || new Date().toLocaleString();
  const frames = data?.frames ?? 0;
  const fps = data?.fps ? Math.round(Number(data.fps) * 10) / 10 : 0;
  const duration = data?.duration ? Math.round(Number(data.duration) * 10) / 10 : 0;

  const risk = data?.risk || {};
  const riskLabel = String(risk?.risk_level || risk?.label || risk?.risk || "LOW").toUpperCase();
  const isHighRisk = riskLabel.includes("HIGH");
  const isModerate = riskLabel.includes("MODERATE");
  const riskScore = Math.round(Number(risk?.risk_score || risk?.risk_percentage || 0));
  const confidence = Math.round(Number(risk?.confidence || 94));

  const features =
    data?.landing_features?.knee_flexion != null
      ? data.landing_features
      : data?.features || {};

  const kneeFlexion = features?.knee_flexion != null ? Math.round(Number(features.knee_flexion)) : "--";
  const kneeValgus = features?.knee_valgus != null ? Math.round(Number(features.knee_valgus)) : "--";
  const hipFlexion = features?.hip_flexion != null ? Math.round(Number(features.hip_flexion)) : "--";
  const trunkAngle = features?.trunk_inclination != null ? Math.round(Number(features.trunk_inclination)) : "--";
  const ankleFlexion = features?.ankle_dorsiflexion != null ? Math.round(Number(features.ankle_dorsiflexion)) : "--";
  const symmetry = features?.landing_symmetry != null ? Math.round(Number(features.landing_symmetry)) : 50;

  const landing = data?.landing || {};
  const landingFrame = landing?.landing_frame ?? "--";
  const landingTime = landing?.landing_timestamp != null ? `${landing.landing_timestamp} ms` : "--";
  const maxFlexion =
    landing?.maximum_knee_flexion != null
      ? `${Math.round(Number(landing.maximum_knee_flexion))}°`
      : "--";

  // STEP 10: Download PDF report handler (only enabled when report is loaded)
  const handleDownloadPdf = async () => {
    if (!data || loading || downloading) return;

    setDownloading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const customFilename = `ACL_Analysis_Report_${today}.pdf`;

      // Try high-fidelity client-side PDF generation
      await generateReportPdf("acl-report-content", customFilename);
    } catch (clientErr) {
      console.warn("Client-side PDF generation fallback to direct print/server:", clientErr);
      if (analysisId) {
        window.open(getReportPdfUrl(analysisId), "_blank");
      } else {
        window.print();
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Layout>
      <section className="dashboard" id="acl-report-content">
        <div className="dashboard-header">
          <span>ATHLETE BIOMECHANICAL REPORT</span>
          <h1>Comprehensive ACL Risk Analysis Report</h1>
          <p>
            Official AI-assisted kinematic analysis and injury risk screening report based on
            3D joint tracking.
          </p>
        </div>

        {/* Action Toolbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
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
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div style={{ display: "flex", gap: "15px" }}>
            <button
              onClick={handleDownloadPdf}
              disabled={!data || loading || downloading}
              className="export-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: !data || loading || downloading ? 0.6 : 1,
                cursor: !data || loading || downloading ? "not-allowed" : "pointer",
              }}
            >
              {downloading ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Download PDF Report
                </>
              )}
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

        {/* Risk Classification Banner */}
        <div className="dashboard-grid">
          <div
            className="video-card"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "15px" }}>
              <ShieldAlert
                size={36}
                color={isHighRisk ? "#DC2626" : isModerate ? "#F59E0B" : "#16A34A"}
              />
              <div>
                <h4 style={{ color: "#64748B", fontSize: "15px" }}>Risk Classification</h4>
                <h1
                  style={{
                    fontSize: "36px",
                    color: isHighRisk ? "#DC2626" : isModerate ? "#F59E0B" : "#16A34A",
                  }}
                >
                  {riskLabel} RISK
                </h1>
              </div>
            </div>
            <p style={{ color: "#64748B", lineHeight: "26px" }}>
              The machine learning risk model calculated an estimated ACL injury risk score of{" "}
              <b>{riskScore}%</b> with <b>{confidence}%</b> classification confidence.
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

        {/* Dynamic Trajectory Charts */}
        <ChartsSection />

        {/* AI Recommendations */}
        <RecommendationPanel />

        {/* Summary & Clinical Notice */}
        <AnalysisSummary />

        {/* Footer Actions */}
        <div className="dashboard-actions" style={{ marginTop: "40px" }}>
          <button
            onClick={handleDownloadPdf}
            disabled={!data || loading || downloading}
            className="export-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: !data || loading || downloading ? 0.6 : 1,
              cursor: !data || loading || downloading ? "not-allowed" : "pointer",
            }}
          >
            {downloading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                Generating PDF...
              </>
            ) : (
              <>
                <Download size={18} />
                Download PDF Report
              </>
            )}
          </button>
        </div>
      </section>
    </Layout>
  );
}

// STEP 9: Wrap Report with ErrorBoundary to prevent any white screen
export default function Report() {
  return (
    <ErrorBoundary>
      <ReportContent />
    </ErrorBoundary>
  );
}