import { useState, useMemo } from "react";
import { GitCompare, TrendingDown, TrendingUp, Minus, ArrowRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function CompareAnalyses({ historyList = [] }) {
  const [selectedIdA, setSelectedIdA] = useState(historyList[0]?.analysis_id || "");
  const [selectedIdB, setSelectedIdB] = useState(historyList[1]?.analysis_id || "");

  const sessionA = useMemo(() => historyList.find((h) => h.analysis_id === selectedIdA) || historyList[0], [historyList, selectedIdA]);
  const sessionB = useMemo(() => historyList.find((h) => h.analysis_id === selectedIdB) || historyList[1], [historyList, selectedIdB]);

  // Risk Trend data over historical sessions
  const trendData = useMemo(() => {
    return [...historyList]
      .reverse()
      .map((item, idx) => ({
        index: idx + 1,
        session: `S${idx + 1}`,
        id: item.analysis_id,
        date: item.created_at ? item.created_at.split(" ")[0] : `Run #${idx + 1}`,
        risk: Math.round(item.risk?.risk_score || item.risk?.risk_percentage || 0),
        valgus: Math.round(item.landing_features?.knee_valgus || item.features?.knee_valgus || 0),
      }));
  }, [historyList]);

  if (!historyList || historyList.length < 2) {
    return (
      <div
        className="athlete-overview-card"
        style={{ padding: "24px", textAlign: "center", justifyContent: "center", margin: "24px 0" }}
      >
        <p style={{ color: "#64748B", fontSize: "14px" }}>
          At least 2 athlete sessions are required to run comparative progression analytics.
        </p>
      </div>
    );
  }

  // Calculate Delta
  const getVal = (sess, path, fallback = 0) => {
    if (!sess) return fallback;
    const f = sess.landing_features || sess.features || {};
    if (path === "risk") return Math.round(sess.risk?.risk_score || sess.risk?.risk_percentage || 0);
    if (path === "valgus") return Math.round(f.knee_valgus || 0);
    if (path === "flexion") return Math.round(f.knee_flexion || 0);
    if (path === "symmetry") return Math.round(f.landing_symmetry || 50);
    return fallback;
  };

  const riskA = getVal(sessionA, "risk");
  const riskB = getVal(sessionB, "risk");
  const riskDelta = riskB - riskA;

  const valgusA = getVal(sessionA, "valgus");
  const valgusB = getVal(sessionB, "valgus");

  const flexA = getVal(sessionA, "flexion");
  const flexB = getVal(sessionB, "flexion");

  const symmA = getVal(sessionA, "symmetry");
  const symmB = getVal(sessionB, "symmetry");

  return (
    <section className="section-container" style={{ marginTop: "30px" }}>
      <div className="section-title-wrapper">
        <h2 className="section-title">
          <GitCompare size={24} color="#2563EB" />
          Comparative Athlete Progression Analytics
        </h2>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
          Session-over-Session Kinematic Deltas
        </span>
      </div>

      <div
        className="athlete-overview-card"
        style={{ padding: "26px", flexDirection: "column", alignItems: "stretch", gap: "20px" }}
      >
        {/* Session Selectors */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Baseline Session (A)
            </label>
            <select
              value={selectedIdA}
              onChange={(e) => setSelectedIdA(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                fontSize: "13px",
                fontWeight: 600,
                color: "#0F172A",
                outline: "none",
                background: "white",
              }}
            >
              {historyList.map((h) => (
                <option key={h.analysis_id} value={h.analysis_id}>
                  {h.filename || "Video"} ({h.analysis_id}) — {Math.round(h.risk?.risk_score || 0)}% Risk
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "20px" }}>
            <ArrowRight size={20} color="#2563EB" />
          </div>

          <div style={{ flex: 1, minWidth: "220px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Comparison Session (B)
            </label>
            <select
              value={selectedIdB}
              onChange={(e) => setSelectedIdB(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                fontSize: "13px",
                fontWeight: 600,
                color: "#0F172A",
                outline: "none",
                background: "white",
              }}
            >
              {historyList.map((h) => (
                <option key={h.analysis_id} value={h.analysis_id}>
                  {h.filename || "Video"} ({h.analysis_id}) — {Math.round(h.risk?.risk_score || 0)}% Risk
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delta Comparison Matrix */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          {/* Risk Comparison */}
          <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "14px", border: "1px solid #EEF2F6" }}>
            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>ACL Risk Delta</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "6px 0" }}>
              <span style={{ fontSize: "20px", fontWeight: 800 }}>{riskA}% → {riskB}%</span>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: riskDelta < 0 ? "#059669" : riskDelta > 0 ? "#DC2626" : "#64748B",
              }}
            >
              {riskDelta < 0 ? `▼ Improved by ${Math.abs(riskDelta)}%` : riskDelta > 0 ? `▲ Increased by ${riskDelta}%` : "No Change"}
            </span>
          </div>

          {/* Valgus Comparison */}
          <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "14px", border: "1px solid #EEF2F6" }}>
            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Knee Valgus</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "6px 0" }}>
              <span style={{ fontSize: "20px", fontWeight: 800 }}>{valgusA}° → {valgusB}°</span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: valgusB <= valgusA ? "#059669" : "#DC2626" }}>
              {valgusB < valgusA ? `▼ Reduced by ${valgusA - valgusB}°` : valgusB > valgusA ? `▲ Increased by ${valgusB - valgusA}°` : "Equal"}
            </span>
          </div>

          {/* Flexion Depth */}
          <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "14px", border: "1px solid #EEF2F6" }}>
            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Knee Flexion Depth</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "6px 0" }}>
              <span style={{ fontSize: "20px", fontWeight: 800 }}>{flexA}° → {flexB}°</span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: flexB >= flexA ? "#059669" : "#D97706" }}>
              {flexB > flexA ? `▲ Deeper by ${flexB - flexA}°` : flexB < flexA ? `▼ Stiffer by ${flexA - flexB}°` : "Equal"}
            </span>
          </div>

          {/* Landing Symmetry */}
          <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "14px", border: "1px solid #EEF2F6" }}>
            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Bilateral Symmetry</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "6px 0" }}>
              <span style={{ fontSize: "20px", fontWeight: 800 }}>{symmA}% → {symmB}%</span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: Math.abs(symmB - 50) <= Math.abs(symmA - 50) ? "#059669" : "#D97706" }}>
              {Math.abs(symmB - 50) <= Math.abs(symmA - 50) ? "Better Balance" : "Asymmetric Delta"}
            </span>
          </div>
        </div>

        {/* Longitudinal Risk Progression Trendline */}
        <div style={{ marginTop: "10px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#334155", marginBottom: "12px" }}>
            Longitudinal ACL Risk Progression Trendline
          </h4>
          <div style={{ height: "180px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name) => [`${val}%`, name === "risk" ? "ACL Risk Score" : "Knee Valgus"]}
                  labelFormatter={(l) => `Session Date: ${l}`}
                />
                <Line type="monotone" dataKey="risk" stroke="#2563EB" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
