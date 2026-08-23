class LandingDetector:

    def __init__(self):

        # Frames around detected landing
        self.window_before = 5
        self.window_after = 15

        # Ignore very beginning/end of sequence when
        # searching for a landing event.
        self.ignore_start = 3
        self.ignore_end = 2

        # Minimum change in knee flexion required
        # to consider a meaningful movement.
        self.minimum_prominence = 5.0


    # =========================================================
    # MOVING AVERAGE
    # =========================================================

    def _smooth(self, values, window=3):

        if len(values) < window:

            return values[:]

        smoothed = []

        half = window // 2

        for i in range(len(values)):

            start = max(
                0,
                i - half
            )

            end = min(
                len(values),
                i + half + 1
            )

            section = values[start:end]

            smoothed.append(
                sum(section) /
                len(section)
            )

        return smoothed


    # =========================================================
    # FIND LANDING PEAK
    # =========================================================

    def _find_landing_index(
        self,
        feature_sequence,
        knee_values
    ):

        total = len(
            knee_values
        )

        if total == 0:
            return None

        # -----------------------------------------------------
        # Smooth noisy MediaPipe measurements
        # -----------------------------------------------------

        smoothed = self._smooth(
            knee_values,
            window=3
        )

        # -----------------------------------------------------
        # Search region
        # -----------------------------------------------------

        start = min(
            self.ignore_start,
            max(0, total - 1)
        )

        end = max(
            start + 1,
            total - self.ignore_end
        )

        # -----------------------------------------------------
        # Find local peaks
        # -----------------------------------------------------

        candidates = []

        for i in range(
            start,
            end
        ):

            previous_value = (
                smoothed[i - 1]
                if i > 0
                else smoothed[i]
            )

            current_value = (
                smoothed[i]
            )

            next_value = (
                smoothed[i + 1]
                if i + 1 < total
                else smoothed[i]
            )

            # Local maximum
            if (
                current_value >= previous_value
                and
                current_value >= next_value
            ):

                lookback_start = max(
                    0,
                    i - 5
                )

                previous_min = min(
                    smoothed[
                        lookback_start:i + 1
                    ]
                )

                prominence = (
                    current_value -
                    previous_min
                )

                if (
                    prominence >=
                    self.minimum_prominence
                ):

                    candidates.append(
                        (
                            i,
                            current_value,
                            prominence
                        )
                    )

        if candidates:

            candidates.sort(
                key=lambda x: (
                    x[2],
                    x[1]
                ),
                reverse=True
            )

            return candidates[0][0]

        best_index = start

        best_value = (
            smoothed[start]
        )

        for i in range(
            start,
            end
        ):

            if (
                smoothed[i] >
                best_value
            ):

                best_value = (
                    smoothed[i]
                )

                best_index = i

        return best_index


    # =========================================================
    # MAIN DETECTION
    # =========================================================

    def detect(
        self,
        feature_sequence
    ):

        if not feature_sequence:

            return {
                "success": False,
                "message": "No feature sequence available.",
                "landing_frame": None,
                "landing_timestamp_ms": None,
                "maximum_knee_flexion": None,
                "peak_risk_frame": None,
                "peak_risk_timestamp_ms": None,
                "start_frame": None,
                "end_frame": None,
                "phases": {},
                "landing_sequence": []
            }

        # =====================================================
        # EXTRACT KNEE FLEXION
        # =====================================================

        knee_values = []

        for item in feature_sequence:

            features = (
                item.get(
                    "features",
                    {}
                )
            )

            try:
                knee_flexion = float(
                    features.get(
                        "knee_flexion",
                        0
                    )
                )
            except (
                TypeError,
                ValueError
            ):
                knee_flexion = 0.0

            knee_values.append(
                knee_flexion
            )

        # =====================================================
        # FIND LANDING
        # =====================================================

        landing_index = (
            self._find_landing_index(
                feature_sequence,
                knee_values
            )
        )

        if landing_index is None:

            return {
                "success": False,
                "message": "Unable to detect landing frame.",
                "landing_frame": None,
                "landing_timestamp_ms": None,
                "maximum_knee_flexion": None,
                "peak_risk_frame": None,
                "peak_risk_timestamp_ms": None,
                "start_frame": None,
                "end_frame": None,
                "phases": {},
                "landing_sequence": []
            }

        # =====================================================
        # LANDING WINDOW
        # =====================================================

        start_index = max(
            0,
            landing_index - self.window_before
        )

        end_index = min(
            len(feature_sequence),
            landing_index + self.window_after + 1
        )

        landing_sequence = (
            feature_sequence[
                start_index:end_index
            ]
        )

        landing_frame_data = (
            feature_sequence[
                landing_index
            ]
        )

        maximum_knee_flexion = (
            knee_values[
                landing_index
            ]
        )

        # =====================================================
        # HIGHEST RISK FRAME DETECTION
        # =====================================================

        peak_risk_index = landing_index
        max_valgus_val = 0.0

        for idx, item in enumerate(feature_sequence):
            f = item.get("features", {})
            v = float(f.get("knee_valgus", 0.0))
            if v > max_valgus_val and abs(idx - landing_index) <= 12:
                max_valgus_val = v
                peak_risk_index = idx

        peak_risk_frame_data = feature_sequence[peak_risk_index]

        # =====================================================
        # MOVEMENT PHASES
        # =====================================================

        landing_frame_num = landing_frame_data.get("frame", 1)
        start_frame_num = landing_sequence[0].get("frame", 1)
        end_frame_num = landing_sequence[-1].get("frame", len(feature_sequence))

        phases = {
            "approach": {
                "name": "Approach & Flight",
                "start_frame": max(1, start_frame_num - 8),
                "end_frame": max(1, start_frame_num - 1),
            },
            "pre_landing": {
                "name": "Pre-Landing Preparation",
                "start_frame": start_frame_num,
                "end_frame": max(start_frame_num, landing_frame_num - 2),
            },
            "initial_contact": {
                "name": "Initial Ground Contact",
                "start_frame": max(start_frame_num, landing_frame_num - 1),
                "end_frame": min(end_frame_num, landing_frame_num + 2),
                "landing_frame": landing_frame_num,
                "timestamp_ms": landing_frame_data.get("timestamp_ms"),
            },
            "loading": {
                "name": "Peak Impact Deceleration",
                "start_frame": landing_frame_num,
                "end_frame": min(end_frame_num, landing_frame_num + 8),
                "peak_risk_frame": peak_risk_frame_data.get("frame"),
                "timestamp_ms": peak_risk_frame_data.get("timestamp_ms"),
            },
            "stabilization": {
                "name": "Stabilization & Recovery",
                "start_frame": min(end_frame_num, landing_frame_num + 9),
                "end_frame": end_frame_num,
            }
        }

        # =====================================================
        # DEBUG INFORMATION
        # =====================================================

        print()
        print("=" * 60)
        print("LANDING DETECTION & PHASES")
        print("=" * 60)
        print("Total feature frames:", len(feature_sequence))
        print("Detected landing index:", landing_index)
        print("Landing frame:", landing_frame_data.get("frame"))
        print("Peak risk frame:", peak_risk_frame_data.get("frame"))
        print("Landing timestamp:", landing_frame_data.get("timestamp_ms"))
        print("Maximum knee flexion:", round(maximum_knee_flexion, 2))
        print("=" * 60)
        print()

        return {
            "success": True,
            "landing_frame": landing_frame_data.get("frame"),
            "landing_timestamp_ms": landing_frame_data.get("timestamp_ms"),
            "maximum_knee_flexion": round(maximum_knee_flexion, 2),
            "peak_risk_frame": peak_risk_frame_data.get("frame"),
            "peak_risk_timestamp_ms": peak_risk_frame_data.get("timestamp_ms"),
            "start_frame": landing_sequence[0].get("frame"),
            "end_frame": landing_sequence[-1].get("frame"),
            "phases": phases,
            "landing_sequence": landing_sequence
        }