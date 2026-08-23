import os
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs")
PROCESSED_FOLDER = os.path.join(OUTPUT_FOLDER, "processed")
REPORTS_FOLDER = os.path.join(OUTPUT_FOLDER, "reports")
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")

MODEL_PATH = os.path.join(MODELS_DIR, "acl_risk_model.pkl")
POSE_LANDMARKER_MODEL_PATH = os.path.join(MODELS_DIR, "pose_landmarker_lite.task")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)
os.makedirs(REPORTS_FOLDER, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)


def get_ffmpeg_path():
    env_path = os.environ.get("FFMPEG_PATH")
    if env_path and os.path.exists(env_path):
        return env_path

    path_ffmpeg = shutil.which("ffmpeg")
    if path_ffmpeg:
        return path_ffmpeg

    fallback_paths = [
        r"C:\ffmpeg\ffmpeg-9.0.1-essentials_build\bin\ffmpeg.exe",
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
    ]

    for p in fallback_paths:
        if os.path.exists(p):
            return p

    return "ffmpeg"


FFMPEG_PATH = get_ffmpeg_path()
