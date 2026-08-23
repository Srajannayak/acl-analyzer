import axios from "axios";

export const API_BASE_URL = "http://127.0.0.1:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15 * 60 * 1000,
});

export const uploadVideo = async (videoFile) => {
  const formData = new FormData();
  formData.append("video", videoFile);

  try {
    const response = await api.post("/upload", formData);
    return response.data;
  } catch (err) {
    if (typeof window !== "undefined" && window.location.port === "5173" && !err.response) {
      console.warn("Direct upload to 127.0.0.1:5000 failed, attempting via dev proxy...");
      const proxyResponse = await axios.post("/upload", formData, {
        timeout: 15 * 60 * 1000,
      });
      return proxyResponse.data;
    }
    throw err;
  }
};

export const fetchHistory = async () => {
  try {
    const response = await api.get("/history");
    return response.data;
  } catch (err) {
    if (typeof window !== "undefined" && window.location.port === "5173" && !err.response) {
      const proxyResponse = await axios.get("/history", { timeout: 15000 });
      return proxyResponse.data;
    }
    throw err;
  }
};

export const fetchAnalysisById = async (analysisId) => {
  try {
    const response = await api.get(`/analysis/${analysisId}`);
    return response.data;
  } catch (err) {
    if (typeof window !== "undefined" && window.location.port === "5173" && !err.response) {
      const proxyResponse = await axios.get(`/analysis/${analysisId}`, { timeout: 15000 });
      return proxyResponse.data;
    }
    throw err;
  }
};

export const deleteAnalysisById = async (analysisId) => {
  try {
    const response = await api.delete(`/history/${analysisId}`);
    return response.data;
  } catch (err) {
    if (typeof window !== "undefined" && window.location.port === "5173" && !err.response) {
      const proxyResponse = await axios.delete(`/history/${analysisId}`, { timeout: 15000 });
      return proxyResponse.data;
    }
    throw err;
  }
};

export const getReportPdfUrl = (analysisId) => {
  return `${API_BASE_URL}/report/${analysisId}/pdf`;
};

export default api;