import numpy as np
import pandas as pd
import os

np.random.seed(42)

SAMPLES_PER_CLASS = 2000


# =========================================================
# LANDING SYMMETRY
# =========================================================

def generate_symmetry(low, high, n):
    return np.random.uniform(low, high, n)


# =========================================================
# LOW / SAFE RISK
# Based on ranges from the project report
# =========================================================

def generate_low(n):

    return pd.DataFrame({

        "knee_flexion": np.random.uniform(
            30, 60, n
        ),

        "knee_valgus": np.random.uniform(
            0, 10, n
        ),

        "hip_flexion": np.random.uniform(
            25, 50, n
        ),

        "trunk_inclination": np.random.uniform(
            0, 10, n
        ),

        "ankle_dorsiflexion": np.random.uniform(
            10, 30, n
        ),

        "landing_symmetry": np.random.uniform(
            45, 55, n
        ),

        "risk": "Low"
    })


# =========================================================
# MODERATE RISK
# =========================================================

def generate_moderate(n):

    half = n // 2

    symmetry = np.concatenate([
        np.random.uniform(35, 45, half),
        np.random.uniform(55, 65, n - half)
    ])

    np.random.shuffle(symmetry)

    return pd.DataFrame({

        "knee_flexion": np.random.uniform(
            20, 30, n
        ),

        "knee_valgus": np.random.uniform(
            10, 15, n
        ),

        "hip_flexion": np.random.uniform(
            15, 25, n
        ),

        "trunk_inclination": np.random.uniform(
            10, 20, n
        ),

        "ankle_dorsiflexion": np.random.uniform(
            5, 15, n
        ),

        "landing_symmetry": symmetry,

        "risk": "Moderate"
    })


# =========================================================
# HIGH RISK
# =========================================================

def generate_high(n):

    half = n // 2

    symmetry = np.concatenate([
        np.random.uniform(20, 35, half),
        np.random.uniform(65, 80, n - half)
    ])

    np.random.shuffle(symmetry)

    return pd.DataFrame({

        "knee_flexion": np.random.uniform(
            5, 20, n
        ),

        "knee_valgus": np.random.uniform(
            15, 25, n
        ),

        "hip_flexion": np.random.uniform(
            5, 15, n
        ),

        "trunk_inclination": np.random.uniform(
            20, 35, n
        ),

        "ankle_dorsiflexion": np.random.uniform(
            2, 10, n
        ),

        "landing_symmetry": symmetry,

        "risk": "High"
    })


# =========================================================
# GENERATE DATA
# =========================================================

low = generate_low(SAMPLES_PER_CLASS)

moderate = generate_moderate(SAMPLES_PER_CLASS)

high = generate_high(SAMPLES_PER_CLASS)


dataset = pd.concat(
    [low, moderate, high],
    ignore_index=True
)


# Shuffle
dataset = dataset.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)


# =========================================================
# SAVE CSV
# =========================================================

output_path = os.path.join(
    os.path.dirname(__file__),
    "acl_biomechanical_dataset.csv"
)

dataset.to_csv(
    output_path,
    index=False
)


# =========================================================
# DISPLAY INFORMATION
# =========================================================

print("\n======================================")
print("ACL BIOMECHANICAL DATASET GENERATED")
print("======================================")

print("\nTotal samples:", len(dataset))

print("\nClass distribution:")
print(dataset["risk"].value_counts())

print("\nFeatures:")
print([
    "knee_flexion",
    "knee_valgus",
    "hip_flexion",
    "trunk_inclination",
    "ankle_dorsiflexion",
    "landing_symmetry"
])

print("\nFirst 10 rows:")
print(dataset.head(10))

print("\nSaved at:")
print(output_path)