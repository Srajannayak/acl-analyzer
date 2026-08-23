import { Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/Home/Home";
import Upload from "../pages/Upload/Upload";
import Processing from "../pages/Processing/Processing";
import Dashboard from "../pages/Dashboard/Dashboard";
import Visualization from "../pages/Visualization/Visualization";
import Report from "../pages/Report/Report";
import History from "../pages/History/History";
import About from "../pages/About/About";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/processing" element={<Processing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/visualization" element={<Visualization />} />
      <Route path="/report" element={<Report />} />
      <Route path="/history" element={<History />} />
      <Route path="/about" element={<About />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;