import os
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

from routes.upload_routes import upload_bp
from routes.history_routes import history_bp
from routes.report_routes import report_bp


app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

os.makedirs(
    OUTPUT_FOLDER,
    exist_ok=True
)
os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


# ============================================================
# CORS HEADERS (AFTER REQUEST)
# ============================================================

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Range"
    response.headers["Access-Control-Expose-Headers"] = "Content-Range, Content-Length, Accept-Ranges"
    return response


# ============================================================
# HOME & HEALTH CHECK
# ============================================================

@app.route("/")
def home():

    return jsonify({

        "success": True,

        "message":
            "ACL Analyzer Backend Running Successfully"

    })


# ============================================================
# REGISTER BLUEPRINTS
# ============================================================

app.register_blueprint(
    upload_bp
)

app.register_blueprint(
    history_bp
)

app.register_blueprint(
    report_bp
)


# ============================================================
# SERVE PROCESSED VIDEO & OUTPUTS
# ============================================================

@app.route(
    "/outputs/<path:filename>"
)
def serve_output_video(filename):

    full_path = os.path.join(
        OUTPUT_FOLDER,
        filename
    )

    if not os.path.exists(
        full_path
    ):

        return jsonify({

            "success": False,

            "message":
                "Video not found",

            "filename":
                filename

        }), 404

    return send_from_directory(

        OUTPUT_FOLDER,

        filename,

        conditional=True,

        mimetype="video/mp4"

    )


# ============================================================
# SERVE RAW UPLOADS
# ============================================================

@app.route(
    "/uploads/<path:filename>"
)
def serve_upload_video(filename):

    full_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    if not os.path.exists(
        full_path
    ):

        return jsonify({

            "success": False,

            "message":
                "Uploaded video not found",

            "filename":
                filename

        }), 404

    return send_from_directory(

        UPLOAD_FOLDER,

        filename,

        conditional=True,

        mimetype="video/mp4"

    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print("ACL ANALYZER BACKEND")
    print("=" * 60)

    print(
        "Output folder:",
        OUTPUT_FOLDER
    )

    print(
        "Upload folder:",
        UPLOAD_FOLDER
    )

    print(
        "Server:",
        "http://127.0.0.1:5000"
    )

    print("=" * 60)
    print()

    app.run(

        host="0.0.0.0",

        port=5000,

        debug=True,

        threaded=True

    )