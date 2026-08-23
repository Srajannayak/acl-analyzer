import cv2


class SkeletonDrawer:

    def __init__(self):

        self.connections = [

            (11, 12),

            (11, 13),
            (13, 15),

            (12, 14),
            (14, 16),

            (11, 23),
            (12, 24),

            (23, 24),

            (23, 25),
            (25, 27),
            (27, 31),

            (24, 26),
            (26, 28),
            (28, 32)

        ]

    def draw(self, frame, pose_landmarks):

        if pose_landmarks is None or len(pose_landmarks) < 33 or frame is None:
            return frame

        h, w, _ = frame.shape

        # Draw skeleton lines
        for start_idx, end_idx in self.connections:
            if start_idx < len(pose_landmarks) and end_idx < len(pose_landmarks):
                start = pose_landmarks[start_idx]
                end = pose_landmarks[end_idx]

                x1 = int(start.x * w)
                y1 = int(start.y * h)

                x2 = int(end.x * w)
                y2 = int(end.y * h)

                cv2.line(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 255),
                    2
                )

        # Draw joints
        for landmark in pose_landmarks:
            x = int(landmark.x * w)
            y = int(landmark.y * h)

            cv2.circle(
                frame,
                (x, y),
                5,
                (0, 255, 0),
                -1
            )

        return frame