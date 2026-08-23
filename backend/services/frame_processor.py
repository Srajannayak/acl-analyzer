from services.feature_extractor import FeatureExtractor
from services.overlay import OverlayDrawer
from services.risk_predictor import RiskPredictor


class FrameProcessor:

    def __init__(self):

        self.extractor = FeatureExtractor()

        self.overlay = OverlayDrawer()

        self.predictor = RiskPredictor()

    # ==============================================
    # PROCESS FRAME
    # ==============================================

    def process(self, frame, landmarks):

        # ==========================================
        # FEATURE EXTRACTION
        # ==========================================

        features = self.extractor.extract(

            landmarks

        )

        # ==========================================
        # ML PREDICTION
        # ==========================================

        risk = self.predictor.predict(

            features

        )

        # ==========================================
        # DRAW BIOMECHANICAL VALUES
        # ==========================================

        self.overlay.draw(

            frame,

            features

        )

        # ==========================================
        # RETURN
        # ==========================================

        return {

            "frame": frame,

            "features": features,

            "risk": risk

        }