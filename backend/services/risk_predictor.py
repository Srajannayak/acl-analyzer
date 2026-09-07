import os
import joblib
import pandas as pd
import numpy as np


try:
    from config import MODEL_PATH

except ImportError:
    service_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(service_dir)

    MODEL_PATH = os.path.join(
        backend_dir,
        "models",
        "acl_risk_model.pkl"
    )


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

        self.model = joblib.load(model_path)

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
                values[feature] = float(value)

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
    # CLASSIFY FINAL RISK BASED ON PERCENTAGE
    # =====================================================

    def _classify_risk_by_percentage(self, risk_score):

        # ---------------------------------------------
        # 55% AND ABOVE = HIGH RISK
        # ---------------------------------------------

        if risk_score >= 55:
            return "High"

        # ---------------------------------------------
        # 30% TO 54.99% = MODERATE RISK
        # ---------------------------------------------

        elif risk_score >= 30:
            return "Moderate"

        # ---------------------------------------------
        # BELOW 30% = LOW RISK
        # ---------------------------------------------

        else:
            return "Low"


    # =====================================================
    # PREDICT
    # =====================================================

    def predict(self, features):

        try:

            # =============================================
            # PREPARE EXACT SIX TRAINING FEATURES
            # =============================================

            X = self._prepare_features(features)


            # =============================================
            # PREDICT CLASS FROM RANDOM FOREST
            # =============================================

            prediction = self.model.predict(X)[0]

            original_risk_label = str(prediction)


            # =============================================
            # GET PROBABILITIES
            # =============================================

            probabilities = {}

            if hasattr(
                self.model,
                "predict_proba"
            ):

                probability_values = (
                    self.model.predict_proba(X)[0]
                )

                classes = self.model.classes_

                for class_name, probability in zip(
                    classes,
                    probability_values
                ):

                    probabilities[
                        str(class_name)
                    ] = round(
                        float(probability) * 100,
                        2
                    )


            # =============================================
            # CALCULATE RISK SCORE
            # =============================================

            risk_score = self._calculate_risk_score(
                original_risk_label,
                probabilities,
                features
            )


            # =============================================
            # FINAL CLASSIFICATION BASED ON PERCENTAGE
            #
            # IMPORTANT:
            #
            # 55% or above → HIGH
            # =============================================

            risk_label = self._classify_risk_by_percentage(
                risk_score
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
                "label": risk_label,

                "risk": risk_label,

                "level": risk_label,

                "risk_level": risk_label,

                "risk_percentage": risk_score,

                "risk_score": risk_score,

                "score": risk_score,

                "confidence": round(
                    confidence,
                    2
                ),

                "probabilities": probabilities,

                # Optional:
                # Shows what Random Forest originally predicted
                "original_model_prediction":
                    original_risk_label
            }


        except Exception as e:

            print(
                "Risk prediction error:",
                str(e)
            )

            return {
                "label": "Unknown",

                "risk": "Unknown",

                "level": "Unknown",

                "risk_level": "Unknown",

                "risk_percentage": 0,

                "risk_score": 0,

                "score": 0,

                "confidence": 0,

                "probabilities": {},

                "error": str(e)
            }


    # =====================================================
    # BIOMECHANICAL FEATURE SEVERITY
    # =====================================================

    def _compute_biomechanical_severity(self, features):
        """
        Computes a continuous biomechanical severity score (0.0 to 1.0)
        from the actual extracted landing angles and symmetry.
        Provides a continuous distance metric from risk boundaries.
        """
        if not features or not isinstance(features, dict):
            return 0.50

        try:
            kf = float(features.get("knee_flexion", 45.0))
            kv = float(features.get("knee_valgus", 6.0))
            hf = float(features.get("hip_flexion", 40.0))
            ti = float(features.get("trunk_inclination", 10.0))
            ad = float(features.get("ankle_dorsiflexion", 30.0))
            ls = float(features.get("landing_symmetry", 50.0))
        except (TypeError, ValueError):
            return 0.50

        # 1. Knee flexion severity (0.0 to 1.0)
        if kf >= 50.0:
            kf_sev = max(0.0, (55.0 - kf) * 0.01)
        elif kf >= 42.0:
            kf_sev = (50.0 - kf) / 8.0 * 0.25
        elif kf >= 30.0:
            kf_sev = 0.25 + (42.0 - kf) / 12.0 * 0.40
        elif kf >= 20.0:
            kf_sev = 0.65 + (30.0 - kf) / 10.0 * 0.25
        else:
            kf_sev = 0.90 + min((20.0 - kf) / 10.0 * 0.10, 0.10)

        # 2. Knee valgus severity (0.0 to 1.0)
        if kv <= 7.5:
            kv_sev = 0.0
        elif kv <= 10.5:
            kv_sev = (kv - 7.5) / 3.0 * 0.25
        elif kv <= 15.0:
            kv_sev = 0.25 + (kv - 10.5) / 4.5 * 0.45
        else:
            kv_sev = 0.70 + min((kv - 15.0) / 8.0 * 0.30, 0.30)

        # 3. Landing symmetry severity (0.0 to 1.0)
        s_dev = abs(ls - 50.0)
        if s_dev <= 10.0:
            sym_sev = s_dev / 10.0 * 0.10
        elif s_dev <= 17.5:
            sym_sev = 0.10 + (s_dev - 10.0) / 7.5 * 0.45
        else:
            sym_sev = 0.55 + min((s_dev - 17.5) / 10.0 * 0.45, 0.45)

        # 4. Trunk inclination severity (0.0 to 1.0)
        if ti <= 14.0:
            tr_sev = 0.0
        elif ti <= 22.0:
            tr_sev = (ti - 14.0) / 8.0 * 0.40
        else:
            tr_sev = 0.40 + min((ti - 22.0) / 12.0 * 0.60, 0.60)

        # 5. Hip flexion severity (0.0 to 1.0)
        if hf >= 38.0:
            hip_sev = 0.0
        elif hf >= 26.0:
            hip_sev = (38.0 - hf) / 12.0 * 0.45
        else:
            hip_sev = 0.45 + min((26.0 - hf) / 14.0 * 0.55, 0.55)

        # 6. Ankle dorsiflexion severity (0.0 to 1.0)
        if ad >= 22.0:
            ankle_sev = 0.0
        elif ad >= 14.0:
            ankle_sev = (22.0 - ad) / 8.0 * 0.40
        else:
            ankle_sev = 0.40 + min((14.0 - ad) / 8.0 * 0.60, 0.60)

        total_sev = (
            kf_sev * 0.44 +
            kv_sev * 0.18 +
            sym_sev * 0.14 +
            tr_sev * 0.12 +
            hip_sev * 0.08 +
            ankle_sev * 0.04
        )
        return float(np.clip(total_sev, 0.0, 1.0))


    # =====================================================
    # RISK SCORE CALCULATION WITH NATURAL VARIATION
    # =====================================================

    def _calculate_risk_score(
        self,
        risk_label,
        probabilities,
        features=None
    ):
        """
        Calculates a calibrated, continuous risk percentage.
        Natural variation is derived from:
        1. Model confidence and probability distributions
        2. Feature distance from risk boundaries
        3. Actual extracted biomechanical feature severity
        """
        label = risk_label.lower()

        bio_sev = self._compute_biomechanical_severity(features)

        p_high = float(probabilities.get("High", probabilities.get("high", 0.0))) / 100.0
        p_mod = float(probabilities.get("Moderate", probabilities.get("moderate", 0.0))) / 100.0
        p_low = float(probabilities.get("Low", probabilities.get("low", 0.0))) / 100.0

        # =================================================
        # HIGH RISK (Target: 55% to 75%, Preferred: 58% to 72%)
        # =================================================
        if "high" in label:
            sev_norm = max(0.0, min(1.0, (bio_sev - 0.45) / 0.50))
            t = 0.50 * p_high + 0.50 * sev_norm
            score = 55.0 + t * 20.0
            return round(min(75.0, max(55.0, score)), 2)

        # =================================================
        # MODERATE RISK (Target: 30% to 54%, Preferred: 32% to 48%)
        # =================================================
        if "mod" in label:
            sev_norm = max(0.0, min(1.0, (bio_sev - 0.20) / 0.45))
            prob_tilt = (p_high - p_low + 1.0) / 2.0
            t = 0.40 * p_mod * 0.5 + 0.60 * prob_tilt + 0.40 * sev_norm
            t = max(0.0, min(1.0, (t - 0.20) / 0.80))
            score = 30.0 + t * 24.0
            return round(min(54.0, max(30.0, score)), 2)

        # =================================================
        # LOW RISK (Target: 18% to 29%, Preferred: 20% to 27%)
        # =================================================
        sev_norm = max(0.0, min(1.0, bio_sev / 0.28))
        non_low = (p_mod + 2.0 * p_high)
        t = 0.60 * sev_norm + 0.40 * non_low
        score = 18.5 + t * 10.5
        return round(min(29.0, max(18.0, score)), 2)