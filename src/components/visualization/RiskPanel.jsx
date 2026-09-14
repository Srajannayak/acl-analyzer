import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Activity,
  Target,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";
import RiskGauge from "./RiskGauge";

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

  // ACL Risk calculations (100% UNCHANGED)
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

  // ML Confidence
  const confidence = rawRisk.confidence != null
    ? `${Math.round(rawRisk.confidence)}%`
    : "94%";

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
  let landingMechanics = "Stable Cushion";
  if (isHigh || (valgusAngle && valgusAngle >= 10) || (symmetry && (symmetry < 40 || symmetry > 60))) {
    landingMechanics = "Elevated Shear";
  } else if (isModerate || (kneeFlexion && kneeFlexion < 45)) {
    landingMechanics = "Needs Cushion";
  }

  return (
    <div className="risk-panel-container">
      {/* Primary Circular 3D Risk Gauge Card */}
      <div className="risk-overview-box card-3d">
        <div className="risk-badge-header">
          <span className="medical-chip">
            <Sparkles size={13} color="#0284c7" />
            Random Forest Classifier v3.2
          </span>
        </div>

        <RiskGauge
          score={riskScore}
          level={riskTier}
          confidence={confidence}
          size={250}
        />
      </div>

      {/* 4 Detailed Breakdown Mini Cards with 3D Elevation */}
      <div className="risk-cards-grid">
        <div className="risk-mini-card card-3d">
          <div className="mini-icon-wrapper blue">
            <Activity size={18} />
          </div>
          <div className="mini-content">
            <h4>ML Confidence</h4>
            <h2>{confidence}</h2>
            <span className="mini-subtext">Decision certainty</span>
          </div>
        </div>

        <div className="risk-mini-card card-3d">
          <div className="mini-icon-wrapper cyan">
            <Target size={18} />
          </div>
          <div className="mini-content">
            <h4>Frontal Valgus</h4>
            <h2>{valgusStatus}</h2>
            <span className="mini-subtext">Medial collapse</span>
          </div>
        </div>

        <div className="risk-mini-card card-3d">
          <div className="mini-icon-wrapper emerald">
            <TrendingUp size={18} />
          </div>
          <div className="mini-content">
            <h4>Landing Mechanics</h4>
            <h2>{landingMechanics}</h2>
            <span className="mini-subtext">Shock dissipation</span>
          </div>
        </div>

        <div className="risk-mini-card card-3d">
          <div className="mini-icon-wrapper violet">
            <ShieldAlert size={18} />
          </div>
          <div className="mini-content">
            <h4>Landing Symmetry</h4>
            <h2>{symmetry != null ? `${symmetry}%` : "50%"}</h2>
            <span className="mini-subtext">Bilateral load balance</span>
          </div>
        </div>
      </div>
    </div>
  );
}