import { useState, useEffect, useRef, useMemo } from "react";
import {
  Flame,
  Info,
  ShieldAlert,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Sliders,
  Crosshair,
  Maximize2,
} from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

// MediaPipe 33 Landmark indices
const JOINTS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

const BONES = [
  [JOINTS.LEFT_SHOULDER, JOINTS.RIGHT_SHOULDER],
  [JOINTS.LEFT_SHOULDER, JOINTS.LEFT_ELBOW],
  [JOINTS.LEFT_ELBOW, JOINTS.LEFT_WRIST],
  [JOINTS.RIGHT_SHOULDER, JOINTS.RIGHT_ELBOW],
  [JOINTS.RIGHT_ELBOW, JOINTS.RIGHT_WRIST],
  [JOINTS.LEFT_SHOULDER, JOINTS.LEFT_HIP],
  [JOINTS.RIGHT_SHOULDER, JOINTS.RIGHT_HIP],
  [JOINTS.LEFT_HIP, JOINTS.RIGHT_HIP],
  [JOINTS.LEFT_HIP, JOINTS.LEFT_KNEE],
  [JOINTS.RIGHT_HIP, JOINTS.RIGHT_KNEE],
  [JOINTS.LEFT_KNEE, JOINTS.LEFT_ANKLE],
  [JOINTS.RIGHT_KNEE, JOINTS.RIGHT_ANKLE],
  [JOINTS.LEFT_ANKLE, JOINTS.LEFT_FOOT_INDEX],
  [JOINTS.RIGHT_ANKLE, JOINTS.RIGHT_FOOT_INDEX],
];

export default function AclLandingHeatmap() {
  const { analysisResult } = useAnalysis();
  const [data, setData] = useState(analysisResult);

  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedJointKey, setSelectedJointKey] = useState(null);
  const [hoveredJoint, setHoveredJoint] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const imageRef = useRef(null);

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
      console.error("Failed to parse analysisResult for AclLandingHeatmap:", e);
    }
  }, [analysisResult]);

  const landing = data?.landing || {};
  const landingFrameNum = landing.peak_risk_frame ?? landing.landing_frame ?? 1;
  const landingTimestampMs = landing.peak_risk_timestamp_ms ?? landing.landing_timestamp_ms ?? 0;
  const rawImgUrl = data?.landing_image_url || landing.landing_image_url;

  const landingImageUrl = rawImgUrl
    ? rawImgUrl.startsWith("http")
      ? rawImgUrl
      : `http://127.0.0.1:5000${rawImgUrl}`
    : null;

  // Retrieve exact landmarks for this landing frame
  const landmarks = useMemo(() => {
    if (data?.landing_frame_landmarks && data.landing_frame_landmarks.length >= 33) {
      return data.landing_frame_landmarks;
    }
    if (landing.landing_frame_landmarks && landing.landing_frame_landmarks.length >= 33) {
      return landing.landing_frame_landmarks;
    }
    const seq = data?.feature_sequence || [];
    const found = seq.find((s) => s.frame === landingFrameNum);
    if (found && found.landmarks && found.landmarks.length >= 33) {
      return found.landmarks;
    }
    return data?.landmarks || [];
  }, [data, landing, landingFrameNum]);

  // Retrieve exact biomechanical features for this landing frame
  const features = useMemo(() => {
    if (data?.landing_frame_features && Object.keys(data.landing_frame_features).length > 0) {
      return data.landing_frame_features;
    }
    if (landing.landing_frame_features && Object.keys(landing.landing_frame_features).length > 0) {
      return landing.landing_frame_features;
    }
    return data?.landing_features || data?.features || {};
  }, [data, landing]);

  // Compute individual joint risk states based on real calculated angles
  const jointStates = useMemo(() => {
    const valgus = features.knee_valgus ?? 0;
    const lValgus = features.left_knee_valgus ?? valgus;
    const rValgus = features.right_knee_valgus ?? valgus;

    const flexion = features.knee_flexion ?? 55;
    const lFlexion = features.left_knee_flexion ?? flexion;
    const rFlexion = features.right_knee_flexion ?? flexion;

    const hipFlex = features.hip_flexion ?? 55;
    const lHipFlex = features.left_hip_flexion ?? hipFlex;
    const rHipFlex = features.right_hip_flexion ?? hipFlex;

    const ankleFlex = features.ankle_dorsiflexion ?? 30;
    const lAnkle = features.left_ankle_dorsiflexion ?? ankleFlex;
    const rAnkle = features.right_ankle_dorsiflexion ?? ankleFlex;

    // Standardized Biomechanical Thresholds:
    // Safe: Valgus < 6°, Flexion >= 50°
    // Moderate: Valgus 6° - 11°, Flexion 40° - 49°
    // High: Valgus >= 12° or Flexion < 40°
    const evaluateKnee = (valg, flex) => {
      if (valg >= 11 || flex < 38) {
        return { tier: "HIGH", label: "High Risk", color: "#EF4444", pillClass: "high", aura: "rgba(239, 68, 68, 0.65)" };
      }
      if (valg >= 6 || flex < 48) {
        return { tier: "MODERATE", label: "Moderate", color: "#F59E0B", pillClass: "moderate", aura: "rgba(245, 158, 11, 0.55)" };
      }
      return { tier: "SAFE", label: "Safe", color: "#10B981", pillClass: "low", aura: "rgba(16, 185, 129, 0.45)" };
    };

    const lKnee = evaluateKnee(lValgus, lFlexion);
    const rKnee = evaluateKnee(rValgus, rFlexion);

    const evaluateHip = (h) => {
      if (h < 40) return { tier: "MODERATE", label: "Upright", color: "#F59E0B", pillClass: "moderate", aura: "rgba(245, 158, 11, 0.5)" };
      return { tier: "SAFE", label: "Safe", color: "#10B981", pillClass: "low", aura: "rgba(16, 185, 129, 0.4)" };
    };

    const evaluateAnkle = (a) => {
      if (a < 20) return { tier: "MODERATE", label: "Stiff", color: "#F59E0B", pillClass: "moderate", aura: "rgba(245, 158, 11, 0.5)" };
      return { tier: "SAFE", label: "Safe", color: "#10B981", pillClass: "low", aura: "rgba(16, 185, 129, 0.4)" };
    };

    const isHighKnee = rKnee.tier === "HIGH" || lKnee.tier === "HIGH";
    const isModKnee = rKnee.tier === "MODERATE" || lKnee.tier === "MODERATE";
    const primaryKnee = rValgus >= lValgus ? "Right Knee" : "Left Knee";
    const primaryValgus = rValgus >= lValgus ? rValgus : lValgus;

    return {
      rightKnee: {
        key: "rightKnee",
        name: "Right Knee",
        valgus: rValgus,
        flexion: rFlexion,
        index: JOINTS.RIGHT_KNEE,
        ...rKnee,
      },
      leftKnee: {
        key: "leftKnee",
        name: "Left Knee",
        valgus: lValgus,
        flexion: lFlexion,
        index: JOINTS.LEFT_KNEE,
        ...lKnee,
      },
      rightHip: {
        key: "rightHip",
        name: "Right Hip",
        flexion: rHipFlex,
        index: JOINTS.RIGHT_HIP,
        ...evaluateHip(rHipFlex),
      },
      leftHip: {
        key: "leftHip",
        name: "Left Hip",
        flexion: lHipFlex,
        index: JOINTS.LEFT_HIP,
        ...evaluateHip(lHipFlex),
      },
      rightAnkle: {
        key: "rightAnkle",
        name: "Right Ankle",
        dorsiflexion: rAnkle,
        index: JOINTS.RIGHT_ANKLE,
        ...evaluateAnkle(rAnkle),
      },
      leftAnkle: {
        key: "leftAnkle",
        name: "Left Ankle",
        dorsiflexion: lAnkle,
        index: JOINTS.LEFT_ANKLE,
        ...evaluateAnkle(lAnkle),
      },
      primarySummary: {
        joint: primaryKnee,
        valgus: primaryValgus,
        isHigh: isHighKnee,
        isMod: isModKnee,
        tier: isHighKnee ? "HIGH" : isModKnee ? "MODERATE" : "SAFE",
      },
    };
  }, [features]);

  // Educational explanation
  const explanation = useMemo(() => {
    const { primarySummary } = jointStates;
    if (primarySummary.isHigh) {
      return `Peak biomechanical stress detected at the ${primarySummary.joint.toLowerCase()} during landing touchdown. Knee valgus angle measured ${Math.round(primarySummary.valgus)}° (High Risk). Dynamic medial knee collapse combined with rapid ground deceleration produces high anterior shear stress on the anterior cruciate ligament.`;
    }
    if (primarySummary.isMod) {
      return `Moderate biomechanical stress detected at the ${primarySummary.joint.toLowerCase()} during landing (${Math.round(primarySummary.valgus)}° knee valgus). Mild inward knee displacement observed. Increasing sagittal knee flexion depth upon ground contact helps dissipate impact forces.`;
    }
    return `Optimal landing mechanics observed. Both knees maintain neutral frontal alignment (< 6° valgus) and symmetric ground force absorption across the lower extremities.`;
  }, [jointStates]);

  const jointList = [
    jointStates.rightKnee,
    jointStates.leftKnee,
    jointStates.rightHip,
    jointStates.leftHip,
    jointStates.rightAnkle,
    jointStates.leftAnkle,
  ];

  return (
    <section className="section-container" style={{ marginTop: "24px" }}>
      {/* Section Header */}
      <div className="section-title-wrapper">
        <h2 className="section-title">
          <Flame size={24} color="#EF4444" />
          ACL Risk Heatmap
        </h2>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
          Landing / Peak Risk Frame Biomechanical Evaluation
        </span>
      </div>

      <div
        className="athlete-overview-card"
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: "28px",
          padding: "26px",
          alignItems: "stretch",
          margin: 0,
        }}
      >
        {/* Left Column: Landing Frame Image + Exact Overlaid Landmark Coordinates */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Top Control Bar & Badges */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#FEF2F2",
                  color: "#DC2626",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 800,
                  border: "1px solid #FECACA",
                }}
              >
                <Zap size={13} />
                Peak Risk Landing Frame #{landingFrameNum}
              </span>

              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                Time: {(landingTimestampMs / 1000).toFixed(2)}s
              </span>
            </div>

            {/* Toggle Overlay Controls */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                style={{
                  background: showSkeleton ? "#EEF5FF" : "#F1F5F9",
                  color: showSkeleton ? "#2563EB" : "#64748B",
                  border: "1px solid",
                  borderColor: showSkeleton ? "#BFDBFE" : "#E2E8F0",
                  padding: "5px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Skeleton
              </button>

              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                style={{
                  background: showHeatmap ? "#FEF2F2" : "#F1F5F9",
                  color: showHeatmap ? "#DC2626" : "#64748B",
                  border: "1px solid",
                  borderColor: showHeatmap ? "#FECACA" : "#E2E8F0",
                  padding: "5px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Risk Heatmap
              </button>
            </div>
          </div>

          {/* Landing Frame Image Container with High-Precision SVG Coordinate Overlay */}
          <div
            style={{
              position: "relative",
              borderRadius: "18px",
              overflow: "hidden",
              background: "#0F172A",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              border: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "360px",
            }}
          >
            {landingImageUrl ? (
              <img
                ref={imageRef}
                src={landingImageUrl}
                alt="Landing Frame"
                onLoad={() => setImgLoaded(true)}
                style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
              />
            ) : (
              <div style={{ padding: "60px 20px", color: "#94A3B8", textAlign: "center" }}>
                <p>Extracting landing frame image...</p>
              </div>
            )}

            {/* Mathematically Aligned SVG Coordinate Overlay (viewBox 0 0 1000 1000) */}
            {landmarks && landmarks.length >= 33 && (
              <svg
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "auto",
                }}
              >
                <defs>
                  {/* High Risk Radial Glow Filter */}
                  <radialGradient id="highRiskGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
                    <stop offset="40%" stopColor="#EF4444" stopOpacity="0.55" />
                    <stop offset="80%" stopColor="#EF4444" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                  </radialGradient>

                  {/* Moderate Risk Radial Glow */}
                  <radialGradient id="modRiskGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.85" />
                    <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.45" />
                    <stop offset="80%" stopColor="#F59E0B" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </radialGradient>

                  {/* Safe Risk Radial Glow */}
                  <radialGradient id="safeRiskGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                    <stop offset="45%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="80%" stopColor="#10B981" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* 1. MediaPipe Anatomical Skeleton Linkages */}
                {showSkeleton &&
                  BONES.map(([s, e], bIdx) => {
                    const p1 = landmarks[s];
                    const p2 = landmarks[e];
                    if (!p1 || !p2) return null;
                    return (
                      <line
                        key={bIdx}
                        x1={p1.x * 1000}
                        y1={p1.y * 1000}
                        x2={p2.x * 1000}
                        y2={p2.y * 1000}
                        stroke="#38BDF8"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        opacity="0.85"
                      />
                    );
                  })}

                {/* 2. Soft Biomechanical Heatmap Auras */}
                {showHeatmap &&
                  jointList.map((j) => {
                    const lm = landmarks[j.index];
                    if (!lm) return null;
                    const gradId = j.tier === "HIGH" ? "url(#highRiskGlow)" : j.tier === "MODERATE" ? "url(#modRiskGlow)" : "url(#safeRiskGlow)";
                    const radius = j.tier === "HIGH" ? 55 : j.tier === "MODERATE" ? 42 : 32;

                    return (
                      <circle
                        key={`aura-${j.key}`}
                        cx={lm.x * 1000}
                        cy={lm.y * 1000}
                        r={radius}
                        fill={gradId}
                      />
                    );
                  })}

                {/* 3. Anatomically Centered Joint Keypoint Nodes */}
                {jointList.map((j) => {
                  const lm = landmarks[j.index];
                  if (!lm) return null;
                  const isSelected = selectedJointKey === j.key;

                  return (
                    <g
                      key={`node-${j.key}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedJointKey(isSelected ? null : j.key)}
                      onMouseEnter={() => setHoveredJoint(j)}
                      onMouseLeave={() => setHoveredJoint(null)}
                    >
                      {/* Outer Ring */}
                      <circle
                        cx={lm.x * 1000}
                        cy={lm.y * 1000}
                        r={isSelected ? 14 : 9}
                        fill={j.color}
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                      />

                      {/* Inner Target Point */}
                      <circle
                        cx={lm.x * 1000}
                        cy={lm.y * 1000}
                        r="3.5"
                        fill="#FFFFFF"
                      />
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Interactive Tooltip Overlay */}
            {hoveredJoint && landmarks[hoveredJoint.index] && (
              <div
                style={{
                  position: "absolute",
                  left: `${Math.min(80, Math.max(10, landmarks[hoveredJoint.index].x * 100))}%`,
                  top: `${Math.min(80, Math.max(10, (landmarks[hoveredJoint.index].y * 100) - 10))}%`,
                  background: "rgba(15, 23, 42, 0.92)",
                  backdropFilter: "blur(6px)",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                  pointerEvents: "none",
                  zIndex: 20,
                  fontSize: "12px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div style={{ fontWeight: 800, color: hoveredJoint.color, marginBottom: "2px" }}>
                  {hoveredJoint.name}: {hoveredJoint.label}
                </div>
                {hoveredJoint.valgus != null && (
                  <div style={{ color: "#E2E8F0" }}>Valgus: <b>{Math.round(hoveredJoint.valgus)}°</b></div>
                )}
                {hoveredJoint.flexion != null && (
                  <div style={{ color: "#E2E8F0" }}>Flexion: <b>{Math.round(hoveredJoint.flexion)}°</b></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Risk Legend + Joint Risk Summary + Explanation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Risk Legend Card */}
          <div
            style={{
              background: "#F8FAFC",
              borderRadius: "18px",
              padding: "18px",
              border: "1px solid #EEF2F6",
            }}
          >
            <h4 style={{ fontSize: "13px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "10px" }}>
              Risk Legend
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} />
                <span style={{ fontWeight: 700, color: "#059669" }}>🟢 Safe:</span>
                <span style={{ color: "#64748B" }}>Optimal biomechanical range</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
                <span style={{ fontWeight: 700, color: "#D97706" }}>🟠 Moderate:</span>
                <span style={{ color: "#64748B" }}>Elevated biomechanical stress</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
                <span style={{ fontWeight: 700, color: "#DC2626" }}>🔴 High Risk:</span>
                <span style={{ color: "#64748B" }}>Potential ACL stress indicator</span>
              </div>
            </div>
          </div>

          {/* Joint Risk Summary Table */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "18px",
              padding: "18px",
              border: "1px solid #EEF2F6",
              boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
            }}
          >
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Crosshair size={17} color="#2563EB" />
              Joint Risk Summary
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {jointList.map((j) => (
                <div
                  key={j.key}
                  onClick={() => setSelectedJointKey(selectedJointKey === j.key ? null : j.key)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    background: selectedJointKey === j.key ? "#EFF6FF" : "#F8FAFC",
                    border: "1px solid",
                    borderColor: selectedJointKey === j.key ? "#BFDBFE" : "#EEF2F6",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: j.color }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B" }}>{j.name}</span>
                    {j.valgus != null && (
                      <span style={{ fontSize: "12px", color: "#64748B" }}>({Math.round(j.valgus)}° Valgus)</span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: j.color,
                      background: j.tier === "HIGH" ? "#FEF2F2" : j.tier === "MODERATE" ? "#FFFBEB" : "#ECFDF5",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      border: `1px solid ${j.tier === "HIGH" ? "#FECACA" : j.tier === "MODERATE" ? "#FDE68A" : "#A7F3D0"}`,
                    }}
                  >
                    {j.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Human-Readable Risk Explanation Card */}
          <div
            style={{
              background: "#EEF5FF",
              border: "1px solid #BFDBFE",
              borderRadius: "18px",
              padding: "16px 18px",
              marginTop: "auto",
            }}
          >
            <h4 style={{ fontSize: "13px", fontWeight: 800, color: "#1E40AF", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Info size={16} />
              Biomechanical Observation
            </h4>
            <p style={{ fontSize: "12px", color: "#1E3A8A", lineHeight: "18px", margin: 0 }}>
              {explanation}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
