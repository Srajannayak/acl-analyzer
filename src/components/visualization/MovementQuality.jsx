import { useEffect, useState } from "react";
import { ShieldCheck, Crosshair, Scale, Compass } from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function MovementQuality() {
  const { analysisResult } = useAnalysis();
  const [videoData, setVideoData] = useState(analysisResult);

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
      console.error("Failed to parse analysisResult for MovementQuality:", e);
    }
  }, [analysisResult]);

  const features = videoData?.landing_features?.knee_flexion != null
    ? videoData.landing_features
    : (videoData?.features || {});

  const kneeFlexion = features.knee_flexion != null ? Math.round(features.knee_flexion) : null;
  const kneeValgus = features.knee_valgus != null ? Math.round(features.knee_valgus) : null;
  const symmetry = features.landing_symmetry != null ? Math.round(features.landing_symmetry) : null;
  const trunkInclination = features.trunk_inclination != null ? Math.round(features.trunk_inclination) : null;

  // Derive quality parameters based on real biomechanical metrics
  const qualityItems = [
    {
      title: "Frontal Knee Stability",
      icon: <Crosshair size={18} color="#2563EB" />,
      status: kneeValgus == null ? "good" : kneeValgus < 6 ? "optimal" : kneeValgus < 11 ? "good" : "attention",
      statusLabel: kneeValgus == null ? "Good" : kneeValgus < 6 ? "Optimal" : kneeValgus < 11 ? "Moderate" : "Needs Attention",
      description: kneeValgus == null
        ? "Evaluation of knee alignment."
        : kneeValgus < 6
        ? "Excellent frontal plane control with minimal dynamic knee valgus collapse."
        : kneeValgus < 11
        ? "Mild inward knee displacement detected during peak impact deceleration."
        : "Significant inward knee collapse. Hip abductor and gluteal stabilization recommended.",
    },
    {
      title: "Landing Symmetry",
      icon: <Scale size={18} color="#2563EB" />,
      status: symmetry == null ? "good" : (symmetry >= 80 || (symmetry >= 46 && symmetry <= 54)) ? "optimal" : "attention",
      statusLabel: symmetry == null ? "Good" : (symmetry >= 80 || (symmetry >= 46 && symmetry <= 54)) ? "Optimal" : "Asymmetric",
      description: symmetry == null
        ? "Bilateral load sharing."
        : (symmetry >= 80 || (symmetry >= 46 && symmetry <= 54))
        ? "Symmetric weight acceptance across lower extremities."
        : "Asymmetrical force distribution detected. Practice bilateral ground contact drills.",
    },
    {
      title: "Impact Absorption",
      icon: <ShieldCheck size={18} color="#2563EB" />,
      status: kneeFlexion == null ? "good" : kneeFlexion >= 55 ? "optimal" : kneeFlexion >= 42 ? "good" : "attention",
      statusLabel: kneeFlexion == null ? "Good" : kneeFlexion >= 55 ? "Optimal" : kneeFlexion >= 42 ? "Good" : "Stiff Landing",
      description: kneeFlexion == null
        ? "Sagittal deceleration depth."
        : kneeFlexion >= 55
        ? "Deep knee flexion actively dissipates ground reaction forces away from the ACL."
        : kneeFlexion >= 42
        ? "Acceptable flexion angle. Aim for greater knee and hip bend upon initial contact."
        : "Extended knee posture during impact increases anterior tibial shear stress.",
    },
    {
      title: "Trunk Postural Control",
      icon: <Compass size={18} color="#2563EB" />,
      status: trunkInclination == null ? "good" : (trunkInclination >= 10 && trunkInclination <= 35) ? "optimal" : "good",
      statusLabel: trunkInclination == null ? "Good" : (trunkInclination >= 10 && trunkInclination <= 35) ? "Optimal" : "Standard",
      description: trunkInclination == null
        ? "Upper body posture during movement."
        : (trunkInclination >= 10 && trunkInclination <= 35)
        ? "Optimal forward trunk lean aligns center of mass over base of support."
        : "Postural alignment maintained during jump deceleration.",
    },
  ];

  return (
    <section className="section-container">
      <div className="section-title-wrapper">
        <h2 className="section-title">
          <ShieldCheck size={24} color="#2563EB" />
          Movement Quality Assessment
        </h2>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
          Biomechanical Control Criteria
        </span>
      </div>

      <div className="movement-quality-grid">
        {qualityItems.map((item, idx) => (
          <div className="quality-card" key={idx}>
            <div className="quality-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {item.icon}
                <span className="quality-title">{item.title}</span>
              </div>
              <span className={`quality-chip ${item.status}`}>
                {item.statusLabel}
              </span>
            </div>
            <p className="quality-desc">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
