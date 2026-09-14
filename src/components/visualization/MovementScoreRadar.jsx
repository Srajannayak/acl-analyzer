import { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Award, Layers, PlayCircle } from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function MovementScoreRadar({ onSeekToTimestamp = null }) {
  const { analysisResult } = useAnalysis();

  const features = useMemo(() => {
    return analysisResult?.landing_features?.knee_flexion != null
      ? analysisResult.landing_features
      : (analysisResult?.features || {});
  }, [analysisResult]);

  const landing = analysisResult?.landing || {};
  const phases = landing.phases || {};

  // Compute 5-axis movement dimensions (0 to 100)
  const scores = useMemo(() => {
    const valgus = features.knee_valgus ?? 5;
    const flexion = features.knee_flexion ?? 60;
    const symmetry = features.landing_symmetry ?? 50;
    const hip = features.hip_flexion ?? 60;
    const ankle = features.ankle_dorsiflexion ?? 30;

    const kneeStability = Math.max(20, Math.min(100, Math.round(100 - valgus * 5)));
    const shockAbsorption = Math.max(20, Math.min(100, Math.round((flexion / 70) * 100)));
    const bilateralSymmetry = Math.max(20, Math.min(100, Math.round(100 - Math.abs(symmetry - 50) * 3.5)));
    const hipHinge = Math.max(20, Math.min(100, Math.round((hip / 65) * 100)));
    const ankleMobility = Math.max(20, Math.min(100, Math.round((ankle / 40) * 100)));

    const overallScore = Math.round(
      (kneeStability * 0.3) +
      (shockAbsorption * 0.25) +
      (bilateralSymmetry * 0.2) +
      (hipHinge * 0.15) +
      (ankleMobility * 0.1)
    );

    return {
      overallScore,
      kneeStability,
      shockAbsorption,
      bilateralSymmetry,
      hipHinge,
      ankleMobility,
      radarData: [
        { subject: "Knee Stability", athlete: kneeStability, ideal: 95 },
        { subject: "Shock Absorption", athlete: shockAbsorption, ideal: 90 },
        { subject: "Bilateral Symmetry", athlete: bilateralSymmetry, ideal: 95 },
        { subject: "Hip Hinge Depth", athlete: hipHinge, ideal: 90 },
        { subject: "Ankle Mobility", athlete: ankleMobility, ideal: 85 },
      ],
    };
  }, [features]);

  const handlePhaseClick = (phaseKey) => {
    const p = phases[phaseKey];
    if (p && onSeekToTimestamp) {
      if (p.timestamp_ms != null) {
        onSeekToTimestamp(p.timestamp_ms / 1000);
      } else if (p.start_frame && analysisResult?.fps) {
        onSeekToTimestamp(p.start_frame / analysisResult.fps);
      }
    }
  };

  return (
    <section className="section-container">
      <div className="section-title-wrapper">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="section-title-icon-box">
            <Award size={22} color="#0284c7" />
          </div>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>
              Athlete Movement Quality Score &amp; Radar Profile
            </h2>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
              Comprehensive 5-Axis Dynamic Evaluation
            </span>
          </div>
        </div>
      </div>

      <div
        className="athlete-overview-card card-3d"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: "28px",
          padding: "26px",
          alignItems: "center",
          margin: 0,
        }}
      >
        {/* Left Column: Score Gauge & Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              background: "#f0f9ff",
              borderRadius: "18px",
              padding: "20px",
              textAlign: "center",
              border: "1px solid #bae6fd",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Derived Movement Score
            </span>
            <div
              style={{
                fontSize: "52px",
                fontWeight: 900,
                color: scores.overallScore >= 75 ? "#0284c7" : scores.overallScore >= 55 ? "#f59e0b" : "#ef4444",
                margin: "6px 0",
                letterSpacing: "-0.04em",
              }}
            >
              {scores.overallScore} <span style={{ fontSize: "20px", color: "#94a3b8", fontWeight: 600 }}>/ 100</span>
            </div>
            <span
              style={{
                display: "inline-block",
                fontSize: "12px",
                fontWeight: 700,
                padding: "3px 12px",
                borderRadius: "9999px",
                background: "#ffffff",
                border: "1px solid #bae6fd",
                color: scores.overallScore >= 75 ? "#0284c7" : scores.overallScore >= 55 ? "#d97706" : "#dc2626",
              }}
            >
              {scores.overallScore >= 75 ? "Optimal Biomechanical Cushion" : scores.overallScore >= 55 ? "Moderate Movement Efficiency" : "Elevated Impact Risk"}
            </span>
          </div>

          {/* Movement Phase Buttons */}
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Layers size={15} color="#0284c7" />
              Jump to Movement Phase
            </h4>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { id: "approach", label: "Approach" },
                { id: "pre_landing", label: "Pre-Landing" },
                { id: "initial_contact", label: "Touchdown" },
                { id: "loading", label: "Peak Loading" },
                { id: "stabilization", label: "Stabilization" },
              ].map((phase) => (
                <button
                  key={phase.id}
                  onClick={() => handlePhaseClick(phase.id)}
                  style={{
                    background: "#f0f9ff",
                    color: "#0284c7",
                    border: "1px solid #bae6fd",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {phase.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recharts Radar Polygon */}
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={scores.radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#334155", fontSize: 11, fontWeight: 700 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Radar
                name="Athlete Profile"
                dataKey="athlete"
                stroke="#0284c7"
                fill="#38bdf8"
                fillOpacity={0.4}
              />
              <Radar
                name="Ideal Reference"
                dataKey="ideal"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.08}
                strokeDasharray="3 3"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #bae6fd",
                  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.1)",
                  fontSize: "12px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

