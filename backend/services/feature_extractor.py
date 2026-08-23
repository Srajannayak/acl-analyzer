import math

from services.angle_calculator import AngleCalculator


class _LandmarkPoint:
    def __init__(self, x=0.0, y=0.0, z=0.0):
        self.x = float(x)
        self.y = float(y)
        self.z = float(z)


def _normalize_landmark(lm):
    if lm is None:
        return _LandmarkPoint(0.0, 0.0, 0.0)
    if isinstance(lm, dict):
        return _LandmarkPoint(lm.get("x", 0.0), lm.get("y", 0.0), lm.get("z", 0.0))
    if hasattr(lm, "x") and hasattr(lm, "y"):
        return lm
    return _LandmarkPoint(0.0, 0.0, 0.0)


class FeatureExtractor:

    def __init__(self):

        self.calculator = AngleCalculator()

    # ==============================================
    # MIDPOINT
    # ==============================================

    def _midpoint(self, a, b):

        return (

            (a.x + b.x) / 2,

            (a.y + b.y) / 2

        )

    # ==============================================
    # DISTANCE
    # ==============================================

    def _distance(self, a, b):

        return math.sqrt(

            (a.x - b.x) ** 2 +

            (a.y - b.y) ** 2

        )

    # ==============================================
    # GEOMETRIC → FLEXION
    # ==============================================

    def _flexion_angle(self, angle):

        return round(
            180.0 - angle,
            2
        )

    # ==============================================
    # EXTRACT FEATURES
    # ==============================================

    def extract(self, landmarks):

        if not landmarks or len(landmarks) < 33:
            return {
                "knee_flexion": 0.0,
                "knee_valgus": 0.0,
                "hip_flexion": 0.0,
                "trunk_inclination": 0.0,
                "ankle_dorsiflexion": 0.0,
                "landing_symmetry": 50.0,
                "left_knee_flexion": 0.0,
                "right_knee_flexion": 0.0,
                "left_hip_flexion": 0.0,
                "right_hip_flexion": 0.0,
                "left_knee_valgus": 0.0,
                "right_knee_valgus": 0.0,
                "left_ankle_dorsiflexion": 0.0,
                "right_ankle_dorsiflexion": 0.0,
            }

        # ==========================================
        # MEDIAPIPE LANDMARK INDEXES
        # ==========================================

        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12

        LEFT_HIP = 23
        RIGHT_HIP = 24

        LEFT_KNEE = 25
        RIGHT_KNEE = 26

        LEFT_ANKLE = 27
        RIGHT_ANKLE = 28

        LEFT_FOOT = 31
        RIGHT_FOOT = 32

        # ==========================================
        # LANDMARKS
        # ==========================================

        left_shoulder = _normalize_landmark(landmarks[LEFT_SHOULDER])
        right_shoulder = _normalize_landmark(landmarks[RIGHT_SHOULDER])

        left_hip = _normalize_landmark(landmarks[LEFT_HIP])
        right_hip = _normalize_landmark(landmarks[RIGHT_HIP])

        left_knee = _normalize_landmark(landmarks[LEFT_KNEE])
        right_knee = _normalize_landmark(landmarks[RIGHT_KNEE])

        left_ankle = _normalize_landmark(landmarks[LEFT_ANKLE])
        right_ankle = _normalize_landmark(landmarks[RIGHT_ANKLE])

        left_foot = _normalize_landmark(landmarks[LEFT_FOOT])
        right_foot = _normalize_landmark(landmarks[RIGHT_FOOT])

        # ==========================================
        # 1. KNEE FLEXION
        # ==========================================

        left_knee_geometric = (
            self.calculator.calculate_angle(

                (left_hip.x, left_hip.y),

                (left_knee.x, left_knee.y),

                (left_ankle.x, left_ankle.y)

            )
        )

        right_knee_geometric = (
            self.calculator.calculate_angle(

                (right_hip.x, right_hip.y),

                (right_knee.x, right_knee.y),

                (right_ankle.x, right_ankle.y)

            )
        )

        left_knee_flexion = (
            self._flexion_angle(
                left_knee_geometric
            )
        )

        right_knee_flexion = (
            self._flexion_angle(
                right_knee_geometric
            )
        )

        knee_flexion = (

            left_knee_flexion +

            right_knee_flexion

        ) / 2

        # ==========================================
        # 2. HIP FLEXION
        # ==========================================

        left_hip_geometric = (
            self.calculator.calculate_angle(

                (left_shoulder.x, left_shoulder.y),

                (left_hip.x, left_hip.y),

                (left_knee.x, left_knee.y)

            )
        )

        right_hip_geometric = (
            self.calculator.calculate_angle(

                (right_shoulder.x, right_shoulder.y),

                (right_hip.x, right_hip.y),

                (right_knee.x, right_knee.y)

            )
        )

        left_hip_flexion = (
            self._flexion_angle(
                left_hip_geometric
            )
        )

        right_hip_flexion = (
            self._flexion_angle(
                right_hip_geometric
            )
        )

        hip_flexion = (

            left_hip_flexion +

            right_hip_flexion

        ) / 2

        # ==========================================
        # 3. KNEE VALGUS
        # ==========================================

        left_hip_ankle_x = (

            left_hip.x +

            left_ankle.x

        ) / 2

        right_hip_ankle_x = (

            right_hip.x +

            right_ankle.x

        ) / 2

        left_valgus_displacement = abs(

            left_knee.x -

            left_hip_ankle_x

        )

        right_valgus_displacement = abs(

            right_knee.x -

            right_hip_ankle_x

        )

        left_leg_length = (

            self._distance(
                left_hip,
                left_knee
            )

            +

            self._distance(
                left_knee,
                left_ankle
            )

        )

        right_leg_length = (

            self._distance(
                right_hip,
                right_knee
            )

            +

            self._distance(
                right_knee,
                right_ankle
            )

        )

        left_valgus = math.degrees(

            math.atan2(

                left_valgus_displacement,

                max(
                    left_leg_length,
                    1e-6
                )

            )

        )

        right_valgus = math.degrees(

            math.atan2(

                right_valgus_displacement,

                max(
                    right_leg_length,
                    1e-6
                )

            )

        )

        knee_valgus = (

            left_valgus +

            right_valgus

        ) / 2

        # ==========================================
        # 4. TRUNK INCLINATION
        # ==========================================

        shoulder_mid = self._midpoint(

            left_shoulder,

            right_shoulder

        )

        hip_mid = self._midpoint(

            left_hip,

            right_hip

        )

        trunk_x = (

            shoulder_mid[0] -

            hip_mid[0]

        )

        trunk_y = (

            shoulder_mid[1] -

            hip_mid[1]

        )

        trunk_angle = math.degrees(

            math.atan2(

                abs(trunk_x),

                abs(trunk_y)

            )

        )

        trunk_inclination = round(

            trunk_angle,

            2

        )

        # ==========================================
        # 5. ANKLE DORSIFLEXION
        # ==========================================

        left_ankle_geometric = (
            self.calculator.calculate_angle(

                (left_knee.x, left_knee.y),

                (left_ankle.x, left_ankle.y),

                (left_foot.x, left_foot.y)

            )
        )

        right_ankle_geometric = (
            self.calculator.calculate_angle(

                (right_knee.x, right_knee.y),

                (right_ankle.x, right_ankle.y),

                (right_foot.x, right_foot.y)

            )
        )

        left_ankle_dorsiflexion = (
            self._flexion_angle(
                left_ankle_geometric
            )
        )

        right_ankle_dorsiflexion = (
            self._flexion_angle(
                right_ankle_geometric
            )
        )

        ankle_dorsiflexion = (

            left_ankle_dorsiflexion +

            right_ankle_dorsiflexion

        ) / 2

        # ==========================================
        # 6. LANDING SYMMETRY
        # ==========================================

        total_knee_flexion = (

            left_knee_flexion +

            right_knee_flexion

        )

        if total_knee_flexion > 0:

            landing_symmetry = (

                left_knee_flexion /

                total_knee_flexion

            ) * 100

        else:

            landing_symmetry = 50.0

        # ==========================================
        # FINAL FEATURES
        # ==========================================

        features = {

            "knee_flexion": round(
                knee_flexion,
                2
            ),

            "knee_valgus": round(
                knee_valgus,
                2
            ),

            "hip_flexion": round(
                hip_flexion,
                2
            ),

            "trunk_inclination": round(
                trunk_inclination,
                2
            ),

            "ankle_dorsiflexion": round(
                ankle_dorsiflexion,
                2
            ),

            "landing_symmetry": round(
                landing_symmetry,
                2
            ),

            "left_knee_flexion": round(
                left_knee_flexion,
                2
            ),

            "right_knee_flexion": round(
                right_knee_flexion,
                2
            ),

            "left_hip_flexion": round(
                left_hip_flexion,
                2
            ),

            "right_hip_flexion": round(
                right_hip_flexion,
                2
            ),

            "left_knee_valgus": round(
                left_valgus,
                2
            ),

            "right_knee_valgus": round(
                right_valgus,
                2
            ),

            "left_ankle_dorsiflexion": round(
                left_ankle_dorsiflexion,
                2
            ),

            "right_ankle_dorsiflexion": round(
                right_ankle_dorsiflexion,
                2
            )

        }

        return features