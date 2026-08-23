import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App";
import { AnalysisProvider } from "./context/AnalysisContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AnalysisProvider>
        <App />
        <Toaster
          position="top-right"
          reverseOrder={false}
        />
      </AnalysisProvider>
    </BrowserRouter>
  </React.StrictMode>
);