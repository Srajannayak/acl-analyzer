import {
  Users,
  Activity,
  ShieldCheck,
  BrainCircuit,
} from "lucide-react";

import "../../styles/statistics.css";

const stats = [
  {
    icon: <Users size={34} />,
    number: "500+",
    title: "Athletes Analysed",
  },
  {
    icon: <Activity size={34} />,
    number: "98%",
    title: "Pose Accuracy",
  },
  {
    icon: <BrainCircuit size={34} />,
    number: "95%",
    title: "Prediction Accuracy",
  },
  {
    icon: <ShieldCheck size={34} />,
    number: "24/7",
    title: "AI Monitoring",
  },
];

export default function Statistics() {
  return (
    <section className="stats">

      <div className="stats-heading">

        <span>OUR IMPACT</span>

        <h2>Trusted AI Sports Analytics</h2>

      </div>

      <div className="stats-grid">

        {stats.map((item, index) => (

          <div className="stat-card" key={index}>

            <div className="stat-icon">

              {item.icon}

            </div>

            <h1>{item.number}</h1>

            <p>{item.title}</p>

          </div>

        ))}

      </div>

    </section>
  );
}