import os
import cv2
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision

try:
    from config import POSE_LANDMARKER_MODEL_PATH
except ImportError:
    service_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(service_dir)
    POSE_LANDMARKER_MODEL_PATH = os.path.join(
        backend_dir, "models", "pose_landmarker_lite.task"
    )

from services.skeleton_drawer import SkeletonDrawer
from services.landmark_serializer import LandmarkSerializer
from services.feature_extractor import FeatureExtractor


class PoseDetector:

    def __init__(self):

        model_path = POSE_LANDMARKER_MODEL_PATH

        self.drawer = SkeletonDrawer()
        self.serializer = LandmarkSerializer()
        self.extractor = FeatureExtractor()

        base_options = python.BaseOptions(
            model_asset_path=model_path
        )

        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            output_segmentation_masks=False,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )

        self.detector = vision.PoseLandmarker.create_from_options(
            options
        )

    # ==========================================================
    # DRAW LANDMARKS
    # ==========================================================

    def draw_landmarks(self, frame, detection_result):

        if not detection_result.pose_landmarks or len(detection_result.pose_landmarks) == 0:
            return frame

        return self.drawer.draw(
            frame,
            detection_result.pose_landmarks[0]
        )

    # ==========================================================
    # DETECT SINGLE FRAME
    # ==========================================================

    def detect_frame(self, frame, timestamp_ms):

        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame
        )

        detection_result = self.detector.detect_for_video(
            mp_image,
            int(timestamp_ms)
        )

        if not detection_result.pose_landmarks or len(detection_result.pose_landmarks) == 0:
            return {
                "success": False,
                "frame": frame,
                "timestamp_ms": timestamp_ms,
                "landmarks": [],
                "features": {
                    "knee_flexion": 0.0,
                    "knee_valgus": 0.0,
                    "hip_flexion": 0.0,
                    "trunk_inclination": 0.0,
                    "ankle_dorsiflexion": 0.0,
                    "landing_symmetry": 50.0
                }
            }

        annotated_frame = self.draw_landmarks(
            frame,
            detection_result
        )

        serialized_landmarks = self.serializer.serialize(
            detection_result.pose_landmarks[0]
        )

        # Extract features for detected frame
        features = self.extractor.extract(
            detection_result.pose_landmarks[0]
        )

        return {
            "success": True,
            "frame": annotated_frame,
            "landmarks": serialized_landmarks,
            "features": features,
            "timestamp_ms": timestamp_ms
        }

    # ==========================================================
    # PROCESS FULL VIDEO
    # ==========================================================

    def process_video(self, input_video_path, output_video_path):

        cap = cv2.VideoCapture(
            input_video_path
        )

        if not cap.isOpened():
            return {
                "success": False,
                "message": "Cannot open input video file."
            }

        fps = cap.get(
            cv2.CAP_PROP_FPS
        )

        if fps <= 0 or fps != fps:
            fps = 30.0

        width = int(
            cap.get(
                cv2.CAP_PROP_FRAME_WIDTH
            )
        )

        height = int(
            cap.get(
                cv2.CAP_PROP_FRAME_HEIGHT
            )
        )

        fourcc = cv2.VideoWriter_fourcc(
            *"mp4v"
        )

        out = cv2.VideoWriter(
            output_video_path,
            fourcc,
            fps,
            (width, height)
        )

        total_frames = 0
        detected_frames = 0

        frame_duration = 1000.0 / fps
        timestamp_ms = 0.0

        landmarks_data = []
        feature_sequence = []

        while True:

            success, frame = cap.read()

            if not success:
                break

            total_frames += 1

            result = self.detect_frame(
                frame,
                timestamp_ms
            )

            timestamp_ms += frame_duration

            if result["success"]:
                detected_frames += 1
                frame = result["frame"]
                landmarks_data.append(
                    result["landmarks"]
                )
                feature_sequence.append({
                    "frame": total_frames,
                    "timestamp_ms": round(result["timestamp_ms"], 2),
                    "features": result["features"],
                    "landmarks": result["landmarks"]
                })

            out.write(frame)

        cap.release()
        out.release()

        return {
            "success": True,
            "total_frames": total_frames,
            "detected_frames": detected_frames,
            "landmarks": landmarks_data,
            "feature_sequence": feature_sequence
        }