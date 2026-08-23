import os
import json
from datetime import datetime

try:
    from config import DATA_DIR
except ImportError:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR = os.path.join(BASE_DIR, "data")


class HistoryManager:

    def __init__(self):
        self.data_dir = DATA_DIR
        self.history_file = os.path.join(self.data_dir, "history.json")

        os.makedirs(self.data_dir, exist_ok=True)

        if not os.path.exists(self.history_file):
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _read_history(self):
        try:
            if not os.path.exists(self.history_file):
                return []
            with open(self.history_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print("Error reading history file:", e)
            return []

    def _write_history(self, records):
        try:
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2)
            return True
        except Exception as e:
            print("Error writing history file:", e)
            return False

    def save_analysis(self, analysis_data):
        try:
            records = self._read_history()

            analysis_id = analysis_data.get("analysis_id")
            if not analysis_id:
                now_str = datetime.now().strftime("%Y%m%d_%H%M%S")
                analysis_id = f"ACL_{now_str}"
                analysis_data["analysis_id"] = analysis_id

            # Remove existing record with same ID if any
            records = [r for r in records if r.get("analysis_id") != analysis_id]

            created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            analysis_data["created_at"] = created_at

            # Prepend newest record
            records.insert(0, analysis_data)

            # Keep latest 100 records
            records = records[:100]

            self._write_history(records)
            return analysis_data
        except Exception as e:
            print("Error saving analysis to history:", e)
            return analysis_data

    def get_history(self):
        return self._read_history()

    def get_analysis_by_id(self, analysis_id):
        records = self._read_history()
        for record in records:
            if record.get("analysis_id") == analysis_id:
                return record
        return None

    def delete_analysis(self, analysis_id):
        records = self._read_history()
        new_records = [r for r in records if r.get("analysis_id") != analysis_id]
        if len(new_records) < len(records):
            self._write_history(new_records)
            return True
        return False
