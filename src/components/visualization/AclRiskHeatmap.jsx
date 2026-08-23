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
  Info,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

// Landmark indices for key joint centers
const JOINTS = {
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

export default function AclRiskHeatmap() {
  const { analysisResult } = useAnalysis();
  const [data, setData] = useState(analysisResult);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReplayingHighRisk, setIsReplayingHighRisk] = useState(false);

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
      console.error("Failed to parse analysisResult for AclRiskHeatmap:", e);
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

  // Find nearest analysis frame for current video playback time
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

  // Compute angle-based joint stress states
  const jointRiskStates = useMemo(() => {
    const valgus = activeFeatures.knee_valgus ?? activeFeatures.left_knee_valgus ?? 0;
    const lValgus = activeFeatures.left_knee_valgus ?? valgus;
    const rValgus = activeFeatures.right_knee_valgus ?? valgus;

    const flexion = activeFeatures.knee_flexion ?? 60;
    const lFlexion = activeFeatures.left_knee_flexion ?? flexion;
    const rFlexion = activeFeatures.right_knee_flexion ?? flexion;

    const hipFlex = activeFeatures.hip_flexion ?? 60;
    const ankleFlex = activeFeatures.ankle_dorsiflexion ?? 30;

    // Knee risk calculation: Safe (green) < 0.38, Moderate (orange) 0.38 - 0.64, High (red) >= 0.65
    const evaluateKnee = (valg, flex) => {
      let score = 0.15;
      if (valg >= 11) score += 0.60;
      else if (valg >= 6) score += 0.38;
      else if (valg >= 3) score += 0.18;

      if (flex < 42) score += 0.25;
      else if (flex < 52) score += 0.15;
      return Math.min(1.0, score);
    };

    const lScore = evaluateKnee(lValgus, lFlexion);
    const rScore = evaluateKnee(rValgus, rFlexion);

    const getRiskTier = (score) => {
      if (score >= 0.65) return { tier: "HIGH", label: "🔴 High Risk", color: "#EF4444", aura: "rgba(239, 68, 68, 0.65)", core: "#EF4444" };
      if (score >= 0.38) return { tier: "MODERATE", label: "🟠 Moderate", color: "#F59E0B", aura: "rgba(245, 158, 11, 0.55)", core: "#F59E0B" };
      return { tier: "SAFE", label: "🟢 Safe", color: "#10B981", aura: "rgba(16, 185, 129, 0.45)", core: "#10B981" };
    };

    const leftKneeRisk = getRiskTier(lScore);
    const rightKneeRisk = getRiskTier(rScore);
    const hipRisk = getRiskTier(hipFlex < 45 ? 0.45 : 0.2);
    const ankleRisk = getRiskTier(ankleFlex < 22 ? 0.45 : 0.2);

    const primaryKnee = rScore >= lScore ? "Right Knee" : "Left Knee";
    const primaryValgus = rScore >= lScore ? rValgus : lValgus;
    const primaryFlexion = rScore >= lScore ? rFlexion : lFlexion;
    const primaryRisk = rScore >= lScore ? rightKneeRisk : leftKneeRisk;

    return {
      leftKnee: { score: lScore, valgus: lValgus, flexion: lFlexion, ...leftKneeRisk, index: JOINTS.LEFT_KNEE },
      rightKnee: { score: rScore, valgus: rValgus, flexion: rFlexion, ...rightKneeRisk, index: JOINTS.RIGHT_KNEE },
      leftHip: { score: 0.2, flexion: hipFlex, ...hipRisk, index: JOINTS.LEFT_HIP },
      rightHip: { score: 0.2, flexion: hipFlex, ...hipRisk, index: JOINTS.RIGHT_HIP },
      leftAnkle: { score: 0.2, dorsiflexion: ankleFlex, ...ankleRisk, index: JOINTS.LEFT_ANKLE },
      rightAnkle: { score: 0.2, dorsiflexion: ankleFlex, ...ankleRisk, index: JOINTS.RIGHT_ANKLE },
      primary: {
        name: primaryKnee,
        valgus: primaryValgus,
        flexion: primaryFlexion,
        risk: primaryRisk,
      },
    };
  }, [activeFeatures]);

  // Current Movement Phase
  const currentPhase = useMemo(() => {
    const currentFrame = activeFrameData?.frame ?? (currentFrameIdx + 1);
    if (landingStartFrame && currentFrame < landingStartFrame) return "Approach & Flight";
    if (landingFrame && currentFrame >= landingStartFrame && currentFrame < landingFrame - 1) return "Pre-Landing";
    if (landingFrame && currentFrame >= landingFrame - 1 && currentFrame <= landingFrame + 2) return "Landing (Initial Contact)";
    if (landingFrame && currentFrame > landingFrame + 2 && currentFrame <= landingEndFrame) return "Loading (Deceleration)";
    return "Stabilization";
  }, [activeFrameData, currentFrameIdx, landingFrame, landingStartFrame, landingEndFrame]);

  // Overall Risk Score from backend
  const overallRiskScore = Math.round(data?.risk?.risk_score || data?.risk?.risk_percentage || 27);
  const overallRiskLevel = String(data?.risk?.risk_level || data?.risk?.label || data?.risk?.risk || "LOW").toUpperCase();

  // Draw Heatmap Overlay directly on Video
  const drawHeatmap = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = video.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const width = canvas.width;
    const height = canvas.height;
    const now = Date.now() / 1000;

    ctx.clearRect(0, 0, width, height);

    if (!activeLandmarks || activeLandmarks.length < 33) return;

    const getPos = (idx) => {
      const lm = activeLandmarks[idx];
      if (!lm) return { x: width / 2, y: height / 2 };
      return {
        x: lm.x * width,
        y: lm.y * height,
      };
    };

    // Draw Heatmap Soft Auras on Lower Body Joints
    const jointsToHeat = [
      { key: "rightKnee", data: jointRiskStates.rightKnee, baseRadius: 32 },
      { key: "leftKnee", data: jointRiskStates.leftKnee, baseRadius: 32 },
      { key: "rightHip", data: jointRiskStates.rightHip, baseRadius: 20 },
      { key: "leftHip", data: jointRiskStates.leftHip, baseRadius: 20 },
      { key: "rightAnkle", data: jointRiskStates.rightAnkle, baseRadius: 18 },
      { key: "leftAnkle", data: jointRiskStates.leftAnkle, baseRadius: 18 },
    ];

    jointsToHeat.forEach(({ data: jData, baseRadius }) => {
      const pos = getPos(jData.index);

      // Pulse multiplier on red / orange joints
      const pulse = jData.tier === "HIGH" ? 1 + 0.2 * Math.sin(now * 4.5) : jData.tier === "MODERATE" ? 1 + 0.1 * Math.sin(now * 3) : 1.0;
      const radius = baseRadius * (0.85 + jData.score * 0.75) * pulse;

      // Soft radial gradient
      const grad = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, radius);
      if (jData.tier === "HIGH") {
        grad.addColorStop(0, "#EF4444");
        grad.addColorStop(0.35, "rgba(239, 68, 68, 0.75)");
        grad.addColorStop(0.7, "rgba(239, 68, 68, 0.25)");
        grad.addColorStop(1, "rgba(239, 68, 68, 0)");
      } else if (jData.tier === "MODERATE") {
        grad.addColorStop(0, "#F59E0B");
        grad.addColorStop(0.4, "rgba(245, 158, 11, 0.65)");
        grad.addColorStop(0.75, "rgba(245, 158, 11, 0.2)");
        grad.addColorStop(1, "rgba(245, 158, 11, 0)");
      } else {
        grad.addColorStop(0, "#10B981");
        grad.addColorStop(0.4, "rgba(16, 185, 129, 0.55)");
        grad.addColorStop(0.75, "rgba(16, 185, 129, 0.15)");
        grad.addColorStop(1, "rgba(16, 185, 129, 0)");
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Small glowing center dot
      ctx.fillStyle = jData.core;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [activeLandmarks, jointRiskStates]);

  // Video Animation Frame Loop
  useEffect(() => {
    const loop = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
      drawHeatmap();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawHeatmap]);

  // Transport Handlers
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

  const handleFrameStep = (delta) => {
    if (!videoRef.current) return;
    const frameTime = 1 / fps;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta * frameTime));
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

  // REPLAY HIGH-RISK MOMENT ACTION
  const handleReplayHighRisk = () => {
    if (!videoRef.current) return;
    const targetMs = peakRiskTimestampMs ?? landingTimestampMs ?? (duration * 500);
    const startSec = Math.max(0, (targetMs / 1000) - 0.45);
    const endSec = Math.min(duration, (targetMs / 1000) + 0.85);

    videoRef.current.currentTime = startSec;
    videoRef.current.playbackRate = 0.5; // slow motion replay
    setPlaybackRate(0.5);
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
    setIsReplayingHighRisk(true);

    const checkInterval = setInterval(() => {
      if (videoRef.current && videoRef.current.currentTime >= endSec) {
        videoRef.current.pause();
        setIsPlaying(false);
        setIsReplayingHighRisk(false);
        clearInterval(checkInterval);
      }
    }, 100);
  };

  // User-Friendly "What are you seeing?" Explanation
  const whatAreYouSeeingText = useMemo(() => {
    if (jointRiskStates.primary.risk.tier === "HIGH") {
      return "Red indicates a high-risk biomechanical loading pattern (elevated knee valgus or stiff knee flexion) during this movement phase, creating heightened tension on the ACL ligament.";
    }
    if (jointRiskStates.primary.risk.tier === "MODERATE") {
      return "Orange indicates moderate biomechanical stress. The athlete exhibits mild inward knee displacement or sub-optimal flexion during ground contact.";
    }
    return "Green indicates an optimal, safe movement pattern. The athlete demonstrates aligned knee tracking and balanced bilateral force distribution.";
  }, [jointRiskStates]);

  return (
    <section className="section-container" style={{ marginTop: "24px" }}>
      {/* Section Header */}
      <div className="section-title-wrapper">
        <h2 className="section-title">
          <Flame size={24} color="#EF4444" />
          ACL Risk Heatmap
        </h2>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
          Watch how biomechanical risk changes throughout the athlete's movement
        </span>
      </div>

      {/* Main Grid: Heatmap Video + Live Telemetry */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 1.2fr",
          gap: "28px",
          alignItems: "stretch",
        }}
      >
        {/* Left Column: Heatmap Video Player */}
        <div
          ref={containerRef}
          className="athlete-overview-card"
          style={{
            padding: "22px",
            margin: 0,
            flexDirection: "column",
            alignItems: "stretch",
            background: "#FFFFFF",
          }}
        >
          {/* Top Control Bar & Risk Legend */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#334155" }}>
                BIOMECHANICAL RISK:
              </span>
              <div style={{ display: "flex", gap: "12px", fontSize: "12px", fontWeight: 700 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#059669" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} /> Safe
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#D97706" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} /> Moderate
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#DC2626" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} /> High Risk
                </span>
              </div>
            </div>

            <button
              onClick={handleReplayHighRisk}
              style={{
                background: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FECACA",
                borderRadius: "10px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              title="Automatically replay high-risk landing moment in 0.5x slow-motion"
            >
              <Zap size={14} />
              Replay High-Risk Moment
            </button>
          </div>

          {/* Synchronized Video + Transparent Canvas Overlay */}
          <div
            style={{
              position: "relative",
              borderRadius: "18px",
              overflow: "hidden",
              background: "#0F172A",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
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
                <p>Loading athlete video...</p>
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
          </div>

          {/* Color-Coded Risk Timeline */}
          <div style={{ marginTop: "14px" }}>
            <div
              style={{
                position: "relative",
                height: "26px",
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
              {/* Highlight Landing Event */}
              {landingStartFrame && landingEndFrame && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${Math.max(0, (landingStartFrame / totalFrames) * 100)}%`,
                    width: `${Math.min(100, ((landingEndFrame - landingStartFrame) / totalFrames) * 100)}%`,
                    background: "rgba(239, 68, 68, 0.28)",
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
                  LANDING EVENT
                </div>
              )}

              {/* Peak Risk Marker */}
              {peakRiskTimestampMs != null && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${Math.min(100, ((peakRiskTimestampMs / 1000) / duration) * 100)}%`,
                    width: "3px",
                    background: "#DC2626",
                    zIndex: 2,
                  }}
                  title="Peak Risk Moment"
                />
              )}

              {/* Playhead */}
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
              <span>Click timeline to seek • Landing at {((landingTimestampMs || 0) / 1000).toFixed(2)}s</span>
              <span>{duration.toFixed(2)}s</span>
            </div>
          </div>

          {/* Transport Controls Bar */}
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
            </div>

            {/* Playback Speed Selectors */}
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

        {/* Right Column: Live Heatmap Information & Explanations */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Live Risk Status Card */}
          <div
            style={{
              background: jointRiskStates.primary.risk.tier === "HIGH" ? "#FEF2F2" : jointRiskStates.primary.risk.tier === "MODERATE" ? "#FFFBEB" : "#ECFDF5",
              border: `1px solid ${jointRiskStates.primary.risk.tier === "HIGH" ? "#FECACA" : jointRiskStates.primary.risk.tier === "MODERATE" ? "#FDE68A" : "#A7F3D0"}`,
              borderRadius: "20px",
              padding: "22px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: jointRiskStates.primary.risk.color, textTransform: "uppercase" }}>
                Live Biomechanical Risk
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                {currentPhase}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", margin: "6px 0" }}>
              <span style={{ fontSize: "36px", fontWeight: 900, color: jointRiskStates.primary.risk.color }}>
                {jointRiskStates.primary.risk.label}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", lineHeight: "19px", margin: 0 }}>
              Primary Region: <b>{jointRiskStates.primary.name}</b> (Valgus: <b>{Math.round(jointRiskStates.primary.valgus)}°</b>)
            </p>
          </div>

          {/* Live Heatmap Information Metrics */}
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
              Live Frame Measurements
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "12px", border: "1px solid #EEF2F6" }}>
                <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>CURRENT FRAME</span>
                <p style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: "3px 0 0" }}>
                  #{activeFrameData?.frame ?? (currentFrameIdx + 1)} ({currentTime.toFixed(2)}s)
                </p>
              </div>

              <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "12px", border: "1px solid #EEF2F6" }}>
                <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>PRIMARY REGION</span>
                <p style={{ fontSize: "16px", fontWeight: 800, color: "#2563EB", margin: "3px 0 0" }}>
                  {jointRiskStates.primary.name}
                </p>
              </div>

              <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "12px", border: "1px solid #EEF2F6" }}>
                <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>KNEE FLEXION</span>
                <p style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: "3px 0 0" }}>
                  {Math.round(jointRiskStates.primary.flexion)}°
                </p>
              </div>

              <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "12px", border: "1px solid #EEF2F6" }}>
                <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>KNEE VALGUS</span>
                <p style={{ fontSize: "16px", fontWeight: 800, color: jointRiskStates.primary.valgus >= 8 ? "#DC2626" : "#059669", margin: "3px 0 0" }}>
                  {Math.round(jointRiskStates.primary.valgus)}° ({jointRiskStates.primary.valgus >= 8 ? "High" : "Normal"})
                </p>
              </div>
            </div>
          </div>

          {/* "WHAT ARE YOU SEEING?" User-Friendly Explanation Card */}
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
              WHAT ARE YOU SEEING?
            </h4>
            <p style={{ fontSize: "12px", color: "#1E3A8A", lineHeight: "18px", margin: 0 }}>
              {whatAreYouSeeingText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
