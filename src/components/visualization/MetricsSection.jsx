import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function MetricsSection() {
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

  const features = videoData?.landing_features?.knee_flexion != null
    ? videoData.landing_features
    : (videoData?.features || {});

  const kneeFlexion = features.knee_flexion != null ? Math.round(features.knee_flexion) : null;
  const kneeValgus = features.knee_valgus != null ? Math.round(features.knee_valgus) : null;
  const hipFlexion = features.hip_flexion != null ? Math.round(features.hip_flexion) : null;
  const trunkInclination = features.trunk_inclination != null ? Math.round(features.trunk_inclination) : null;
  const ankleDorsiflexion = features.ankle_dorsiflexion != null ? Math.round(features.ankle_dorsiflexion) : null;
  const landingSymmetry = features.landing_symmetry != null ? Math.round(features.landing_symmetry) : null;

  const metricsConfig = [
    {
      name: "Knee Flexion",
      value: kneeFlexion != null ? `${kneeFlexion}°` : "N/A",
      target: "Optimal: > 60° (Deep Cushion)",
      status: kneeFlexion == null ? "normal" : kneeFlexion >= 60 ? "optimal" : kneeFlexion >= 45 ? "attention" : "alert",
      statusText: kneeFlexion == null ? "Measured" : kneeFlexion >= 60 ? "Optimal Absorption" : kneeFlexion >= 45 ? "Moderate Flexion" : "Stiff Landing",
    },
    {
      name: "Knee Valgus",
      value: kneeValgus != null ? `${kneeValgus}°` : "N/A",
      target: "Optimal: < 5° (Neutral Alignment)",
      status: kneeValgus == null ? "normal" : kneeValgus < 6 ? "optimal" : kneeValgus < 12 ? "attention" : "alert",
      statusText: kneeValgus == null ? "Measured" : kneeValgus < 6 ? "Stable Alignment" : kneeValgus < 12 ? "Moderate Inward Collapse" : "High Valgus Risk",
    },
    {
      name: "Hip Flexion",
      value: hipFlexion != null ? `${hipFlexion}°` : "N/A",
      target: "Optimal: > 60° (Gluteal Loading)",
      status: hipFlexion == null ? "normal" : hipFlexion >= 55 ? "optimal" : "attention",
      statusText: hipFlexion == null ? "Measured" : hipFlexion >= 55 ? "Effective Hinge" : "Upright Hip Position",
    },
    {
      name: "Trunk Inclination",
      value: trunkInclination != null ? `${trunkInclination}°` : "N/A",
      target: "Target: 10° – 35° (Forward Lean)",
      status: trunkInclination == null ? "normal" : (trunkInclination >= 10 && trunkInclination <= 35) ? "optimal" : "attention",
      statusText: trunkInclination == null ? "Measured" : (trunkInclination >= 10 && trunkInclination <= 35) ? "Balanced Posture" : "Sub-optimal Trunk Lean",
    },
    {
      name: "Ankle Dorsiflexion",
      value: ankleDorsiflexion != null ? `${ankleDorsiflexion}°` : "N/A",
      target: "Normal Range: 20° – 45°",
      status: ankleDorsiflexion == null ? "normal" : (ankleDorsiflexion >= 20 && ankleDorsiflexion <= 45) ? "optimal" : "attention",
      statusText: ankleDorsiflexion == null ? "Measured" : (ankleDorsiflexion >= 20 && ankleDorsiflexion <= 45) ? "Good Mobility" : "Limited Dorsiflexion",
    },
    {
      name: "Landing Symmetry",
      value: landingSymmetry != null ? `${landingSymmetry}%` : "N/A",
      target: "Target: 85% – 100% Balanced Load",
      status: landingSymmetry == null ? "normal" : (landingSymmetry >= 80 || (landingSymmetry >= 45 && landingSymmetry <= 55)) ? "optimal" : "attention",
      statusText: landingSymmetry == null ? "Measured" : (landingSymmetry >= 80 || (landingSymmetry >= 45 && landingSymmetry <= 55)) ? "Bilateral Balance" : "Load Asymmetry",
    },
  ];

  return (
    <section className="section-container">
      <div className="section-title-wrapper">
        <h2 className="section-title">
          <Activity size={24} color="#2563EB" />
          Biomechanical Kinematics
        </h2>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
          3D Multi-Joint Geometric Angles
        </span>
      </div>

      <div className="metrics-grid-enhanced">
        {metricsConfig.map((metric, idx) => (
          <div className="metric-card-pro" key={idx}>
            <div className="metric-top">
              <div>
                <h3 className="metric-name">{metric.name}</h3>
                <span className="metric-target">{metric.target}</span>
              </div>
              <span className={`metric-status-badge ${metric.status}`}>
                {metric.statusText}
              </span>
            </div>

            <div className="metric-value-row">
              <span className="metric-value-large">{metric.value}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}