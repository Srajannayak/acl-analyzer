import { useEffect, useState, useRef } from "react";
import { Activity, Play, Zap, Camera, Download, X, Eye } from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function VideoPanel({ onTimeUpdate = null, seekTime = null }) {
  const { analysisResult } = useAnalysis();
  const [videoData, setVideoData] = useState(analysisResult);
  const [snapshotImg, setSnapshotImg] = useState(null);
  const [snapshotTime, setSnapshotTime] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    if (analysisResult) {
      setVideoData(analysisResult);
      return;
    }

    try {
      const storedData = sessionStorage.getItem("analysisResult");
      if (storedData) {
        setVideoData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Unable to load analysis result:", error);
    }
  }, [analysisResult]);

  // Handle external seek requests
  useEffect(() => {
    if (seekTime != null && videoRef.current) {
      videoRef.current.currentTime = seekTime;
      videoRef.current.play().catch(() => {});
    }
  }, [seekTime]);

  const rawUrl =
    videoData?.video_url ||
    videoData?.processed_video ||
    videoData?.processed_video_url;

  const videoUrl = rawUrl
    ? rawUrl.startsWith("http")
      ? rawUrl
      : `http://127.0.0.1:5000${rawUrl}`
    : null;

  const frames = videoData?.frames ?? (videoData?.total_frames ?? 0);
  const fps = videoData?.fps ? Math.round(Number(videoData.fps) * 10) / 10 : 0;
  const duration = videoData?.duration
    ? `${Math.round(Number(videoData.duration) * 100) / 100}s`
    : "0s";

  const landing = videoData?.landing || {};
  const landingFrame = landing.landing_frame;
  const landingTimestampMs =
    landing.landing_timestamp ?? landing.landing_timestamp_ms;

  const handleJumpToLanding = () => {
    if (videoRef.current && landingTimestampMs != null) {
      videoRef.current.currentTime = Math.max(0, landingTimestampMs / 1000);
      videoRef.current.play().catch(() => {});
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && onTimeUpdate) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleCaptureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setSnapshotImg(dataUrl);
      setSnapshotTime(video.currentTime);
    } catch (e) {
      console.warn("Snapshot capture prevented by browser security (CORS):", e);
    }
  };

  const [scannerActive, setScannerActive] = useState(true);

  return (
    <div className="video-panel-wrapper card-3d">
      <div className="video-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="video-header-icon-box">
            <Activity size={18} color="#0284c7" />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Biomechanical Video Analysis
            </h2>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
              Kinematic Landing & Dynamic Pose Tracking
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setScannerActive((prev) => !prev)}
            className="video-scanner-toggle-btn"
            style={{
              background: scannerActive ? "#f0f9ff" : "#f8fafc",
              color: scannerActive ? "#0284c7" : "#64748b",
              border: `1px solid ${scannerActive ? "#bae6fd" : "#e2e8f0"}`,
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
            title="Toggle AI biomechanical scanning HUD overlay"
          >
            <Zap size={14} color={scannerActive ? "#0284c7" : "#94a3b8"} />
            AI HUD: {scannerActive ? "Active" : "Muted"}
          </button>

          <button
            onClick={handleCaptureSnapshot}
            style={{
              background: "#ffffff",
              color: "#334155",
              border: "1px solid #e2e8f0",
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
            title="Capture current video frame snapshot"
          >
            <Camera size={14} color="#0284c7" />
            Capture Frame
          </button>
        </div>
      </div>

      <div className="video-container" style={{ position: "relative", overflow: "hidden", borderRadius: "16px" }}>
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              controls
              className="video-player"
              src={videoUrl}
              preload="metadata"
              playsInline
              crossOrigin="anonymous"
              onTimeUpdate={handleVideoTimeUpdate}
            >
              Your browser does not support HTML5 video.
            </video>

            {/* AI HUD Biomechanical Scanning Overlay */}
            {scannerActive && (
              <div
                className="ai-scanner-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              >
                {/* Moving Scan Line */}
                <div className="ai-scanner-line" />

                {/* HUD Corner Brackets */}
                <div className="hud-bracket top-left" />
                <div className="hud-bracket top-right" />
                <div className="hud-bracket bottom-left" />
                <div className="hud-bracket bottom-right" />

                {/* HUD Live Status Badge */}
                <div
                  className="hud-status-chip"
                  style={{
                    position: "absolute",
                    top: "14px",
                    left: "14px",
                    background: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(6px)",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    letterSpacing: "0.04em",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                  }}
                >
                  <span className="scanner-beacon" />
                  <span>POSE TRACKER ACTIVE</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            className="video-placeholder-ai"
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: "16px",
              color: "#64748b",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div className="ai-scanner-line" />
            <Activity size={36} color="#0284c7" style={{ marginBottom: "10px" }} />
            <p style={{ fontWeight: 700, fontSize: "14px", color: "#334155" }}>
              Video Stream & Landmark Overlay
            </p>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Tracking 33 MediaPipe Kinematic Landmarks
            </span>
          </div>
        )}
      </div>

      {/* MediaPipe Pose Overlay Legend */}
      <div className="pose-legend">
        <span style={{ fontWeight: 700, color: "#334155", fontSize: "12px" }}>Overlay Legend:</span>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#0284c7" }}></div>
          <span style={{ fontSize: "12px" }}>Keypoints (33 Anatomical Joints)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#38bdf8" }}></div>
          <span style={{ fontSize: "12px" }}>Kinematic Linkages</span>
        </div>
        {landingFrame != null && (
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "#ef4444" }}></div>
            <span style={{ fontSize: "12px" }}>Impact Landing Frame (#{landingFrame})</span>
          </div>
        )}
      </div>

      {/* Video Telemetry & Quick-Jump */}
      <div className="video-info-grid">
        <div className="video-info-card card-3d">
          <h4>Total Frames</h4>
          <p>{frames > 0 ? frames : "--"}</p>
        </div>

        <div className="video-info-card card-3d">
          <h4>Framerate</h4>
          <p>{fps > 0 ? `${fps} fps` : "30 fps"}</p>
        </div>

        <div className="video-info-card card-3d">
          <h4>Duration</h4>
          <p>{duration !== "0s" ? duration : "--"}</p>
        </div>

        <div
          className={`video-info-card card-3d ${landingFrame != null ? "interactive" : ""}`}
          onClick={landingFrame != null ? handleJumpToLanding : undefined}
          title="Click to seek video directly to the impact landing frame"
        >
          <h4>Landing Event</h4>
          <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <Zap size={16} color="#0284c7" />
            {landingFrame != null ? `Frame #${landingFrame}` : "--"}
          </p>
        </div>
      </div>


      {/* Snapshot Modal */}
      {snapshotImg && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSnapshotImg(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                AI Analysis Snapshot ({snapshotTime.toFixed(2)}s)
              </h3>
              <button
                onClick={() => setSnapshotImg(null)}
                style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", padding: "6px", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <img
              src={snapshotImg}
              alt="Video Analysis Snapshot"
              style={{ width: "100%", borderRadius: "12px", marginBottom: "16px", border: "1px solid #E2E8F0" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <a
                href={snapshotImg}
                download={`acl_snapshot_${snapshotTime.toFixed(2)}s.png`}
                style={{
                  background: "#2563EB",
                  color: "white",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                }}
              >
                <Download size={16} />
                Download Snapshot
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}