import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function ChartsSection() {
  const { analysisResult } = useAnalysis();
  const [videoData, setVideoData] = useState(analysisResult);
  const [activeFilter, setActiveFilter] = useState("all");

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
      console.error("Failed to parse analysisResult for charts:", e);
    }
  }, [analysisResult]);

  const featureSequence = videoData?.feature_sequence || [];
  const landingFrame = videoData?.landing?.landing_frame;

  const chartData = featureSequence.map((item, index) => ({
    frame: item.frame ?? (index + 1),
    knee: item.features?.knee_flexion != null ? Math.round(Number(item.features.knee_flexion) * 10) / 10 : 0,
    hip: item.features?.hip_flexion != null ? Math.round(Number(item.features.hip_flexion) * 10) / 10 : 0,
    ankle: item.features?.ankle_dorsiflexion != null ? Math.round(Number(item.features.ankle_dorsiflexion) * 10) / 10 : 0,
  }));

  const showKnee = activeFilter === "all" || activeFilter === "knee";
  const showHip = activeFilter === "all" || activeFilter === "hip";
  const showAnkle = activeFilter === "all" || activeFilter === "ankle";

  return (
    <section className="section-container">
      <div className="chart-card-pro card-3d">
        <div className="chart-header">
          <div className="chart-title-area">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <div className="video-header-icon-box">
                <BarChart2 size={20} color="#0284c7" />
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Dynamic Joint Angle Trajectories
              </h2>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px" }}>
              Frame-by-frame angular motion throughout movement and ground impact
            </p>
          </div>

          <div className="chart-controls">
            <button
              className={`chart-filter-btn ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All Angles
            </button>
            <button
              className={`chart-filter-btn ${activeFilter === "knee" ? "active" : ""}`}
              onClick={() => setActiveFilter("knee")}
            >
              Knee
            </button>
            <button
              className={`chart-filter-btn ${activeFilter === "hip" ? "active" : ""}`}
              onClick={() => setActiveFilter("hip")}
            >
              Hip
            </button>
            <button
              className={`chart-filter-btn ${activeFilter === "ankle" ? "active" : ""}`}
              onClick={() => setActiveFilter("ankle")}
            >
              Ankle
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />

              <XAxis
                dataKey="frame"
                tick={{ fill: "#64748B", fontSize: 12 }}
                label={{ value: "Video Frame", position: "insideBottomRight", offset: -5, fill: "#94A3B8", fontSize: 12 }}
              />

              <YAxis
                tick={{ fill: "#64748B", fontSize: 12 }}
                label={{ value: "Angle (°)", angle: -90, position: "insideLeft", fill: "#94A3B8", fontSize: 12 }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  border: "1px solid #BAE6FD",
                  boxShadow: "0 10px 25px rgba(2,132,199,0.08)",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
                formatter={(value, name) => {
                  const label = name === "knee" ? "Knee Flexion" : name === "hip" ? "Hip Flexion" : "Ankle Dorsiflexion";
                  return [`${value}°`, label];
                }}
                labelFormatter={(label) => `Frame #${label}`}
              />

              {landingFrame != null && (
                <ReferenceLine
                  x={landingFrame}
                  stroke="#DC2626"
                  strokeDasharray="4 4"
                  label={{
                    value: `Landing (#${landingFrame})`,
                    position: "top",
                    fill: "#DC2626",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                />
              )}

              {showKnee && (
                <Line
                  type="monotone"
                  dataKey="knee"
                  name="Knee Flexion"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}

              {showHip && (
                <Line
                  type="monotone"
                  dataKey="hip"
                  name="Hip Flexion"
                  stroke="#0891b2"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}

              {showAnkle && (
                <Line
                  type="monotone"
                  dataKey="ankle"
                  name="Ankle Dorsiflexion"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>

        ) : (
          <div
            style={{
              height: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
            }}
          >
            <p>No kinematic feature sequence data available for this session.</p>
          </div>
        )}
      </div>
    </section>
  );
}