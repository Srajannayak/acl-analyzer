class LandmarkSerializer:

    def __init__(self):
        pass

    def serialize(self, data):
        if data is None:
            return []

        # If detection result object with pose_landmarks attribute was passed
        if hasattr(data, "pose_landmarks"):
            if not data.pose_landmarks:
                return []
            data = data.pose_landmarks[0]

        landmarks = []
        for landmark in data:
            landmarks.append({
                "x": round(getattr(landmark, "x", 0.0), 6),
                "y": round(getattr(landmark, "y", 0.0), 6),
                "z": round(getattr(landmark, "z", 0.0), 6),
                "visibility": round(getattr(landmark, "visibility", 0.0), 4),
                "presence": round(getattr(landmark, "presence", 0.0), 4)
            })

        return landmarks