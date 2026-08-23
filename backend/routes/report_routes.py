import os
from flask import Blueprint, jsonify, send_file
from services.history_manager import HistoryManager
from services.report_generator import ReportGenerator

try:
    from config import REPORTS_FOLDER
except ImportError:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    REPORTS_FOLDER = os.path.join(BASE_DIR, "outputs", "reports")

report_bp = Blueprint("report", __name__)
history_manager = HistoryManager()
report_generator = ReportGenerator()

os.makedirs(REPORTS_FOLDER, exist_ok=True)


@report_bp.route("/report/<analysis_id>", methods=["GET"])
def get_report_data(analysis_id):
    try:
        analysis = history_manager.get_analysis_by_id(analysis_id)
        if not analysis:
            return jsonify({
                "success": False,
                "message": f"Analysis with ID '{analysis_id}' not found."
            }), 404

        landing_features = analysis.get("landing_features") or analysis.get("features") or {}
        risk = analysis.get("risk") or {}

        report_content = report_generator.generate(landing_features, risk)

        return jsonify({
            "success": True,
            "analysis_id": analysis_id,
            "filename": analysis.get("filename"),
            "created_at": analysis.get("created_at"),
            "report": report_content,
            "analysis": analysis
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to generate report data.",
            "error": str(e)
        }), 500


@report_bp.route("/report/<analysis_id>/pdf", methods=["GET"])
@report_bp.route("/report/<analysis_id>/download", methods=["GET"])
def download_report_pdf(analysis_id):
    try:
        analysis = history_manager.get_analysis_by_id(analysis_id)
        if not analysis:
            return jsonify({
                "success": False,
                "message": f"Analysis with ID '{analysis_id}' not found."
            }), 404

        pdf_filename = f"report_{analysis_id}.pdf"
        pdf_path = os.path.join(REPORTS_FOLDER, pdf_filename)

        generated_path = report_generator.generate_pdf(analysis, pdf_path)

        if not generated_path or not os.path.exists(pdf_path):
            return jsonify({
                "success": False,
                "message": "Failed to compile PDF report."
            }), 500

        return send_file(
            pdf_path,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"ACL_Report_{analysis_id}.pdf"
        )
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "PDF download failed.",
            "error": str(e)
        }), 500
