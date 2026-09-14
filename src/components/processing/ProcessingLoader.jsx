import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Brain,
  LoaderCircle,
  Activity,
  Compass,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Video,
} from "lucide-react";

import { uploadVideo } from "../../services/api";
import { useAnalysis } from "../../context/AnalysisContext";
import {
  getStoredVideo,
  getActiveAnalysisPromise,
  setActiveAnalysisPromise,
  clearStoredVideo,
} from "../../services/videoStore";
import "../../styles/processing.css";

const STAGES = [
  { threshold: 0, message: "Uploading video to analysis server..." },
  { threshold: 18, message: "Extracting video frames and ground plane..." },
  { threshold: 38, message: "Running MediaPipe 33-point pose estimation..." },
  { threshold: 58, message: "Extracting dynamic joint angles (flexion, valgus, symmetry)..." },
  { threshold: 72, message: "Detecting impact frame and peak deceleration window..." },
  { threshold: 84, message: "Evaluating ACL injury risk with Random Forest ML..." },
  { threshold: 92, message: "Generating skeletal overlay video and telemetry..." },
  { threshold: 100, message: "Analysis complete! Finalizing dashboard..." },
];

const CHECKLIST_STAGES = [
  {
    id: "video",
    threshold: 22,
    title: "Processing video",
    detail: "Decoding frames and ground plane timeline",
    icon: Video,
  },
  {
    id: "pose",
    threshold: 48,
    title: "Detecting pose landmarks",
    detail: "Tracking 33 body landmarks across frames",
    icon: Activity,
  },
  {
    id: "features",
    threshold: 74,
    title: "Extracting biomechanical features",
    detail: "Measuring knee flexion, valgus & symmetry",
    icon: Compass,
  },
  {
    id: "risk",
    threshold: 95,
    title: "Calculating ACL risk",
    detail: "Predicting risk category via calibrated ML model",
    icon: ShieldAlert,
  },
];

export default function ProcessingLoader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedVideo, setAnalysisResult } = useAnalysis();

  const [progress, setProgress] = useState(12);
  const [currentMessage, setCurrentMessage] = useState(STAGES[0].message);
  const [error, setError] = useState("");

  useEffect(() => {
    let progressTimer = null;
    let isCancelled = false;

    const videoToProcess =
      selectedVideo ||
      location.state?.video ||
      getStoredVideo();

    if (!videoToProcess) {
      console.warn("[ACL] ProcessingLoader: No video selected.");
      setError("No video was selected. Please upload a video again.");
      return;
    }

    console.log("[ACL] ProcessingLoader mounted for video:", videoToProcess.name);

    // Easing progress animation up to 92%
    let currentPct = 12;
    progressTimer = setInterval(() => {
      if (currentPct < 92) {
        const increment = currentPct < 50 ? 2 : 1;
        currentPct = Math.min(92, currentPct + increment);
        setProgress(currentPct);

        const stage = [...STAGES].reverse().find((s) => currentPct >= s.threshold);
        if (stage) {
          setCurrentMessage(stage.message);
        }
      }
    }, 280);

    // Use or create a single active upload promise for this session
    let analysisPromise = getActiveAnalysisPromise();

    if (!analysisPromise) {
      console.log("[ACL] Starting new upload and analysis request to Flask...");
      analysisPromise = uploadVideo(videoToProcess);
      setActiveAnalysisPromise(analysisPromise);
    } else {
      console.log("[ACL] Reusing existing in-flight analysis request...");
    }

    analysisPromise
      .then((result) => {
        if (isCancelled) return;

        console.log("[ACL] Backend analysis succeeded:", result);

        if (!result || !result.success) {
          throw new Error(result?.message || "Video processing failed on backend.");
        }

        const finalData = result.video || result;

        if (progressTimer) {
          clearInterval(progressTimer);
        }

        setProgress(100);
        setCurrentMessage("Analysis complete! Finalizing dashboard...");

        setAnalysisResult(finalData);
        sessionStorage.setItem("analysisResult", JSON.stringify(finalData));

        setTimeout(() => {
          if (!isCancelled) {
            console.log("[ACL] Navigating to /dashboard with analysis data.");
            navigate("/dashboard");
          }
        }, 500);
      })
      .catch((err) => {
        if (isCancelled) return;

        console.error("[ACL] Backend analysis error:", err);

        setActiveAnalysisPromise(null);

        if (progressTimer) {
          clearInterval(progressTimer);
        }

        let errorMessage = "Unable to process the video.";

        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
          if (err.response.data.error && err.response.data.error !== err.response.data.message) {
            errorMessage += ` (${err.response.data.error})`;
          }
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.code === "ECONNABORTED" || err.message?.toLowerCase().includes("timeout")) {
          errorMessage = "Analysis timed out. Please check that the Flask backend is running.";
        } else if (err.message === "Network Error" || !err.response) {
          errorMessage = "Cannot connect to analysis backend. Please ensure the Flask server is running at http://127.0.0.1:5000.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
      });

    return () => {
      isCancelled = true;
      if (progressTimer) {
        clearInterval(progressTimer);
      }
    };
  }, [selectedVideo, location.state, navigate, setAnalysisResult]);

  if (error) {
    return (
      <section className="processing-container">
        <div className="processing-card error-card">
          <div className="error-icon-box">
            <Brain size={44} />
          </div>

          <h2>Analysis Failed</h2>
          <p className="error-desc">{error}</p>

          <button
            onClick={() => {
              clearStoredVideo();
              navigate("/upload");
            }}
            className="retry-btn"
          >
            Upload Another Video
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="processing-container">
      <div className="processing-card">
        {/* Top Header */}
        <div className="processing-header">
          <span className="processing-badge">
            <span className="badge-pulse-dot" />
            AI BIOMECHANICAL ANALYSIS
          </span>
          <h1>Analyzing Your Landing</h1>
          <p>
            AI-powered kinematic estimation and joint deceleration assessment in progress
          </p>
        </div>

        {/* Central Animated Biomechanical AI Skeleton Visualization */}
        <div className="processing-viz-wrapper">
          <div className="laser-scanner-line" />

          <svg
            viewBox="0 0 280 260"
            className="ai-skeleton-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="procBoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#2F6FAF" />
              </linearGradient>
              <filter id="procGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#2F6FAF" floodOpacity="0.7" />
              </filter>
            </defs>

            {/* Impact ground plane */}
            <ellipse cx="140" cy="242" rx="90" ry="12" fill="none" stroke="#bae6fd" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
            <line x1="40" y1="242" x2="240" y2="242" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Spine & Torso */}
            <line x1="140" y1="48" x2="140" y2="120" stroke="url(#procBoneGrad)" strokeWidth="6" strokeLinecap="round" />

            {/* Shoulders */}
            <line x1="95" y1="62" x2="185" y2="62" stroke="url(#procBoneGrad)" strokeWidth="4.5" strokeLinecap="round" />
            {/* Arms */}
            <line x1="95" y1="62" x2="75" y2="105" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <line x1="75" y1="105" x2="65" y2="145" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <line x1="185" y1="62" x2="205" y2="105" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <line x1="205" y1="105" x2="215" y2="145" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />

            {/* Pelvis bar */}
            <line x1="110" y1="120" x2="170" y2="120" stroke="#2F6FAF" strokeWidth="6" strokeLinecap="round" />

            {/* Left Leg */}
            <line x1="110" y1="120" x2="100" y2="175" stroke="url(#procBoneGrad)" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="100" y1="175" x2="95" y2="235" stroke="url(#procBoneGrad)" strokeWidth="5" strokeLinecap="round" />

            {/* Right Leg */}
            <line x1="170" y1="120" x2="180" y2="175" stroke="url(#procBoneGrad)" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="180" y1="175" x2="185" y2="235" stroke="url(#procBoneGrad)" strokeWidth="5" strokeLinecap="round" />

            {/* Feet */}
            <ellipse cx="90" cy="238" rx="14" ry="4.5" fill="#334155" />
            <ellipse cx="190" cy="238" rx="14" ry="4.5" fill="#334155" />

            {/* Head Joint */}
            <circle cx="140" cy="32" r="16" fill="#ffffff" stroke="#2F6FAF" strokeWidth="3" filter="url(#procGlow)" className="proc-pulse-node" />
            <circle cx="140" cy="32" r="8" fill="#e0f2fe" />

            {/* Shoulder Joints */}
            <circle cx="95" cy="62" r="5" fill="#ffffff" stroke="#2F6FAF" strokeWidth="2.5" />
            <circle cx="185" cy="62" r="5" fill="#ffffff" stroke="#2F6FAF" strokeWidth="2.5" />

            {/* Hip Joints */}
            <circle cx="110" cy="120" r="6" fill="#ffffff" stroke="#2F6FAF" strokeWidth="2.5" />
            <circle cx="170" cy="120" r="6" fill="#ffffff" stroke="#2F6FAF" strokeWidth="2.5" />

            {/* Knee Joints (Pulsing tracking beacons) */}
            <circle cx="100" cy="175" r="7.5" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" filter="url(#procGlow)" className="proc-pulse-node" />
            <circle cx="180" cy="175" r="7.5" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" filter="url(#procGlow)" className="proc-pulse-node" />

            {/* Ankle Joints */}
            <circle cx="95" cy="235" r="5" fill="#ffffff" stroke="#2F6FAF" strokeWidth="2" />
            <circle cx="185" cy="235" r="5" fill="#ffffff" stroke="#2F6FAF" strokeWidth="2" />
          </svg>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="processing-progress-section">
          <div className="progress-info-row">
            <span className="progress-status-text">{currentMessage}</span>
            <span className="progress-pct-badge">{progress}%</span>
          </div>

          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 4-Step Analysis Stages Checklist (Section 3 Requirement) */}
        <div className="analysis-stages-grid">
          {CHECKLIST_STAGES.map((st) => {
            const Icon = st.icon;
            const isCompleted = progress >= st.threshold;
            const isCurrent = !isCompleted && progress >= st.threshold - 30;

            return (
              <div
                key={st.id}
                className={`stage-card ${isCompleted ? "completed" : isCurrent ? "active" : "pending"}`}
              >
                <div className="stage-icon-box">
                  {isCompleted ? (
                    <CheckCircle2 size={16} className="stage-check-icon" />
                  ) : isCurrent ? (
                    <LoaderCircle size={16} className="stage-spin-icon" />
                  ) : (
                    <Clock size={16} className="stage-wait-icon" />
                  )}
                </div>

                <div className="stage-content">
                  <h4>{st.title}</h4>
                  <p>{isCompleted ? "✓ Verified & Completed" : st.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}