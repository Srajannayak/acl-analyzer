import os
import joblib
import pandas as pd

try:
    from config import MODEL_PATH
except ImportError:
    service_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(service_dir)
    MODEL_PATH = os.path.join(backend_dir, "models", "acl_risk_model.pkl")


class RiskPredictor:

    # =====================================================
    # FEATURES USED DURING TRAINING
    # =====================================================

    FEATURE_NAMES = [
        "knee_flexion",
        "knee_valgus",
        "hip_flexion",
        "trunk_inclination",
        "ankle_dorsiflexion",
        "landing_symmetry"
    ]

    def __init__(self):

        model_path = MODEL_PATH

        print()
        print("=" * 60)
        print("ACL ML MODEL")
        print("=" * 60)
        print("Model path:", model_path)
        print("Model exists:", os.path.exists(model_path))

        if not os.path.exists(model_path):
            raise FileNotFoundError(
                "ACL ML model not found at: " + model_path
            )

        # =================================================
        # LOAD MODEL
        # =================================================

        self.model = joblib.load(
            model_path
        )

        print("ACL ML model loaded successfully")
        print("=" * 60)
        print()

    # =====================================================
    # PREPARE FEATURES
    # =====================================================

    def _prepare_features(self, features):

        values = {}

        for feature in self.FEATURE_NAMES:
            value = features.get(
                feature,
                0
            )

            try:
                values[feature] = float(
                    value
                )
            except (
                TypeError,
                ValueError
            ):
                values[feature] = 0.0

        return pd.DataFrame(
            [values],
            columns=self.FEATURE_NAMES
        )

    # =====================================================
    # PREDICT
    # =====================================================

    def predict(self, features):

        try:

            # =============================================
            # PREPARE EXACT SIX TRAINING FEATURES
            # =============================================

            X = self._prepare_features(
                features
            )

            # =============================================
            # PREDICT CLASS
            # =============================================

            prediction = self.model.predict(
                X
            )[0]

            risk_label = str(
                prediction
            )

            # =============================================
            # PROBABILITY
            # =============================================

            probabilities = {}

            if hasattr(
                self.model,
                "predict_proba"
            ):
                probability_values = (
                    self.model.predict_proba(X)[0]
                )

                classes = (
                    self.model.classes_
                )

                for class_name, probability in zip(
                    classes,
                    probability_values
                ):
                    probabilities[
                        str(class_name)
                    ] = round(
                        float(probability)
                        * 100,
                        2
                    )

            # =============================================
            # CALCULATE RISK SCORE
            # =============================================

            risk_score = (
                self._calculate_risk_score(
                    risk_label,
                    probabilities
                )
            )

            # =============================================
            # CONFIDENCE
            # =============================================

            confidence = 0.0

            if probabilities:
                confidence = max(
                    probabilities.values()
                )

            # =============================================
            # FINAL RESULT
            # =============================================

            return {
                "label":
                    risk_label,
                "risk":
                    risk_label,
                "level":
                    risk_label,
                "risk_level":
                    risk_label,
                "risk_percentage":
                    risk_score,
                "risk_score":
                    risk_score,
                "score":
                    risk_score,
                "confidence":
                    round(
                        confidence,
                        2
                    ),
                "probabilities":
                    probabilities
            }

        except Exception as e:

            print(
                "Risk prediction error:",
                str(e)
            )

            return {
                "label":
                    "Unknown",
                "risk":
                    "Unknown",
                "level":
                    "Unknown",
                "risk_level":
                    "Unknown",
                "risk_percentage":
                    0,
                "risk_score":
                    0,
                "score":
                    0,
                "confidence":
                    0,
                "probabilities":
                    {},
                "error":
                    str(e)
            }

    # =====================================================
    # RISK SCORE
    # =====================================================

    def _calculate_risk_score(
        self,
        risk_label,
        probabilities
    ):

        label = risk_label.lower()

        # =================================================
        # HIGH RISK
        # =================================================

        if "high" in label:
            high_prob = probabilities.get(
                "High",
                probabilities.get(
                    "high",
                    75.0
                )
            )
            return round(
                70.0 + (float(high_prob) / 100.0) * 25.0,
                2
            )

        # =================================================
        # MODERATE RISK
        # =================================================

        if "mod" in label:
            mod_prob = probabilities.get(
                "Moderate",
                probabilities.get(
                    "moderate",
                    50.0
                )
            )
            return round(
                40.0 + (float(mod_prob) / 100.0) * 25.0,
                2
            )

        # =================================================
        # LOW RISK
        # =================================================

        low_prob = probabilities.get(
            "Low",
            probabilities.get(
                "low",
                60.0
            )
        )

        return round(
            max(5.0, 50.0 - (float(low_prob) / 100.0) * 35.0),
            2
        )