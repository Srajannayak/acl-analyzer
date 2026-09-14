import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  Video,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useAnalysis } from "../../context/AnalysisContext";
import { setStoredVideo } from "../../services/videoStore";
import "../../styles/upload.css";

export default function Upload() {
  const navigate = useNavigate();
  const { setSelectedVideo } = useAnalysis();

  const [video, setVideo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (video) {
      const url = URL.createObjectURL(video);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [video]);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      setVideo(selected);
      setSelectedVideo(selected);
      setStoredVideo(selected);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/x-msvideo": [".avi"],
    },
    multiple: false,
    onDrop,
  });

  const handleAnalyze = () => {
    if (!video) {
      alert("Please upload a video first.");
      return;
    }

    console.log("[Upload] Analyzing athlete video:", video.name);
    setSelectedVideo(video);
    setStoredVideo(video);
    sessionStorage.setItem("aclVideoName", video.name);

    navigate("/processing", { state: { video } });
  };

  const handleRemove = () => {
    setVideo(null);
    setSelectedVideo(null);
    setStoredVideo(null);
  };

  return (
    <>
      <Navbar />
      <section className="upload-page">
        <div className="upload-header">
          <span>AI MOVEMENT SCREENING</span>
          <h1>Athlete Video Upload</h1>
          <p>
            Upload a high-speed landing, jump, or cutting video to evaluate 3D joint kinematics and predict ACL injury risk.
          </p>
        </div>

        {!video ? (
          <div
            {...getRootProps()}
            className={`upload-box ${isDragActive ? "active" : ""}`}
          >
            <input {...getInputProps()} />

            <div className="upload-icon-wrapper">
              <UploadCloud size={40} className="upload-icon" />
            </div>

            <h2>
              {isDragActive
                ? "Drop athlete video here..."
                : "Drag & Drop Athlete Video"}
            </h2>

            <p>Supported formats: MP4 • MOV • AVI (Up to 100 MB)</p>

            <button type="button" className="browse-btn">
              Browse Local Video
            </button>
          </div>
        ) : (
          <div className="preview-card">
            <div className="preview-header">
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "#f0f7ff",
                  border: "1px solid #bae6fd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2F6FAF",
                }}
              >
                <FileCheck size={26} />
              </div>
              <div>
                <h2>Selected Athlete Video</h2>
                <p>
                  <b>{video.name}</b> • {(video.size / (1024 * 1024)).toFixed(2)} MB • {video.type || "video/mp4"}
                </p>
              </div>
            </div>

            {previewUrl && (
              <video
                className="preview-video"
                controls
                src={previewUrl}
                style={{ maxHeight: "400px" }}
              />
            )}

            <div className="preview-buttons">
              <button
                type="button"
                className="remove-btn"
                onClick={handleRemove}
              >
                <RefreshCw size={18} />
                Change Video
              </button>

              <button
                type="button"
                className="analyze-btn"
                onClick={handleAnalyze}
              >
                Analyze Athlete
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}