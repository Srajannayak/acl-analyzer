import { BookOpen, ShieldCheck, Activity, Scale, Compass, CheckCircle } from "lucide-react";

export default function EducationalLanding() {
  const educationalTopics = [
    {
      id: "knee_alignment",
      title: "Proper Knee Alignment",
      subtitle: "Preventing Medial Valgus Collapse",
      icon: Compass,
      tag: "Frontal Plane Stability",
      description:
        "During jump landings, knees should track squarely in the sagittal plane directly over the second toe. Medial collapse (knee valgus) increases anterior cruciate ligament tension exponentially.",
      keyPoints: [
        "Maintain parallel thigh-to-foot axis",
        "Engage gluteus medius during ground contact",
        "Avoid dynamic inward knee knocking",
      ],
      svgGraphic: (
        <svg width="220" height="130" viewBox="0 0 220 130">
          <line x1="20" y1="120" x2="200" y2="120" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" />
          {/* Aligned knee tracks */}
          <line x1="70" y1="20" x2="70" y2="70" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
          <line x1="70" y1="70" x2="70" y2="116" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
          <circle cx="70" cy="70" r="6" fill="#0284c7" />
          <line x1="150" y1="20" x2="150" y2="70" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
          <line x1="150" y1="70" x2="150" y2="116" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
          <circle cx="150" cy="70" r="6" fill="#0284c7" />
          <ellipse cx="70" cy="118" rx="10" ry="3" fill="#334155" />
          <ellipse cx="150" cy="118" rx="10" ry="3" fill="#334155" />
          <text x="110" y="65" textAnchor="middle" fill="#0284c7" fontSize="10" fontWeight="700">PARALLEL AXIS</text>
        </svg>
      ),
    },
    {
      id: "controlled_landing",
      title: "Controlled Shock Absorption",
      subtitle: "Dynamic Knee & Hip Flexion Cushion",
      icon: Activity,
      tag: "Sagittal Deceleration",
      description:
        "Stiff landings with straight knees deliver immediate ground reaction forces straight into passive skeletal structures. Controlled bending of knees and hips acts like a suspension spring.",
      keyPoints: [
        "Aim for ≥ 45° to 60° knee flexion",
        "Hinge hips and lean trunk gently forward",
        "Disperse impact through hamstrings & glutes",
      ],
      svgGraphic: (
        <svg width="220" height="130" viewBox="0 0 220 130">
          <line x1="20" y1="120" x2="200" y2="120" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" />
          {/* Spring shock absorber schematic */}
          <circle cx="110" cy="20" r="10" fill="#10b981" />
          <line x1="110" y1="30" x2="110" y2="50" stroke="#059669" strokeWidth="5" strokeLinecap="round" />
          {/* Spring zig-zag */}
          <path d="M 110,50 L 95,60 L 125,70 L 95,80 L 125,90 L 110,100" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="110" y1="100" x2="110" y2="118" stroke="#059669" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="110" cy="118" rx="14" ry="4" fill="#334155" />
          <text x="160" y="75" fill="#059669" fontSize="10" fontWeight="700">DYNAMIC CUSHION</text>
        </svg>
      ),
    },
    {
      id: "balanced_landing",
      title: "Balanced Landing Symmetry",
      subtitle: "Equal Bilateral Load Distribution",
      icon: Scale,
      tag: "Force Distribution",
      description:
        "Favoring one leg upon touchdown overloads the dominant knee and indicates potential neuromuscular deficit or lack of confidence from previous lower-extremity injury.",
      keyPoints: [
        "Ensure simultaneous two-foot contact sound",
        "Maintain equal 50/50 bodyweight transfer",
        "Screen for unilateral strength deficits",
      ],
      svgGraphic: (
        <svg width="220" height="130" viewBox="0 0 220 130">
          <line x1="20" y1="120" x2="200" y2="120" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" />
          {/* Balanced scale schematic */}
          <polygon points="110,95 95,118 125,118" fill="#64748b" />
          <line x1="40" y1="65" x2="180" y2="65" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
          <circle cx="110" cy="65" r="5" fill="#1d4ed8" />
          <rect x="45" y="45" width="25" height="20" rx="4" fill="#0284c7" />
          <text x="57" y="58" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">50%</text>
          <rect x="150" y="45" width="25" height="20" rx="4" fill="#0284c7" />
          <text x="162" y="58" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">50%</text>
          <text x="110" y="30" textAnchor="middle" fill="#0284c7" fontSize="10" fontWeight="700">BILATERAL SYMMETRY</text>
        </svg>
      ),
    },
  ];

  return (
    <section className="section-container" style={{ marginBottom: "28px" }}>
      <div className="card-3d" style={{ padding: "28px 32px" }}>
        {/* Section Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0284c7",
                }}
              >
                <BookOpen size={20} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Understanding Your Landing: Biomechanical Fundamentals
              </h2>
            </div>
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
              Key sports medicine principles that reduce ACL peak loading and reinforce safe neuromuscular landing mechanics.
            </p>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "20px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#166534",
            }}
          >
            <ShieldCheck size={14} color="#16a34a" />
            <span>Injury Prevention Protocol</span>
          </div>
        </div>

        {/* 3 Visual Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {educationalTopics.map((topic) => {
            const Icon = topic.icon;
            return (
              <div
                key={topic.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e0f2fe",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 18px rgba(2, 132, 199, 0.04)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                {/* Visual SVG schematic */}
                <div
                  style={{
                    height: "130px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  {topic.svgGraphic}
                </div>

                {/* Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: "#f0f9ff",
                      color: "#0284c7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#0284c7",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      background: "#e0f2fe",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {topic.tag}
                  </span>
                </div>

                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                  {topic.title}
                </h3>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "12.5px", fontWeight: 600, color: "#64748b" }}>
                  {topic.subtitle}
                </h4>

                <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#334155", lineHeight: "1.5", flexGrow: 1 }}>
                  {topic.description}
                </p>

                {/* Key takeaway bullets */}
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
                    Clinical Recommendations:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#64748b", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {topic.keyPoints.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
