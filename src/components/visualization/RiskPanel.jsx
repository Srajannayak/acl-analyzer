import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Activity,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function RiskPanel() {
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
      console.error("Failed to parse analysisResult:", e);
    }
  }, [analysisResult]);

  // ACL Risk calculations
  const rawRisk = videoData?.risk || {};
  const riskScore = rawRisk.risk_score != null
    ? Math.round(rawRisk.risk_score)
    : rawRisk.risk_percentage != null
    ? Math.round(rawRisk.risk_percentage)
    : 0;

  const rawLabel = String(rawRisk.risk_level || rawRisk.label || rawRisk.risk || "LOW").toUpperCase();
  const isHigh = rawLabel.includes("HIGH") || riskScore > 60;
  const isModerate = rawLabel.includes("MODERATE") || (riskScore > 30 && riskScore <= 60);

  const riskTier = isHigh ? "HIGH RISK" : isModerate ? "MODERATE RISK" : "LOW RISK";
  const tierClass = isHigh ? "high" : isModerate ? "moderate" : "low";

  // ML Confidence
  const confidence = rawRisk.confidence != null
    ? `${Math.round(rawRisk.confidence)}%`
    : "N/A";

  // Kinematics features
  const features = videoData?.landing_features?.knee_flexion != null
    ? videoData.landing_features
    : (videoData?.features || {});

  const valgusAngle = features.knee_valgus != null ? Math.round(features.knee_valgus) : null;
  const kneeFlexion = features.knee_flexion != null ? Math.round(features.knee_flexion) : null;
  const symmetry = features.landing_symmetry != null ? Math.round(features.landing_symmetry) : null;

  // Valgus Classification
  let valgusStatus = "Optimal (<5°)";
  if (valgusAngle != null) {
    if (valgusAngle >= 12) valgusStatus = `High (${valgusAngle}°)`;
    else if (valgusAngle >= 6) valgusStatus = `Moderate (${valgusAngle}°)`;
    else valgusStatus = `Low (${valgusAngle}°)`;
  }

  // Landing Mechanics Classification
  let landingMechanics = "Stable";
  if (isHigh || (valgusAngle && valgusAngle >= 10) || (symmetry && (symmetry < 40 || symmetry > 60))) {
    landingMechanics = "Elevated Risk";
  } else if (isModerate || (kneeFlexion && kneeFlexion < 45)) {
    landingMechanics = "Needs Focus";
  }

  return (
    <div className="risk-panel-container">
      {/* Primary Risk Overview Gauge */}
      <div className="risk-overview-box">
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          AI ACL Risk Assessment
        </h3>

        <div className="risk-score-display">
          <span className={`risk-score-number ${tierClass}`}>
            {riskScore}%
          </span>
          <span className={`risk-score-label ${tierClass}`}>
            {riskTier}
          </span>
        </div>

        {/* 3-Tier Risk Gauge */}
        <div className="risk-gauge-bar">
          <div className="gauge-segment low" style={{ opacity: !isModerate && !isHigh ? 1 : 0.4 }}></div>
          <div className="gauge-segment moderate" style={{ opacity: isModerate ? 1 : 0.4 }}></div>
          <div className="gauge-segment high" style={{ opacity: isHigh ? 1 : 0.4 }}></div>
        </div>
        <div className="gauge-labels">
          <span>0% Low</span>
          <span>31% Moderate</span>
          <span>61% - 100% High</span>
        </div>
      </div>

      {/* 4 Detailed Breakdown Mini Cards */}
      <div className="risk-cards-grid">
        <div className="risk-mini-card">
          <div className="mini-icon-wrapper">
            <Activity size={20} />
          </div>
          <h4>ML Confidence</h4>
          <h2>{confidence}</h2>
        </div>

        <div className="risk-mini-card">
          <div className="mini-icon-wrapper">
            <Target size={20} />
          </div>
          <h4>Frontal Valgus</h4>
          <h2>{valgusStatus}</h2>
        </div>

        <div className="risk-mini-card">
          <div className="mini-icon-wrapper">
            <TrendingUp size={20} />
          </div>
          <h4>Landing Stability</h4>
          <h2>{landingMechanics}</h2>
        </div>

        <div className="risk-mini-card">
          <div className="mini-icon-wrapper">
            <ShieldAlert size={20} />
          </div>
          <h4>Landing Symmetry</h4>
          <h2>{symmetry != null ? `${symmetry}%` : "N/A"}</h2>
        </div>
      </div>
    </div>
  );
}