import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Flame,
  Info,
  Maximize2,
  Compass,
  Play,
  RotateCcw,
  Sliders,
  Crosshair,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  Eye,
  XCircle,
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
  // Upper body
  [JOINTS.LEFT_SHOULDER, JOINTS.RIGHT_SHOULDER],
  [JOINTS.LEFT_SHOULDER, JOINTS.LEFT_ELBOW],
  [JOINTS.LEFT_ELBOW, JOINTS.LEFT_WRIST],
  [JOINTS.RIGHT_SHOULDER, JOINTS.RIGHT_ELBOW],
  [JOINTS.RIGHT_ELBOW, JOINTS.RIGHT_WRIST],
  // Torso / Spine linkages
  [JOINTS.LEFT_SHOULDER, JOINTS.LEFT_HIP],
  [JOINTS.RIGHT_SHOULDER, JOINTS.RIGHT_HIP],
  [JOINTS.LEFT_HIP, JOINTS.RIGHT_HIP],
  // Lower body
  [JOINTS.LEFT_HIP, JOINTS.LEFT_KNEE],
  [JOINTS.RIGHT_HIP, JOINTS.RIGHT_KNEE],
  [JOINTS.LEFT_KNEE, JOINTS.LEFT_ANKLE],
  [JOINTS.RIGHT_KNEE, JOINTS.RIGHT_ANKLE],
  [JOINTS.LEFT_ANKLE, JOINTS.LEFT_HEEL],
  [JOINTS.RIGHT_ANKLE, JOINTS.RIGHT_HEEL],
  [JOINTS.LEFT_HEEL, JOINTS.LEFT_FOOT_INDEX],
  [JOINTS.RIGHT_HEEL, JOINTS.RIGHT_FOOT_INDEX],
  [JOINTS.LEFT_ANKLE, JOINTS.LEFT_FOOT_INDEX],
  [JOINTS.RIGHT_ANKLE, JOINTS.RIGHT_FOOT_INDEX],
];

export default function BiomechanicalHeatmap({ currentVideoTime = 0, onSeekToFrame = null }) {
  const { analysisResult } = useAnalysis();
  const [videoData, setVideoData] = useState(analysisResult);
  const [selectedJointFilter, setSelectedJointFilter] = useState("all");
  const [focusedJointKey, setFocusedJointKey] = useState(null);
  const [hoveredJoint, setHoveredJoint] = useState(null);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [scanlineProgress, setScanlineProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(true);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

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

  const featureSequence = useMemo(() => videoData?.feature_sequence || [], [videoData]);
  const landing = videoData?.landing || {};
  const landingFrame = landing.landing_frame;
  const peakRiskFrame = landing.peak_risk_frame ?? landingFrame;
  const peakRiskTimestampMs = landing.peak_risk_timestamp_ms ?? landing.landing_timestamp_ms;
  const totalFrames = videoData?.frames ?? (featureSequence.length || 1);
  const fps = videoData?.fps || 30.0;
  const phases = landing.phases || {};

  // Initial High-Tech Scanline sweep animation
  useEffect(() => {
    setIsScanning(true);
    let start = null;
    const duration = 1400; // 1.4s scanline

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      if (progress < 1.0) {
        setScanlineProgress(progress);
        requestAnimationFrame(step);
      } else {
        setScanlineProgress(1.0);
        setIsScanning(false);
      }
    };

    requestAnimationFrame(step);
  }, []);

  // Synchronize active frame with video playback time
  useEffect(() => {
    if (featureSequence.length === 0) return;

    if (currentVideoTime > 0) {
      const currentMs = currentVideoTime * 1000;
      let closestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < featureSequence.length; i++) {
        const diff = Math.abs((featureSequence[i].timestamp_ms ?? (i * (1000 / fps))) - currentMs);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }
      setActiveFrameIndex(closestIdx);
    }
  }, [currentVideoTime, featureSequence, fps]);

  // Set default frame to landing frame on initial load
  useEffect(() => {
    if (featureSequence.length > 0 && landingFrame) {
      const landingIdx = featureSequence.findIndex((f) => f.frame === landingFrame);
      if (landingIdx >= 0) {
        setActiveFrameIndex(landingIdx);
      }
    }
  }, [featureSequence, landingFrame]);

  const currentFrameData = featureSequence[activeFrameIndex] || featureSequence[0] || null;
  const currentLandmarks = currentFrameData?.landmarks || [];
  const currentFeatures = currentFrameData?.features || videoData?.landing_features || videoData?.features || {};

  // Compute real joint stress/intensity based on kinematics
  const jointStress = useMemo(() => {
    const valgus = currentFeatures.knee_valgus ?? currentFeatures.left_knee_valgus ?? 0;
    const lValgus = currentFeatures.left_knee_valgus ?? valgus;
    const rValgus = currentFeatures.right_knee_valgus ?? valgus;

    const flexion = currentFeatures.knee_flexion ?? 60;
    const lFlexion = currentFeatures.left_knee_flexion ?? flexion;
    const rFlexion = currentFeatures.right_knee_flexion ?? flexion;

    const hipFlex = currentFeatures.hip_flexion ?? 60;
    const lHipFlex = currentFeatures.left_hip_flexion ?? hipFlex;
    const rHipFlex = currentFeatures.right_hip_flexion ?? hipFlex;

    const ankleFlex = currentFeatures.ankle_dorsiflexion ?? 30;
    const lAnkleFlex = currentFeatures.left_ankle_dorsiflexion ?? ankleFlex;
    const rAnkleFlex = currentFeatures.right_ankle_dorsiflexion ?? ankleFlex;

    const trunk = currentFeatures.trunk_inclination ?? 15;

    // Knee stress formula (0.0 to 1.0) derived from measured valgus and flexion depth
    const calcKneeStress = (valg, flex) => {
      let score = 0.18;
      if (valg >= 12) score += 0.58;
      else if (valg >= 7) score += 0.38;
      else if (valg >= 3) score += 0.18;

      if (flex < 40) score += 0.24;
      else if (flex < 52) score += 0.14;
      return Math.min(1.0, score);
    };

    const leftKnee = calcKneeStress(lValgus, lFlexion);
    const rightKnee = calcKneeStress(rValgus, rFlexion);

    const calcHipStress = (hFlex) => Math.min(1.0, 0.15 + (hFlex < 45 ? 0.4 : 0.1));
    const calcAnkleStress = (aFlex) => Math.min(1.0, 0.15 + (aFlex < 22 ? 0.4 : 0.1));
    const trunkStress = Math.min(1.0, 0.2 + (trunk > 35 ? 0.35 : 0.1));

    return {
      leftKnee: {
        key: "leftKnee",
        name: "Left Knee Joint",
        landmarkIndex: JOINTS.LEFT_KNEE,
        score: leftKnee,
        valgus: lValgus,
        flexion: lFlexion,
        riskTier: leftKnee >= 0.65 ? "High Loading" : leftKnee >= 0.4 ? "Moderate Loading" : "Optimal Alignment",
        color: leftKnee >= 0.65 ? "#EF4444" : leftKnee >= 0.4 ? "#F59E0B" : "#10B981",
        insight: lValgus >= 8 ? `Dynamic medial valgus displacement (${Math.round(lValgus)}°) increases ACL strain.` : "Frontal alignment maintained within safe biomechanical limits.",
      },
      rightKnee: {
        key: "rightKnee",
        name: "Right Knee Joint",
        landmarkIndex: JOINTS.RIGHT_KNEE,
        score: rightKnee,
        valgus: rValgus,
        flexion: rFlexion,
        riskTier: rightKnee >= 0.65 ? "High Loading" : rightKnee >= 0.4 ? "Moderate Loading" : "Optimal Alignment",
        color: rightKnee >= 0.65 ? "#EF4444" : rightKnee >= 0.4 ? "#F59E0B" : "#10B981",
        insight: rValgus >= 8 ? `Dynamic medial valgus displacement (${Math.round(rValgus)}°) increases ACL strain.` : "Frontal alignment maintained within safe biomechanical limits.",
      },
      leftHip: {
        key: "leftHip",
        name: "Left Hip Joint",
        landmarkIndex: JOINTS.LEFT_HIP,
        score: calcHipStress(lHipFlex),
        flexion: lHipFlex,
        riskTier: calcHipStress(lHipFlex) >= 0.6 ? "Limited Hinge" : "Optimal Hinge",
        color: calcHipStress(lHipFlex) >= 0.6 ? "#F59E0B" : "#10B981",
        insight: lHipFlex < 50 ? "Upright hip angle limits gluteal posterior chain shock absorption." : "Deep hip hinge effectively dissipates vertical impact forces.",
      },
      rightHip: {
        key: "rightHip",
        name: "Right Hip Joint",
        landmarkIndex: JOINTS.RIGHT_HIP,
        score: calcHipStress(rHipFlex),
        flexion: rHipFlex,
        riskTier: calcHipStress(rHipFlex) >= 0.6 ? "Limited Hinge" : "Optimal Hinge",
        color: calcHipStress(rHipFlex) >= 0.6 ? "#F59E0B" : "#10B981",
        insight: rHipFlex < 50 ? "Upright hip angle limits gluteal posterior chain shock absorption." : "Deep hip hinge effectively dissipates vertical impact forces.",
      },
      leftAnkle: {
        key: "leftAnkle",
        name: "Left Ankle Complex",
        landmarkIndex: JOINTS.LEFT_ANKLE,
        score: calcAnkleStress(lAnkleFlex),
        dorsiflexion: lAnkleFlex,
        riskTier: calcAnkleStress(lAnkleFlex) >= 0.6 ? "Restricted Mobility" : "Optimal Dorsiflexion",
        color: calcAnkleStress(lAnkleFlex) >= 0.6 ? "#F59E0B" : "#10B981",
        insight: lAnkleFlex < 25 ? "Limited ankle dorsiflexion causes compensatory medial knee collapse." : "Good ankle compliance assists initial ground force absorption.",
      },
      rightAnkle: {
        key: "rightAnkle",
        name: "Right Ankle Complex",
        landmarkIndex: JOINTS.RIGHT_ANKLE,
        score: calcAnkleStress(rAnkleFlex),
        dorsiflexion: rAnkleFlex,
        riskTier: calcAnkleStress(rAnkleFlex) >= 0.6 ? "Restricted Mobility" : "Optimal Dorsiflexion",
        color: calcAnkleStress(rAnkleFlex) >= 0.6 ? "#F59E0B" : "#10B981",
        insight: rAnkleFlex < 25 ? "Limited ankle dorsiflexion causes compensatory medial knee collapse." : "Good ankle compliance assists initial ground force absorption.",
      },
      trunk: {
        key: "trunk",
        name: "Trunk Postural Lean",
        landmarkIndex: JOINTS.NOSE,
        score: trunkStress,
        inclination: trunk,
        riskTier: trunkStress >= 0.6 ? "Excessive Lean" : "Optimal Forward Lean",
        color: trunkStress >= 0.6 ? "#F59E0B" : "#10B981",
        insight: "Trunk alignment maintains center of mass over base of support.",
      },
    };
  }, [currentFeatures]);

  // Determine peak risk joint
  const peakJoint = useMemo(() => {
    if (jointStress.rightKnee.score >= jointStress.leftKnee.score) {
      return jointStress.rightKnee.score >= 0.4 ? jointStress.rightKnee : jointStress.leftKnee;
    }
    return jointStress.leftKnee;
  }, [jointStress]);

  // Overall Risk
  const rawRisk = videoData?.risk || {};
  const riskScore = Math.round(rawRisk.risk_score || rawRisk.risk_percentage || 0);
  const rawLabel = String(rawRisk.risk_level || rawRisk.label || rawRisk.risk || "LOW").toUpperCase();
  const isHigh = rawLabel.includes("HIGH") || riskScore > 60;
  const isModerate = rawLabel.includes("MODERATE") || (riskScore > 30 && riskScore <= 60);

  // RENDER ADVANCED BIOMECHANICAL SCAN SKELETON ON CANVAS
  const renderScan = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const now = Date.now() / 1000;

    ctx.clearRect(0, 0, width, height);

    // 1. Futuristic Scanning Chamber Background
    const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
    bgGradient.addColorStop(0, "#F8FAFC");
    bgGradient.addColorStop(0.6, "#EEF4FF");
    bgGradient.addColorStop(1, "#E2E8F0");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. High-Tech Target HUD Grid & Reticles
    ctx.strokeStyle = "rgba(203, 213, 225, 0.4)";
    ctx.lineWidth = 1;

    // Technical concentric scanning rings
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 90, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 170, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(width / 2, 20);
    ctx.lineTo(width / 2, height - 20);
    ctx.moveTo(20, height / 2);
    ctx.lineTo(width - 20, height / 2);
    ctx.stroke();

    // Corner HUD brackets
    const bracketSize = 16;
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 2.5;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(14, 14 + bracketSize);
    ctx.lineTo(14, 14);
    ctx.lineTo(14 + bracketSize, 14);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(width - 14 - bracketSize, 14);
    ctx.lineTo(width - 14, 14);
    ctx.lineTo(width - 14, 14 + bracketSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(14, height - 14 - bracketSize);
    ctx.lineTo(14, height - 14);
    ctx.lineTo(14 + bracketSize, height - 14);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(width - 14 - bracketSize, height - 14);
    ctx.lineTo(width - 14, height - 14);
    ctx.lineTo(width - 14, height - 14 - bracketSize);
    ctx.stroke();

    if (!currentLandmarks || currentLandmarks.length < 33) {
      ctx.fillStyle = "#64748B";
      ctx.font = "600 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("MediaPipe biomechanical tracking initializing...", width / 2, height / 2);
      return;
    }

    // Dynamic Coordinate Projection & Centering
    // Find athlete bounding box to scale & center smoothly
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    currentLandmarks.forEach((lm) => {
      if (lm && lm.x != null && lm.y != null) {
        if (lm.x < minX) minX = lm.x;
        if (lm.x > maxX) maxX = lm.x;
        if (lm.y < minY) minY = lm.y;
        if (lm.y > maxY) maxY = lm.y;
      }
    });

    const boxW = Math.max(0.2, maxX - minX);
    const boxH = Math.max(0.4, maxY - minY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const padX = 70;
    const padY = 50;
    const availW = width - padX * 2;
    const availH = height - padY * 2;

    const scale = Math.min(availW / boxW, availH / boxH) * 0.85;

    const getPos = (lm) => {
      if (!lm) return { x: width / 2, y: height / 2 };
      return {
        x: width / 2 + (lm.x - centerX) * scale,
        y: height / 2 + (lm.y - centerY) * scale,
      };
    };

    // 3. Motion Ghosting / Skeleton Trail (Previous Frames)
    const ghostIndices = [activeFrameIndex - 4, activeFrameIndex - 2].filter((i) => i >= 0 && featureSequence[i]);
    ghostIndices.forEach((gIdx, step) => {
      const gLandmarks = featureSequence[gIdx]?.landmarks;
      if (gLandmarks && gLandmarks.length >= 33) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = step === 0 ? "rgba(56, 189, 248, 0.12)" : "rgba(37, 99, 235, 0.22)";
        ctx.lineCap = "round";

        BONES.forEach(([s, e]) => {
          const p1 = getPos(gLandmarks[s]);
          const p2 = getPos(gLandmarks[e]);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        });
      }
    });

    // 4. Primary Glowing Cybernetic Skeleton
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#38BDF8";
    ctx.strokeStyle = "#2563EB";

    BONES.forEach(([s, e]) => {
      const p1 = getPos(currentLandmarks[s]);
      const p2 = getPos(currentLandmarks[e]);

      // Highlight linkages connected to focused joint
      const isFocusedLink =
        focusedJointKey &&
        ((focusedJointKey.includes("Knee") && (s === JOINTS.LEFT_KNEE || e === JOINTS.LEFT_KNEE || s === JOINTS.RIGHT_KNEE || e === JOINTS.RIGHT_KNEE)) ||
          (focusedJointKey.includes("Hip") && (s === JOINTS.LEFT_HIP || e === JOINTS.LEFT_HIP || s === JOINTS.RIGHT_HIP || e === JOINTS.RIGHT_HIP)));

      ctx.strokeStyle = isFocusedLink ? "#00F0FF" : focusedJointKey ? "rgba(148, 163, 184, 0.45)" : "#2563EB";
      ctx.lineWidth = isFocusedLink ? 6 : 4;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Reset shadow
    ctx.shadowBlur = 0;

    // 5. RADIANT JOINT HEAT AURAS & STRESS HALOS
    const jointConfigs = [
      { key: "leftKnee", stress: jointStress.leftKnee, radius: 36 },
      { key: "rightKnee", stress: jointStress.rightKnee, radius: 36 },
      { key: "leftHip", stress: jointStress.leftHip, radius: 26 },
      { key: "rightHip", stress: jointStress.rightHip, radius: 26 },
      { key: "leftAnkle", stress: jointStress.leftAnkle, radius: 22 },
      { key: "rightAnkle", stress: jointStress.rightAnkle, radius: 22 },
    ];

    jointConfigs.forEach(({ key, stress, radius }) => {
      const pos = getPos(currentLandmarks[stress.landmarkIndex]);
      const isFiltered =
        selectedJointFilter === "all" ||
        (selectedJointFilter === "knee" && key.includes("Knee")) ||
        (selectedJointFilter === "hip" && key.includes("Hip")) ||
        (selectedJointFilter === "ankle" && key.includes("Ankle"));

      if (!isFiltered) return;

      const isFocused = focusedJointKey === key;
      const isDimmed = focusedJointKey && !isFocused;

      if (isDimmed) {
        ctx.globalAlpha = 0.3;
      } else {
        ctx.globalAlpha = 1.0;
      }

      // Pulsing effect on high-risk joints
      const pulseMultiplier = stress.score >= 0.5 ? 1 + 0.15 * Math.sin(now * 3.5) : 1.0;
      const effectiveRadius = radius * (0.85 + stress.score * 0.75) * pulseMultiplier * (isFocused ? 1.3 : 1.0);

      // Multilayered Soft Radial Heat Aura
      const auraGradient = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, effectiveRadius);
      if (stress.score >= 0.65) {
        auraGradient.addColorStop(0, "#EF4444");
        auraGradient.addColorStop(0.3, "rgba(239, 68, 68, 0.65)");
        auraGradient.addColorStop(0.65, "rgba(239, 68, 68, 0.25)");
        auraGradient.addColorStop(1, "rgba(239, 68, 68, 0)");
      } else if (stress.score >= 0.4) {
        auraGradient.addColorStop(0, "#F59E0B");
        auraGradient.addColorStop(0.4, "rgba(245, 158, 11, 0.5)");
        auraGradient.addColorStop(0.7, "rgba(245, 158, 11, 0.18)");
        auraGradient.addColorStop(1, "rgba(245, 158, 11, 0)");
      } else {
        auraGradient.addColorStop(0, "#10B981");
        auraGradient.addColorStop(0.4, "rgba(16, 185, 129, 0.45)");
        auraGradient.addColorStop(0.7, "rgba(16, 185, 129, 0.15)");
        auraGradient.addColorStop(1, "rgba(16, 185, 129, 0)");
      }

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, effectiveRadius, 0, Math.PI * 2);
      ctx.fill();

      // Core Solid Joint Node
      ctx.fillStyle = stress.color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isFocused ? 9 : 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // If peak risk knee, draw animated targeting reticle
      if (key === peakJoint.key && stress.score >= 0.5) {
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, effectiveRadius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.globalAlpha = 1.0;
    });

    // 6. Anatomical Head Scanner Dome
    const nosePos = getPos(currentLandmarks[JOINTS.NOSE]);
    ctx.fillStyle = "#38BDF8";
    ctx.beginPath();
    ctx.arc(nosePos.x, nosePos.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 7. Initial AI Scanline Overlay
    if (isScanning && scanlineProgress < 1.0) {
      const scanY = scanlineProgress * height;
      const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      scanGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
      scanGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.45)");
      scanGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 20, width, 40);

      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();
    }
  }, [
    currentLandmarks,
    jointStress,
    selectedJointFilter,
    focusedJointKey,
    isScanning,
    scanlineProgress,
    activeFrameIndex,
    featureSequence,
    peakJoint,
  ]);

  // Run render loop
  useEffect(() => {
    renderScan();
    animFrameRef.current = requestAnimationFrame(renderScan);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [renderScan]);

  // Handle canvas mouse move for interactive joint hovering
  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentLandmarks || currentLandmarks.length < 33) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Find closest joint within 30px
    let found = null;
    let minD = 35;

    const jointsToCheck = [
      jointStress.leftKnee,
      jointStress.rightKnee,
      jointStress.leftHip,
      jointStress.rightHip,
      jointStress.leftAnkle,
      jointStress.rightAnkle,
    ];

    jointsToCheck.forEach((j) => {
      const lm = currentLandmarks[j.landmarkIndex];
      if (lm) {
        // Approximate coordinate calculation matching render
        const lmX = 60 + lm.x * (canvas.width - 120);
        const lmY = 40 + lm.y * (canvas.height - 80);
        const dist = Math.hypot(mouseX - lmX, mouseY - lmY);
        if (dist < minD) {
          minD = dist;
          found = { ...j, mouseX: e.clientX - rect.left, mouseY: e.clientY - rect.top };
        }
      }
    });

    setHoveredJoint(found);
  };

  const handleCanvasMouseLeave = () => {
    setHoveredJoint(null);
  };

  const handleCanvasClick = () => {
    if (hoveredJoint) {
      setFocusedJointKey(focusedJointKey === hoveredJoint.key ? null : hoveredJoint.key);
    }
  };

  // Actions
  const handleFocusOnPeakRisk = () => {
    if (peakRiskFrame) {
      const idx = featureSequence.findIndex((f) => f.frame === peakRiskFrame);
      if (idx >= 0) {
        setActiveFrameIndex(idx);
        const f = featureSequence[idx];
        if (onSeekToFrame) onSeekToFrame(f.frame, f.timestamp_ms);
      }
    }
    setFocusedJointKey(peakJoint.key);
  };

  const handleJumpToLanding = () => {
    if (landingFrame) {
      const idx = featureSequence.findIndex((f) => f.frame === landingFrame);
      if (idx >= 0) {
        setActiveFrameIndex(idx);
        const f = featureSequence[idx];
        if (onSeekToFrame) onSeekToFrame(f.frame, f.timestamp_ms);
      }
    }
    setFocusedJointKey(null);
  };

  const handleFrameSlider = (e) => {
    const idx = parseInt(e.target.value, 10);
    setActiveFrameIndex(idx);
    const frameObj = featureSequence[idx];
    if (frameObj && onSeekToFrame) {
      onSeekToFrame(frameObj.frame, frameObj.timestamp_ms);
    }
  };

  return (
    <section className="section-container">
      {/* Header */}
      <div className="section-title-wrapper">
        <h2 className="section-title">
          <Activity size={24} color="#2563EB" />
          Biomechanical Body Scan & Kinetic Heatmap
        </h2>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
          3D Kinetic Load Concentrations & Dynamic Pose Tracking
        </span>
      </div>

      {/* Main Scanner Card Container */}
      <div
        className="athlete-overview-card"
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: "28px",
          padding: "28px",
          alignItems: "stretch",
          margin: 0,
        }}
      >
        {/* Left Column: Biomechanical Body Scanner Chamber */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Top Control Bar & Live Status */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: isScanning ? "#EEF5FF" : "#ECFDF5",
                  color: isScanning ? "#2563EB" : "#059669",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.03em",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: isScanning ? "#2563EB" : "#10B981" }}></span>
                {isScanning ? "SCANNING BIOMECHANICS..." : "LIVE BIOMECHANICS ACTIVE"}
              </span>

              {focusedJointKey && (
                <button
                  onClick={() => setFocusedJointKey(null)}
                  style={{
                    background: "#FEF2F2",
                    color: "#DC2626",
                    border: "1px solid #FECACA",
                    borderRadius: "10px",
                    padding: "5px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <XCircle size={13} />
                  Clear Focus ({jointStress[focusedJointKey]?.name})
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleFocusOnPeakRisk}
                style={{
                  background: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #FECACA",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                title="Seek video and body scan directly to the peak-risk impact frame"
              >
                <Zap size={14} />
                Focus on Peak Risk
              </button>

              <button
                onClick={handleJumpToLanding}
                style={{
                  background: "#EEF5FF",
                  color: "#2563EB",
                  border: "1px solid #BFDBFE",
                  padding: "6px 12px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <RotateCcw size={14} />
                Reset Landing
              </button>
            </div>
          </div>

          {/* Canvas Scanning Chamber with Interactive HUD Tooltip */}
          <div
            style={{
              position: "relative",
              borderRadius: "20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
              overflow: "hidden",
              background: "#F8FAFC",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <canvas
              ref={canvasRef}
              width={520}
              height={460}
              style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
              onClick={handleCanvasClick}
            />

            {/* Floating Joint Inspection Tooltip */}
            {hoveredJoint && (
              <div
                style={{
                  position: "absolute",
                  left: `${Math.min(320, Math.max(10, hoveredJoint.mouseX + 15))}px`,
                  top: `${Math.min(320, Math.max(10, hoveredJoint.mouseY - 40))}px`,
                  background: "rgba(15, 23, 42, 0.92)",
                  backdropFilter: "blur(8px)",
                  color: "white",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
                  pointerEvents: "none",
                  zIndex: 20,
                  maxWidth: "260px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#38BDF8" }}>
                    {hoveredJoint.name}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: hoveredJoint.color,
                      background: "rgba(255,255,255,0.1)",
                      padding: "2px 6px",
                      borderRadius: "6px",
                    }}
                  >
                    {hoveredJoint.riskTier}
                  </span>
                </div>

                <div style={{ fontSize: "12px", color: "#CBD5E1", margin: "4px 0 6px" }}>
                  {hoveredJoint.valgus != null && (
                    <span>Valgus: <b>{Math.round(hoveredJoint.valgus)}°</b> • </span>
                  )}
                  {hoveredJoint.flexion != null && (
                    <span>Flexion: <b>{Math.round(hoveredJoint.flexion)}°</b></span>
                  )}
                  {hoveredJoint.dorsiflexion != null && (
                    <span>Dorsiflexion: <b>{Math.round(hoveredJoint.dorsiflexion)}°</b></span>
                  )}
                </div>

                <p style={{ fontSize: "11px", color: "#94A3B8", lineHeight: "15px", margin: 0 }}>
                  {hoveredJoint.insight}
                </p>
                <span style={{ fontSize: "10px", color: "#64748B", display: "block", marginTop: "4px" }}>
                  Click to lock joint focus
                </span>
              </div>
            )}

            {/* Heatmap Legend Overlay */}
            <div
              style={{
                position: "absolute",
                bottom: "14px",
                left: "16px",
                background: "rgba(255, 255, 255, 0.94)",
                backdropFilter: "blur(6px)",
                padding: "8px 16px",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                display: "flex",
                gap: "16px",
                fontSize: "11px",
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }}></span> Optimal
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }}></span> Moderate
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }}></span> Elevated Load
              </span>
            </div>
          </div>

          {/* Timeline Synchronization Slider */}
          <div style={{ padding: "0 6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B", marginBottom: "6px" }}>
              <span>
                <b>Synchronized Frame:</b> #{currentFrameData?.frame ?? activeFrameIndex + 1} of {totalFrames}
              </span>
              <span>
                <b>Time:</b> {((currentFrameData?.timestamp_ms ?? activeFrameIndex * 33.3) / 1000).toFixed(2)}s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, featureSequence.length - 1)}
              value={activeFrameIndex}
              onChange={handleFrameSlider}
              style={{ width: "100%", accentColor: "#2563EB", cursor: "pointer" }}
            />
          </div>
        </div>

        {/* Right Column: AI Biomechanical Insights & Key Findings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Top Peak Risk Summary Badge */}
          <div
            style={{
              background: isHigh ? "#FEF2F2" : isModerate ? "#FFFBEB" : "#ECFDF5",
              border: `1px solid ${isHigh ? "#FECACA" : isModerate ? "#FDE68A" : "#A7F3D0"}`,
              borderRadius: "18px",
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: isHigh ? "#DC2626" : isModerate ? "#D97706" : "#059669", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                AI Biomechanical Loading
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                Frame #{currentFrameData?.frame ?? activeFrameIndex + 1}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", margin: "4px 0" }}>
              <span style={{ fontSize: "36px", fontWeight: 900, color: isHigh ? "#DC2626" : isModerate ? "#D97706" : "#059669" }}>
                {riskScore}%
              </span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: isHigh ? "#DC2626" : isModerate ? "#D97706" : "#059669" }}>
                {rawLabel} RISK
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "#475569", lineHeight: "18px", margin: 0 }}>
              Peak mechanical stress concentrated around the <b>{peakJoint.name}</b> during ground impact touchdown.
            </p>
          </div>

          {/* "What is Happening?" Natural Language Biomechanical Feedback */}
          <div
            style={{
              background: "#F8FAFC",
              borderRadius: "18px",
              padding: "18px",
              border: "1px solid #EEF2F6",
            }}
          >
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Info size={16} color="#2563EB" />
              Biomechanical Observation
            </h4>
            <p style={{ fontSize: "13px", color: "#475569", lineHeight: "20px", marginBottom: "10px" }}>
              {peakJoint.score >= 0.6
                ? `Elevated dynamic medial knee displacement (${Math.round(peakJoint.valgus)}°) detected during impact deceleration.`
                : "Athlete maintains well-controlled lower-extremity frontal alignment and symmetric weight acceptance."}
            </p>
            <span style={{ fontSize: "12px", color: "#64748B", display: "block" }}>
              <b>Why it matters:</b> Proper knee and hip flexion cushions vertical landing forces, reducing anterior cruciate ligament shear stress.
            </span>
          </div>

          {/* 3 Visual Key Findings Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: "14px", border: "1px solid #E2E8F0", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", display: "block", marginBottom: "4px" }}>KNEE VALGUS</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: peakJoint.score >= 0.6 ? "#DC2626" : "#059669" }}>
                {Math.round(peakJoint.valgus)}°
              </span>
              <span style={{ fontSize: "10px", color: "#94A3B8", display: "block", marginTop: "2px" }}>
                {peakJoint.score >= 0.6 ? "Elevated" : "Optimal"}
              </span>
            </div>

            <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: "14px", border: "1px solid #E2E8F0", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", display: "block", marginBottom: "4px" }}>ASYMMETRY</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#2563EB" }}>
                {Math.round(currentFeatures.landing_symmetry ?? 50)}%
              </span>
              <span style={{ fontSize: "10px", color: "#94A3B8", display: "block", marginTop: "2px" }}>
                Bilateral Balance
              </span>
            </div>

            <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: "14px", border: "1px solid #E2E8F0", textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", display: "block", marginBottom: "4px" }}>FLEXION DEPTH</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: peakJoint.flexion >= 50 ? "#059669" : "#D97706" }}>
                {Math.round(peakJoint.flexion)}°
              </span>
              <span style={{ fontSize: "10px", color: "#94A3B8", display: "block", marginTop: "2px" }}>
                {peakJoint.flexion >= 50 ? "Optimal" : "Shallow"}
              </span>
            </div>
          </div>

          {/* Interactive Joint Filters */}
          <div style={{ marginTop: "auto" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Filter Anatomical Scan
            </span>
            <div className="chart-controls" style={{ width: "100%" }}>
              {[
                { id: "all", label: "Full Body" },
                { id: "knee", label: "Knee (ACL)" },
                { id: "hip", label: "Hips" },
                { id: "ankle", label: "Ankles" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  className={`chart-filter-btn ${selectedJointFilter === filter.id ? "active" : ""}`}
                  onClick={() => setSelectedJointFilter(filter.id)}
                  style={{ flex: 1, textAlign: "center" }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
