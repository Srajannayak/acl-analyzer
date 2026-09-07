import numpy as np
import pandas as pd
import os

# Set random seed for reproducibility
np.random.seed(42)

# =========================================================
# COMBINATION-BASED BIOMECHANICAL RISK SCORING SYSTEM
# BROAD MODERATE ZONE & NATURAL PROGRESSION
# =========================================================

def calculate_combination_risk(
    knee_flexion,
    knee_valgus,
    hip_flexion,
    trunk_inclination,
    ankle_dorsiflexion,
    landing_symmetry
):
    """
    Computes continuous biomechanical severity score (18 to 75).

    Biomechanical design:
    1. Smooth knee flexion curve with a wide, accessible Moderate Risk intermediate zone:
       - Compliant bending (> 45 deg): safe baseline (~18-27%) with cushion for deep flexion (> 55 deg).
       - Moderate knee bending (31 - 42 deg): steady 8 to 22 pts, placing landing firmly in Moderate (32%-45%).
       - Borderline to stiff (< 30 deg): 22 to 45 pts, transitioning smoothly to High (55%-75%).
    2. Multi-planar secondary modifiers (valgus, symmetry, trunk, hip, ankle):
       - Moderate valgus (10 - 15 deg), moderate asymmetry (dev 11-18%), or moderate trunk lean (16-24 deg)
         naturally trigger Moderate Risk even with good knee flexion.
       - Dangerous combinations (stiff knee + valgus/asymmetry) push into High Risk.
    """
    # 1. Knee Flexion penalty (Smooth transition through Moderate)
    # > 50 deg: gentle cushion (-2.5 to 0 pts)
    # 42 to 50 deg: mild transition (0 to 3.0 pts)
    # 32 to 42 deg (Moderate Region): 10.0 to 24.0 pts
    # 24 to 32 deg (Borderline Stiff): 24.0 to 38.0 pts
    # < 24 deg (Severely Stiff): 38.0 to 48.0 pts
    kf_p = np.where(
        knee_flexion >= 50.0,
        np.maximum(-2.5, (50.0 - knee_flexion) * 0.05),
        np.where(
            knee_flexion >= 42.0,
            (50.0 - knee_flexion) * 0.375,
            np.where(
                knee_flexion >= 32.0,
                10.0 + (42.0 - knee_flexion) * 1.4,
                np.where(
                    knee_flexion >= 24.0,
                    24.0 + (32.0 - knee_flexion) * 1.75,
                    38.0 + np.minimum((24.0 - knee_flexion) * 0.8, 10.0)
                )
            )
        )
    )

    # 2. Knee Valgus penalty
    # <= 8.0 deg: 0 pts (normal coronal angle in 2D video)
    # 8.0 to 10.5 deg: 0 to 3.0 pts (mild athletic valgus)
    # 10.5 to 15.0 deg: 11.0 to 19.1 pts (MODERATE VALGUS: establishes Moderate Risk)
    # > 15.0 deg: 19.1 to 29.0 pts (severe dynamic collapse)
    kv_p = np.where(
        knee_valgus <= 8.0,
        0.0,
        np.where(
            knee_valgus <= 10.5,
            (knee_valgus - 8.0) * 1.2,
            np.where(
                knee_valgus <= 15.0,
                11.0 + (knee_valgus - 10.5) * 1.8,
                19.1 + np.minimum((knee_valgus - 15.0) * 1.4, 10.0)
            )
        )
    )

    # 3. Landing Symmetry penalty
    # dev <= 11.0%: normal single-camera perspective jitter (0 to 1.1 pts)
    # dev 11.0% to 17.5%: 11.0 to 18.5 pts (MODERATE ASYMMETRY: establishes Moderate Risk)
    # dev > 17.5%: 18.5 to 29.0 pts (severe unilateral impact)
    sym_dev = np.abs(landing_symmetry - 50.0)
    sym_p = np.where(
        sym_dev <= 11.0,
        sym_dev * 0.10,
        np.where(
            sym_dev <= 17.5,
            11.0 + (sym_dev - 11.0) * 1.15,
            18.5 + np.minimum((sym_dev - 17.5) * 1.2, 10.5)
        )
    )

    # 4. Trunk Inclination penalty
    # <= 16.0 deg: normal forward lean (0 pts)
    # 16.0 to 24.0 deg: 11.0 to 17.4 pts (MODERATE TRUNK TILT: establishes Moderate Risk)
    # > 24.0 deg: 17.4 to 26.0 pts (severe trunk lean)
    trunk_p = np.where(
        trunk_inclination <= 16.0,
        0.0,
        np.where(
            trunk_inclination <= 24.0,
            11.0 + (trunk_inclination - 16.0) * 0.8,
            17.4 + np.minimum((trunk_inclination - 24.0) * 0.6, 8.6)
        )
    )

    # 5. Hip Flexion penalty
    # >= 36.0 deg: good hip hinge (0 pts)
    # 26.0 to 36.0 deg: 0 to 4.0 pts (mild upright hip)
    # < 26.0 deg: 4.0 to 10.0 pts (stiff erect hip)
    hip_p = np.where(
        hip_flexion >= 36.0,
        0.0,
        np.where(
            hip_flexion >= 26.0,
            (36.0 - hip_flexion) * 0.4,
            4.0 + np.minimum((26.0 - hip_flexion) * 0.45, 6.0)
        )
    )

    # 6. Ankle Dorsiflexion penalty
    # >= 20.0 deg: good dorsiflexion (0 pts)
    # 14.0 to 20.0 deg: 0 to 2.4 pts
    # < 14.0 deg: 2.4 to 6.0 pts
    ankle_p = np.where(
        ankle_dorsiflexion >= 20.0,
        0.0,
        np.where(
            ankle_dorsiflexion >= 14.0,
            (20.0 - ankle_dorsiflexion) * 0.4,
            2.4 + np.minimum((14.0 - ankle_dorsiflexion) * 0.5, 3.6)
        )
    )

    # Multi-Factor Synergies for true High Risk combinations
    syn_stiff_valg = np.where(
        (knee_flexion < 29.0) & (knee_valgus > 11.0),
        np.minimum((knee_valgus - 11.0) * 1.3, 7.0),
        0.0
    )
    syn_stiff_sym = np.where(
        (knee_flexion < 29.0) & (sym_dev > 11.0),
        np.minimum((sym_dev - 11.0) * 0.8, 6.0),
        0.0
    )

    # Protective cushion for deep flexion (> 50 deg) to absorb mild noise
    deep_flex_cushion = np.where(
        knee_flexion >= 50.0,
        np.maximum(0.5, 1.0 - (knee_flexion - 50.0) * 0.015),
        1.0
    )

    secondary_total = (kv_p + sym_p + trunk_p + hip_p + ankle_p) * deep_flex_cushion
    total_penalty = kf_p + secondary_total * 0.85 + syn_stiff_valg + syn_stiff_sym

    # Baseline is 21.0
    # Safe landings: ~19% - 28%
    # Moderate landings: ~30% - 53%
    # High risk landings: ~55% - 75%
    score = 21.0 + total_penalty * 0.78
    return np.clip(score, 18.0, 75.0)


# =========================================================
# GENERATE DIVERSE & BALANCED COHORTS
# =========================================================

def generate_dataset(n_candidates=24000, target_per_class=4000):
    """
    Generates balanced training data (33.3% Low, 33.3% Moderate, 33.3% High)
    with rich representation of all 6 Moderate Risk combinations and controlled overlap.
    """
    np.random.seed(42)
    profiles = []

    # --- CATEGORY 1: SAFE / LOW RISK PROFILES (n ~ 7200) ---
    n_safe = int(n_candidates * 0.30)
    side_safe = np.random.choice([-1, 1], size=n_safe)
    df_safe = pd.DataFrame({
        "knee_flexion": np.random.normal(56.0, 9.0, n_safe).clip(43.0, 85.0),
        "knee_valgus": np.random.normal(5.5, 1.8, n_safe).clip(0.5, 9.5),
        "hip_flexion": np.random.normal(44.0, 5.5, n_safe).clip(34.0, 65.0),
        "trunk_inclination": np.random.normal(9.0, 3.0, n_safe).clip(1.0, 16.0),
        "ankle_dorsiflexion": np.random.normal(34.0, 8.0, n_safe).clip(20.0, 65.0),
        "landing_symmetry": (50.0 + side_safe * np.random.uniform(0.0, 10.5, n_safe)).clip(39.5, 60.5),
    })
    profiles.append(df_safe)

    # --- CATEGORY 2: RICH & DIVERSE MODERATE RISK PROFILES (n ~ 9800) ---

    # 1. Moderate knee bending (32-42 deg) with otherwise mostly safe mechanics
    nm1 = int(n_candidates * 0.08)
    side_m1 = np.random.choice([-1, 1], size=nm1)
    df_m1 = pd.DataFrame({
        "knee_flexion": np.random.uniform(33.0, 42.0, nm1),
        "knee_valgus": np.random.uniform(3.0, 8.5, nm1),
        "hip_flexion": np.random.uniform(34.0, 48.0, nm1),
        "trunk_inclination": np.random.uniform(5.0, 16.0, nm1),
        "ankle_dorsiflexion": np.random.uniform(22.0, 45.0, nm1),
        "landing_symmetry": (50.0 + side_m1 * np.random.uniform(0.0, 9.0, nm1)).clip(41.0, 59.0),
    })

    # 2. Good knee bending (44-62 deg) but moderate knee valgus (10.5 - 14.5 deg)
    nm2 = int(n_candidates * 0.07)
    df_m2 = pd.DataFrame({
        "knee_flexion": np.random.uniform(43.0, 62.0, nm2),
        "knee_valgus": np.random.uniform(10.5, 14.5, nm2),
        "hip_flexion": np.random.uniform(34.0, 50.0, nm2),
        "trunk_inclination": np.random.uniform(6.0, 18.0, nm2),
        "ankle_dorsiflexion": np.random.uniform(22.0, 45.0, nm2),
        "landing_symmetry": (50.0 + np.random.choice([-1, 1], size=nm2) * np.random.uniform(0.0, 10.0, nm2)).clip(40.0, 60.0),
    })

    # 3. Good knee mechanics (44-60 deg) but moderate landing asymmetry (symmetry 33-40% or 60-67%)
    nm3 = int(n_candidates * 0.07)
    side_m3 = np.random.choice([-1, 1], size=nm3)
    df_m3 = pd.DataFrame({
        "knee_flexion": np.random.uniform(43.0, 60.0, nm3),
        "knee_valgus": np.random.uniform(3.0, 9.0, nm3),
        "hip_flexion": np.random.uniform(34.0, 48.0, nm3),
        "trunk_inclination": np.random.uniform(6.0, 17.0, nm3),
        "ankle_dorsiflexion": np.random.uniform(22.0, 45.0, nm3),
        "landing_symmetry": (50.0 + side_m3 * np.random.uniform(10.5, 17.0, nm3)).clip(33.0, 67.0),
    })

    # 4. Moderate trunk inclination (18 - 25 deg) combined with otherwise acceptable mechanics
    nm4 = int(n_candidates * 0.06)
    df_m4 = pd.DataFrame({
        "knee_flexion": np.random.uniform(40.0, 58.0, nm4),
        "knee_valgus": np.random.uniform(4.0, 9.5, nm4),
        "hip_flexion": np.random.uniform(32.0, 48.0, nm4),
        "trunk_inclination": np.random.uniform(18.0, 25.0, nm4),
        "ankle_dorsiflexion": np.random.uniform(20.0, 45.0, nm4),
        "landing_symmetry": (50.0 + np.random.choice([-1, 1], size=nm4) * np.random.uniform(0.0, 10.0, nm4)).clip(40.0, 60.0),
    })

    # 5. Moderate knee flexion (34 - 42 deg) combined with 1 or 2 additional mild risk factors
    nm5 = int(n_candidates * 0.07)
    df_m5 = pd.DataFrame({
        "knee_flexion": np.random.uniform(34.0, 42.0, nm5),
        "knee_valgus": np.random.uniform(8.0, 12.5, nm5),
        "hip_flexion": np.random.uniform(28.0, 40.0, nm5),
        "trunk_inclination": np.random.uniform(14.0, 22.0, nm5),
        "ankle_dorsiflexion": np.random.uniform(18.0, 35.0, nm5),
        "landing_symmetry": (50.0 + np.random.choice([-1, 1], size=nm5) * np.random.uniform(5.0, 14.0, nm5)).clip(36.0, 64.0),
    })

    # 6. Several mild biomechanical issues occurring together
    nm6 = int(n_candidates * 0.06)
    df_m6 = pd.DataFrame({
        "knee_flexion": np.random.uniform(38.0, 46.0, nm6),
        "knee_valgus": np.random.uniform(8.5, 12.0, nm6),
        "hip_flexion": np.random.uniform(30.0, 40.0, nm6),
        "trunk_inclination": np.random.uniform(16.0, 22.0, nm6),
        "ankle_dorsiflexion": np.random.uniform(18.0, 32.0, nm6),
        "landing_symmetry": (50.0 + np.random.choice([-1, 1], size=nm6) * np.random.uniform(6.0, 13.0, nm6)).clip(37.0, 63.0),
    })
    profiles.extend([df_m1, df_m2, df_m3, df_m4, df_m5, df_m6])

    # --- CATEGORY 3: CLEARLY HIGH-RISK PROFILES (n ~ 7000) ---
    n_high = n_candidates - n_safe - (nm1 + nm2 + nm3 + nm4 + nm5 + nm6)
    side_high = np.random.choice([-1, 1], size=n_high)
    df_high = pd.DataFrame({
        "knee_flexion": np.random.uniform(11.0, 28.5, n_high),
        "knee_valgus": np.random.uniform(6.0, 22.0, n_high),
        "hip_flexion": np.random.uniform(12.0, 32.0, n_high),
        "trunk_inclination": np.random.uniform(4.0, 35.0, n_high),
        "ankle_dorsiflexion": np.random.uniform(8.0, 50.0, n_high),
        "landing_symmetry": (50.0 + side_high * np.random.uniform(8.0, 26.0, n_high)).clip(20.0, 80.0),
    })
    profiles.append(df_high)

    raw_df = pd.concat(profiles, ignore_index=True)

    # Compute continuous combination score with controlled noise
    noise = np.random.normal(0.0, 1.0, len(raw_df))
    scores = calculate_combination_risk(
        raw_df["knee_flexion"].values,
        raw_df["knee_valgus"].values,
        raw_df["hip_flexion"].values,
        raw_df["trunk_inclination"].values,
        raw_df["ankle_dorsiflexion"].values,
        raw_df["landing_symmetry"].values
    ) + noise

    scores = np.clip(scores, 18.0, 75.0)

    # Classification boundaries:
    # Low: < 29.5 (Expected: 18%–29%, preferred ~20%–27%)
    # Moderate: 29.5 to 54.99 (Expected: 30%–54%, preferred ~32%–48%)
    # High: >= 55.0 (Expected: 55%–75%, preferred ~58%–72%)
    labels = np.where(scores < 29.5, "Low", np.where(scores < 55.0, "Moderate", "High"))
    raw_df["risk"] = labels
    raw_df["risk_score"] = np.round(scores, 2)

    feature_cols = [
        "knee_flexion",
        "knee_valgus",
        "hip_flexion",
        "trunk_inclination",
        "ankle_dorsiflexion",
        "landing_symmetry"
    ]
    for col in feature_cols:
        raw_df[col] = np.round(raw_df[col], 2)

    # Balance classes (4,000 each: 33.3% Low, 33.3% Moderate, 33.3% High)
    min_c = min(raw_df["risk"].value_counts())
    n_sample = min(target_per_class, min_c)

    balanced = pd.concat([
        raw_df[raw_df["risk"] == "Low"].sample(n=n_sample, random_state=42),
        raw_df[raw_df["risk"] == "Moderate"].sample(n=n_sample, random_state=42),
        raw_df[raw_df["risk"] == "High"].sample(n=n_sample, random_state=42),
    ], ignore_index=True).sample(frac=1.0, random_state=42).reset_index(drop=True)

    return balanced[feature_cols + ["risk"]]


# =========================================================
# MAIN EXECUTION
# =========================================================

if __name__ == "__main__":

    dataset = generate_dataset(n_candidates=24000, target_per_class=4000)

    output_path = os.path.join(
        os.path.dirname(__file__),
        "acl_biomechanical_dataset.csv"
    )

    dataset.to_csv(output_path, index=False)

    print("\n" + "=" * 60)
    print("ACL BIOMECHANICAL DATASET GENERATION COMPLETE")
    print("BROAD MODERATE RISK REPRESENTATION & NATURAL OVERLAP")
    print("=" * 60)
    print(f"Total samples: {len(dataset)}")
    print("\nClass distribution:")
    print(dataset["risk"].value_counts())

    print("\nBiomechanical feature summaries per risk class:")
    for risk_class in ["Low", "Moderate", "High"]:
        print(f"\n--- {risk_class} Risk ---")
        sub = dataset[dataset["risk"] == risk_class]
        for col in ["knee_flexion", "knee_valgus", "hip_flexion", "trunk_inclination", "ankle_dorsiflexion", "landing_symmetry"]:
            print(f"  {col:22s}: mean={sub[col].mean():.2f}, min={sub[col].min():.2f}, max={sub[col].max():.2f}, std={sub[col].std():.2f}")

    print(f"\nSaved at: {output_path}")