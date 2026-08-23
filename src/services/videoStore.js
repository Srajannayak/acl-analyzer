let storedVideoFile = null;
let activeAnalysisPromise = null;

export const setStoredVideo = (file) => {
  storedVideoFile = file;
  activeAnalysisPromise = null;
};

export const getStoredVideo = () => {
  return storedVideoFile;
};

export const clearStoredVideo = () => {
  storedVideoFile = null;
  activeAnalysisPromise = null;
};

export const getActiveAnalysisPromise = () => {
  return activeAnalysisPromise;
};

export const setActiveAnalysisPromise = (promise) => {
  activeAnalysisPromise = promise;
};
