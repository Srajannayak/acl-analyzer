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
    <section className="analysis-summary-pro">
      <div className="section-title-wrapper">
        <h2 className="section-title">
          <FileText size={24} color="#2563EB" />
          Clinical Biomechanics Summary
        </h2>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
          Synthesized Movement Findings
        </span>
      </div>

      <div className="summary-body">
        <p>{summaryParagraph}</p>
      </div>

      <div className="summary-stats-row">
        <div className="summary-stat-box">
          <h4>Overall Classification</h4>
          <p style={{ color: isHighRisk ? "#DC2626" : isModerate ? "#D97706" : "#059669" }}>
            {riskLabel} ({riskScore}%)
          </p>
        </div>

        <div className="summary-stat-box">
          <h4>Model Confidence</h4>
          <p>{confidence}</p>
        </div>

        <div className="summary-stat-box">
          <h4>Knee Valgus Impact</h4>
          <p>{valgus != null ? `${valgus}°` : "N/A"}</p>
        </div>

        <div className="summary-stat-box">
          <h4>Recommended Focus</h4>
          <p style={{ fontSize: "14px", color: "#2563EB" }}>{primaryFocus}</p>
        </div>
      </div>

      <p className="disclaimer-text">
        * Notice: This AI biomechanical analysis provides objective computer-vision screening metrics for coaches and athletic trainers. It does not constitute a medical diagnosis. Consult qualified sports medicine professionals for clinical injury management.
      </p>
    </section>
  );
}