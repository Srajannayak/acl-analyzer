import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Brain, LoaderCircle } from "lucide-react";

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
  { threshold: 0, message: "Uploading video to server..." },
  { threshold: 18, message: "Extracting video frames..." },
  { threshold: 38, message: "Running MediaPipe 33-point pose estimation..." },
  { threshold: 58, message: "Extracting biomechanical joint angles..." },
  { threshold: 72, message: "Detecting landing event & impact window..." },
  { threshold: 84, message: "Predicting ACL injury risk with ML model..." },
  { threshold: 92, message: "Encoding processed video with skeleton overlay..." },
  { threshold: 100, message: "Analysis complete! Finalizing dashboard..." },
];

export default function ProcessingLoader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedVideo, setAnalysisResult } = useAnalysis();

  const [progress, setProgress] = useState(8);
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
    let currentPct = 8;
    progressTimer = setInterval(() => {
      if (currentPct < 92) {
        // Slow down slightly as progress increases to maintain a smooth experience
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
            console.log("[ACL] Navigating to /visualization with analysis data.");
            navigate("/visualization");
          }
        }, 500);
      })
      .catch((err) => {
        if (isCancelled) return;

        console.error("[ACL] Backend analysis error:", err);

        // Clear active promise on error so user can retry
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

  /*
   * Error state
   */
  if (error) {
    return (
      <section className="processing">

        <div className="processing-card">

          <Brain
            className="brain-icon"
            size={65}
          />

          <h1>Analysis Failed</h1>

          <p>
            {error}
          </p>

          <button
            onClick={() => {
              clearStoredVideo();
              navigate("/upload");
            }}
            className="analyze-btn"
          >
            Try Again
          </button>

        </div>

      </section>
    );
  }

  return (
    <section className="processing">

      <div className="processing-card">

        <Brain
          className="brain-icon"
          size={65}
        />

        <h1>
          AI Analysis in Progress
        </h1>

        <p>
          Please wait while our AI analyzes the athlete's biomechanics.
        </p>

        <div className="loader-wrapper">

          <LoaderCircle
            className="loader-icon"
            size={55}
          />

        </div>

        <div className="progress-bar">

          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
            }}
          ></div>

        </div>

        <h3>
          {progress}%
        </h3>

        <span>
          {currentMessage}
        </span>

      </div>

    </section>
  );
}