import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Crosshair,
  Scale,
  Sparkles,
  Compass,
} from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function LandingProblemMap() {
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

  const kneeFlexion = Number(features.knee_flexion ?? 0);
  const kneeValgus = Number(features.knee_valgus ?? 0);
  const landingSymmetry = Number(features.landing_symmetry ?? 0);
  const trunkInclination = Number(features.trunk_inclination ?? 0);
  const hipFlexion = Number(features.hip_flexion ?? 0);

  // Derive clinical problem evaluations
  const problems = [];

  // 1. Knee Flexion Evaluation
  if (kneeFlexion < 30) {
    problems.push({
      id: "knee_flexion",
      title: "Stiff Knee Landing (Low Flexion)",
      joint: "Patellofemoral & Tibiofemoral",
      measured: `${kneeFlexion.toFixed(1)}°`,
      targetRange: "≥ 45° controlled bend",
      severity: "High",
      icon: TrendingDown,
      problem: "Incomplete knee bend during ground contact phase",
      biomechanicalEffect: "Impaired ground reaction force dissipation; transfers shear stress directly to anterior cruciate ligament",
      suggestedAdjustment: "Initiate contact through forefoot with progressive deceleration, flexing knees past 45° during impact buffer phase.",
    });
  } else if (kneeFlexion < 43) {
    problems.push({
      id: "knee_flexion",
      title: "Borderline Knee Flexion",
      joint: "Patellofemoral & Tibiofemoral",
      measured: `${kneeFlexion.toFixed(1)}°`,
      targetRange: "≥ 45° controlled bend",
      severity: "Moderate",
      icon: TrendingDown,
      problem: "Partial knee flexion cushion on landing",
      biomechanicalEffect: "Suboptimal shock dispersion; quadriceps dominant deceleration with moderate knee shear load",
      suggestedAdjustment: "Deepen landing squat gently to increase kinetic energy absorption through gluteal and hamstring musculature.",
    });
  } else {
    problems.push({
      id: "knee_flexion",
      title: "Optimal Knee Flexion Absorption",
      joint: "Patellofemoral & Tibiofemoral",
      measured: `${kneeFlexion.toFixed(1)}°`,
      targetRange: "≥ 45° controlled bend",
      severity: "Low",
      icon: CheckCircle2,
      problem: "Sound sagittal plane cushioning observed",
      biomechanicalEffect: "Ground reaction force effectively attenuated across leg musculature with minimal ACL tensile strain",
      suggestedAdjustment: "Maintain current soft-landing technique and muscular endurance across high-speed repetitions.",
    });
  }

  // 2. Knee Valgus Evaluation
  if (kneeValgus > 12) {
    problems.push({
      id: "knee_valgus",
      title: "Frontal Knee Valgus Collapse",
      joint: "Knee Joint Alignment Axis",
      measured: `${kneeValgus.toFixed(1)}°`,
      targetRange: "0° – 7° neutral tracking",
      severity: "High",
      icon: Crosshair,
      problem: "Dynamic inward knee medial displacement during deceleration",
      biomechanicalEffect: "Combines frontal abduction and internal tibial rotation, producing maximum peak ACL strain",
      suggestedAdjustment: "Focus on driving knees outwards over 2nd toe; strengthen hip abductors (gluteus medius) to resist medial collapse.",
    });
  } else if (kneeValgus > 7) {
    problems.push({
      id: "knee_valgus",
      title: "Mild Frontal Valgus Tendency",
      joint: "Knee Joint Alignment Axis",
      measured: `${kneeValgus.toFixed(1)}°`,
      targetRange: "0° – 7° neutral tracking",
      severity: "Moderate",
      icon: Crosshair,
      problem: "Minor inward tracking detected upon initial ground contact",
      biomechanicalEffect: "Elevates joint torque slightly during high-velocity impacts or fatigue conditions",
      suggestedAdjustment: "Incorporate lateral band walks and neuromuscular landing drills to reinforce parallel knee alignment.",
    });
  } else {
    problems.push({
      id: "knee_valgus",
      title: "Neutral Knee Frontal Alignment",
      joint: "Knee Joint Alignment Axis",
      measured: `${kneeValgus.toFixed(1)}°`,
      targetRange: "0° – 7° neutral tracking",
      severity: "Low",
      icon: CheckCircle2,
      problem: "Knees track squarely over feet with zero medial collapse",
      biomechanicalEffect: "Symmetrical patellar tracking and balanced medial-lateral compartment loading",
      suggestedAdjustment: "Excellent biomechanical tracking; maintain neuromuscular alignment during unexpected athletic cuts.",
    });
  }

  // 3. Landing Symmetry Evaluation
  if (landingSymmetry < 40) {
    problems.push({
      id: "landing_symmetry",
      title: "Severe Bilateral Landing Asymmetry",
      joint: "Bilateral Lower Extremity Chain",
      measured: `${landingSymmetry.toFixed(1)}%`,
      targetRange: "≥ 75% bilateral parity",
      severity: "High",
      icon: Scale,
      problem: "Significant uneven weight bearing between left and right limb",
      biomechanicalEffect: "Concentrates over 70% of impact impact forces into the dominant limb, multiplying unilateral ACL stress",
      suggestedAdjustment: "Perform unilateral drop-jump screening and single-leg strength stabilization to restore equal bilateral impact.",
    });
  } else if (landingSymmetry < 70) {
    problems.push({
      id: "landing_symmetry",
      title: "Moderate Bilateral Asymmetry",
      joint: "Bilateral Lower Extremity Chain",
      measured: `${landingSymmetry.toFixed(1)}%`,
      targetRange: "≥ 75% bilateral parity",
      severity: "Moderate",
      icon: Scale,
      problem: "Mild weight distribution preference detected between limbs",
      biomechanicalEffect: "Slight lateral force imbalance; potential compensatory movement pattern under high fatigue",
      suggestedAdjustment: "Cue athlete for simultaneous double-foot touchdown sound parity during vertical drop tests.",
    });
  }

  // 4. Trunk / Hip Angle Evaluation
  if (trunkInclination > 20 || hipFlexion < 25) {
    problems.push({
      id: "trunk_hip",
      title: "Erect Trunk / Low Hip Activation",
      joint: "Lumbopelvic-Hip Complex",
      measured: `Trunk: ${trunkInclination.toFixed(1)}° | Hip: ${hipFlexion.toFixed(1)}°`,
      targetRange: "Trunk 10°–20° / Hip ≥ 35°",
      severity: "Moderate",
      icon: Compass,
      problem: "Upright landing torso shifting ground force vector behind knee",
      biomechanicalEffect: "Increases quadriceps anterior pull force on tibia, heightening ligament strain",
      suggestedAdjustment: "Engage hip hinge on touchdown; cue chest forward over toes to recruit posterior chain stabilizers.",
    });
  }

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
                <ShieldAlert size={20} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Landing Problem Map &amp; Kinematic Flaw Analysis
              </h2>
            </div>
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
              Direct clinical mapping of athlete landing mechanics: What occurred, where it is located, biomechanical consequences, and suggested adjustments.
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
            <span>AI Automated Movement Diagnosis</span>
          </div>
        </div>

        {/* Problem Cards Flow */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {problems.map((item) => {
            const IconComponent = item.icon;
            const isHigh = item.severity === "High";
            const isMod = item.severity === "Moderate";
            const borderColor = isHigh ? "#fecaca" : isMod ? "#fde68a" : "#bae6fd";
            const bgHeader = isHigh ? "#fef2f2" : isMod ? "#fffbeb" : "#f0f9ff";
            const badgeColor = isHigh ? "#dc2626" : isMod ? "#d97706" : "#0284c7";
            const badgeBg = isHigh ? "#fee2e2" : isMod ? "#fef3c7" : "#e0f2fe";

            return (
              <div
                key={item.id}
                style={{
                  border: `1px solid ${borderColor}`,
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: "#ffffff",
                  boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                {/* Top card bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 20px",
                    background: bgHeader,
                    borderBottom: `1px solid ${borderColor}`,
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: badgeColor,
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      <IconComponent size={16} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                        {item.title}
                      </h4>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Joint Complex: <b>{item.joint}</b>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                      Measured: <span style={{ color: badgeColor }}>{item.measured}</span>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginLeft: "6px" }}>
                        (Target: {item.targetRange})
                      </span>
                    </span>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        background: badgeBg,
                        color: badgeColor,
                        fontSize: "11px",
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.severity} Risk
                    </span>
                  </div>
                </div>

                {/* 4-Step Biomechanical Breakdown Row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                    padding: "16px 20px",
                    background: "#ffffff",
                  }}
                >
                  {/* Step 1: Detected Flaw */}
                  <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>
                      1. Detected Kinematic State
                    </span>
                    <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", lineHeight: "1.45" }}>
                      {item.problem}
                    </p>
                  </div>

                  {/* Step 2: Biomechanical Loading Effect */}
                  <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>
                      2. Biomechanical Load Effect
                    </span>
                    <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", lineHeight: "1.45" }}>
                      {item.biomechanicalEffect}
                    </p>
                  </div>

                  {/* Step 3: Suggested Biomechanical Adjustment */}
                  <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>
                      3. Recommended Adjustment
                    </span>
                    <p style={{ margin: 0, fontSize: "13px", color: "#166534", lineHeight: "1.45", fontWeight: 500 }}>
                      {item.suggestedAdjustment}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "16px", padding: "10px 16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b", textAlign: "center" }}>
          * Biomechanical movement guidance derived from kinematic markers. Intended for performance conditioning and athletic coaching; not a substitute for clinical orthopedic diagnosis.
        </div>
      </div>
    </section>
  );
}
