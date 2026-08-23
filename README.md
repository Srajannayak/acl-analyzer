# ACL Analyzer — AI-Powered Athlete Biomechanical & Injury Risk Analysis

ACL Analyzer is an AI-assisted movement screening and kinematic assessment platform that evaluates 2D athlete movement videos, tracks 33-point skeletal landmarks using Google MediaPipe, extracts joint angles during landing/deceleration phases, and predicts non-contact Anterior Cruciate Ligament (ACL) injury risk using machine learning.

> **Responsible AI Notice:** ACL Analyzer is an AI-assisted movement screening and training support tool for athletic trainers and coaches. It is not a medical diagnostic device and does not substitute for clinical medical evaluation.

---

## Key Features

- **Video-Based 3D Pose Tracking**: Non-invasive 33-point skeletal landmark detection via MediaPipe Pose Landmarker.
- **Dynamic Biomechanical Kinematics**: Computes real-time joint angles:
  - Knee Flexion & Extension
  - Dynamic Knee Valgus (Inward Knee Collapse)
  - Hip Flexion
  - Trunk Inclination & Neuromuscular Control
  - Ankle Dorsiflexion
  - Bilateral Landing Symmetry
- **Landing Phase Event Detection**: Automated peak impact identification and temporal window extraction.
- **ML Injury Risk Classification**: Scikit-learn Random Forest model trained on biomechanical landing kinematics.
- **Authoritative Processed Video**: Generates browser-compatible H.264 MP4 with skeletal overlay drawn directly on frames.
- **Interactive Biomechanical Dashboard**: Live video playback, risk score visualization, kinematic metric cards, and joint angle sequence charts.
- **Downloadable PDF Reports**: Automated PDF generation summarizing session metadata, risk assessment, kinematics tables, and actionable recommendations.
- **Analysis History**: Persistent storage of past athlete evaluations with quick retrieval and re-visualization.

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router 7, Recharts, Lucide Icons, Axios.
- **Backend**: Python 3, Flask, Flask-CORS, OpenCV (`cv2`), MediaPipe (`mediapipe.tasks.python.vision`), Scikit-learn, ReportLab, FFmpeg.

---

## Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)
- **FFmpeg** (Configured in system PATH or available at `C:\ffmpeg\ffmpeg-9.0.1-essentials_build\bin\ffmpeg.exe`)

### 2. Backend Setup
```bash
cd backend

# Activate existing virtual environment (Windows)
.\venv\Scripts\activate

# Or install dependencies
pip install flask flask-cors opencv-python mediapipe scikit-learn joblib pandas reportlab

# Start Flask backend server
python app.py
```
*Backend runs at `http://127.0.0.1:5000`*

### 3. Frontend Setup
```bash
# In the project root
npm install

# Start Vite development server
npm run dev

# Or build for production
npm run build
```
*Frontend runs at `http://localhost:5173`*

---

## Application Workflow

1. **Upload (`/upload`)**: Select an athlete landing or movement video (MP4, MOV, AVI).
2. **Processing (`/processing`)**: Real-time analysis status (frame extraction, pose estimation, kinematics, risk inference, H.264 transcoding).
3. **Results Dashboard (`/dashboard` / `/visualization`)**: View processed skeleton video, risk percentage, joint metrics, and kinematic charts.
4. **Report (`/report`)**: Comprehensive biomechanical report with downloadable PDF export.
5. **History (`/history`)**: Browse previous analyses, reload results, and download reports.
6. **About (`/about`)**: Methodological and clinical context behind kinematic risk screening.
