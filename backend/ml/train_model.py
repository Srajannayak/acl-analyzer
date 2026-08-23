import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

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

print("======================================")
print("DATASET LOADED")
print("======================================")

print("Total samples:", len(df))

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
# 3. TRAIN / TEST SPLIT
# =====================================================

X_train, X_test, y_train, y_test = train_test_split(

    X,
    y,

    test_size=0.20,

    random_state=42,

    stratify=y
)


print("\n======================================")
print("DATA SPLIT")
print("======================================")

print("Training samples:", len(X_train))
print("Testing samples :", len(X_test))


# =====================================================
# 4. RANDOM FOREST MODEL
# =====================================================

random_forest = RandomForestClassifier(

    n_estimators=200,

    max_depth=10,

    random_state=42,

    class_weight="balanced",

    n_jobs=-1
)


random_forest.fit(
    X_train,
    y_train
)


# =====================================================
# 5. RANDOM FOREST PREDICTION
# =====================================================

rf_predictions = random_forest.predict(
    X_test
)


rf_accuracy = accuracy_score(
    y_test,
    rf_predictions
)


print("\n======================================")
print("RANDOM FOREST RESULTS")
print("======================================")

print(
    f"Accuracy: {rf_accuracy * 100:.2f}%"
)

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        rf_predictions
    )
)

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        rf_predictions
    )
)


# =====================================================
# 6. FEATURE IMPORTANCE
# =====================================================

print("\n======================================")
print("FEATURE IMPORTANCE")
print("======================================")

for feature, importance in zip(
    features,
    random_forest.feature_importances_
):

    print(
        f"{feature:25s}: "
        f"{importance:.4f}"
    )


# =====================================================
# 7. LOGISTIC REGRESSION BASELINE
# =====================================================

logistic_model = Pipeline([

    (
        "scaler",
        StandardScaler()
    ),

    (
        "classifier",
        LogisticRegression(
            max_iter=1000,
            random_state=42
        )
    )

])


logistic_model.fit(
    X_train,
    y_train
)


lr_predictions = logistic_model.predict(
    X_test
)


lr_accuracy = accuracy_score(
    y_test,
    lr_predictions
)


print("\n======================================")
print("LOGISTIC REGRESSION RESULTS")
print("======================================")

print(
    f"Accuracy: {lr_accuracy * 100:.2f}%"
)

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        lr_predictions
    )
)


# =====================================================
# 8. SELECT BEST MODEL
# =====================================================

if rf_accuracy >= lr_accuracy:

    best_model = random_forest

    best_model_name = "Random Forest"

    best_accuracy = rf_accuracy

else:

    best_model = logistic_model

    best_model_name = "Logistic Regression"

    best_accuracy = lr_accuracy


print("\n======================================")
print("BEST MODEL")
print("======================================")

print("Model:", best_model_name)

print(
    f"Accuracy: {best_accuracy * 100:.2f}%"
)


# =====================================================
# 9. SAVE MODEL
# =====================================================

model_path = os.path.join(
    os.path.dirname(__file__),
    "acl_risk_model.pkl"
)


joblib.dump(
    best_model,
    model_path
)


print("\n======================================")
print("MODEL SAVED")
print("======================================")

print(model_path)

print("\nTraining completed successfully!")