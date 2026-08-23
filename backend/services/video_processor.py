import os
import cv2
import time
import subprocess

try:
    from config import PROCESSED_FOLDER, get_ffmpeg_path, FFMPEG_PATH
except ImportError:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    PROCESSED_FOLDER = os.path.join(BASE_DIR, "outputs", "processed")
    FFMPEG_PATH = "ffmpeg"
    def get_ffmpeg_path():
        return "ffmpeg"

from services.pose_detector import PoseDetector
from services.landing_detector import LandingDetector
from services.feature_aggregator import FeatureAggregator
from services.risk_predictor import RiskPredictor
from services.report_generator import ReportGenerator


class VideoProcessor:

    def __init__(self, video_path):

        self.video_path = video_path

        self.detector = PoseDetector()
        self.landing_detector = LandingDetector()
        self.aggregator = FeatureAggregator()
        self.predictor = RiskPredictor()
        self.reporter = ReportGenerator()

        self.output_folder = PROCESSED_FOLDER

        os.makedirs(
            self.output_folder,
            exist_ok=True
        )

    # ============================================================
    # FFMPEG RESOLUTION
    # ============================================================

    def _get_ffmpeg_executable(self):
        return get_ffmpeg_path()

    # ============================================================
    # GET VIDEO INFORMATION & RUN COMPLETE PIPELINE
    # ============================================================

    def get_video_info(self):

        start_time = time.time()

        if not os.path.exists(self.video_path):
            return {
                "success": False,
                "message": f"Input video file not found at: {self.video_path}"
            }

        cap = cv2.VideoCapture(
            self.video_path
        )

        if not cap.isOpened():
            return {
                "success": False,
                "message": "Unable to open uploaded video. The file may be corrupt or in an unsupported format."
            }

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 0
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 0
        duration = total_frames / fps if fps > 0 else 0.0

        cap.release()

        # ========================================================
        # OUTPUT PATHS
        # ========================================================

        filename = os.path.basename(self.video_path)
        filename_no_ext, _ = os.path.splitext(filename)

        raw_output = os.path.join(
            self.output_folder,
            f"{filename_no_ext}_mediapipe_raw.mp4"
        )

        final_output = os.path.join(
            self.output_folder,
            f"{filename_no_ext}_processed.mp4"
        )

        print()
        print("=" * 70)
        print("MEDIAPIPE VIDEO PROCESSING")
        print("=" * 70)
        print("Input:", self.video_path)
        print("Raw output:", raw_output)
        print("Final output:", final_output)
        print("=" * 70)
        print()

        # ========================================================
        # MEDIAPIPE POSE DETECTION
        # ========================================================

        pose_result = self.detector.process_video(
            self.video_path,
            raw_output
        )

        if not pose_result.get("success", False):
            return {
                "success": False,
                "message": pose_result.get("message", "MediaPipe video processing failed.")
            }

        detected_frames = pose_result.get("detected_frames", 0)

        print("MediaPipe processing completed.")
        print(f"Total frames: {total_frames}")
        print(f"Detected frames: {detected_frames}")
        print(f"Raw video exists: {os.path.exists(raw_output)}")

        # ========================================================
        # FFMPEG ENCODING (H.264 / AAC / FASTSTART FOR BROWSER)
        # ========================================================

        ffmpeg_exe = self._get_ffmpeg_executable()

        cmd = [
            ffmpeg_exe,
            "-y",
            "-i", raw_output,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-an",
            final_output
        ]

        print()
        print("=" * 70)
        print("FFMPEG CONVERSION")
        print("=" * 70)
        print("Executable:", ffmpeg_exe)
        print("Command:", " ".join(cmd))
        print("=" * 70)
        print()

        try:
            p = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=False
            )

            if p.returncode != 0:
                print("FFmpeg encoding error:", p.stderr)
                if os.path.exists(raw_output):
                    import shutil
                    shutil.copyfile(raw_output, final_output)
        except Exception as ffmpeg_error:
            print("FFmpeg execution error:", ffmpeg_error)
            if os.path.exists(raw_output):
                import shutil
                shutil.copyfile(raw_output, final_output)

        if not os.path.exists(final_output):
            return {
                "success": False,
                "message": "Processed video could not be created."
            }

        final_size = os.path.getsize(final_output)
        if final_size == 0:
            return {
                "success": False,
                "message": "Final processed video is empty."
            }

        # Cleanup raw video
        try:
            if os.path.exists(raw_output):
                os.remove(raw_output)
        except Exception as cleanup_error:
            print("Raw video cleanup warning:", cleanup_error)

        # ========================================================
        # POSE & BIOMECHANICAL ANALYSIS DATA
        # ========================================================

        landmarks = pose_result.get("landmarks", [])
        feature_sequence = pose_result.get("feature_sequence", [])

        # ========================================================
        # LANDING DETECTION
        # ========================================================

        landing_result = self.landing_detector.detect(
            feature_sequence
        )

        # ========================================================
        # EXTRACT LANDING / PEAK RISK FRAME STILL IMAGE
        # ========================================================

        target_frame_num = (
            landing_result.get("peak_risk_frame")
            or landing_result.get("landing_frame")
            or (feature_sequence[0].get("frame") if feature_sequence else 1)
        )

        outputs_base = os.path.dirname(self.output_folder)
        frames_dir = os.path.join(outputs_base, "frames")
        os.makedirs(frames_dir, exist_ok=True)

        landing_img_filename = f"{filename_no_ext}_landing_frame_{target_frame_num}.jpg"
        landing_img_path = os.path.join(frames_dir, landing_img_filename)
        landing_image_url = f"/outputs/frames/{landing_img_filename}"

        # Extract still frame from input video
        try:
            cap_still = cv2.VideoCapture(self.video_path)
            if cap_still.isOpened():
                cap_still.set(cv2.CAP_PROP_POS_FRAMES, max(0, target_frame_num - 1))
                ret, frame_bgr = cap_still.read()
                if ret and frame_bgr is not None:
                    cv2.imwrite(landing_img_path, frame_bgr)
                cap_still.release()
        except Exception as still_err:
            print("Landing frame extraction warning:", still_err)

        # Find landmarks & features for this exact landing frame
        landing_frame_landmarks = []
        landing_frame_features = {}
        for item in feature_sequence:
            if item.get("frame") == target_frame_num:
                landing_frame_landmarks = item.get("landmarks", [])
                landing_frame_features = item.get("features", {})
                break

        if not landing_frame_landmarks and landmarks:
            landing_frame_landmarks = landmarks

        if isinstance(landing_result, dict):
            landing_result["landing_image_url"] = landing_image_url
            landing_result["landing_frame_landmarks"] = landing_frame_landmarks
            landing_result["landing_frame_features"] = landing_frame_features
            landing_result["landing_timestamp"] = landing_result.get("landing_timestamp_ms")

        # ========================================================
        # FEATURE AGGREGATION
        # ========================================================

        landing_sequence = (
            landing_result.get("landing_sequence")
            if landing_result.get("success") and landing_result.get("landing_sequence")
            else feature_sequence
        )

        landing_features = self.aggregator.aggregate(
            landing_sequence
        )

        overall_features = self.aggregator.aggregate(
            feature_sequence
        )

        # ========================================================
        # RISK PREDICTION (ML MODEL)
        # ========================================================

        features_for_risk = (
            landing_features
            if landing_features and landing_features.get("knee_flexion", 0) > 0
            else overall_features
        )

        risk_result = self.predictor.predict(
            features_for_risk
        )

        risk_result["risk_score"] = risk_result.get("risk_percentage", 0.0)
        risk_result["risk_level"] = risk_result.get("label", "Low")

        # ========================================================
        # REPORT & RECOMMENDATIONS GENERATION
        # ========================================================

        report_data = self.reporter.generate(
            landing_features or overall_features,
            risk_result
        )

        recommendations = report_data.get("recommendations", [])
        analysis_summary = report_data.get("analysis_summary", {})

        processing_time = round(
            time.time() - start_time,
            2
        )

        # ========================================================
        # FINAL STRUCTURED RESULT
        # ========================================================

        result_data = {
            "success": True,
            "fps": round(fps, 2),
            "frames": total_frames,
            "width": width,
            "height": height,
            "duration": round(duration, 2),
            "processing_time": processing_time,
            "detected_frames": detected_frames,
            "landmarks": landmarks,
            "landmarks_sequence": landmarks,
            "landing_frame_landmarks": landing_frame_landmarks,
            "landing_frame_features": landing_frame_features,
            "landing_image_url": landing_image_url,
            "processed_video": final_output,
            "features": overall_features,
            "feature_sequence": feature_sequence,
            "landing": landing_result,
            "landing_features": landing_features,
            "risk": risk_result,
            "recommendations": recommendations,
            "analysis_summary": analysis_summary
        }

        print()
        print("=" * 70)
        print("VIDEO PROCESSING COMPLETE")
        print("=" * 70)
        print("Final video:", final_output)
        print("Landing image:", landing_img_path, f"(Exists: {os.path.exists(landing_img_path)})")
        print("Frames:", total_frames)
        print("Detected frames:", detected_frames)
        print("Landing frame:", landing_result.get("landing_frame"))
        print("Peak risk frame:", landing_result.get("peak_risk_frame"))
        print("Risk:", risk_result.get("label"), f"({risk_result.get('risk_percentage')}%, conf: {risk_result.get('confidence')}%)")
        print("=" * 70)
        print()

        return result_data