import cv2


class OverlayDrawer:

    def __init__(self):
        pass

    def draw(self, frame, features):

        x = 20
        y = 40

        values = [
            (
                "Knee Flexion",
                features["knee_flexion"],
                (0, 255, 0)
            ),

            (
                "Knee Valgus",
                features["knee_valgus"],
                (0, 255, 255)
            ),

            (
                "Hip Flexion",
                features["hip_flexion"],
                (255, 255, 0)
            ),

            (
                "Trunk Inclination",
                features["trunk_inclination"],
                (255, 165, 0)
            ),

            (
                "Ankle Dorsiflexion",
                features["ankle_dorsiflexion"],
                (0, 255, 255)
            ),

            (
                "Landing Symmetry",
                features["landing_symmetry"],
                (255, 255, 255)
            )
        ]

        for name, value, color in values:

            unit = "%" if name == "Landing Symmetry" else "°"

            cv2.putText(
                frame,
                f"{name}: {value:.1f}{unit}",
                (x, y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.65,
                color,
                2
            )

            y += 30

        return frame