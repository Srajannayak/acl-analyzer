import { useMemo } from "react";
import { Scale, Target, ShieldAlert, CheckCircle } from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function JointRiskBreakdown() {
  const { analysisResult } = useAnalysis();

  const features = useMemo(() => {
    return analysisResult?.landing_features?.knee_flexion != null
      ? analysisResult.landing_features
      : (analysisResult?.features || {});
  }, [analysisResult]);

  const lKneeFlex = features.left_knee_flexion ?? (features.knee_flexion != null ? features.knee_flexion : 0);
  const rKneeFlex = features.right_knee_flexion ?? (features.knee_flexion != null ? features.knee_flexion : 0);

  const lValgus = features.left_knee_valgus ?? (features.knee_valgus != null ? features.knee_valgus : 0);
  const rValgus = features.right_knee_valgus ?? (features.knee_valgus != null ? features.knee_valgus : 0);

  const lHipFlex = features.left_hip_flexion ?? (features.hip_flexion != null ? features.hip_flexion : 0);
  const rHipFlex = features.right_hip_flexion ?? (features.hip_flexion != null ? features.hip_flexion : 0);

  const lAnkle = features.left_ankle_dorsiflexion ?? (features.ankle_dorsiflexion != null ? features.ankle_dorsiflexion : 0);
  const rAnkle = features.right_ankle_dorsiflexion ?? (features.ankle_dorsiflexion != null ? features.ankle_dorsiflexion : 0);

  const symmetry = features.landing_symmetry != null ? Math.round(features.landing_symmetry) : 50;

  // Comparison metrics config
  const comparisons = [
    {
      name: "Knee Flexion (Shock Absorption)",
      left: Math.round(lKneeFlex),
      right: Math.round(rKneeFlex),
      unit: "°",
      max: 120,
      delta: Math.abs(Math.round(lKneeFlex - rKneeFlex)),
      desc: "Equal bilateral knee flexion ensures uniform force absorption.",
    },
    {
      name: "Knee Valgus (Inward Angle)",
      left: Math.round(lValgus),
      right: Math.round(rValgus),
      unit: "°",
      max: 25,
      delta: Math.abs(Math.round(lValgus - rValgus)),
      desc: "Unilateral valgus collapse creates uneven ACL ligament tension.",
    },
    {
      name: "Hip Flexion (Posterior Chain)",
      left: Math.round(lHipFlex),
      right: Math.round(rHipFlex),
      unit: "°",
      max: 110,
      delta: Math.abs(Math.round(lHipFlex - rHipFlex)),
      desc: "Deep hip hinge activates gluteal musculature to protect knees.",
    },
    {
      name: "Ankle Dorsiflexion",
      left: Math.round(lAnkle),
      right: Math.round(rAnkle),
      unit: "°",
      max: 60,
      delta: Math.abs(Math.round(lAnkle - rAnkle)),
      desc: "Ankle compliance helps absorb initial ground reaction impact.",
    },
  ];

  return (
    <section className="section-container">
      <div className="section-title-wrapper">
        <h2 className="section-title">
          <Scale size={24} color="#2563EB" />
          Bilateral Symmetry & Left vs Right Biomechanics
        </h2>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
          Bilateral Load Distribution (Symmetry: {symmetry}%)
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "18px" }}>
        {comparisons.map((c, idx) => (
          <div
            key={idx}
            className="athlete-overview-card"
            style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", margin: 0 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>{c.name}</h3>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "10px",
                  background: c.delta <= 4 ? "#ECFDF5" : "#FFFBEB",
                  color: c.delta <= 4 ? "#059669" : "#D97706",
                }}
              >
                Δ {c.delta}{c.unit} ({c.delta <= 4 ? "Symmetric" : "Asymmetric"})
              </span>
            </div>

            {/* Left vs Right Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Left Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px", color: "#475569" }}>
                  <span><b>Left Side</b></span>
                  <span><b>{c.left}{c.unit}</b></span>
                </div>
                <div style={{ height: "8px", background: "#E2E8F0", borderRadius: "6px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, (c.left / c.max) * 100)}%`,
                      background: "#2563EB",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              </div>

              {/* Right Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px", color: "#475569" }}>
                  <span><b>Right Side</b></span>
                  <span><b>{c.right}{c.unit}</b></span>
                </div>
                <div style={{ height: "8px", background: "#E2E8F0", borderRadius: "6px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, (c.right / c.max) * 100)}%`,
                      background: "#10B981",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              </div>
            </div>

            <p style={{ fontSize: "12px", color: "#64748B", lineHeight: "18px", marginTop: "2px" }}>
              {c.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
