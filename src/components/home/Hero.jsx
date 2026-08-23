import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/hero.css";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="hero">

      <div className="hero-content">

        <div className="hero-left">

          <p className="hero-tag">
            AI Powered Sports Biomechanics
          </p>

          <h1>
            Analyze.
            <br />

            Predict.
            <br />

            <span>Prevent.</span>
          </h1>

          <p className="hero-description">
            AI-powered biomechanical analysis for ACL injury
            prediction in athletes.

            Smarter insights for a safer tomorrow.
          </p>

          <div className="hero-buttons">

            <button
              className="primary-btn"
              onClick={() => navigate("/upload")}
            >
              Analyze Athlete

              <ArrowRight size={18} />
            </button>

            <button
              className="secondary-btn"
              onClick={() => navigate("/about")}
            >
              Learn More
            </button>

          </div>

        </div>

        <div className="hero-right">

          <div className="circle one"></div>

          <div className="circle two"></div>

          <div className="circle three"></div>

          <img
            src="/hero.png"
            className="hero-image"
            alt="ACL Athlete"
          />

        </div>

      </div>

    </section>
  );
};

export default Hero;