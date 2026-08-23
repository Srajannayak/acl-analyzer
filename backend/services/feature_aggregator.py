import numpy as np


class FeatureAggregator:

    FEATURE_NAMES = [
        "knee_flexion",
        "knee_valgus",
        "hip_flexion",
        "trunk_inclination",
        "ankle_dorsiflexion",
        "landing_symmetry",
        "left_knee_flexion",
        "right_knee_flexion",
        "left_hip_flexion",
        "right_hip_flexion",
        "left_knee_valgus",
        "right_knee_valgus",
        "left_ankle_dorsiflexion",
        "right_ankle_dorsiflexion",
    ]


    def aggregate(self, landing_sequence):

        if not landing_sequence:

            return {}

        aggregated = {}

        for feature_name in self.FEATURE_NAMES:

            values = []

            for frame_data in landing_sequence:

                features = frame_data.get(
                    "features",
                    {}
                )

                value = features.get(
                    feature_name
                )

                if value is not None:

                    values.append(
                        float(value)
                    )

            if not values:

                aggregated[
                    feature_name
                ] = 0.0

                continue

            # =============================================
            # STATISTICS
            # =============================================

            aggregated[
                feature_name
            ] = round(
                float(
                    np.mean(values)
                ),
                2
            )

            aggregated[
                f"{feature_name}_max"
            ] = round(
                float(
                    np.max(values)
                ),
                2
            )

            aggregated[
                f"{feature_name}_min"
            ] = round(
                float(
                    np.min(values)
                ),
                2
            )

            aggregated[
                f"{feature_name}_std"
            ] = round(
                float(
                    np.std(values)
                ),
                2
            )

        return aggregated