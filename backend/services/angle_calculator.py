import math


class AngleCalculator:

    @staticmethod
    def calculate_angle(a, b, c):
        """
        Calculate the angle ABC in degrees.

        a, b, c = (x, y)
        """

        ax, ay = a
        bx, by = b
        cx, cy = c

        ba = (ax - bx, ay - by)
        bc = (cx - bx, cy - by)

        dot = ba[0] * bc[0] + ba[1] * bc[1]

        mag_ba = math.sqrt(ba[0] ** 2 + ba[1] ** 2)
        mag_bc = math.sqrt(bc[0] ** 2 + bc[1] ** 2)

        if mag_ba == 0 or mag_bc == 0:
            return 0.0

        cosine = dot / (mag_ba * mag_bc)

        cosine = max(-1.0, min(1.0, cosine))

        angle = math.degrees(math.acos(cosine))

        return round(angle, 2)

    def calculate_knee_angle(self, hip, knee, ankle):
        return self.calculate_angle(hip, knee, ankle)

    def calculate_hip_angle(self, shoulder, hip, knee):
        return self.calculate_angle(shoulder, hip, knee)

    def calculate_ankle_angle(self, knee, ankle, foot):
        return self.calculate_angle(knee, ankle, foot)