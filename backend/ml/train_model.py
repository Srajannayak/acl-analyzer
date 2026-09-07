import os
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# =====================================================
# 1. LOAD DATASET
# =====================================================

dataset_path = os.path.join(
    os.path.dirname(__file__),
    "acl_biomechanical_dataset.csv"
)

df = pd.read_csv(dataset_path)

print("=" * 60)
print("1. DATASET LOADED")
print("=" * 60)
print(f"Total samples: {len(df)}")
print("\nClass distribution:")
print(df["risk"].value_counts())

# =====================================================
# 2. SELECT FEATURES
# =====================================================

features = [
    "knee_flexion",
    "knee_valgus",
    "hip_flexion",
    "trunk_inclination",
    "ankle_dorsiflexion",
    "landing_symmetry"
]

X = df[features]
y = df["risk"]

# =====================================================
# 3. TRAIN / TEST SPLIT (80% Train, 20% Test, Stratified)
# =====================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\n" + "=" * 60)
print("2. DATA SPLIT")
print("=" * 60)
print(f"Training samples : {len(X_train)}")
print(f"Testing samples  : {len(X_test)}")

# =====================================================
# 4. TRAIN RANDOM FOREST CLASSIFIER
# =====================================================

random_forest = RandomForestClassifier(
    n_estimators=200,
    min_samples_leaf=3,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

random_forest.fit(X_train, y_train)

# =====================================================
# 5. MODEL EVALUATION
# =====================================================

rf_predictions = random_forest.predict(X_test)
rf_accuracy = accuracy_score(y_test, rf_predictions)

print("\n" + "=" * 60)
print("3. RANDOM FOREST EVALUATION")
print("=" * 60)
print(f"Accuracy: {rf_accuracy * 100:.2f}%\n")

print("Classification Report:")
print(classification_report(y_test, rf_predictions, digits=4))

print("Confusion Matrix:")
cm = confusion_matrix(y_test, rf_predictions, labels=["Low", "Moderate", "High"])
cm_df = pd.DataFrame(
    cm,
    index=["True Low", "True Moderate", "True High"],
    columns=["Pred Low", "Pred Moderate", "Pred High"]
)
print(cm_df)

# =====================================================
# 6. FEATURE IMPORTANCE
# =====================================================

print("\n" + "=" * 60)
print("4. FEATURE IMPORTANCE")
print("=" * 60)

importances = sorted(
    zip(features, random_forest.feature_importances_),
    key=lambda x: x[1],
    reverse=True
)

for feature, importance in importances:
    print(f"  {feature:25s}: {importance:.4f} ({importance * 100:.1f}%)")

# =====================================================
# 7. SAVE MODEL
# =====================================================

ml_dir = os.path.dirname(__file__)
backend_dir = os.path.dirname(ml_dir)
models_dir = os.path.join(backend_dir, "models")
os.makedirs(models_dir, exist_ok=True)

production_model_path = os.path.join(models_dir, "acl_risk_model.pkl")
ml_backup_model_path = os.path.join(ml_dir, "acl_risk_model.pkl")

joblib.dump(random_forest, production_model_path)
joblib.dump(random_forest, ml_backup_model_path)

print("\n" + "=" * 60)
print("5. MODEL PERSISTENCE")
print("=" * 60)
print(f"Saved to production path : {production_model_path}")
print(f"Saved to ml backup path  : {ml_backup_model_path}")

# =====================================================
# 8. TEST EXAMPLES
# =====================================================

print("\n" + "=" * 60)
print("6. TEST EXAMPLES (INFERENCE TEST)")
print("=" * 60)

test_scenarios = [
    {
        "name": "TEST 1: Clearly Stiff / Insufficient Knee Bending (Knee Not Bending)",
        "features": {
            "knee_flexion": 16.5,
            "knee_valgus": 6.5,
            "hip_flexion": 26.0,
            "trunk_inclination": 12.0,
            "ankle_dorsiflexion": 32.0,
            "landing_symmetry": 52.0
        },
        "expected": "High"
    },
    {
        "name": "TEST 1B: Stiff Knee Landing with Elevated Valgus",
        "features": {
            "knee_flexion": 18.0,
            "knee_valgus": 16.0,
            "hip_flexion": 20.0,
            "trunk_inclination": 20.0,
            "ankle_dorsiflexion": 14.0,
            "landing_symmetry": 40.0
        },
        "expected": "High"
    },
    {
        "name": "TEST 2: Moderate or Partial Knee Bending",
        "features": {
            "knee_flexion": 36.0,
            "knee_valgus": 9.5,
            "hip_flexion": 32.0,
            "trunk_inclination": 16.0,
            "ankle_dorsiflexion": 25.0,
            "landing_symmetry": 46.0
        },
        "expected": "Moderate"
    },
    {
        "name": "TEST 3: Clearly Good Knee Bending",
        "features": {
            "knee_flexion": 54.0,
            "knee_valgus": 5.0,
            "hip_flexion": 46.0,
            "trunk_inclination": 8.0,
            "ankle_dorsiflexion": 32.0,
            "landing_symmetry": 50.0
        },
        "expected": "Low"
    },
    {
        "name": "TEST 3B: Tested Safe Video (WhatsApp_Video_2026-09-03_at_8.54.13_AM.mp4)",
        "features": {
            "knee_flexion": 43.17,
            "knee_valgus": 9.95,
            "hip_flexion": 41.02,
            "trunk_inclination": 13.80,
            "ankle_dorsiflexion": 37.42,
            "landing_symmetry": 60.76
        },
        "expected": "Low"
    }
]

classes = list(random_forest.classes_)

for scenario in test_scenarios:
    input_df = pd.DataFrame([scenario["features"]], columns=features)
    pred_label = random_forest.predict(input_df)[0]
    probabilities = random_forest.predict_proba(input_df)[0]
    prob_map = {cls_name: round(float(p) * 100, 1) for cls_name, p in zip(classes, probabilities)}

    match_symbol = "PASS" if pred_label == scenario["expected"] else "MISMATCH"
    print(f"\n[{match_symbol}] {scenario['name']}")
    print(f"  Input Features  : {scenario['features']}")
    print(f"  Model Prediction: {pred_label} (Expected: {scenario['expected']})")
    print(f"  Probabilities   : {prob_map}")

print("\n" + "=" * 60)
print("TRAINING PIPELINE COMPLETED SUCCESSFULLY")
print("=" * 60)