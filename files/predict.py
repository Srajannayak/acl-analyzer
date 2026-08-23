"""
predict.py
-----------
Loads the trained ACL risk model and runs inference on a feature dict
produced by feature_extraction.extract_landing_frame_features().

Usage:
    from predict import predict_acl_risk
    result = predict_acl_risk({
        "knee_angle": 28.0, "hip_angle": 35.0, "ankle_angle": 12.0,
        "trunk_lean": 22.0, "knee_valgus": 0.15
    })
    # result = {
    #   "risk_class": "Moderate",
    #   "probabilities": {"Low": 0.12, "Moderate": 0.63, "High": 0.25},
    #   "flags": ["Elevated knee valgus (possible dynamic knee collapse)"]
    # }
"""

import os
import joblib
import numpy as np

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")

_clf = None
_scaler = None
_feature_names = None


def _load():
    global _clf, _scaler, _feature_names
    if _clf is None:
        _clf = joblib.load(os.path.join(MODEL_DIR, "acl_risk_model.joblib"))
        _scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.joblib"))
        _feature_names = joblib.load(os.path.join(MODEL_DIR, "feature_names.joblib"))
    return _clf, _scaler, _feature_names


def _generate_flags(features):
    """Human-readable coaching flags alongside the ML prediction."""
    flags = []
    if features["knee_valgus"] > 0.15:
        flags.append("Elevated knee valgus (possible dynamic knee collapse) — the strongest cited ACL risk factor.")
    if features["knee_angle"] < 30:
        flags.append("Low knee flexion at landing (stiff landing pattern) — increases ACL loading.")
    if features["hip_angle"] < 35:
        flags.append("Low hip flexion at landing — often paired with reduced knee flexion.")
    if features["ankle_angle"] < 12:
        flags.append("Limited ankle dorsiflexion — reduces the ankle's shock-absorption role.")
    if features["trunk_lean"] > 30:
        flags.append("Excessive trunk lean — associated with poor core/trunk control on landing.")
    if not flags:
        flags.append("No major risk flags detected — landing mechanics look within typical safe ranges.")
    return flags


def predict_acl_risk(features: dict):
    """
    features: dict with keys knee_angle, hip_angle, ankle_angle,
              trunk_lean, knee_valgus (as produced by feature_extraction.py)
    Returns dict with risk_class, probabilities, flags.
    """
    clf, scaler, feature_names = _load()
    x = np.array([[features[name] for name in feature_names]])
    x_scaled = scaler.transform(x)

    pred_class = clf.predict(x_scaled)[0]
    proba = clf.predict_proba(x_scaled)[0]
    proba_dict = {cls: float(p) for cls, p in zip(clf.classes_, proba)}

    return {
        "risk_class": str(pred_class),
        "probabilities": proba_dict,
        "flags": _generate_flags(features),
    }


if __name__ == "__main__":
    # quick smoke test
    sample = {"knee_angle": 22, "hip_angle": 28, "ankle_angle": 8, "trunk_lean": 35, "knee_valgus": 0.22}
    print(predict_acl_risk(sample))
    sample2 = {"knee_angle": 55, "hip_angle": 60, "ankle_angle": 28, "trunk_lean": 10, "knee_valgus": 0.02}
    print(predict_acl_risk(sample2))
