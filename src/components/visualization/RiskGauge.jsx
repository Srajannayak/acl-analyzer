import { useEffect, useState, useId } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

/**
 * RiskGauge - Premium 3D-styled animated circular risk gauge
 * Animates smoothly from 0% to actual risk score.
 */
export default function RiskGauge({
  score = 0,
  level = "LOW RISK",
  confidence = null,
  size = 250,
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const filterId = useId().replace(/:/g, "_");

  // Normalize inputs
  const targetScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const normalizedLevel = String(level || "LOW RISK").toUpperCase();
  const isHigh = normalizedLevel.includes("HIGH") || targetScore > 60;
  const isModerate = normalizedLevel.includes("MODERATE") || (targetScore > 30 && targetScore <= 60);

  const tier = isHigh ? "high" : isModerate ? "moderate" : "low";
  const tierLabel = isHigh ? "HIGH RISK" : isModerate ? "MODERATE RISK" : "LOW RISK";

  // Tier color definitions matching Medical AI design system
  const colorMap = {
    low: {
      primary: "#0284c7",     // Cool Medical Blue
      secondary: "#38bdf8",   // Soft Cyan
      track: "#e0f2fe",
      glow: "rgba(2, 132, 199, 0.3)",
      badgeBg: "#f0f9ff",
      badgeBorder: "#bae6fd",
      badgeText: "#0369a1",
      icon: ShieldCheck,
    },
    moderate: {
      primary: "#f59e0b",     // Warm Amber
      secondary: "#fbbf24",   // Soft Gold
      track: "#fef3c7",
      glow: "rgba(245, 158, 11, 0.3)",
      badgeBg: "#fffbeb",
      badgeBorder: "#fde68a",
      badgeText: "#b45309",
      icon: AlertTriangle,
    },
    high: {
      primary: "#ef4444",     // Medical Red
      secondary: "#f87171",   // Soft Crimson
      track: "#fee2e2",
      glow: "rgba(239, 68, 68, 0.35)",
      badgeBg: "#fef2f2",
      badgeBorder: "#fecaca",
      badgeText: "#b91c1c",
      icon: ShieldAlert,
    },
  };

  const currentColors = colorMap[tier];
  const IconComponent = currentColors.icon;

  // Animate counter and gauge fill smoothly from 0 to targetScore
  useEffect(() => {
    let startTimestamp = null;
    const duration = 1200; // ms
    const initialScore = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(initialScore + (targetScore - initialScore) * easeOut);
      setAnimatedScore(currentVal);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetScore]);

  // SVG Gauge calculations
  // Gauge spans 260 degrees arc (from 140deg to 400deg)
  const strokeWidth = 16;
  const radius = (size - strokeWidth * 2 - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc angle is 260 degrees
  const arcLength = circumference * (260 / 360);
  // Filled proportion along the 260 degree arc
  const strokeDashoffset = arcLength - (arcLength * (animatedScore / 100));

  return (
    <div className="risk-gauge-component" style={{ width: "100%", maxWidth: `${size + 40}px`, margin: "0 auto" }}>
      <div className="gauge-header" style={{ textAlign: "center", marginBottom: "8px" }}>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "#64748b",
            textTransform: "uppercase",
          }}
        >
          AI ACL Risk Assessment
        </span>
      </div>

      <div className="gauge-svg-wrapper" style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="risk-gauge-svg"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* 3D Drop Shadow for Depth */}
            <filter id={`gaugeShadow_${filterId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={currentColors.glow} />
            </filter>

            {/* Inner Plate Shadow */}
            <filter id={`plateShadow_${filterId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(15, 23, 42, 0.06)" />
            </filter>

            {/* Active Arc Gradient */}
            <linearGradient id={`gaugeGrad_${filterId}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={currentColors.primary} />
              <stop offset="100%" stopColor={currentColors.secondary} />
            </linearGradient>

            {/* Inner Plate Radial Gradient */}
            <radialGradient id={`innerPlate_${filterId}`} cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="85%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </radialGradient>
          </defs>

          {/* Layer 1: Subtle Outer Decorative Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + 12}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Layer 2: Inner Plate (Soft 3D layered disk) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth / 2 - 6}
            fill={`url(#innerPlate_${filterId})`}
            filter={`url(#plateShadow_${filterId})`}
          />

          {/* Layer 3: Gauge Background Track (260 degree arc) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform={`rotate(140 ${size / 2} ${size / 2})`}
          />

          {/* Layer 4: Active Animated Colored Risk Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#gaugeGrad_${filterId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(140 ${size / 2} ${size / 2})`}
            filter={`url(#gaugeShadow_${filterId})`}
            style={{
              transition: "stroke-dashoffset 0.1s linear, stroke 0.4s ease",
            }}
          />

          {/* Decorative Scale Ticks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angleDeg = 140 + (tick / 100) * 260;
            const angleRad = (angleDeg * Math.PI) / 180;
            const tickInner = radius + strokeWidth / 2 + 3;
            const tickOuter = radius + strokeWidth / 2 + 7;
            const x1 = size / 2 + tickInner * Math.cos(angleRad);
            const y1 = size / 2 + tickInner * Math.sin(angleRad);
            const x2 = size / 2 + tickOuter * Math.cos(angleRad);
            const y2 = size / 2 + tickOuter * Math.sin(angleRad);

            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Center Content: Animated Percentage & Tier Badge */}
        <div
          className="gauge-center-content"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            paddingTop: "6px",
          }}
        >
          <div
            className="gauge-score-number"
            style={{
              fontSize: size > 240 ? "52px" : "44px",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: currentColors.primary,
              textShadow: `0 2px 10px ${currentColors.glow}`,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {animatedScore}%
          </div>

          <div
            className="gauge-tier-badge"
            style={{
              marginTop: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 14px",
              borderRadius: "9999px",
              background: currentColors.badgeBg,
              border: `1px solid ${currentColors.badgeBorder}`,
              color: currentColors.badgeText,
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.04em",
              boxShadow: `0 2px 8px ${currentColors.glow}`,
            }}
          >
            <IconComponent size={14} />
            <span>{tierLabel}</span>
          </div>

          {confidence && (
            <span
              style={{
                marginTop: "6px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
              }}
            >
              ML Confidence: {confidence}
            </span>
          )}
        </div>
      </div>

      {/* Scale Indicator Marks below the arc */}
      <div
        className="gauge-scale-legend"
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 16px",
          marginTop: "-14px",
          fontSize: "11px",
          fontWeight: 700,
          color: "#94a3b8",
        }}
      >
        <span style={{ color: "#0284c7" }}>0% Low</span>
        <span style={{ color: "#f59e0b" }}>31% Moderate</span>
        <span style={{ color: "#ef4444" }}>61%+ High</span>
      </div>
    </div>
  );
}
