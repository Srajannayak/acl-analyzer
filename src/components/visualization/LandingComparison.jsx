import { useState, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function LandingComparison() {
  const { analysisResult } = useAnalysis();
  const [data, setData] = useState(analysisResult);

  useEffect(() => {
    if (analysisResult) {
      setData(analysisResult);
      return;
    }
    try {
      const stored = sessionStorage.getItem("analysisResult");
      if (stored) setData(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to parse analysisResult:", e);
    }
  }, [analysisResult]);

  if (!data) return null;

  const features = data?.landing_features?.knee_flexion != null
    ? data.landing_features
    : (data?.features || {});

  const kneeFlexion = Number(features.knee_flexion ?? 18);
  const kneeValgus = Number(features.knee_valgus ?? 8);
  const symmetry = Number(features.landing_symmetry ?? 50);

  const isStiff = kneeFlexion < 30;
  const isValgusProblem = kneeValgus > 8;

  // Visual coordinates for athlete silhouette
  // Left current landing: stiff leg has high knee y (nearly straight), or valgus offset
  // Right recommended landing: bent knee has lower hip y and deep flexion angle
  const currentKneeY = isStiff ? 230 : 210;
  const currentHipY = isStiff ? 130 : 150;
  const currentKneeXLeft = isValgusProblem ? 150 : 138;
  const currentKneeXRight = isValgusProblem ? 170 : 182;

  return (
    <section className="section-container" style={{ marginBottom: "28px" }}>
      <div className="card-3d" style={{ padding: "28px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0284c7",
                }}
              >
                <Layers size={20} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Current vs. Recommended Landing Mechanics
              </h2>
            </div>
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
              Visual side-by-side comparison of the athlete's detected ground contact kinematics against recommended clinical alignment.
            </p>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "20px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#475569",
            }}
          >
            <Sparkles size={14} color="#0284c7" />
            <span>Biomechanical Guidance</span>
          </div>
        </div>

        {/* Side by Side Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {/* CURRENT LANDING (LEFT) */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              border: `1.5px solid ${isStiff || isValgusProblem ? "#fecaca" : "#bae6fd"}`,
              padding: "20px",
              boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: isStiff || isValgusProblem ? "#fee2e2" : "#e0f2fe",
                    color: isStiff || isValgusProblem ? "#ef4444" : "#0284c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isStiff || isValgusProblem ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                    Detected Landing Posture
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Measured from video impact frame</span>
                </div>
              </div>

              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  background: isStiff || isValgusProblem ? "#fee2e2" : "#e0f2fe",
                  color: isStiff || isValgusProblem ? "#dc2626" : "#0284c7",
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                {isStiff ? "Stiff Landing" : isValgusProblem ? "Valgus Collapse" : "Controlled"}
              </span>
            </div>

            {/* SVG Silhouette Comparison (Current) */}
            <div
              style={{
                height: "260px",
                background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
              }}
            >
              <svg width="320" height="250" viewBox="0 0 320 250" style={{ maxWidth: "100%", height: "auto" }}>
                {/* Floor reference line */}
                <line x1="20" y1="230" x2="300" y2="230" stroke="#cbd5e1" strokeWidth="2.5" strokeDasharray="4 4" />
                <text x="30" y="244" fill="#94a3b8" fontSize="10" fontWeight="600">IMPACT GROUND PLANE</text>

                {/* Head */}
                <circle cx="160" cy="40" r="14" fill="#64748b" opacity="0.9" />

                {/* Torso */}
                <line x1="160" y1="54" x2="160" y2={currentHipY} stroke="#475569" strokeWidth="12" strokeLinecap="round" />

                {/* Pelvis bar */}
                <line x1="135" y1={currentHipY} x2="185" y2={currentHipY} stroke="#334155" strokeWidth="6" strokeLinecap="round" />

                {/* Left Leg (Thigh + Shank) */}
                <line x1="135" y1={currentHipY} x2={currentKneeXLeft} y2={currentKneeY - 30} stroke={isStiff ? "#ef4444" : "#0284c7"} strokeWidth="7" strokeLinecap="round" />
                <line x1={currentKneeXLeft} y1={currentKneeY - 30} x2="120" y2="226" stroke={isStiff ? "#ef4444" : "#0284c7"} strokeWidth="6" strokeLinecap="round" />

                {/* Right Leg (Thigh + Shank) */}
                <line x1="185" y1={currentHipY} x2={currentKneeXRight} y2={currentKneeY - 30} stroke={isStiff ? "#ef4444" : "#0284c7"} strokeWidth="7" strokeLinecap="round" />
                <line x1={currentKneeXRight} y1={currentKneeY - 30} x2="200" y2="226" stroke={isStiff ? "#ef4444" : "#0284c7"} strokeWidth="6" strokeLinecap="round" />

                {/* Feet */}
                <ellipse cx="114" cy="227" rx="14" ry="4" fill="#334155" />
                <ellipse cx="206" cy="227" rx="14" ry="4" fill="#334155" />

                {/* Knee joints highlighted */}
                <circle cx={currentKneeXLeft} cy={currentKneeY - 30} r="7" fill={isStiff || isValgusProblem ? "#ef4444" : "#0284c7"} />
                <circle cx={currentKneeXRight} cy={currentKneeY - 30} r="7" fill={isStiff || isValgusProblem ? "#ef4444" : "#0284c7"} />

                {/* Warning / Callout text */}
                <rect x="25" y="100" width="95" height="34" rx="6" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1" />
                <text x="32" y="115" fill="#b91c1c" fontSize="10" fontWeight="800">
                  {isStiff ? "STIFF KNEE" : "COLLAPSE"}
                </text>
                <text x="32" y="127" fill="#b91c1c" fontSize="9.5" fontWeight="600">
                  Flex: {kneeFlexion.toFixed(1)}°
                </text>
                <line x1="120" y1="117" x2={currentKneeXLeft - 8} y2={currentKneeY - 30} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            </div>

            {/* Metrics Checklist */}
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>Measured Knee Flexion:</span>
                <b style={{ color: isStiff ? "#ef4444" : "#0284c7" }}>{kneeFlexion.toFixed(1)}°</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>Measured Valgus Angle:</span>
                <b style={{ color: isValgusProblem ? "#ef4444" : "#0284c7" }}>{kneeValgus.toFixed(1)}°</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>Impact Shock Absorption:</span>
                <b style={{ color: isStiff ? "#dc2626" : "#059669" }}>{isStiff ? "Poor (Direct Joint Load)" : "Acceptable"}</b>
              </div>
            </div>
          </div>

          {/* RECOMMENDED LANDING (RIGHT) */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              border: "1.5px solid #bbf7d0",
              padding: "20px",
              boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "#dcfce7",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                    Recommended Athletic Alignment
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Suggested biomechanical target</span>
                </div>
              </div>

              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  background: "#dcfce7",
                  color: "#15803d",
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                Optimal Absorption
              </span>
            </div>

            {/* SVG Silhouette Comparison (Recommended) */}
            <div
              style={{
                height: "260px",
                background: "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                border: "1px solid #bbf7d0",
              }}
            >
              <svg width="320" height="250" viewBox="0 0 320 250" style={{ maxWidth: "100%", height: "auto" }}>
                {/* Floor reference line */}
                <line x1="20" y1="230" x2="300" y2="230" stroke="#86efac" strokeWidth="2.5" strokeDasharray="4 4" />
                <text x="30" y="244" fill="#15803d" fontSize="10" fontWeight="600">SAFE DECELERATION PLANE</text>

                {/* Head (lower due to athletic squat) */}
                <circle cx="160" cy="65" r="14" fill="#047857" opacity="0.9" />

                {/* Torso (athletic forward lean ~15°) */}
                <line x1="160" y1="79" x2="160" y2="155" stroke="#065f46" strokeWidth="12" strokeLinecap="round" />

                {/* Pelvis bar (wider stance) */}
                <line x1="130" y1="155" x2="190" y2="155" stroke="#047857" strokeWidth="6" strokeLinecap="round" />

                {/* Left Leg: deep flexion (~55° bend) */}
                <line x1="130" y1="155" x2="110" y2="190" stroke="#16a34a" strokeWidth="7" strokeLinecap="round" />
                <line x1="110" y1="190" x2="115" y2="226" stroke="#16a34a" strokeWidth="6" strokeLinecap="round" />

                {/* Right Leg: deep flexion (~55° bend) */}
                <line x1="190" y1="155" x2="210" y2="190" stroke="#16a34a" strokeWidth="7" strokeLinecap="round" />
                <line x1="210" y1="190" x2="205" y2="226" stroke="#16a34a" strokeWidth="6" strokeLinecap="round" />

                {/* Feet */}
                <ellipse cx="110" cy="227" rx="15" ry="4.5" fill="#065f46" />
                <ellipse cx="210" cy="227" rx="15" ry="4.5" fill="#065f46" />

                {/* Knee joints highlighted in green */}
                <circle cx="110" cy="190" r="7" fill="#16a34a" />
                <circle cx="210" cy="190" r="7" fill="#16a34a" />

                {/* Alignment guidance dashed line over foot */}
                <line x1="110" y1="180" x2="110" y2="230" stroke="#15803d" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="210" y1="180" x2="210" y2="230" stroke="#15803d" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Recommended Badge callout */}
                <rect x="200" y="100" width="105" height="34" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="1" />
                <text x="208" y="115" fill="#15803d" fontSize="10" fontWeight="800">
                  DEEP CUSHION
                </text>
                <text x="208" y="127" fill="#15803d" fontSize="9.5" fontWeight="600">
                  Flex: 45°–60°
                </text>
                <line x1="200" y1="117" x2="210" y2="186" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            </div>

            {/* Target Checklist */}
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f0fdf4", borderRadius: "8px", fontSize: "13px" }}>
                <span style={{ color: "#166534" }}>Target Knee Flexion:</span>
                <b style={{ color: "#15803d" }}>45° – 65° (Controlled)</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f0fdf4", borderRadius: "8px", fontSize: "13px" }}>
                <span style={{ color: "#166534" }}>Target Knee Alignment:</span>
                <b style={{ color: "#15803d" }}>Directly over 2nd Toe</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f0fdf4", borderRadius: "8px", fontSize: "13px" }}>
                <span style={{ color: "#166534" }}>Impact Shock Absorption:</span>
                <b style={{ color: "#15803d" }}>Maximized via Glutes/Quads</b>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "18px", padding: "10px 16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b", textAlign: "center" }}>
          * Conceptual alignment comparison. Individual athlete anatomy, landing speed, and sport dynamics may require customized training protocols.
        </div>
      </div>
    </section>
  );
}
