import { useState, useEffect, useMemo } from "react";
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  Activity,
  Maximize2,
  Minimize2,
  Compass,
  Scale,
  Crosshair,
  TrendingDown,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function AclRiskHeatmap() {
  const { analysisResult } = useAnalysis();
  const [data, setData] = useState(analysisResult);
  const [selectedParamId, setSelectedParamId] = useState("knee_valgus");
  const [hoveredParamId, setHoveredParamId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (analysisResult) {
      setData(analysisResult);
      return;
    }
    try {
      const stored = sessionStorage.getItem("analysisResult");
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse analysisResult for AclRiskHeatmap:", e);
    }
  }, [analysisResult]);

  // Extract numerical biomechanical analysis features
  const features = useMemo(() => {
    if (data?.landing_features && Object.keys(data.landing_features).length > 0) {
      return data.landing_features;
    }
    if (data?.landing_frame_features && Object.keys(data.landing_frame_features).length > 0) {
      return data.landing_frame_features;
    }
    return data?.features || {};
  }, [data]);

  const rawRisk = data?.risk || {};
  const overallRiskScore = Math.round(rawRisk.risk_score || rawRisk.risk_percentage || 0);
  const overallRiskLevel = String(rawRisk.risk_level || rawRisk.label || rawRisk.risk || "LOW").toUpperCase();

  // Extract individual biomechanical metrics
  const kneeValgus = features.knee_valgus != null ? Number(features.knee_valgus) : 4.5;
  const lKneeValgus = features.left_knee_valgus != null ? Number(features.left_knee_valgus) : kneeValgus;
  const rKneeValgus = features.right_knee_valgus != null ? Number(features.right_knee_valgus) : kneeValgus;
  const peakValgus = Math.max(lKneeValgus, rKneeValgus, kneeValgus);

  const kneeFlexion = features.knee_flexion != null ? Number(features.knee_flexion) : 58.0;
  const lKneeFlex = features.left_knee_flexion != null ? Number(features.left_knee_flexion) : kneeFlexion;
  const rKneeFlex = features.right_knee_flexion != null ? Number(features.right_knee_flexion) : kneeFlexion;
  const minKneeFlex = Math.min(lKneeFlex, rKneeFlex, kneeFlexion);

  const hipFlexion = features.hip_flexion != null ? Number(features.hip_flexion) : 56.0;
  const lHipFlex = features.left_hip_flexion != null ? Number(features.left_hip_flexion) : hipFlexion;
  const rHipFlex = features.right_hip_flexion != null ? Number(features.right_hip_flexion) : hipFlexion;
  const minHipFlex = Math.min(lHipFlex, rHipFlex, hipFlexion);

  const ankleDorsiflexion = features.ankle_dorsiflexion != null ? Number(features.ankle_dorsiflexion) : 26.0;
  const lAnkle = features.left_ankle_dorsiflexion != null ? Number(features.left_ankle_dorsiflexion) : ankleDorsiflexion;
  const rAnkle = features.right_ankle_dorsiflexion != null ? Number(features.right_ankle_dorsiflexion) : ankleDorsiflexion;

  const rawSymmetry = features.landing_symmetry != null ? Number(features.landing_symmetry) : 50.0;
  const trunkInclination = features.trunk_inclination != null ? Number(features.trunk_inclination) : 20.0;

  // Evaluate risk level & calculated heat intensity percentage (0 - 100%) for each parameter
  const parameters = useMemo(() => {
    // 1. Knee Valgus
    let valgusRisk = 15;
    let valgusTier = "SAFE";
    if (peakValgus >= 12.0) {
      valgusTier = "HIGH";
      valgusRisk = Math.min(98, 65 + ((peakValgus - 12.0) / 10.0) * 33);
    } else if (peakValgus >= 6.0) {
      valgusTier = "MODERATE";
      valgusRisk = 32 + ((peakValgus - 6.0) / 6.0) * 28;
    } else {
      valgusTier = "SAFE";
      valgusRisk = Math.max(10, 10 + (peakValgus / 6.0) * 18);
    }

    // 2. Knee Flexion (Lower flexion = higher ACL shear)
    let flexRisk = 18;
    let flexTier = "SAFE";
    if (minKneeFlex < 45.0) {
      flexTier = "HIGH";
      flexRisk = Math.min(96, 65 + ((45.0 - Math.max(10, minKneeFlex)) / 35.0) * 31);
    } else if (minKneeFlex < 60.0) {
      flexTier = "MODERATE";
      flexRisk = 32 + ((60.0 - minKneeFlex) / 15.0) * 28;
    } else {
      flexTier = "SAFE";
      flexRisk = Math.max(10, 28 - ((minKneeFlex - 60.0) / 40.0) * 18);
    }

    // 3. Hip Flexion (Sagittal hinge)
    let hipRisk = 20;
    let hipTier = "SAFE";
    if (minHipFlex < 40.0) {
      hipTier = "HIGH";
      hipRisk = Math.min(92, 65 + ((40.0 - Math.max(10, minHipFlex)) / 30.0) * 27);
    } else if (minHipFlex < 55.0) {
      hipTier = "MODERATE";
      hipRisk = 32 + ((55.0 - minHipFlex) / 15.0) * 28;
    } else {
      hipTier = "SAFE";
      hipRisk = Math.max(10, 28 - ((minHipFlex - 55.0) / 35.0) * 18);
    }

    // 4. Ankle Dorsiflexion
    let ankleRisk = 20;
    let ankleTier = "SAFE";
    const minAnkle = Math.min(lAnkle, rAnkle, ankleDorsiflexion);
    if (minAnkle < 12.0 || minAnkle > 50.0) {
      ankleTier = "HIGH";
      ankleRisk = Math.min(90, 65 + ((12.0 - Math.max(0, minAnkle)) / 12.0) * 25);
    } else if (minAnkle < 20.0) {
      ankleTier = "MODERATE";
      ankleRisk = 32 + ((20.0 - minAnkle) / 8.0) * 28;
    } else {
      ankleTier = "SAFE";
      ankleRisk = Math.max(10, 25 - ((minAnkle - 20.0) / 25.0) * 13);
    }

    // 5. Left/Right Knee Symmetry
    const symmetryDelta = Math.abs(rawSymmetry - 50.0);
    const valgusDelta = Math.abs(lKneeValgus - rKneeValgus);
    const flexDelta = Math.abs(lKneeFlex - rKneeFlex);
    const symmetryScore = Math.max(20, Math.min(100, Math.round(100 - (symmetryDelta * 3.2 + valgusDelta * 2.5))));
    let symmetryTier = "SAFE";
    let symmetryRisk = 18;
    if (symmetryScore < 70 || symmetryDelta > 10 || valgusDelta > 6.0) {
      symmetryTier = "HIGH";
      symmetryRisk = 72 + Math.min(25, (100 - symmetryScore) * 0.7);
    } else if (symmetryScore < 85 || symmetryDelta > 5 || valgusDelta > 3.0) {
      symmetryTier = "MODERATE";
      symmetryRisk = 35 + ((85 - symmetryScore) / 15) * 25;
    } else {
      symmetryTier = "SAFE";
      symmetryRisk = Math.max(10, 25 - ((symmetryScore - 85) / 15) * 15);
    }

    // 6. Landing Stability (Trunk control & posture)
    let stabilityTier = "SAFE";
    let stabilityRisk = 20;
    if (trunkInclination < 5.0 || trunkInclination > 45.0) {
      stabilityTier = "HIGH";
      stabilityRisk = 75;
    } else if (trunkInclination < 10.0 || trunkInclination > 35.0) {
      stabilityTier = "MODERATE";
      stabilityRisk = 45;
    } else {
      stabilityTier = "SAFE";
      stabilityRisk = 18;
    }

    // 7. Overall Movement Quality
    let movementTier = "SAFE";
    let movementRisk = overallRiskScore > 0 ? overallRiskScore : 22;
    if (movementRisk >= 60 || overallRiskLevel.includes("HIGH")) {
      movementTier = "HIGH";
    } else if (movementRisk >= 30 || overallRiskLevel.includes("MODERATE")) {
      movementTier = "MODERATE";
    } else {
      movementTier = "SAFE";
    }

    return [
      {
        id: "knee_valgus",
        name: "Knee Valgus",
        category: "frontal",
        joint: "Knee",
        icon: Crosshair,
        measuredValue: `${peakValgus.toFixed(1)}°`,
        rawVal: peakValgus,
        unit: "°",
        bilateralInfo: `Left: ${lKneeValgus.toFixed(1)}° | Right: ${rKneeValgus.toFixed(1)}°`,
        safeRange: "< 5.0° (Neutral Alignment)",
        safeMin: 0,
        safeMax: 5.0,
        tier: valgusTier,
        riskScore: Math.round(valgusRisk),
        explanation: "Excessive dynamic medial (inward) knee collapse during landing and deceleration.",
        whyItMatters: "Dynamic valgus causes sudden knee abduction torque and lateral rotation, drastically multiplying tensile stress on the anterior cruciate ligament.",
      },
      {
        id: "knee_flexion",
        name: "Knee Flexion",
        category: "sagittal",
        joint: "Knee",
        icon: Activity,
        measuredValue: `${minKneeFlex.toFixed(1)}°`,
        rawVal: minKneeFlex,
        unit: "°",
        bilateralInfo: `Left: ${lKneeFlex.toFixed(1)}° | Right: ${rKneeFlex.toFixed(1)}°`,
        safeRange: "> 60.0° (Deep Cushion)",
        safeMin: 60.0,
        safeMax: 120.0,
        tier: flexTier,
        riskScore: Math.round(flexRisk),
        explanation: "Degree of knee bend in the sagittal plane upon impact ground contact.",
        whyItMatters: "Shallow knee flexion produces a stiff landing, failing to absorb ground reaction shock and directly transmitting high anterior tibial shear forces to the ACL.",
      },
      {
        id: "hip_flexion",
        name: "Hip Flexion",
        category: "sagittal",
        joint: "Hip",
        icon: TrendingDown,
        measuredValue: `${minHipFlex.toFixed(1)}°`,
        rawVal: minHipFlex,
        unit: "°",
        bilateralInfo: `Left: ${lHipFlex.toFixed(1)}° | Right: ${rHipFlex.toFixed(1)}°`,
        safeRange: "> 55.0° (Gluteal Hinge)",
        safeMin: 55.0,
        safeMax: 110.0,
        tier: hipTier,
        riskScore: Math.round(hipRisk),
        explanation: "Sagittal hip hinge depth that engages the posterior chain during touchdown.",
        whyItMatters: "Deep hip flexion activates the gluteus maximus and hamstrings, reducing quadriceps dominance and protecting the knee from ligamentous overload.",
      },
      {
        id: "ankle_dorsiflexion",
        name: "Ankle Dorsiflexion",
        category: "sagittal",
        joint: "Ankle",
        icon: Compass,
        measuredValue: `${ankleDorsiflexion.toFixed(1)}°`,
        rawVal: ankleDorsiflexion,
        unit: "°",
        bilateralInfo: `Left: ${lAnkle.toFixed(1)}° | Right: ${rAnkle.toFixed(1)}°`,
        safeRange: "20.0° – 45.0° (Compliance)",
        safeMin: 20.0,
        safeMax: 45.0,
        tier: ankleTier,
        riskScore: Math.round(ankleRisk),
        explanation: "Ankle joint upward mobility allowing smooth initial foot-to-shin deceleration.",
        whyItMatters: "Restricted ankle mobility prevents effective ground shock dissipation, forcing compensatory inward knee collapse and elevated knee torque.",
      },
      {
        id: "knee_symmetry",
        name: "Left / Right Knee Symmetry",
        category: "symmetry",
        joint: "Bilateral",
        icon: Scale,
        measuredValue: `${symmetryScore}% Balance`,
        rawVal: symmetryScore,
        unit: "%",
        bilateralInfo: `Load: ${rawSymmetry.toFixed(1)}% L / ${(100 - rawSymmetry).toFixed(1)}% R | Δ Valgus: ${valgusDelta.toFixed(1)}°`,
        safeRange: "85% – 100% (Balanced Loading)",
        safeMin: 85,
        safeMax: 100,
        tier: symmetryTier,
        riskScore: Math.round(symmetryRisk),
        explanation: "Bilateral kinematic coordination and ground reaction force distribution between both legs.",
        whyItMatters: "Asymmetrical load distribution forces one limb to absorb an excessive fraction of kinetic impact, significantly multiplying injury risk on the overloaded side.",
      },
      {
        id: "landing_stability",
        name: "Landing Stability",
        category: "frontal",
        joint: "Trunk",
        icon: Layers,
        measuredValue: `${trunkInclination.toFixed(1)}° Lean`,
        rawVal: trunkInclination,
        unit: "°",
        bilateralInfo: "Trunk center-of-mass alignment over lower base of support",
        safeRange: "10.0° – 35.0° (Forward Lean)",
        safeMin: 10.0,
        safeMax: 35.0,
        tier: stabilityTier,
        riskScore: Math.round(stabilityRisk),
        explanation: "Trunk postural control and core alignment during high-velocity jump deceleration.",
        whyItMatters: "Lateral trunk displacement or an overly upright posture shifts the center of mass away from the knee axis, dramatically amplifying multi-planar knee abduction moments.",
      },
      {
        id: "movement_quality",
        name: "Overall Movement Quality",
        category: "all",
        joint: "Kinematic Chain",
        icon: Sparkles,
        measuredValue: `${Math.max(10, 100 - overallRiskScore)} / 100`,
        rawVal: 100 - overallRiskScore,
        unit: "/100",
        bilateralInfo: `ML Composite ACL Risk: ${overallRiskScore}% (${overallRiskLevel})`,
        safeRange: "> 80 / 100 (Optimal Neuromuscular Control)",
        safeMin: 80,
        safeMax: 100,
        tier: movementTier,
        riskScore: Math.round(movementRisk),
        explanation: "Machine-learning composite synthesis across all 6 kinematic joint angles and temporal landing phases.",
        whyItMatters: "Integrates multi-joint alignment, deceleration capacity, and bilateral balance into an overarching ACL injury risk classification.",
      },
    ];
  }, [
    peakValgus,
    lKneeValgus,
    rKneeValgus,
    minKneeFlex,
    lKneeFlex,
    rKneeFlex,
    minHipFlex,
    lHipFlex,
    rHipFlex,
    ankleDorsiflexion,
    lAnkle,
    rAnkle,
    rawSymmetry,
    trunkInclination,
    overallRiskScore,
    overallRiskLevel,
  ]);

  // Compute individual joint tier states for the abstract lower body SVG diagram
  const jointSchematicStates = useMemo(() => {
    const evalKnee = (valg, flex) => {
      if (valg >= 12.0 || flex < 45.0) return { tier: "HIGH", color: "#EF4444", aura: "rgba(239, 68, 68, 0.45)" };
      if (valg >= 6.0 || flex < 60.0) return { tier: "MODERATE", color: "#F59E0B", aura: "rgba(245, 158, 11, 0.4)" };
      return { tier: "SAFE", color: "#10B981", aura: "rgba(16, 185, 129, 0.35)" };
    };

    const evalHip = (flex) => {
      if (flex < 40.0) return { tier: "HIGH", color: "#EF4444", aura: "rgba(239, 68, 68, 0.45)" };
      if (flex < 55.0) return { tier: "MODERATE", color: "#F59E0B", aura: "rgba(245, 158, 11, 0.4)" };
      return { tier: "SAFE", color: "#10B981", aura: "rgba(16, 185, 129, 0.35)" };
    };

    const evalAnkle = (ank) => {
      if (ank < 12.0 || ank > 50.0) return { tier: "HIGH", color: "#EF4444", aura: "rgba(239, 68, 68, 0.45)" };
      if (ank < 20.0) return { tier: "MODERATE", color: "#F59E0B", aura: "rgba(245, 158, 11, 0.4)" };
      return { tier: "SAFE", color: "#10B981", aura: "rgba(16, 185, 129, 0.35)" };
    };

    return {
      leftHip: { id: "left_hip", name: "Left Hip", angle: `${lHipFlex.toFixed(1)}°`, ...evalHip(lHipFlex) },
      rightHip: { id: "right_hip", name: "Right Hip", angle: `${rHipFlex.toFixed(1)}°`, ...evalHip(rHipFlex) },
      leftKnee: {
        id: "left_knee",
        name: "Left Knee",
        valgus: `${lKneeValgus.toFixed(1)}°`,
        flexion: `${lKneeFlex.toFixed(1)}°`,
        ...evalKnee(lKneeValgus, lKneeFlex),
      },
      rightKnee: {
        id: "right_knee",
        name: "Right Knee",
        valgus: `${rKneeValgus.toFixed(1)}°`,
        flexion: `${rKneeFlex.toFixed(1)}°`,
        ...evalKnee(rKneeValgus, rKneeFlex),
      },
      leftAnkle: { id: "left_ankle", name: "Left Ankle", angle: `${lAnkle.toFixed(1)}°`, ...evalAnkle(lAnkle) },
      rightAnkle: { id: "right_ankle", name: "Right Ankle", angle: `${rAnkle.toFixed(1)}°`, ...evalAnkle(rAnkle) },
    };
  }, [lHipFlex, rHipFlex, lKneeValgus, rKneeValgus, lKneeFlex, rKneeFlex, lAnkle, rAnkle]);

  // Filtered parameters
  const filteredParameters = useMemo(() => {
    if (activeFilter === "all") return parameters;
    if (activeFilter === "sagittal") return parameters.filter((p) => p.category === "sagittal");
    if (activeFilter === "frontal") return parameters.filter((p) => p.category === "frontal");
    if (activeFilter === "symmetry") return parameters.filter((p) => p.category === "symmetry" || p.id === "knee_symmetry");
    return parameters;
  }, [parameters, activeFilter]);

  const activeParam = useMemo(() => {
    return parameters.find((p) => p.id === (hoveredParamId || selectedParamId)) || parameters[0];
  }, [parameters, hoveredParamId, selectedParamId]);

  const getTierColor = (tier) => {
    if (tier === "HIGH") return "#EF4444";
    if (tier === "MODERATE") return "#F59E0B";
    return "#10B981";
  };

  const getTierPillClass = (tier) => {
    if (tier === "HIGH") return "pill-high";
    if (tier === "MODERATE") return "pill-mod";
    return "pill-safe";
  };

  return (
    <section className="section-container" style={{ marginTop: "24px" }}>
      {/* Section Header */}
      <div className="section-title-wrapper">
        <h2 className="section-title">
          <Flame size={24} color="#EF4444" />
          ACL Risk Heatmap
        </h2>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
          Numerical Biomechanical Risk Intensity & Multi-Joint Alignment
        </span>
      </div>

      {/* Main Heatmap Card Container */}
      <div className="biomech-heatmap-card">
        {/* Top Analytics Summary & Category Filter Bar */}
        <div className="biomech-heatmap-topbar">
          <div className="biomech-topbar-left">
            <div className="biomech-status-indicator">
              <span className="biomech-pulse-dot" style={{ background: getTierColor(activeParam.tier) }} />
              <span className="biomech-status-title">
                Active Assessment: <b>{activeParam.name}</b>
              </span>
            </div>
            <div className="biomech-topbar-badge">
              <span>Risk Intensity: {activeParam.riskScore}%</span>
            </div>
          </div>

          <div className="biomech-filter-pills">
            <button
              className={`biomech-filter-btn ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All Metrics ({parameters.length})
            </button>
            <button
              className={`biomech-filter-btn ${activeFilter === "frontal" ? "active" : ""}`}
              onClick={() => setActiveFilter("frontal")}
            >
              Frontal / Valgus
            </button>
            <button
              className={`biomech-filter-btn ${activeFilter === "sagittal" ? "active" : ""}`}
              onClick={() => setActiveFilter("sagittal")}
            >
              Sagittal / Flexion
            </button>
            <button
              className={`biomech-filter-btn ${activeFilter === "symmetry" ? "active" : ""}`}
              onClick={() => setActiveFilter("symmetry")}
            >
              Bilateral Balance
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Horizontal Heatmap Rows (Left) + Abstract Joint Schematic (Right) */}
        <div className="biomech-heatmap-layout">
          {/* Left Column: Horizontal Biomechanical Risk Heatmap */}
          <div className="biomech-heatmap-main">
            {/* Heat Intensity Zone Guide Bar */}
            <div className="biomech-intensity-guide">
              <div className="biomech-guide-label-col">
                <span className="biomech-guide-title">BIOMECHANICAL PARAMETER</span>
              </div>
              <div className="biomech-guide-track-col">
                <div className="biomech-scale-labels">
                  <span className="scale-safe">
                    <span className="scale-dot safe" /> SAFE (0 – 30%)
                  </span>
                  <span className="scale-mod">
                    <span className="scale-dot mod" /> MODERATE (30 – 60%)
                  </span>
                  <span className="scale-high">
                    <span className="scale-dot high" /> HIGH RISK (60 – 100%)
                  </span>
                </div>
                <div className="biomech-scale-bar-track">
                  <div className="scale-zone zone-safe" />
                  <div className="scale-zone zone-mod" />
                  <div className="scale-zone zone-high" />
                </div>
              </div>
              <div className="biomech-guide-val-col">
                <span>ACTUAL VALUE</span>
              </div>
            </div>

            {/* Parameter Rows List */}
            <div className="biomech-params-list">
              {filteredParameters.map((param) => {
                const IconComponent = param.icon;
                const isSelected = selectedParamId === param.id;
                const isHovered = hoveredParamId === param.id;
                const isActive = isSelected || isHovered;

                return (
                  <div
                    key={param.id}
                    className={`biomech-param-row ${isActive ? "row-active" : ""}`}
                    onClick={() => setSelectedParamId(param.id)}
                    onMouseEnter={() => setHoveredParamId(param.id)}
                    onMouseLeave={() => setHoveredParamId(null)}
                  >
                    {/* Left: Parameter Info */}
                    <div className="biomech-row-info">
                      <div className="biomech-icon-wrapper" style={{ color: getTierColor(param.tier) }}>
                        <IconComponent size={17} />
                      </div>
                      <div className="biomech-row-texts">
                        <span className="biomech-param-name">{param.name}</span>
                        <span className="biomech-param-target">{param.safeRange}</span>
                      </div>
                    </div>

                    {/* Middle: Continuous Multi-Zone Heatmap Bar with Animated Needle */}
                    <div className="biomech-bar-container">
                      <div className="biomech-bar-track">
                        {/* Background continuous gradient */}
                        <div className="biomech-gradient-bg" />

                        {/* Animated Heat Intensity Fill Bar */}
                        <div
                          className={`biomech-heat-fill ${param.tier.toLowerCase()}`}
                          style={{ width: `${Math.max(8, param.riskScore)}%` }}
                        >
                          <div className="biomech-heat-shimmer" />
                        </div>

                        {/* Exact Risk Marker Needle */}
                        <div
                          className="biomech-needle"
                          style={{
                            left: `${Math.min(97, Math.max(3, param.riskScore))}%`,
                            borderColor: getTierColor(param.tier),
                          }}
                        >
                          <div
                            className="biomech-needle-dot"
                            style={{ background: getTierColor(param.tier) }}
                          />
                        </div>
                      </div>

                      {/* Small inline zone dividers */}
                      <div className="biomech-track-ticks">
                        <span className="tick-mark" style={{ left: "30%" }} />
                        <span className="tick-mark" style={{ left: "60%" }} />
                      </div>
                    </div>

                    {/* Right: Measured Value & Risk Badge */}
                    <div className="biomech-row-value-col">
                      <div className="biomech-value-display">
                        <span className="biomech-measured-num">{param.measuredValue}</span>
                        <span className={`biomech-tier-pill ${getTierPillClass(param.tier)}`}>
                          {param.tier} ({param.riskScore}%)
                        </span>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`biomech-row-chevron ${isActive ? "chevron-active" : ""}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Abstract Lower-Body Vector SVG Schematic & Interactive Inspector */}
          <div className="biomech-schematic-sidebar">
            <div className="biomech-schematic-header">
              <div className="schematic-title-group">
                <span className="schematic-badge">BIOMECHANICAL SCHEMATIC</span>
                <h4>Lower Extremity Joint Risk</h4>
              </div>
              <span className="schematic-note">Bilateral Alignment</span>
            </div>

            {/* Clean Abstract Lower-Body Vector Diagram */}
            <div className="biomech-svg-container">
              <svg
                viewBox="0 0 340 380"
                className="biomech-body-svg"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  {/* Subtle Grid Pattern for Technical Analytics Feel */}
                  <pattern id="biomechGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F1F5F9" strokeWidth="0.8" />
                  </pattern>

                  {/* High Risk Radial Aura Glow */}
                  <radialGradient id="highRiskHalo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#EF4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                  </radialGradient>

                  {/* Moderate Risk Radial Aura Glow */}
                  <radialGradient id="modRiskHalo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.75" />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </radialGradient>

                  {/* Safe Risk Radial Aura Glow */}
                  <radialGradient id="safeRiskHalo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="#10B981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Technical grid backdrop */}
                <rect x="0" y="0" width="340" height="380" fill="url(#biomechGrid)" rx="16" />

                {/* Lumbar / Spine Axis Center Line */}
                <line
                  x1="170"
                  y1="25"
                  x2="170"
                  y2="75"
                  stroke="#CBD5E1"
                  strokeWidth="3.5"
                  strokeDasharray="4 3"
                />

                {/* Pelvic Belt / Bridge Structure */}
                <path
                  d="M 105 75 Q 170 85 235 75"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <circle cx="170" cy="80" r="4.5" fill="#64748B" />

                {/* Femur Bones (Hip -> Knee) */}
                {/* Left Femur (Viewer's Left) */}
                <line
                  x1="105"
                  y1="75"
                  x2="115"
                  y2="200"
                  stroke="#94A3B8"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                {/* Right Femur (Viewer's Right) */}
                <line
                  x1="235"
                  y1="75"
                  x2="225"
                  y2="200"
                  stroke="#94A3B8"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                {/* Tibia / Fibula Bones (Knee -> Ankle) */}
                {/* Left Lower Leg */}
                <line
                  x1="115"
                  y1="200"
                  x2="110"
                  y2="310"
                  stroke="#94A3B8"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                {/* Right Lower Leg */}
                <line
                  x1="225"
                  y1="200"
                  x2="230"
                  y2="310"
                  stroke="#94A3B8"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />

                {/* Foot Bases */}
                {/* Left Foot */}
                <path
                  d="M 110 310 L 80 340 L 125 340 Z"
                  fill="#E2E8F0"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Right Foot */}
                <path
                  d="M 230 310 L 260 340 L 215 340 Z"
                  fill="#E2E8F0"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                {/* Ground Line Reference */}
                <line
                  x1="50"
                  y1="345"
                  x2="290"
                  y2="345"
                  stroke="#E2E8F0"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />

                {/* Left & Right Side Anatomical Indicators */}
                <text x="35" y="45" fill="#94A3B8" fontSize="11" fontWeight="700" textAnchor="middle">
                  LEFT (L)
                </text>
                <text x="305" y="45" fill="#94A3B8" fontSize="11" fontWeight="700" textAnchor="middle">
                  RIGHT (R)
                </text>

                {/* 1. Hip Joint Nodes */}
                {/* Left Hip */}
                <g
                  className="svg-joint-node"
                  onClick={() => setSelectedParamId("hip_flexion")}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx="105"
                    cy="75"
                    r="24"
                    fill={
                      jointSchematicStates.leftHip.tier === "HIGH"
                        ? "url(#highRiskHalo)"
                        : jointSchematicStates.leftHip.tier === "MODERATE"
                        ? "url(#modRiskHalo)"
                        : "url(#safeRiskHalo)"
                    }
                  />
                  <circle
                    cx="105"
                    cy="75"
                    r="10"
                    fill={jointSchematicStates.leftHip.color}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />
                  <text x="105" y="55" fill="#475569" fontSize="10" fontWeight="700" textAnchor="middle">
                    L Hip ({jointSchematicStates.leftHip.angle})
                  </text>
                </g>

                {/* Right Hip */}
                <g
                  className="svg-joint-node"
                  onClick={() => setSelectedParamId("hip_flexion")}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx="235"
                    cy="75"
                    r="24"
                    fill={
                      jointSchematicStates.rightHip.tier === "HIGH"
                        ? "url(#highRiskHalo)"
                        : jointSchematicStates.rightHip.tier === "MODERATE"
                        ? "url(#modRiskHalo)"
                        : "url(#safeRiskHalo)"
                    }
                  />
                  <circle
                    cx="235"
                    cy="75"
                    r="10"
                    fill={jointSchematicStates.rightHip.color}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />
                  <text x="235" y="55" fill="#475569" fontSize="10" fontWeight="700" textAnchor="middle">
                    R Hip ({jointSchematicStates.rightHip.angle})
                  </text>
                </g>

                {/* 2. Knee Joint Nodes (Primary ACL Risk Focus) */}
                {/* Left Knee */}
                <g
                  className="svg-joint-node"
                  onClick={() => setSelectedParamId("knee_valgus")}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx="115"
                    cy="200"
                    r="32"
                    fill={
                      jointSchematicStates.leftKnee.tier === "HIGH"
                        ? "url(#highRiskHalo)"
                        : jointSchematicStates.leftKnee.tier === "MODERATE"
                        ? "url(#modRiskHalo)"
                        : "url(#safeRiskHalo)"
                    }
                  />
                  <circle
                    cx="115"
                    cy="200"
                    r="13"
                    fill={jointSchematicStates.leftKnee.color}
                    stroke="#FFFFFF"
                    strokeWidth="3"
                  />
                  <circle cx="115" cy="200" r="4.5" fill="#FFFFFF" opacity="0.9" />
                  <text x="75" y="195" fill="#1E293B" fontSize="10" fontWeight="800" textAnchor="end">
                    L Knee
                  </text>
                  <text x="75" y="208" fill="#64748B" fontSize="9" fontWeight="600" textAnchor="end">
                    Valg {jointSchematicStates.leftKnee.valgus}
                  </text>
                </g>

                {/* Right Knee */}
                <g
                  className="svg-joint-node"
                  onClick={() => setSelectedParamId("knee_valgus")}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx="225"
                    cy="200"
                    r="32"
                    fill={
                      jointSchematicStates.rightKnee.tier === "HIGH"
                        ? "url(#highRiskHalo)"
                        : jointSchematicStates.rightKnee.tier === "MODERATE"
                        ? "url(#modRiskHalo)"
                        : "url(#safeRiskHalo)"
                    }
                  />
                  <circle
                    cx="225"
                    cy="200"
                    r="13"
                    fill={jointSchematicStates.rightKnee.color}
                    stroke="#FFFFFF"
                    strokeWidth="3"
                  />
                  <circle cx="225" cy="200" r="4.5" fill="#FFFFFF" opacity="0.9" />
                  <text x="265" y="195" fill="#1E293B" fontSize="10" fontWeight="800" textAnchor="start">
                    R Knee
                  </text>
                  <text x="265" y="208" fill="#64748B" fontSize="9" fontWeight="600" textAnchor="start">
                    Valg {jointSchematicStates.rightKnee.valgus}
                  </text>
                </g>

                {/* 3. Ankle Joint Nodes */}
                {/* Left Ankle */}
                <g
                  className="svg-joint-node"
                  onClick={() => setSelectedParamId("ankle_dorsiflexion")}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx="110"
                    cy="310"
                    r="20"
                    fill={
                      jointSchematicStates.leftAnkle.tier === "HIGH"
                        ? "url(#highRiskHalo)"
                        : jointSchematicStates.leftAnkle.tier === "MODERATE"
                        ? "url(#modRiskHalo)"
                        : "url(#safeRiskHalo)"
                    }
                  />
                  <circle
                    cx="110"
                    cy="310"
                    r="8.5"
                    fill={jointSchematicStates.leftAnkle.color}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text x="110" y="360" fill="#475569" fontSize="9.5" fontWeight="700" textAnchor="middle">
                    L Ankle ({jointSchematicStates.leftAnkle.angle})
                  </text>
                </g>

                {/* Right Ankle */}
                <g
                  className="svg-joint-node"
                  onClick={() => setSelectedParamId("ankle_dorsiflexion")}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx="230"
                    cy="310"
                    r="20"
                    fill={
                      jointSchematicStates.rightAnkle.tier === "HIGH"
                        ? "url(#highRiskHalo)"
                        : jointSchematicStates.rightAnkle.tier === "MODERATE"
                        ? "url(#modRiskHalo)"
                        : "url(#safeRiskHalo)"
                    }
                  />
                  <circle
                    cx="230"
                    cy="310"
                    r="8.5"
                    fill={jointSchematicStates.rightAnkle.color}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text x="230" y="360" fill="#475569" fontSize="9.5" fontWeight="700" textAnchor="middle">
                    R Ankle ({jointSchematicStates.rightAnkle.angle})
                  </text>
                </g>
              </svg>
            </div>

            {/* Selected Joint / Parameter Quick Insight Popover Card */}
            <div className="biomech-popover-card">
              <div className="popover-card-top">
                <div className="popover-title-row">
                  <div
                    className="popover-icon-box"
                    style={{ background: `${getTierColor(activeParam.tier)}15`, color: getTierColor(activeParam.tier) }}
                  >
                    <Info size={16} />
                  </div>
                  <div>
                    <h5>{activeParam.name}</h5>
                    <span className="popover-bilateral">{activeParam.bilateralInfo}</span>
                  </div>
                </div>

                <span className={`biomech-tier-pill ${getTierPillClass(activeParam.tier)}`}>
                  {activeParam.tier} RISK ({activeParam.riskScore}%)
                </span>
              </div>

              <p className="popover-desc">{activeParam.explanation}</p>

              <div className="popover-acl-relevance">
                <b>Why This Matters For ACL Injury Risk:</b>
                <p>{activeParam.whyItMatters}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Risk Legend & Non-Medical Analytics Disclaimer */}
        <div className="biomech-heatmap-footer">
          <div className="biomech-legend-items">
            <div className="biomech-legend-item">
              <span className="legend-marker safe" />
              <span>
                <b>SAFE / LOW RISK</b> (&lt; 30% Intensity)
              </span>
            </div>
            <div className="biomech-legend-item">
              <span className="legend-marker mod" />
              <span>
                <b>MODERATE / CAUTION</b> (30% – 60% Intensity)
              </span>
            </div>
            <div className="biomech-legend-item">
              <span className="legend-marker high" />
              <span>
                <b>HIGH RISK</b> (&gt; 60% Intensity)
              </span>
            </div>
          </div>

          <div className="biomech-disclaimer">
            <ShieldCheck size={15} color="#2563EB" />
            <span>
              Risk intensity is calculated from biomechanical measurements extracted during movement analysis.
              Intended for athletic biomechanics assessment; not a medical diagnosis.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
