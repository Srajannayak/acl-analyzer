import { useEffect, useState } from "react";
import { FileText, ShieldAlert } from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function AnalysisSummary() {
  const { analysisResult } = useAnalysis();
  const [videoData, setVideoData] = useState(analysisResult);

  useEffect(() => {
    if (analysisResult) {
      setVideoData(analysisResult);
      return;
    }

    try {
      const stored = sessionStorage.getItem("analysisResult");
      if (stored) {
        setVideoData(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse analysisResult for summary:", e);
    }
  }, [analysisResult]);

  const riskRaw = videoData?.risk?.risk_level || videoData?.risk?.label || videoData?.risk?.risk || "Low";
  const riskLabel = String(riskRaw).toUpperCase();
  const isHighRisk = riskLabel.includes("HIGH");
  const isModerate = riskLabel.includes("MODERATE");

  const riskScore = Math.round(videoData?.risk?.risk_score || videoData?.risk?.risk_percentage || 0);

  const confidence = videoData?.risk?.confidence != null
    ? `${Math.round(videoData.risk.confidence)}%`
    : "N/A";

  const features = videoData?.landing_features?.knee_flexion != null
    ? videoData.landing_features
    : (videoData?.features || {});

  const valgus = features.knee_valgus != null ? Math.round(features.knee_valgus) : null;
  const symmetry = features.landing_symmetry != null ? Math.round(features.landing_symmetry) : null;
  const kneeFlexion = features.knee_flexion != null ? Math.round(features.knee_flexion) : null;

  // Primary Clinical Focus
  let primaryFocus = "Routine Maintenance";
  if (isHighRisk || (valgus != null && valgus >= 10)) {
    primaryFocus = "Frontal Valgus & Hip Abductor Stabilization";
  } else if (kneeFlexion != null && kneeFlexion < 45) {
    primaryFocus = "Soft Landing & Sagittal Absorption Drills";
  } else if (symmetry != null && (symmetry < 42 || symmetry > 58)) {
    primaryFocus = "Bilateral Ground Reaction Equalization";
  } else if (isModerate) {
    primaryFocus = "Neuromuscular Control & Deceleration Technique";
  }

  // Summary Text
  let summaryParagraph = videoData?.analysis_summary?.summary_text;
  if (!summaryParagraph) {
    const findings = [];
    if (valgus != null && valgus >= 10) {
      findings.push(`elevated knee valgus (${valgus}°)`);
    }
    if (kneeFlexion != null && kneeFlexion < 45) {
      findings.push(`reduced sagittal knee flexion (${kneeFlexion}°)`);
    }
    if (symmetry != null && (symmetry < 42 || symmetry > 58)) {
      findings.push(`bilateral landing asymmetry (${symmetry}%)`);
    }

    const observations = findings.length > 0
      ? `Key kinematic flags include ${findings.join(" and ")} during the ground deceleration phase.`
      : "The athlete demonstrates well-aligned frontal plane knee stability and coordinated deceleration mechanics.";

    summaryParagraph = `The biomechanical evaluation indicates an overall ${riskRaw.toLowerCase()} ACL injury risk profile (${riskScore}% risk score, ${confidence} model confidence). ${observations}`;
  }

  return (
    <section className="analysis-summary-pro card-3d">
      <div className="section-title-wrapper">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="section-title-icon-box">
            <FileText size={22} color="#0284c7" />
          </div>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>
              Clinical Biomechanics Summary
            </h2>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
              Synthesized Movement Findings &amp; Clinical Insights
            </span>
          </div>
        </div>
      </div>

      <div className="summary-body" style={{ background: "#f8fafc", padding: "18px 22px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
        <p style={{ color: "#334155", lineHeight: "1.7", fontSize: "14.5px" }}>{summaryParagraph}</p>
      </div>

      <div className="summary-stats-row">
        <div className="summary-stat-box card-3d">
          <h4>Overall Classification</h4>
          <p style={{ color: isHighRisk ? "#ef4444" : isModerate ? "#f59e0b" : "#0284c7", fontWeight: 800 }}>
            {riskLabel} ({riskScore}%)
          </p>
        </div>

        <div className="summary-stat-box card-3d">
          <h4>Model Confidence</h4>
          <p style={{ color: "#0f172a", fontWeight: 800 }}>{confidence}</p>
        </div>

        <div className="summary-stat-box card-3d">
          <h4>Knee Valgus Impact</h4>
          <p style={{ color: "#0f172a", fontWeight: 800 }}>{valgus != null ? `${valgus}°` : "N/A"}</p>
        </div>

        <div className="summary-stat-box card-3d">
          <h4>Recommended Focus</h4>
          <p style={{ fontSize: "13px", color: "#0284c7", fontWeight: 700 }}>{primaryFocus}</p>
        </div>
      </div>

      <p className="disclaimer-text" style={{ marginTop: "18px", color: "#94a3b8", fontSize: "11.5px", lineHeight: "1.5" }}>
        * Notice: This AI biomechanical analysis provides objective computer-vision screening metrics for sports performance and injury risk evaluation. It is designed to assist clinical staff and does not substitute for clinical medical diagnosis.
      </p>
    </section>
  );
}