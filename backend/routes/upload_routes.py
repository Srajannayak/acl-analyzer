import os
import uuid
import time
from datetime import datetime
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

try:
    from config import UPLOAD_FOLDER, OUTPUT_FOLDER, PROCESSED_FOLDER
except ImportError:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs")
    PROCESSED_FOLDER = os.path.join(OUTPUT_FOLDER, "processed")

from services.video_processor import VideoProcessor
from services.history_manager import HistoryManager


upload_bp = Blueprint(
    "upload",
    __name__
)

history_manager = HistoryManager()

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)


# ============================================================
# UPLOAD VIDEO
# ============================================================

@upload_bp.route(
    "/upload",
    methods=["POST"]
)
def upload_video():

    req_start = time.time()

    try:

        # ====================================================
        # CHECK FILE
        # ====================================================

        if "video" not in request.files:

            return jsonify({

                "success": False,

                "message":
                    "No video uploaded.",

                "error":
                    "Missing 'video' in multipart request."

            }), 400


        video = request.files["video"]


        if video.filename == "":

            return jsonify({

                "success": False,

                "message":
                    "No file selected.",

                "error":
                    "Empty filename."

            }), 400


        # ====================================================
        # SAFE FILENAME & ANALYSIS SESSION ID
        # ====================================================

        filename = secure_filename(
            video.filename
        )

        orig_ext = os.path.splitext(video.filename)[1] or ".mp4"

        if not filename or filename == orig_ext:
            filename = f"upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}{orig_ext}"

        analysis_id = f"ACL_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:4].upper()}"


        # ====================================================
        # SAVE UPLOADED VIDEO
        # ====================================================

        filepath = os.path.join(
            UPLOAD_FOLDER,
            filename
        )


        video.save(
            filepath
        )

        file_size_mb = round(os.path.getsize(filepath) / (1024 * 1024), 2) if os.path.exists(filepath) else 0

        print()
        print("=" * 70)
        print("VIDEO UPLOAD RECEIVED")
        print("=" * 70)
        print("Timestamp:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        print("Analysis ID:", analysis_id)
        print("Filename:", filename)
        print("File Size:", f"{file_size_mb} MB")
        print("Saved to:", filepath)
        print("=" * 70)


        # ====================================================
        # PROCESS VIDEO
        # ====================================================

        print(f"[Upload] Starting VideoProcessor for {analysis_id}...")

        processor = VideoProcessor(
            filepath
        )


        video_info = (
            processor.get_video_info()
        )

        print(f"[Upload] VideoProcessor completed for {analysis_id} in {round(time.time() - req_start, 2)}s")


        # ====================================================
        # PROCESSING FAILED
        # ====================================================

        if not video_info.get(
            "success",
            False
        ):

            err_msg = video_info.get(
                "message",
                "Video processing failed."
            )

            print(f"[Upload Error] {err_msg}")

            return jsonify({

                "success": False,

                "message": err_msg,

                "error": err_msg

            }), 500


        # ====================================================
        # GET PROCESSED VIDEO
        # ====================================================

        processed_video = (
            video_info.get(
                "processed_video",
                ""
            )
        )


        if not processed_video:

            return jsonify({

                "success": False,

                "message":
                    "Processed video path was not returned.",

                "error":
                    "Missing processed_video in analysis result."

            }), 500


        # ====================================================
        # VERIFY PROCESSED FILE
        # ====================================================

        if not os.path.exists(
            processed_video
        ):

            print(
                "ERROR: Processed video does not exist:"
            )

            print(
                processed_video
            )

            return jsonify({

                "success": False,

                "message":
                    "Processed video file was not created.",

                "error":
                    "Output video file missing from disk."

            }), 500


        # ====================================================
        # CREATE FRONTEND URL
        # ====================================================

        processed_filename = os.path.basename(
            processed_video
        )


        processed_video_url = (
            "/outputs/processed/"
            + processed_filename
        )


        # ====================================================
        # FINAL VIDEO DATA
        # ====================================================

        final_video = {

            "analysis_id":
                analysis_id,

            "filename":
                filename,

            "processed_video":
                processed_video_url,

            "processed_video_url":
                processed_video_url,

            "raw_video_url":
                f"/uploads/{filename}",

            "video_url":
                processed_video_url,

            "fps":
                video_info.get(
                    "fps",
                    0
                ),

            "frames":
                video_info.get(
                    "frames",
                    0
                ),

            "width":
                video_info.get(
                    "width",
                    0
                ),

            "height":
                video_info.get(
                    "height",
                    0
                ),

            "duration":
                video_info.get(
                    "duration",
                    0
                ),

            "processing_time":
                video_info.get(
                    "processing_time",
                    0
                ),

            "detected_frames":
                video_info.get(
                    "detected_frames",
                    0
                ),

            "landmarks":
                video_info.get(
                    "landmarks",
                    []
                ),

            "landmarks_sequence":
                video_info.get(
                    "landmarks_sequence",
                    []
                ),

            "features":
                video_info.get(
                    "features",
                    {}
                ),

            "feature_sequence":
                video_info.get(
                    "feature_sequence",
                    []
                ),

            "landing":
                video_info.get(
                    "landing",
                    {}
                ),

            "landing_image_url":
                video_info.get(
                    "landing_image_url",
                    ""
                ),

            "landing_frame_landmarks":
                video_info.get(
                    "landing_frame_landmarks",
                    []
                ),

            "landing_frame_features":
                video_info.get(
                    "landing_frame_features",
                    {}
                ),

            "landing_features":
                video_info.get(
                    "landing_features",
                    {}
                ),

            "risk":
                video_info.get(
                    "risk",
                    {}
                ),

            "recommendations":
                video_info.get(
                    "recommendations",
                    []
                ),

            "analysis_summary":
                video_info.get(
                    "analysis_summary",
                    {}
                )

        }


        # ====================================================
        # PERSIST TO HISTORY STORE
        # ====================================================

        history_manager.save_analysis(final_video)


        # ====================================================
        # DEBUG LOGGING
        # ====================================================

        print()
        print("=" * 70)
        print("ANALYSIS COMPLETE — RETURNING JSON")
        print("=" * 70)
        print("Analysis ID:", analysis_id)
        print("Processed video URL:", processed_video_url)
        print("Total frames:", final_video["frames"])
        print("Detected frames:", final_video["detected_frames"])
        print("Risk Level:", final_video["risk"].get("level"))
        print("Risk Score:", final_video["risk"].get("score"), "%")
        print("Total API Duration:", round(time.time() - req_start, 2), "s")
        print("=" * 70)
        print()


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success":
                True,

            "analysis_id":
                analysis_id,

            "message":
                "Video uploaded and analyzed successfully.",

            "filename":
                filename,

            "video":
                final_video

        }), 200


    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except Exception as e:

        print()
        print("=" * 70)
        print("UPLOAD / PROCESSING ERROR")
        print("=" * 70)

        print(
            str(e)
        )

        print("=" * 70)
        print()


        return jsonify({

            "success":
                False,

            "message":
                "An unexpected error occurred during video analysis.",

            "error":
                str(e)

        }), 500