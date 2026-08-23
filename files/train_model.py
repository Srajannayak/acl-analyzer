"""
train_model.py
----------------
Trains the ACL injury risk classifier.

WHY SYNTHETIC DATA: Public, labeled, real-injury biomechanics datasets do
not exist for student/academic use. Instead of inventing labels, this
script encodes documented risk thresholds from sports-biomechanics
literature into a scoring function, generates a large synthetic feature
population that respects realistic human ranges + noise, labels each
sample with that scoring function, and then trains a Random Forest on it.

This is a legitimate and commonly used technique ("expert-rule distillation")
when ground-truth labels are unavailable — the model learns a smooth,
generalizable decision boundary from domain knowledge, rather than a rigid
set of if/else rules. Cite this reasoning explicitly in your report; do not
present it as "trained on real athlete injury data."

Key cited risk factors used to build the rule/scoring function (cite these
in your report's literature review):
  - Hewett et al. (2005), "Biomechanical Measures of Neuromuscular Control
    and Valgus Loading of the Knee Predict Anterior Cruciate Ligament
    Injury Risk in Female Athletes" -> knee valgus / abduction angle
  - Padua et al. (2009), Landing Error Scoring System (LESS) -> knee
    flexion angle, trunk flexion, foot position at landing
  - Reduced knee & hip flexion at initial contact ("stiff landing") is
    repeatedly cited as an ACL-risk pattern.

Run: python3 train_model.py
Outputs: model/acl_risk_model.joblib, model/scaler.joblib, model/feature_report.txt
"""

import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

RNG = np.random.default_rng(42)
N_SAMPLES = 6000
OUT_DIR = os.path.join(os.path.dirname(__file__), "model")
os.makedirs(OUT_DIR, exist_ok=True)


def generate_synthetic_population(n=N_SAMPLES):
    """
    Sample realistic biomechanical feature values across the population,
    covering good-to-poor landing mechanics.
    """
    knee_angle = RNG.normal(loc=45, scale=18, size=n).clip(5, 90)      # deg, at landing
    hip_angle = RNG.normal(loc=50, scale=20, size=n).clip(5, 100)       # deg
    ankle_angle = RNG.normal(loc=25, scale=12, size=n).clip(0, 60)      # deg dorsiflexion proxy
    trunk_lean = RNG.normal(loc=15, scale=10, size=n).clip(0, 50)       # deg from vertical
    knee_valgus = RNG.normal(loc=0.05, scale=0.08, size=n).clip(-0.1, 0.4)  # normalized proxy

    return np.stack([knee_angle, hip_angle, ankle_angle, trunk_lean, knee_valgus], axis=1)


def score_risk(features):
    """
    Rule-based composite risk score (0-100) from literature-backed
    thresholds. Higher = more risk. Weighted sum of normalized deviations
    from "safe" reference ranges.
    """
    knee_angle, hip_angle, ankle_angle, trunk_lean, knee_valgus = features.T

    # Stiff landing: low knee flexion is risky (protective range >= 45 deg)
    knee_risk = np.clip((45 - knee_angle) / 45, 0, 1)

    # Low hip flexion is risky (protective range >= 50 deg)
    hip_risk = np.clip((50 - hip_angle) / 50, 0, 1)

    # Limited ankle dorsiflexion is risky (protective range >= 20 deg)
    ankle_risk = np.clip((20 - ankle_angle) / 20, 0, 1)

    # Excessive trunk lean (poor core control) is risky beyond ~25 deg
    trunk_risk = np.clip((trunk_lean - 15) / 35, 0, 1)

    # Knee valgus (dynamic knee collapse) is the strongest single predictor
    valgus_risk = np.clip(knee_valgus / 0.3, 0, 1)

    # Weighted composite (valgus weighted highest per Hewett et al.)
    composite = (
        0.35 * valgus_risk +
        0.25 * knee_risk +
        0.15 * hip_risk +
        0.10 * ankle_risk +
        0.15 * trunk_risk
    ) * 100

    # small label noise to avoid an overly clean/artificial decision boundary
    composite += RNG.normal(0, 4, size=composite.shape)
    return np.clip(composite, 0, 100)


def to_class(score, low_cut=None, high_cut=None):
    """
    Classify a composite score into Low/Moderate/High.
    If cutoffs aren't given, derive them from this score distribution's
    33rd/66th percentiles so all three classes are reasonably populated
    for training (labels stay meaningful: they mark the bottom/middle/top
    thirds of realistic landing-mechanics risk).
    """
    if low_cut is None or high_cut is None:
        low_cut, high_cut = np.percentile(score, [40, 75])
    return np.where(score < low_cut, "Low", np.where(score < high_cut, "Moderate", "High")), low_cut, high_cut


def main():
    X = generate_synthetic_population()
    scores = score_risk(X)
    y, low_cut, high_cut = to_class(scores)
    print(f"Derived risk-score cutoffs -> Low < {low_cut:.1f} <= Moderate < {high_cut:.1f} <= High")

    feature_names = ["knee_angle", "hip_angle", "ankle_angle", "trunk_lean", "knee_valgus"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    clf = RandomForestClassifier(
        n_estimators=300,
        max_depth=8,
        min_samples_leaf=5,
        random_state=42,
        class_weight="balanced",
    )
    clf.fit(X_train_s, y_train)

    y_pred = clf.predict(X_test_s)
    report = classification_report(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred, labels=["Low", "Moderate", "High"])
    importances = dict(zip(feature_names, clf.feature_importances_))

    print("=== Classification report ===")
    print(report)
    print("=== Confusion matrix (rows=true, cols=pred) [Low, Moderate, High] ===")
    print(cm)
    print("=== Feature importances ===")
    for k, v in sorted(importances.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v:.3f}")

    joblib.dump(clf, os.path.join(OUT_DIR, "acl_risk_model.joblib"))
    joblib.dump(scaler, os.path.join(OUT_DIR, "scaler.joblib"))
    joblib.dump(feature_names, os.path.join(OUT_DIR, "feature_names.joblib"))
    joblib.dump({"low_cut": float(low_cut), "high_cut": float(high_cut)}, os.path.join(OUT_DIR, "score_cutoffs.joblib"))

    with open(os.path.join(OUT_DIR, "feature_report.txt"), "w") as f:
        f.write("ACL Risk Model - Training Report\n")
        f.write("=================================\n\n")
        f.write("Training approach: literature-threshold-guided synthetic data\n")
        f.write("(no real injury-labeled dataset was available; see train_model.py docstring)\n\n")
        f.write(report)
        f.write("\nConfusion matrix [Low, Moderate, High]:\n")
        f.write(str(cm))
        f.write("\n\nFeature importances:\n")
        for k, v in sorted(importances.items(), key=lambda x: -x[1]):
            f.write(f"  {k}: {v:.3f}\n")

    print(f"\nSaved model + scaler + report to {OUT_DIR}/")


if __name__ == "__main__":
    main()
