import {
  Activity,
  BrainCircuit,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

import "../../styles/home.css";

const features = [
  {
    icon: <Activity size={34} />,
    title: "Pose Estimation",
    description:
      "Extract athlete body keypoints using AI-powered pose estimation for biomechanical analysis.",
  },
  {
    icon: <BrainCircuit size={34} />,
    title: "ACL Risk Prediction",
    description:
      "Machine learning models estimate injury risk based on joint movement and posture.",
  },
  {
    icon: <BarChart3 size={34} />,
    title: "Biomechanics Analytics",
    description:
      "Visualize joint angles, movement symmetry and landing mechanics in real time.",
  },
  {
    icon: <ShieldCheck size={34} />,
    title: "Performance Insights",
    description:
      "Generate preventive recommendations to improve athlete safety and performance.",
  },
];

const FeatureCards = () => {
  return (
    <section className="features-section">

      <div className="section-heading">

        <span>OUR FEATURES</span>

        <h2>
          Intelligent ACL Injury
          <br />
          Risk Analysis
        </h2>

      </div>

      <div className="feature-grid">

        {features.map((item, index) => (

          <div className="feature-card" key={index}>

            <div className="feature-icon">
              {item.icon}
            </div>

            <h3>{item.title}</h3>

            <p>{item.description}</p>

          </div>

        ))}

      </div>

    </section>
  );
};

export default FeatureCards;