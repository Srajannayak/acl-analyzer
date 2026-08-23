from flask import Blueprint, jsonify, request
from services.history_manager import HistoryManager

history_bp = Blueprint("history", __name__)
history_manager = HistoryManager()


@history_bp.route("/history", methods=["GET"])
def get_all_history():
    try:
        records = history_manager.get_history()
        return jsonify({
            "success": True,
            "count": len(records),
            "history": records
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to retrieve history.",
            "error": str(e)
        }), 500


@history_bp.route("/analysis/<analysis_id>", methods=["GET"])
def get_analysis_by_id(analysis_id):
    try:
        analysis = history_manager.get_analysis_by_id(analysis_id)
        if not analysis:
            return jsonify({
                "success": False,
                "message": f"Analysis with ID '{analysis_id}' not found."
            }), 404

        return jsonify({
            "success": True,
            "analysis": analysis
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to retrieve analysis.",
            "error": str(e)
        }), 500


@history_bp.route("/history/<analysis_id>", methods=["DELETE"])
def delete_history_entry(analysis_id):
    try:
        deleted = history_manager.delete_analysis(analysis_id)
        if not deleted:
            return jsonify({
                "success": False,
                "message": f"Analysis with ID '{analysis_id}' not found."
            }), 404

        return jsonify({
            "success": True,
            "message": f"Analysis '{analysis_id}' deleted successfully."
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to delete analysis.",
            "error": str(e)
        }), 500
