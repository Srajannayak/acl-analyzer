import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  History as HistoryIcon,
  Video,
  Calendar,
  ShieldAlert,
  ArrowRight,
  FileText,
  Download,
  Trash2,
  UploadCloud,
  Search,
  Filter,
} from "lucide-react";

import Layout from "../../components/layout/Layout";
import CompareAnalyses from "../../components/visualization/CompareAnalyses";
import { useAnalysis } from "../../context/AnalysisContext";
import { fetchHistory, deleteAnalysisById, getReportPdfUrl } from "../../services/api";
import "../../styles/dashboard.css";

export default function History() {
  const navigate = useNavigate();
  const { setAnalysisResult } = useAnalysis();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await fetchHistory();
      if (res && res.success && Array.isArray(res.history)) {
        setHistoryList(res.history);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleViewDashboard = (item) => {
    setAnalysisResult(item);
    sessionStorage.setItem("analysisResult", JSON.stringify(item));
    navigate("/dashboard");
  };

  const handleViewReport = (item) => {
    setAnalysisResult(item);
    sessionStorage.setItem("analysisResult", JSON.stringify(item));
    navigate(`/report?id=${item.analysis_id}`);
  };

  const handleDelete = async (e, analysisId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this analysis record?")) {
      try {
        await deleteAnalysisById(analysisId);
        setHistoryList((prev) => prev.filter((item) => item.analysis_id !== analysisId));
      } catch (err) {
        console.error("Failed to delete analysis:", err);
      }
    }
  };

  // Filter history records
  const filteredList = historyList.filter((item) => {
    const filename = (item.filename || "").toLowerCase();
    const id = (item.analysis_id || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = filename.includes(query) || id.includes(query);

    const riskLabel = String(item.risk?.risk_level || item.risk?.label || item.risk?.risk || "").toLowerCase();
    const matchesFilter =
      riskFilter === "all" ||
      (riskFilter === "high" && riskLabel.includes("high")) ||
      (riskFilter === "moderate" && riskLabel.includes("mod")) ||
      (riskFilter === "low" && riskLabel.includes("low"));

    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <section className="dashboard">
        <div className="dashboard-header">
          <span>ATHLETE ARCHIVE</span>
          <h1>Movement Analysis History</h1>
          <p>
            Historical record of athlete 3D kinematics, AI risk classifications, and downloadable performance reports.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "white",
              padding: "10px 18px",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              width: "100%",
              maxWidth: "380px",
            }}
          >
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search by video name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: "14px",
                width: "100%",
                color: "#0F172A",
              }}
            />
          </div>

          {/* Risk Level Filter Chips */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Sessions" },
              { id: "high", label: "High Risk" },
              { id: "moderate", label: "Moderate Risk" },
              { id: "low", label: "Low Risk" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setRiskFilter(f.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "1px solid",
                  borderColor: riskFilter === f.id ? "#2563EB" : "#E2E8F0",
                  background: riskFilter === f.id ? "#2563EB" : "white",
                  color: riskFilter === f.id ? "white" : "#64748B",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="athlete-overview-card" style={{ textAlign: "center", justifyContent: "center", padding: "60px" }}>
            <h2>Loading Athlete History...</h2>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="athlete-overview-card" style={{ textAlign: "center", justifyContent: "center", padding: "60px 20px" }}>
            <div>
              <HistoryIcon size={60} color="#2563EB" style={{ margin: "0 auto 20px" }} />
              <h2 style={{ marginBottom: "12px", fontSize: "22px" }}>
                {historyList.length === 0 ? "No Analysis Records Found" : "No Matching Sessions"}
              </h2>
              <p style={{ color: "#64748B", marginBottom: "26px" }}>
                {historyList.length === 0
                  ? "Upload and analyze an athlete's movement video to start building your evaluation archive."
                  : "Try clearing your search query or changing the risk level filter."}
              </p>
              {historyList.length === 0 && (
                <button
                  className="export-btn"
                  onClick={() => navigate("/upload")}
                  style={{ margin: "0 auto" }}
                >
                  Upload Video
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredList.map((item) => {
              const analysisId = item.analysis_id || "ACL_SESSION";
              const filename = item.filename || "athlete_movement.mp4";
              const dateStr = item.created_at || "Recent";
              const risk = item.risk || {};
              const riskLabel = String(risk.risk_level || risk.label || risk.risk || "Low").toUpperCase();
              const isHigh = riskLabel.includes("HIGH");
              const isModerate = riskLabel.includes("MODERATE");
              const riskScore = Math.round(risk.risk_score || risk.risk_percentage || 0);

              const features = item.landing_features?.knee_flexion != null
                ? item.landing_features
                : (item.features || {});

              const valgus = features.knee_valgus != null ? `${Math.round(features.knee_valgus)}°` : "--";
              const symmetry = features.landing_symmetry != null ? `${Math.round(features.landing_symmetry)}%` : "--";
              const flexion = features.knee_flexion != null ? `${Math.round(features.knee_flexion)}°` : "--";

              const badgeBg = isHigh ? "#FEF2F2" : isModerate ? "#FFFBEB" : "#ECFDF5";
              const badgeColor = isHigh ? "#DC2626" : isModerate ? "#D97706" : "#059669";
              const badgeBorder = isHigh ? "#FECACA" : isModerate ? "#FDE68A" : "#A7F3D0";

              return (
                <div
                  key={analysisId}
                  className="athlete-overview-card"
                  style={{ cursor: "pointer", padding: "20px 26px" }}
                  onClick={() => handleViewDashboard(item)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                    <div className="overview-avatar">
                      <Video size={24} />
                    </div>

                    <div>
                      <h3 style={{ fontSize: "18px", marginBottom: "4px", color: "#0F172A" }}>
                        {filename}
                      </h3>
                      <div style={{ display: "flex", gap: "14px", color: "#64748B", fontSize: "13px", flexWrap: "wrap" }}>
                        <span><b>ID:</b> {analysisId}</span>
                        <span>•</span>
                        <span><b>Valgus:</b> {valgus}</span>
                        <span>•</span>
                        <span><b>Flexion:</b> {flexion}</span>
                        <span>•</span>
                        <span><b>Symmetry:</b> {symmetry}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div
                      style={{
                        background: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeBorder}`,
                        padding: "8px 18px",
                        borderRadius: "50px",
                        fontWeight: "700",
                        fontSize: "13px",
                      }}
                    >
                      {riskLabel} ({riskScore}%)
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewReport(item);
                      }}
                      style={{
                        background: "#EEF5FF",
                        color: "#2563EB",
                        border: "none",
                        padding: "9px 16px",
                        borderRadius: "10px",
                        fontWeight: "600",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <FileText size={15} />
                      Report
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(getReportPdfUrl(analysisId), "_blank");
                      }}
                      style={{
                        background: "#EEF5FF",
                        color: "#2563EB",
                        border: "none",
                        padding: "9px 14px",
                        borderRadius: "10px",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                      title="Download PDF Report"
                    >
                      <Download size={15} />
                    </button>

                    <button
                      onClick={(e) => handleDelete(e, analysisId)}
                      style={{
                        background: "#FEF2F2",
                        color: "#DC2626",
                        border: "none",
                        padding: "9px 12px",
                        borderRadius: "10px",
                        cursor: "pointer",
                      }}
                      title="Delete Session"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Feature 12 & 13: Compare Analyses & Longitudinal Trend */}
        {!loading && historyList.length >= 2 && (
          <CompareAnalyses historyList={historyList} />
        )}
      </section>
    </Layout>
  );
}