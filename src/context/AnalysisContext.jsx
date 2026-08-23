import { createContext, useContext, useState } from "react";
import { fetchAnalysisById } from "../services/api";
import { setStoredVideo, getStoredVideo, clearStoredVideo } from "../services/videoStore";

export const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [selectedVideo, setSelectedVideoState] = useState(() => getStoredVideo());
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResultState] = useState(() => {
    try {
      const stored = sessionStorage.getItem("analysisResult");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn("Failed to load cached analysisResult from sessionStorage:", e);
      return null;
    }
  });

  const setSelectedVideo = (file) => {
    setStoredVideo(file);
    setSelectedVideoState(file);
  };

  const setAnalysisResult = (result) => {
    setAnalysisResultState(result);
    if (result) {
      try {
        sessionStorage.setItem("analysisResult", JSON.stringify(result));
      } catch (e) {
        console.warn("Failed to persist analysisResult to sessionStorage:", e);
      }
    } else {
      sessionStorage.removeItem("analysisResult");
    }
  };

  const clearAnalysis = () => {
    clearStoredVideo();
    setSelectedVideoState(null);
    setAnalysisResultState(null);
    try {
      sessionStorage.removeItem("analysisResult");
      sessionStorage.removeItem("aclVideoName");
    } catch (e) {
      console.warn("Failed to clear sessionStorage:", e);
    }
  };

  const loadAnalysisById = async (analysisId) => {
    try {
      setLoading(true);
      const res = await fetchAnalysisById(analysisId);
      if (res && res.success && res.analysis) {
        setAnalysisResult(res.analysis);
        return res.analysis;
      }
      return null;
    } catch (err) {
      console.error("Failed to load analysis by ID:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnalysisContext.Provider
      value={{
        selectedVideo,
        setSelectedVideo,
        analysisResult,
        setAnalysisResult,
        clearAnalysis,
        loadAnalysisById,
        loading,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}

export default AnalysisContext;
