"""
feature_extraction.py
----------------------
Computes biomechanical features from MediaPipe Pose landmarks for
ACL injury risk analysis.

Landmarks reference (MediaPipe Pose, 33-point model):
https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
Relevant indices used here:
  11 - LEFT_SHOULDER      12 - RIGHT_SHOULDER
  23 - LEFT_HIP           24 - RIGHT_HIP
  25 - LEFT_KNEE          26 - RIGHT_KNEE
  27 - LEFT_ANKLE         28 - RIGHT_ANKLE
  31 - LEFT_FOOT_INDEX    32 - RIGHT_FOOT_INDEX

Drop this file next to your existing OpenCV/MediaPipe processing script
and import `extract_features_from_landmarks`.
"""

import numpy as np

# MediaPipe landmark indices
L_SHOULDER, R_SHOULDER = 11, 12
L_HIP, R_HIP = 23, 24
L_KNEE, R_KNEE = 25, 26
L_ANKLE, R_ANKLE = 27, 28
L_FOOT, R_FOOT = 31, 32


def _to_xy(landmark):
    """MediaPipe landmark -> (x, y) numpy array. Ignores z/visibility."""
    return np.array([landmark.x, landmark.y])


def _angle(a, b, c):
    """
    Angle at point b, formed by rays b->a and b->c, in degrees.
    a, b, c are (x, y) numpy arrays.
    """
    ba = a - b
    bc = c - b
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
    cos_angle = np.clip(cos_angle, -1.0, 1.0)
    return np.degrees(np.arccos(cos_angle))


def _trunk_lean(shoulder_mid, hip_mid):
    """
    Trunk lean = angle of the shoulder-hip line from vertical, in degrees.
    0 deg = perfectly upright.
    """
    vec = shoulder_mid - hip_mid
    vertical = np.array([0, -1])  # image y-axis points down, "up" is -y
    cos_angle = np.dot(vec, vertical) / (np.linalg.norm(vec) + 1e-8)
    cos_angle = np.clip(cos_angle, -1.0, 1.0)
    return np.degrees(np.arccos(cos_angle))


def _knee_valgus_proxy(hip, knee, ankle):
    """
    Frontal-plane knee valgus (knock-knee) proxy using a single camera view.
    True valgus needs a frontal-view camera; from a sagittal/landing view we
    approximate it as the horizontal (x) deviation of the knee from the
    hip-ankle line, normalized by leg length. Positive = knee collapses
    inward relative to the hip-ankle line.

    NOTE: for a real deployment, capture from the front of the athlete
    (facing camera) for a true valgus/varus measurement. This proxy is a
    reasonable stand-in when only one camera angle is available.
    """
    leg_len = np.linalg.norm(ankle - hip) + 1e-8
    # perpendicular distance of knee from the hip-ankle line
    hip_ankle = ankle - hip
    hip_knee = knee - hip
    cross = hip_ankle[0] * hip_knee[1] - hip_ankle[1] * hip_knee[0]
    perp_dist = cross / (np.linalg.norm(hip_ankle) + 1e-8)
    return float(perp_dist / leg_len)  # normalized, unitless


def extract_features_from_landmarks(landmarks, side="auto"):
    """
    Extract one feature dict from a single frame's MediaPipe landmark list.

    Parameters
    ----------
    landmarks : list
        `results.pose_landmarks.landmark` from MediaPipe Pose (33 items).
    side : "left" | "right" | "auto"
        Which leg to analyze. "auto" picks whichever leg has higher average
        landmark visibility (useful for single-leg landing videos).

    Returns
    -------
    dict with keys:
        knee_angle, hip_angle, ankle_angle, trunk_lean, knee_valgus
    All angles in degrees; knee_valgus is a normalized unitless proxy.
    """
    if side == "auto":
        left_vis = np.mean([landmarks[i].visibility for i in (L_HIP, L_KNEE, L_ANKLE)])
        right_vis = np.mean([landmarks[i].visibility for i in (R_HIP, R_KNEE, R_ANKLE)])
        side = "left" if left_vis >= right_vis else "right"

    if side == "left":
        shoulder, hip, knee, ankle, foot = L_SHOULDER, L_HIP, L_KNEE, L_ANKLE, L_FOOT
    else:
        shoulder, hip, knee, ankle, foot = R_SHOULDER, R_HIP, R_KNEE, R_ANKLE, R_FOOT

    p_shoulder = _to_xy(landmarks[shoulder])
    p_hip = _to_xy(landmarks[hip])
    p_knee = _to_xy(landmarks[knee])
    p_ankle = _to_xy(landmarks[ankle])
    p_foot = _to_xy(landmarks[foot])

    shoulder_mid = (_to_xy(landmarks[L_SHOULDER]) + _to_xy(landmarks[R_SHOULDER])) / 2
    hip_mid = (_to_xy(landmarks[L_HIP]) + _to_xy(landmarks[R_HIP])) / 2

    knee_angle = _angle(p_hip, p_knee, p_ankle)
    hip_angle = _angle(p_shoulder, p_hip, p_knee)
    ankle_angle = _angle(p_knee, p_ankle, p_foot)
    trunk_lean = _trunk_lean(shoulder_mid, hip_mid)
    knee_valgus = _knee_valgus_proxy(p_hip, p_knee, p_ankle)

    return {
        "knee_angle": float(knee_angle),
        "hip_angle": float(hip_angle),
        "ankle_angle": float(ankle_angle),
        "trunk_lean": float(trunk_lean),
        "knee_valgus": float(knee_valgus),
        "side_used": side,
    }


def extract_landing_frame_features(all_frame_landmarks, fps):
    """
    Given landmarks for every frame of a landing video, find the likely
    initial-contact (landing) frame and surrounding window, and return
    aggregated features — this is what you feed to the ML model.

    Landing/initial-contact heuristic: the frame where the ankle's vertical
    (y) position stops decreasing and reaches its local minimum velocity
    (i.e., the foot just touched down after the drop/jump).

    Parameters
    ----------
    all_frame_landmarks : list of MediaPipe landmark lists, one per frame
    fps : float, video frame rate

    Returns
    -------
    dict of aggregated features ready for the ML model, or None if no
    valid landing frame could be detected.
    """
    if len(all_frame_landmarks) < 5:
        return None

    ankle_y = []
    valid_idxs = []
    for i, lm in enumerate(all_frame_landmarks):
        if lm is None:
            continue
        y = (lm[L_ANKLE].y + lm[R_ANKLE].y) / 2
        ankle_y.append(y)
        valid_idxs.append(i)

    if len(ankle_y) < 5:
        return None

    ankle_y = np.array(ankle_y)
    velocity = np.diff(ankle_y)  # positive = moving down (y increases downward)

    # Landing = last frame where velocity was still strongly positive
    # (descending) right before it drops near zero (foot stops).
    landing_local_idx = None
    for i in range(1, len(velocity)):
        if velocity[i - 1] > 0.01 and velocity[i] <= 0.01:
            landing_local_idx = i
            break
    if landing_local_idx is None:
        landing_local_idx = int(np.argmax(ankle_y))  # fallback: lowest point

    landing_frame_idx = valid_idxs[landing_local_idx]

    # Average features over a small window around landing (+-2 frames) to
    # reduce landmark jitter/noise.
    window = range(max(0, landing_frame_idx - 2), min(len(all_frame_landmarks), landing_frame_idx + 3))
    per_frame_feats = []
    for i in window:
        lm = all_frame_landmarks[i]
        if lm is None:
            continue
        per_frame_feats.append(extract_features_from_landmarks(lm))

    if not per_frame_feats:
        return None

    aggregated = {
        "knee_angle": float(np.mean([f["knee_angle"] for f in per_frame_feats])),
        "hip_angle": float(np.mean([f["hip_angle"] for f in per_frame_feats])),
        "ankle_angle": float(np.mean([f["ankle_angle"] for f in per_frame_feats])),
        "trunk_lean": float(np.mean([f["trunk_lean"] for f in per_frame_feats])),
        "knee_valgus": float(np.mean([f["knee_valgus"] for f in per_frame_feats])),
        "landing_frame_idx": landing_frame_idx,
        "landing_time_s": landing_frame_idx / fps,
    }
    return aggregated
