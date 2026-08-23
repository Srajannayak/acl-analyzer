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
        <h2 className="section-title">
          <Award size={24} color="#2563EB" />
          Athlete Movement Quality Score & Radar Profile
        </h2>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
          Comprehensive 5-Axis Dynamic Evaluation
        </span>
      </div>

      <div
        className="athlete-overview-card"
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
              background: "#F8FAFC",
              borderRadius: "18px",
              padding: "20px",
              textAlign: "center",
              border: "1px solid #EEF2F6",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Derived Movement Score
            </span>
            <div style={{ fontSize: "52px", fontWeight: 900, color: scores.overallScore >= 75 ? "#059669" : scores.overallScore >= 55 ? "#D97706" : "#DC2626", margin: "6px 0" }}>
              {scores.overallScore} <span style={{ fontSize: "22px", color: "#94A3B8" }}>/ 100</span>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>
              {scores.overallScore >= 75 ? "Optimal Biomechanical Mechanics" : scores.overallScore >= 55 ? "Moderate Movement Efficiency" : "Elevated Risk Pattern"}
            </span>
          </div>

          {/* Movement Phase Buttons */}
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Layers size={15} color="#2563EB" />
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
                    background: "#EEF5FF",
                    color: "#2563EB",
                    border: "1px solid #BFDBFE",
                    padding: "6px 10px",
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
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#334155", fontSize: 11, fontWeight: 700 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
              <Radar
                name="Athlete Profile"
                dataKey="athlete"
                stroke="#2563EB"
                fill="#3B82F6"
                fillOpacity={0.45}
              />
              <Radar
                name="Ideal Reference"
                dataKey="ideal"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.1}
                strokeDasharray="3 3"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
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
