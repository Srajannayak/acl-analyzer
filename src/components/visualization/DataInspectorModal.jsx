import { useState } from "react";
import { Code, Download, ChevronDown, ChevronUp, FileSpreadsheet, FileJson } from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function DataInspectorModal() {
  const { analysisResult } = useAnalysis();
  const [expanded, setExpanded] = useState(false);

  if (!analysisResult) return null;

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysisResult, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${analysisResult.analysis_id || "acl_analysis"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const sequence = analysisResult.feature_sequence || [];
    if (sequence.length === 0) {
      alert("No frame sequence data available to export.");
      return;
    }

    const headers = [
      "frame",
      "timestamp_ms",
      "knee_flexion",
      "left_knee_flexion",
      "right_knee_flexion",
      "knee_valgus",
      "left_knee_valgus",
      "right_knee_valgus",
      "hip_flexion",
      "trunk_inclination",
      "ankle_dorsiflexion",
      "landing_symmetry",
    ];

    const rows = sequence.map((s) => {
      const f = s.features || {};
      return [
        s.frame,
        s.timestamp_ms,
        f.knee_flexion ?? "",
        f.left_knee_flexion ?? "",
        f.right_knee_flexion ?? "",
        f.knee_valgus ?? "",
        f.left_knee_valgus ?? "",
        f.right_knee_valgus ?? "",
        f.hip_flexion ?? "",
        f.trunk_inclination ?? "",
        f.ankle_dorsiflexion ?? "",
        f.landing_symmetry ?? "",
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers.join(","), ...rows].join("\n"));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", `${analysisResult.analysis_id || "acl_kinematics"}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <section className="section-container">
      <div
        className="athlete-overview-card"
        style={{ padding: "18px 24px", margin: 0, flexDirection: "column", alignItems: "stretch" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
            onClick={() => setExpanded(!expanded)}
          >
            <Code size={20} color="#2563EB" />
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
              Technical Data Inspector & Raw Telemetry
            </h3>
            {expanded ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleExportJSON}
              style={{
                background: "#EEF5FF",
                color: "#2563EB",
                border: "1px solid #BFDBFE",
                padding: "8px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FileJson size={15} />
              Export JSON
            </button>

            <button
              onClick={handleExportCSV}
              style={{
                background: "#ECFDF5",
                color: "#059669",
                border: "1px solid #A7F3D0",
                padding: "8px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FileSpreadsheet size={15} />
              Export CSV
            </button>
          </div>
        </div>

        {expanded && (
          <div style={{ marginTop: "16px" }}>
            <pre
              style={{
                background: "#0F172A",
                color: "#38BDF8",
                padding: "16px",
                borderRadius: "12px",
                fontSize: "12px",
                maxHeight: "300px",
                overflowY: "auto",
                fontFamily: "monospace",
              }}
            >
              {JSON.stringify(analysisResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
