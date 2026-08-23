"""
flask_integration_example.py
------------------------------
Shows exactly where the ML step plugs into your existing pipeline:

  Upload -> Flask receives video -> OpenCV reads frames -> MediaPipe Pose
  -> [NEW: feature_extraction.py] -> [NEW: predict.py] -> skeleton overlay
  -> FFmpeg -> Dashboard (now includes risk_class + probabilities + flags)

This is NOT your full app — copy the marked sections into your existing
Flask backend where you currently loop over frames with MediaPipe.
"""

from flask import Flask, request, jsonify
import cv2
import mediapipe as mp

from feature_extraction import extract_landing_frame_features
from predict import predict_acl_risk

app = Flask(__name__)
mp_pose = mp.solutions.pose


@app.route("/analyze", methods=["POST"])
def analyze_video():
    video_file = request.files["video"]
    video_path = f"uploads/{video_file.filename}"
    video_file.save(video_path)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    all_frame_landmarks = []  # <-- collect this while you already draw the skeleton overlay

    with mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)

            if results.pose_landmarks:
                all_frame_landmarks.append(results.pose_landmarks.landmark)
                # ... your existing skeleton-drawing / OpenCV overlay code stays here ...
            else:
                all_frame_landmarks.append(None)

    cap.release()

    # ---- NEW: ML integration ----
    landing_features = extract_landing_frame_features(all_frame_landmarks, fps)
    if landing_features is None:
        return jsonify({"error": "Could not detect a clear landing frame in this video."}), 422

    ml_result = predict_acl_risk(landing_features)
    # ------------------------------

    return jsonify({
        "landing_time_s": landing_features["landing_time_s"],
        "features": {
            "knee_angle": round(landing_features["knee_angle"], 1),
            "hip_angle": round(landing_features["hip_angle"], 1),
            "ankle_angle": round(landing_features["ankle_angle"], 1),
            "trunk_lean": round(landing_features["trunk_lean"], 1),
            "knee_valgus": round(landing_features["knee_valgus"], 3),
        },
        "risk_class": ml_result["risk_class"],
        "risk_probabilities": ml_result["probabilities"],
        "coaching_flags": ml_result["flags"],
        # keep your existing fields: processed_video_url, fps, resolution, etc.
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
