import { useMemo } from "react";
import { Clock, Zap, AlertTriangle, ShieldCheck, PlayCircle } from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function RiskTimeline({ onSeekToTimestamp = null, currentVideoTime = 0 }) {
  const { analysisResult } = useAnalysis();

  const featureSequence = useMemo(() => analysisResult?.feature_sequence || [], [analysisResult]);
  const landing = analysisResult?.landing || {};
  const landingFrame = landing.landing_frame;
  const landingTimestampMs = landing.landing_timestamp ?? landing.landing_timestamp_ms;
  const peakRiskFrame = landing.peak_risk_frame ?? landingFrame;
  const peakRiskTimestampMs = landing.peak_risk_timestamp_ms ?? landingTimestampMs;
  const duration = analysisResult?.duration || 2.0;

  // Timeline markers
  const markers = [
    {
      id: "landing",
      name: "Initial Contact",
      frame: landingFrame,
      timestampMs: landingTimestampMs,
      type: "landing",
      color: "#2563EB",
      desc: "Ground impact touchdown",
    },
    {
      id: "peakRisk",
      name: "Peak Risk Point",
      frame: peakRiskFrame,
      timestampMs: peakRiskTimestampMs,
      type: "peak",
      color: "#DC2626",
      desc: "Highest dynamic knee stress",
    },
    {
      id: "stabilization",
      name: "Stabilization",
      frame: landing.end_frame,
      timestampMs: (landing.end_frame && analysisResult?.fps) ? (landing.end_frame / analysisResult.fps) * 1000 : null,
      type: "stable",
      color: "#16A34A",
      desc: "Deceleration recovery",
    },
  ].filter((m) => m.frame != null);

  const handleSeek = (ms) => {
    if (onSeekToTimestamp && ms != null) {
      onSeekToTimestamp(ms / 1000);
    }
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        padding: "20px 24px",
        border: "1px solid #EEF2F6",
        boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
        marginTop: "20px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={18} color="#2563EB" />
          Kinematic Timeline & Event Markers
        </h3>

        <div style={{ display: "flex", gap: "10px" }}>
          {landingTimestampMs != null && (
            <button
              onClick={() => handleSeek(landingTimestampMs)}
              style={{
                background: "#EEF5FF",
                color: "#2563EB",
                border: "1px solid #BFDBFE",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Zap size={14} />
              Jump to Landing ({landingFrame ? `#${landingFrame}` : ""})
            </button>
          )}

          {peakRiskTimestampMs != null && (
            <button
              onClick={() => handleSeek(peakRiskTimestampMs)}
              style={{
                background: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FECACA",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <AlertTriangle size={14} />
              Jump to Peak Risk ({peakRiskFrame ? `#${peakRiskFrame}` : ""})
            </button>
          )}
        </div>
      </div>

      {/* Visual Timeline Track */}
      <div style={{ position: "relative", height: "36px", margin: "14px 0 10px", background: "#F1F5F9", borderRadius: "10px", overflow: "hidden" }}>
        {/* Current playback head */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${Math.min(100, (currentVideoTime / Math.max(0.1, duration)) * 100)}%`,
            width: "3px",
            background: "#0F172A",
            zIndex: 3,
            transition: "left 0.1s linear",
          }}
        />

        {/* Markers plotted along the track */}
        {markers.map((marker) => {
          const pct = Math.min(100, Math.max(0, ((marker.timestampMs || 0) / (duration * 1000)) * 100));
          return (
            <div
              key={marker.id}
              onClick={() => handleSeek(marker.timestampMs)}
              style={{
                position: "absolute",
                top: "4px",
                left: `${pct}%`,
                transform: "translateX(-50%)",
                background: marker.color,
                color: "white",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                zIndex: 2,
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              title={`${marker.name}: ${marker.desc} (Click to Seek)`}
            >
              <span>●</span>
              <span>{marker.name}</span>
            </div>
          );
        })}
      </div>

      {/* Legend & Details */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B" }}>
        <span>0.00s (Start)</span>
        <span>
          Current Position: <b>{currentVideoTime.toFixed(2)}s</b> / {duration.toFixed(2)}s
        </span>
        <span>{duration.toFixed(2)}s (End)</span>
      </div>
    </div>
  );
}
