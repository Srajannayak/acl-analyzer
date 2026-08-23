import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Activity,
  Zap,
  Flame,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  Eye,
  Video,
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

export default function BiomechanicalRiskReplay() {
  const { analysisResult } = useAnalysis();
  const [data, setData] = useState(analysisResult);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSkeletonOverlay, setShowSkeletonOverlay] = useState(true);
  const [showHeatAuras, setShowHeatAuras] = useState(true);
  const [showMotionTrails, setShowMotionTrails] = useState(true);
  const [hoveredJoint, setHoveredJoint] = useState(null);
  const [selectedJointKey, setSelectedJointKey] = useState(null);
  const [isLandingReplaying, setIsLandingReplaying] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);

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
      console.error("Failed to parse analysisResult:", e);
    }
  }, [analysisResult]);

  const rawUrl =
    data?.video_url ||
    data?.processed_video ||
    data?.processed_video_url;

  const videoUrl = rawUrl
    ? rawUrl.startsWith("http")
      ? rawUrl
      : `http://127.0.0.1:5000${rawUrl}`
    : null;

  const featureSequence = useMemo(() => data?.feature_sequence || [], [data]);
  const totalFrames = data?.frames ?? (featureSequence.length || 1);
  const fps = data?.fps && data.fps > 0 ? Number(data.fps) : 30.0;
  const duration = data?.duration ? Number(data.duration) : (totalFrames / fps);

  const landing = data?.landing || {};
  const landingFrame = landing.landing_frame;
  const landingTimestampMs = landing.landing_timestamp ?? landing.landing_timestamp_ms;
  const peakRiskFrame = landing.peak_risk_frame ?? landingFrame;
  const peakRiskTimestampMs = landing.peak_risk_timestamp_ms ?? landingTimestampMs;
  const landingStartFrame = landing.start_frame ?? Math.max(1, (landingFrame || 10) - 5);
  const landingEndFrame = landing.end_frame ?? Math.min(totalFrames, (landingFrame || 10) + 12);
  const phases = landing.phases || {};

  // Find closest frame data based on currentTime
  const currentFrameIdx = useMemo(() => {
    if (featureSequence.length === 0) return 0;
    const currentMs = currentTime * 1000;
    let closest = 0;
    let minDiff = Infinity;
    for (let i = 0; i < featureSequence.length; i++) {
      const ts = featureSequence[i].timestamp_ms ?? (i * (1000 / fps));
      const diff = Math.abs(ts - currentMs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    return closest;
  }, [currentTime, featureSequence, fps]);

  const activeFrameData = featureSequence[currentFrameIdx] || featureSequence[0] || null;
  const activeLandmarks = activeFrameData?.landmarks || [];
  const activeFeatures = activeFrameData?.features || data?.landing_features || data?.features || {};

  // Compute live joint stress for active frame
  const liveJointStress = useMemo(() => {
    const valgus = activeFeatures.knee_valgus ?? activeFeatures.left_knee_valgus ?? 0;
    const lValgus = activeFeatures.left_knee_valgus ?? valgus;
    const rValgus = activeFeatures.right_knee_valgus ?? valgus;

    const flexion = activeFeatures.knee_flexion ?? 60;
    const lFlexion = activeFeatures.left_knee_flexion ?? flexion;
    const rFlexion = activeFeatures.right_knee_flexion ?? flexion;

    const hipFlex = activeFeatures.hip_flexion ?? 60;
    const lHipFlex = activeFeatures.left_hip_flexion ?? hipFlex;
    const rHipFlex = activeFeatures.right_hip_flexion ?? hipFlex;

    const ankleFlex = activeFeatures.ankle_dorsiflexion ?? 30;
    const lAnkle = activeFeatures.left_ankle_dorsiflexion ?? ankleFlex;
    const rAnkle = activeFeatures.right_ankle_dorsiflexion ?? ankleFlex;

    const calcKneeStress = (valg, flex) => {
      let score = 0.15;
      if (valg >= 11) score += 0.60;
      else if (valg >= 6) score += 0.38;
      else if (valg >= 3) score += 0.18;

      if (flex < 42) score += 0.25;
      else if (flex < 52) score += 0.15;
      return Math.min(1.0, score);
    };

    const leftKnee = calcKneeStress(lValgus, lFlexion);
    const rightKnee = calcKneeStress(rValgus, rFlexion);
    const calcHipStress = (h) => Math.min(1.0, 0.15 + (h < 45 ? 0.4 : 0.1));
    const calcAnkleStress = (a) => Math.min(1.0, 0.15 + (a < 22 ? 0.4 : 0.1));

    return {
      leftKnee: {
        key: "leftKnee",
        name: "Left Knee",
        landmarkIndex: JOINTS.LEFT_KNEE,
        score: leftKnee,
        valgus: lValgus,
        flexion: lFlexion,
        riskTier: leftKnee >= 0.65 ? "High Loading" : leftKnee >= 0.4 ? "Moderate Loading" : "Optimal",
        color: leftKnee >= 0.65 ? "#EF4444" : leftKnee >= 0.4 ? "#F59E0B" : "#10B981",
        label: leftKnee >= 0.65 ? `HIGH VALGUS ${Math.round(lValgus)}°` : leftKnee >= 0.4 ? `VALGUS ${Math.round(lValgus)}°` : "STABLE",
      },
      rightKnee: {
        key: "rightKnee",
        name: "Right Knee",
        landmarkIndex: JOINTS.RIGHT_KNEE,
        score: rightKnee,
        valgus: rValgus,
        flexion: rFlexion,
        riskTier: rightKnee >= 0.65 ? "High Loading" : rightKnee >= 0.4 ? "Moderate Loading" : "Optimal",
        color: rightKnee >= 0.65 ? "#EF4444" : rightKnee >= 0.4 ? "#F59E0B" : "#10B981",
        label: rightKnee >= 0.65 ? `HIGH VALGUS ${Math.round(rValgus)}°` : rightKnee >= 0.4 ? `VALGUS ${Math.round(rValgus)}°` : "STABLE",
      },
      leftHip: {
        key: "leftHip",
        name: "Left Hip",
        landmarkIndex: JOINTS.LEFT_HIP,
        score: calcHipStress(lHipFlex),
        flexion: lHipFlex,
        riskTier: calcHipStress(lHipFlex) >= 0.6 ? "Moderate" : "Optimal",
        color: calcHipStress(lHipFlex) >= 0.6 ? "#F59E0B" : "#10B981",
      },
      rightHip: {
        key: "rightHip",
        name: "Right Hip",
        landmarkIndex: JOINTS.RIGHT_HIP,
        score: calcHipStress(rHipFlex),
        flexion: rHipFlex,
        riskTier: calcHipStress(rHipFlex) >= 0.6 ? "Moderate" : "Optimal",
        color: calcHipStress(rHipFlex) >= 0.6 ? "#F59E0B" : "#10B981",
      },
      leftAnkle: {
        key: "leftAnkle",
        name: "Left Ankle",
        landmarkIndex: JOINTS.LEFT_ANKLE,
        score: calcAnkleStress(lAnkle),
        dorsiflexion: lAnkle,
        riskTier: calcAnkleStress(lAnkle) >= 0.6 ? "Moderate" : "Optimal",
        color: calcAnkleStress(lAnkle) >= 0.6 ? "#F59E0B" : "#10B981",
      },
      rightAnkle: {
        key: "rightAnkle",
        name: "Right Ankle",
        landmarkIndex: JOINTS.RIGHT_ANKLE,
        score: calcAnkleStress(rAnkle),
        dorsiflexion: rAnkle,
        riskTier: calcAnkleStress(rAnkle) >= 0.6 ? "Moderate" : "Optimal",
        color: calcAnkleStress(rAnkle) >= 0.6 ? "#F59E0B" : "#10B981",
      },
    };
  }, [activeFeatures]);

  // Current Movement Phase
  const currentPhaseName = useMemo(() => {
    const currentFrame = activeFrameData?.frame ?? (currentFrameIdx + 1);
    if (landingStartFrame && currentFrame < landingStartFrame) {
      return "Approach & Flight";
    }
    if (landingFrame && currentFrame >= landingStartFrame && currentFrame < landingFrame - 1) {
      return "Pre-Landing";
    }
    if (landingFrame && currentFrame >= landingFrame - 1 && currentFrame <= landingFrame + 2) {
      return "Initial Contact (Touchdown)";
    }
    if (landingFrame && currentFrame > landingFrame + 2 && currentFrame <= landingEndFrame) {
      return "Peak Impact Deceleration";
    }
    return "Stabilization & Recovery";
  }, [activeFrameData, currentFrameIdx, landingFrame, landingStartFrame, landingEndFrame]);

  // Live ACL Risk percentage (smoothly interpolated from frame valgus/flexion)
  const liveRiskScore = useMemo(() => {
    const maxKneeStress = Math.max(liveJointStress.leftKnee.score, liveJointStress.rightKnee.score);
    const baseRisk = data?.risk?.risk_score || data?.risk?.risk_percentage || 25;
    const dynamicScore = Math.round(baseRisk * 0.5 + (maxKneeStress * 100) * 0.5);
    return Math.min(99, Math.max(12, dynamicScore));
  }, [liveJointStress, data]);

  // Canvas Synchronized Drawing Loop
  const drawOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas buffer size to video display size
    const rect = video.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const width = canvas.width;
    const height = canvas.height;
    const now = Date.now() / 1000;

    ctx.clearRect(0, 0, width, height);

    if (!activeLandmarks || activeLandmarks.length < 33 || !showSkeletonOverlay) {
      return;
    }

    const getPos = (lm) => {
      if (!lm) return { x: width / 2, y: height / 2 };
      return {
        x: lm.x * width,
        y: lm.y * height,
      };
    };

    // 1. Motion Trails (Previous 2-3 Frames)
    if (showMotionTrails) {
      const trailIndices = [currentFrameIdx - 3, currentFrameIdx - 2, currentFrameIdx - 1].filter(
        (i) => i >= 0 && featureSequence[i]
      );

      trailIndices.forEach((tIdx, step) => {
        const tLandmarks = featureSequence[tIdx]?.landmarks;
        if (tLandmarks && tLandmarks.length >= 33) {
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.12 + step * 0.1})`;
          ctx.setLineDash([3, 3]);

          BONES.forEach(([s, e]) => {
            const p1 = getPos(tLandmarks[s]);
            const p2 = getPos(tLandmarks[e]);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          });
          ctx.setLineDash([]);
        }
      });
    }

    // 2. Main Glowing Neon Cybernetic Skeleton Linkages
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#38BDF8";
    ctx.strokeStyle = "rgba(37, 99, 235, 0.85)";

    BONES.forEach(([s, e]) => {
      const p1 = getPos(activeLandmarks[s]);
      const p2 = getPos(activeLandmarks[e]);

      const isLegLink =
        s === JOINTS.LEFT_HIP || e === JOINTS.LEFT_HIP ||
        s === JOINTS.RIGHT_HIP || e === JOINTS.RIGHT_HIP ||
        s === JOINTS.LEFT_KNEE || e === JOINTS.LEFT_KNEE ||
        s === JOINTS.RIGHT_KNEE || e === JOINTS.RIGHT_KNEE;

      ctx.strokeStyle = isLegLink ? "rgba(0, 240, 255, 0.9)" : "rgba(37, 99, 235, 0.85)";
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    ctx.shadowBlur = 0;

    // 3. RADIANT JOINT HEAT AURAS & STRESS PULSING
    const jointConfigs = [
      { key: "leftKnee", stress: liveJointStress.leftKnee, baseRadius: 28 },
      { key: "rightKnee", stress: liveJointStress.rightKnee, baseRadius: 28 },
      { key: "leftHip", stress: liveJointStress.leftHip, baseRadius: 18 },
      { key: "rightHip", stress: liveJointStress.rightHip, baseRadius: 18 },
      { key: "leftAnkle", stress: liveJointStress.leftAnkle, baseRadius: 16 },
      { key: "rightAnkle", stress: liveJointStress.rightAnkle, baseRadius: 16 },
    ];

    jointConfigs.forEach(({ key, stress, baseRadius }) => {
      const pos = getPos(activeLandmarks[stress.landmarkIndex]);
      const isFocused = selectedJointKey === key;

      if (showHeatAuras) {
        const pulse = stress.score >= 0.5 ? 1 + 0.18 * Math.sin(now * 4) : 1.0;
        const radius = baseRadius * (0.8 + stress.score * 0.8) * pulse * (isFocused ? 1.3 : 1.0);

        const auraGrad = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, radius);
        if (stress.score >= 0.65) {
          auraGrad.addColorStop(0, "#EF4444");
          auraGrad.addColorStop(0.35, "rgba(239, 68, 68, 0.7)");
          auraGrad.addColorStop(0.7, "rgba(239, 68, 68, 0.25)");
          auraGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
        } else if (stress.score >= 0.4) {
          auraGrad.addColorStop(0, "#F59E0B");
          auraGrad.addColorStop(0.4, "rgba(245, 158, 11, 0.6)");
          auraGrad.addColorStop(0.75, "rgba(245, 158, 11, 0.2)");
          auraGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
        } else {
          auraGrad.addColorStop(0, "#10B981");
          auraGrad.addColorStop(0.4, "rgba(16, 185, 129, 0.5)");
          auraGrad.addColorStop(0.75, "rgba(16, 185, 129, 0.15)");
          auraGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
        }

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Joint Node Core
      ctx.fillStyle = stress.color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isFocused ? 7 : 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dynamic Joint Label Badge on High/Moderate Stress Knees
      if (stress.label && (stress.score >= 0.4 || isFocused)) {
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        const labelWidth = ctx.measureText(stress.label).width + 12;

        const lx = pos.x + 12;
        const ly = pos.y - 12;

        ctx.beginPath();
        ctx.roundRect(lx, ly - 12, labelWidth, 16, 4);
        ctx.fill();

        ctx.strokeStyle = stress.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = stress.color;
        ctx.fillText(stress.label, lx + 6, ly);
      }
    });

    // 4. Head Node Indicator
    const nosePos = getPos(activeLandmarks[JOINTS.NOSE]);
    ctx.fillStyle = "#38BDF8";
    ctx.beginPath();
    ctx.arc(nosePos.x, nosePos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [
    activeLandmarks,
    liveJointStress,
    showSkeletonOverlay,
    showHeatAuras,
    showMotionTrails,
    selectedJointKey,
    currentFrameIdx,
    featureSequence,
  ]);

  // Video Animation Frame Loop
  useEffect(() => {
    const loop = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
      drawOverlay();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawOverlay]);

  // Video Transport Handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (newTime) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(duration, newTime));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const handleFrameStep = (deltaFrames) => {
    if (!videoRef.current) return;
    const frameTime = 1 / fps;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + deltaFrames * frameTime));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    if (!videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (speed) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackRate(speed);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    const elem = containerRef.current;
    if (!elem) return;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // REPLAY LANDING FEATURE
  const handleReplayLanding = () => {
    if (!videoRef.current || landingTimestampMs == null) return;

    // Start 0.45s before landing
    const startSec = Math.max(0, (landingTimestampMs / 1000) - 0.45);
    const endSec = Math.min(duration, (landingTimestampMs / 1000) + 0.85);

    videoRef.current.currentTime = startSec;
    videoRef.current.playbackRate = 0.5; // slow-mo landing inspection
    setPlaybackRate(0.5);
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
    setIsLandingReplaying(true);

    const checkInterval = setInterval(() => {
      if (videoRef.current && videoRef.current.currentTime >= endSec) {
        videoRef.current.pause();
        setIsPlaying(false);
        setIsLandingReplaying(false);
        clearInterval(checkInterval);
      }
    }, 100);
  };

  return (
    <section className="section-container" style={{ marginTop: "10px" }}>
      {/* Section Header */}
      <div className="section-title-wrapper">
        <h2 className="section-title">
          <Activity size={24} color="#2563EB" />
          Biomechanical Risk Replay & AI Motion Scanner
        </h2>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
          Synchronized Video, 3D Pose Skeleton, and Dynamic Kinetic Heat Overlay
        </span>
      </div>

      {/* Main Grid: Video + Live Telemetry */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 1.2fr",
          gap: "28px",
          alignItems: "stretch",
        }}
      >
        {/* Left Column: Player & Canvas Overlay */}
        <div
          ref={containerRef}
          className="athlete-overview-card"
          style={{
            padding: "20px",
            margin: 0,
            flexDirection: "column",
            alignItems: "stretch",
            background: "#FFFFFF",
          }}
        >
          {/* Top Status Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: isLandingReplaying ? "#FEF2F2" : isPlaying ? "#ECFDF5" : "#EEF5FF",
                  color: isLandingReplaying ? "#DC2626" : isPlaying ? "#059669" : "#2563EB",
                  padding: "5px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.03em",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isLandingReplaying ? "#DC2626" : isPlaying ? "#10B981" : "#2563EB",
                  }}
                />
                {isLandingReplaying ? "SLOW-MO LANDING REPLAY" : isPlaying ? "LIVE POSE STREAM" : "FRAME-PAUSED"}
              </span>

              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                Frame #{activeFrameData?.frame ?? (currentFrameIdx + 1)} • {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
              </span>
            </div>

            {/* Toggle Overlay Filters */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setShowSkeletonOverlay(!showSkeletonOverlay)}
                style={{
                  background: showSkeletonOverlay ? "#EEF5FF" : "#F1F5F9",
                  color: showSkeletonOverlay ? "#2563EB" : "#64748B",
                  border: "1px solid",
                  borderColor: showSkeletonOverlay ? "#BFDBFE" : "#E2E8F0",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Skeleton
              </button>

              <button
                onClick={() => setShowHeatAuras(!showHeatAuras)}
                style={{
                  background: showHeatAuras ? "#FEF2F2" : "#F1F5F9",
                  color: showHeatAuras ? "#DC2626" : "#64748B",
                  border: "1px solid",
                  borderColor: showHeatAuras ? "#FECACA" : "#E2E8F0",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Heat Auras
              </button>

              <button
                onClick={() => setShowMotionTrails(!showMotionTrails)}
                style={{
                  background: showMotionTrails ? "#ECFDF5" : "#F1F5F9",
                  color: showMotionTrails ? "#059669" : "#64748B",
                  border: "1px solid",
                  borderColor: showMotionTrails ? "#A7F3D0" : "#E2E8F0",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Trails
              </button>
            </div>
          </div>

          {/* Synchronized Video + Canvas Wrapper */}
          <div
            style={{
              position: "relative",
              borderRadius: "18px",
              overflow: "hidden",
              background: "#0F172A",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                preload="metadata"
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                style={{ width: "100%", maxHeight: "440px", display: "block" }}
              />
            ) : (
              <div style={{ padding: "60px 20px", color: "#94A3B8", textAlign: "center" }}>
                <Video size={40} style={{ margin: "0 auto 10px" }} />
                <p>Processed athlete video is loading...</p>
              </div>
            )}

            {/* Overlaid Canvas */}
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />

            {/* Legend inside video corner */}
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "14px",
                background: "rgba(15, 23, 42, 0.82)",
                backdropFilter: "blur(6px)",
                padding: "6px 14px",
                borderRadius: "10px",
                display: "flex",
                gap: "12px",
                fontSize: "11px",
                fontWeight: 700,
                color: "white",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }}></span> Optimal
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }}></span> Moderate
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }}></span> High Valgus
              </span>
            </div>
          </div>

          {/* Interactive Color-Coded Risk Timeline Track */}
          <div style={{ marginTop: "14px" }}>
            <div
              style={{
                position: "relative",
                height: "28px",
                background: "#E2E8F0",
                borderRadius: "8px",
                cursor: "pointer",
                overflow: "hidden",
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = clickX / rect.width;
                handleSeek(pct * duration);
              }}
            >
              {/* Highlight Landing Zone */}
              {landingStartFrame && landingEndFrame && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${Math.max(0, (landingStartFrame / totalFrames) * 100)}%`,
                    width: `${Math.min(100, ((landingEndFrame - landingStartFrame) / totalFrames) * 100)}%`,
                    background: "rgba(239, 68, 68, 0.25)",
                    borderLeft: "2px solid #EF4444",
                    borderRight: "2px solid #EF4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#DC2626",
                  }}
                >
                  LANDING WINDOW
                </div>
              )}

              {/* Touchdown Marker */}
              {landingTimestampMs != null && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${Math.min(100, ((landingTimestampMs / 1000) / duration) * 100)}%`,
                    width: "3px",
                    background: "#2563EB",
                    zIndex: 2,
                  }}
                  title="Impact Touchdown"
                />
              )}

              {/* Progress Playhead */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${Math.min(100, (currentTime / Math.max(0.1, duration)) * 100)}%`,
                  width: "4px",
                  background: "#0F172A",
                  zIndex: 3,
                  transition: "left 0.05s linear",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
              <span>0.00s</span>
              <span>Click timeline to scrub • Landing at {((landingTimestampMs || 0) / 1000).toFixed(2)}s</span>
              <span>{duration.toFixed(2)}s</span>
            </div>
          </div>

          {/* Custom Transport Controls Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid #EEF2F6",
            }}
          >
            {/* Play/Pause & Frame Steps */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={togglePlay}
                style={{
                  background: "#2563EB",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <button
                onClick={() => handleFrameStep(-1)}
                style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px", cursor: "pointer" }}
                title="Previous Frame"
              >
                <SkipBack size={15} color="#475569" />
              </button>

              <button
                onClick={() => handleFrameStep(1)}
                style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px", cursor: "pointer" }}
                title="Next Frame"
              >
                <SkipForward size={15} color="#475569" />
              </button>

              <button
                onClick={handleReplayLanding}
                style={{
                  background: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #FECACA",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 800,
                  fontSize: "13px",
                }}
                title="Automatically replay landing event in 0.5x slow-motion"
              >
                <Zap size={15} />
                Replay Landing
              </button>
            </div>

            {/* Playback Speed & Utilities */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ display: "flex", background: "#F1F5F9", borderRadius: "8px", padding: "2px" }}>
                {[0.25, 0.5, 1.0, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    style={{
                      border: "none",
                      background: playbackRate === s ? "#2563EB" : "transparent",
                      color: playbackRate === s ? "white" : "#64748B",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <button
                onClick={toggleMute}
                style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px", cursor: "pointer" }}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={15} color="#64748B" /> : <Volume2 size={15} color="#2563EB" />}
              </button>

              <button
                onClick={toggleFullscreen}
                style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px", cursor: "pointer" }}
                title="Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={15} color="#64748B" /> : <Maximize2 size={15} color="#64748B" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Synchronized Biomechanical Telemetry */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Live Risk Status Card */}
          <div
            style={{
              background: liveRiskScore >= 60 ? "#FEF2F2" : liveRiskScore >= 35 ? "#FFFBEB" : "#ECFDF5",
              border: `1px solid ${liveRiskScore >= 60 ? "#FECACA" : liveRiskScore >= 35 ? "#FDE68A" : "#A7F3D0"}`,
              borderRadius: "20px",
              padding: "22px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: liveRiskScore >= 60 ? "#DC2626" : liveRiskScore >= 35 ? "#D97706" : "#059669", textTransform: "uppercase" }}>
                Synchronized ACL Risk Indicator
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                {currentPhaseName}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", margin: "6px 0" }}>
              <span style={{ fontSize: "44px", fontWeight: 900, color: liveRiskScore >= 60 ? "#DC2626" : liveRiskScore >= 35 ? "#D97706" : "#059669", transition: "color 0.2s ease" }}>
                {liveRiskScore}%
              </span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: liveRiskScore >= 60 ? "#DC2626" : liveRiskScore >= 35 ? "#D97706" : "#059669" }}>
                {liveRiskScore >= 60 ? "HIGH RISK" : liveRiskScore >= 35 ? "MODERATE RISK" : "OPTIMAL"}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", lineHeight: "19px", margin: 0 }}>
              Primary loading contributor: <b>{liveJointStress.rightKnee.score >= liveJointStress.leftKnee.score ? "Right Knee Frontal Valgus" : "Left Knee Frontal Valgus"}</b>
            </p>
          </div>

          {/* Live Biomechanical Joint Angles Grid */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              padding: "20px",
              border: "1px solid #EEF2F6",
              boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
            }}
          >
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={17} color="#2563EB" />
              Live Frame Kinematics
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "12px", border: "1px solid #EEF2F6" }}>
                <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Knee Flexion (L / R)</span>
                <p style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A", margin: "3px 0 0" }}>
                  {Math.round(liveJointStress.leftKnee.flexion)}° / {Math.round(liveJointStress.rightKnee.flexion)}°
                </p>
              </div>

              <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "12px", border: "1px solid #EEF2F6" }}>
                <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Knee Valgus (L / R)</span>
                <p style={{ fontSize: "17px", fontWeight: 800, color: liveJointStress.rightKnee.valgus >= 8 || liveJointStress.leftKnee.valgus >= 8 ? "#DC2626" : "#059669", margin: "3px 0 0" }}>
                  {Math.round(liveJointStress.leftKnee.valgus)}° / {Math.round(liveJointStress.rightKnee.valgus)}°
                </p>
              </div>

              <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "12px", border: "1px solid #EEF2F6" }}>
                <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Hip Flexion</span>
                <p style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A", margin: "3px 0 0" }}>
                  {Math.round(activeFeatures.hip_flexion ?? 60)}°
                </p>
              </div>

              <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "12px", border: "1px solid #EEF2F6" }}>
                <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Landing Symmetry</span>
                <p style={{ fontSize: "17px", fontWeight: 800, color: "#2563EB", margin: "3px 0 0" }}>
                  {Math.round(activeFeatures.landing_symmetry ?? 50)}%
                </p>
              </div>
            </div>
          </div>

          {/* "Why is this Risky?" Educational Insight Panel */}
          <div
            style={{
              background: "#EEF5FF",
              border: "1px solid #BFDBFE",
              borderRadius: "20px",
              padding: "18px 20px",
              marginTop: "auto",
            }}
          >
            <h4 style={{ fontSize: "13px", fontWeight: 800, color: "#1E40AF", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Info size={16} />
              Why is this Risky?
            </h4>
            <p style={{ fontSize: "12px", color: "#1E3A8A", lineHeight: "18px", margin: 0 }}>
              Dynamic knee valgus combined with shallow knee flexion during ground impact generates substantial anterior shear force across the anterior cruciate ligament.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
