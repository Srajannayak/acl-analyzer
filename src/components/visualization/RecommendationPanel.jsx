import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Dumbbell,
  HeartPulse,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";

export default function RecommendationPanel() {
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
      console.error("Failed to parse analysisResult for recommendations:", e);
    }
  }, [analysisResult]);

  const features = videoData?.landing_features?.knee_flexion != null
    ? videoData.landing_features
    : (videoData?.features || {});

  const valgus = features.knee_valgus ?? 0;
  const symmetry = features.landing_symmetry ?? 50;
  const kneeFlexion = features.knee_flexion ?? 0;
  const riskLabel = String(videoData?.risk?.risk_level || videoData?.risk?.label || videoData?.risk?.risk || "").toLowerCase();

  const getIcon = (type, title) => {
    if (type === "warning") {
      return <AlertTriangle size={22} />;
    }
    const t = (title || "").toLowerCase();
    if (t.includes("strength") || t.includes("flexion") || t.includes("conditioning")) {
      return <Dumbbell size={22} />;
    }
    if (t.includes("landing") || t.includes("control") || t.includes("symmetry")) {
      return <HeartPulse size={22} />;
    }
    return <ShieldCheck size={22} />;
  };

  let recommendations = [];
  if (Array.isArray(videoData?.recommendations) && videoData.recommendations.length > 0) {
    recommendations = videoData.recommendations.map((item) => ({
      type: item.type || "success",
      icon: getIcon(item.type, item.title),
      title: item.title || "Recommendation",
      description: item.description || "",
    }));
  } else {
    // 1. Frontal Valgus Recommendation
    if (valgus >= 10) {
      recommendations.push({
        type: "warning",
        icon: <AlertTriangle size={22} />,
        title: "Frontal Plane Knee Valgus Correction",
        description: `Elevated knee valgus (${Math.round(valgus)}°) detected during deceleration. Integrate targeted gluteus medius strengthening and banded squat/landing alignment drills.`,
      });
    } else {
      recommendations.push({
        type: "success",
        icon: <CheckCircle2 size={22} />,
        title: "Optimal Frontal Plane Alignment",
        description: `Knee valgus angle (${Math.round(valgus)}°) remains within normal biomechanical limits throughout the movement phase.`,
      });
    }

    // 2. Sagittal Flexion Depth
    if (kneeFlexion > 0 && kneeFlexion < 45) {
      recommendations.push({
        type: "warning",
        icon: <Dumbbell size={22} />,
        title: "Soft Landing & Deceleration Mechanics",
        description: `Stiff landing pattern observed (${Math.round(kneeFlexion)}° knee flexion). Focus on progressive depth landing drills with deeper knee and hip flexion to dissipate impact forces.`,
      });
    } else {
      recommendations.push({
        type: "success",
        icon: <Dumbbell size={22} />,
        title: "Eccentric Hamstring & Quad Conditioning",
        description: "Maintain targeted Nordic hamstring curls and multi-angle deceleration training to support dynamic knee joint stability.",
      });
    }

    // 3. Bilateral Symmetry
    if (symmetry < 42 || symmetry > 58) {
      recommendations.push({
        type: "warning",
        icon: <HeartPulse size={22} />,
        title: "Bilateral Load Sharing Drills",
        description: `Bilateral landing asymmetry detected (${Math.round(symmetry)}%). Practice box drop landings focusing on simultaneous, equalized two-foot ground contact.`,
      });
    } else {
      recommendations.push({
        type: "success",
        icon: <HeartPulse size={22} />,
        title: "Balanced Landing Symmetry",
        description: `Bilateral ground force acceptance is well-coordinated (${Math.round(symmetry)}%). Continue balanced plyometric conditioning.`,
      });
    }

    // 4. Monitoring & Periodic Screening
    recommendations.push({
      type: riskLabel.includes("high") ? "warning" : "info",
      icon: riskLabel.includes("high") ? <AlertTriangle size={22} /> : <Sparkles size={22} />,
      title: "Biomechanical Re-Assessment Protocol",
      description: "Re-evaluate athlete landing mechanics following a 4-to-6 week corrective neuromuscular training block to monitor kinematic progression.",
    });
  }

  return (
    <section className="recommendation-panel-pro">
      <div className="section-title-wrapper">
        <h2 className="section-title">
          <Sparkles size={24} color="#2563EB" />
          AI Performance Recommendations
        </h2>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
          Evidence-Based Preventive Protocols
        </span>
      </div>

      <div className="recommendation-grid">
        {recommendations.map((item, index) => (
          <div className={`rec-card ${item.type}`} key={index}>
            <div className="rec-icon-box">
              {item.icon}
            </div>
            <div className="rec-content">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}