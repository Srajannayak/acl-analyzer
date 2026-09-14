import { useEffect, useState } from "react";
import {
  Activity,
  Crosshair,
  TrendingDown,
  Layers,
  Compass,
  Scale,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
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
      icon: Activity,
      iconColor: "#0284c7",
      value: kneeFlexion != null ? `${kneeFlexion}°` : "N/A",
      target: "Optimal: > 60° (Deep Cushion)",
      status: kneeFlexion == null ? "normal" : kneeFlexion >= 60 ? "optimal" : kneeFlexion >= 45 ? "attention" : "alert",
      statusText: kneeFlexion == null ? "Measured" : kneeFlexion >= 60 ? "Optimal Absorption" : kneeFlexion >= 45 ? "Moderate Flexion" : "Stiff Landing",
      gaugePct: kneeFlexion == null ? 50 : Math.min(100, Math.max(10, (kneeFlexion / 90) * 100)),
      gaugeColor: kneeFlexion == null ? "#0284c7" : kneeFlexion >= 60 ? "#0284c7" : kneeFlexion >= 45 ? "#f59e0b" : "#ef4444",
      benchmarks: "45° (Min) — 60° (Safe)",
    },
    {
      name: "Knee Valgus",
      icon: Crosshair,
      iconColor: "#0369a1",
      value: kneeValgus != null ? `${kneeValgus}°` : "N/A",
      target: "Optimal: < 5° (Neutral Alignment)",
      status: kneeValgus == null ? "normal" : kneeValgus < 6 ? "optimal" : kneeValgus < 12 ? "attention" : "alert",
      statusText: kneeValgus == null ? "Measured" : kneeValgus < 6 ? "Stable Alignment" : kneeValgus < 12 ? "Moderate Inward Collapse" : "High Valgus Risk",
      gaugePct: kneeValgus == null ? 30 : Math.min(100, Math.max(10, (kneeValgus / 20) * 100)),
      gaugeColor: kneeValgus == null ? "#0284c7" : kneeValgus < 6 ? "#0284c7" : kneeValgus < 12 ? "#f59e0b" : "#ef4444",
      benchmarks: "< 6° (Safe) — > 12° (Alert)",
    },
    {
      name: "Hip Flexion",
      icon: TrendingDown,
      iconColor: "#2563eb",
      value: hipFlexion != null ? `${hipFlexion}°` : "N/A",
      target: "Optimal: > 55° (Gluteal Loading)",
      status: hipFlexion == null ? "normal" : hipFlexion >= 55 ? "optimal" : "attention",
      statusText: hipFlexion == null ? "Measured" : hipFlexion >= 55 ? "Effective Hinge" : "Upright Hip Position",
      gaugePct: hipFlexion == null ? 50 : Math.min(100, Math.max(10, (hipFlexion / 90) * 100)),
      gaugeColor: hipFlexion == null ? "#0284c7" : hipFlexion >= 55 ? "#0284c7" : "#f59e0b",
      benchmarks: "> 55° Gluteal Cushion",
    },
    {
      name: "Trunk Inclination",
      icon: Layers,
      iconColor: "#0891b2",
      value: trunkInclination != null ? `${trunkInclination}°` : "N/A",
      target: "Target: 10° – 35° (Forward Lean)",
      status: trunkInclination == null ? "normal" : (trunkInclination >= 10 && trunkInclination <= 35) ? "optimal" : "attention",
      statusText: trunkInclination == null ? "Measured" : (trunkInclination >= 10 && trunkInclination <= 35) ? "Balanced Posture" : "Sub-optimal Trunk Lean",
      gaugePct: trunkInclination == null ? 50 : Math.min(100, Math.max(10, (trunkInclination / 45) * 100)),
      gaugeColor: trunkInclination == null ? "#0284c7" : (trunkInclination >= 10 && trunkInclination <= 35) ? "#0284c7" : "#f59e0b",
      benchmarks: "10° (Min) — 35° (Max Lean)",
    },
    {
      name: "Ankle Dorsiflexion",
      icon: Compass,
      iconColor: "#0284c7",
      value: ankleDorsiflexion != null ? `${ankleDorsiflexion}°` : "N/A",
      target: "Normal Range: 20° – 45°",
      status: ankleDorsiflexion == null ? "normal" : (ankleDorsiflexion >= 20 && ankleDorsiflexion <= 45) ? "optimal" : "attention",
      statusText: ankleDorsiflexion == null ? "Measured" : (ankleDorsiflexion >= 20 && ankleDorsiflexion <= 45) ? "Good Mobility" : "Limited Dorsiflexion",
      gaugePct: ankleDorsiflexion == null ? 50 : Math.min(100, Math.max(10, (ankleDorsiflexion / 50) * 100)),
      gaugeColor: ankleDorsiflexion == null ? "#0284c7" : (ankleDorsiflexion >= 20 && ankleDorsiflexion <= 45) ? "#0284c7" : "#f59e0b",
      benchmarks: "20° – 45° Deceleration",
    },
    {
      name: "Landing Symmetry",
      icon: Scale,
      iconColor: "#4f46e5",
      value: landingSymmetry != null ? `${landingSymmetry}%` : "N/A",
      target: "Target: 85% – 100% Balanced Load",
      status: landingSymmetry == null ? "normal" : (landingSymmetry >= 80 || (landingSymmetry >= 45 && landingSymmetry <= 55)) ? "optimal" : "attention",
      statusText: landingSymmetry == null ? "Measured" : (landingSymmetry >= 80 || (landingSymmetry >= 45 && landingSymmetry <= 55)) ? "Bilateral Balance" : "Load Asymmetry",
      gaugePct: landingSymmetry == null ? 85 : Math.min(100, Math.max(10, landingSymmetry)),
      gaugeColor: landingSymmetry == null ? "#0284c7" : (landingSymmetry >= 80 || (landingSymmetry >= 45 && landingSymmetry <= 55)) ? "#0284c7" : "#f59e0b",
      benchmarks: "85% – 100% Bilateral",
    },
  ];

  return (
    <section className="section-container">
      <div className="section-title-wrapper">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="section-title-icon-box">
            <Activity size={22} color="#0284c7" />
          </div>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>
              Biomechanical Kinematics
            </h2>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
              3D Multi-Joint Geometric Angles & Landing Mechanics
            </span>
          </div>
        </div>
      </div>

      <div className="metrics-grid-enhanced">
        {metricsConfig.map((metric, idx) => {
          const IconComp = metric.icon;
          return (
            <div className="metric-card-pro card-3d" key={idx}>
              <div className="metric-top">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    className="metric-icon-bubble"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "#f0f9ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: metric.iconColor,
                      border: "1px solid #e0f2fe",
                    }}
                  >
                    <IconComp size={18} />
                  </div>
                  <div>
                    <h3 className="metric-name">{metric.name}</h3>
                    <span className="metric-target">{metric.target}</span>
                  </div>
                </div>
                <span className={`metric-status-badge ${metric.status}`}>
                  {metric.statusText}
                </span>
              </div>

              <div className="metric-value-row">
                <span className="metric-value-large">{metric.value}</span>
              </div>

              {/* Mini Animated Progress Gauge */}
              <div className="metric-mini-gauge" style={{ marginTop: "14px" }}>
                <div
                  className="metric-gauge-track"
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "#f1f5f9",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    className="metric-gauge-fill"
                    style={{
                      width: `${metric.gaugePct}%`,
                      height: "100%",
                      background: metric.gaugeColor,
                      borderRadius: "9999px",
                      transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "#94a3b8",
                    fontWeight: 600,
                  }}
                >
                  <span>Scale</span>
                  <span>{metric.benchmarks}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}