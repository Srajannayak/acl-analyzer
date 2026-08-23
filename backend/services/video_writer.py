import cv2
import os


class VideoWriter:

    def __init__(
        self,
        output_path,
        fps,
        width,
        height
    ):

        self.output_path = output_path
        self.fps = fps
        self.width = width
        self.height = height

        # --------------------------------------------------
        # Make sure output directory exists
        # --------------------------------------------------

        output_dir = os.path.dirname(
            os.path.abspath(output_path)
        )

        os.makedirs(
            output_dir,
            exist_ok=True
        )

        # --------------------------------------------------
        # Try mp4v first
        # --------------------------------------------------

        fourcc = cv2.VideoWriter_fourcc(
            *"mp4v"
        )

        self.writer = cv2.VideoWriter(
            output_path,
            fourcc,
            fps,
            (width, height)
        )

        print(
            "Writer Opened:",
            self.writer.isOpened()
        )

        print(
            "Writer Path:",
            output_path
        )

        print(
            "Writer FPS:",
            fps
        )

        print(
            "Writer Size:",
            width,
            "x",
            height
        )

    # ------------------------------------------------------
    # WRITE FRAME
    # ------------------------------------------------------

    def write(self, frame):

        if frame is None:
            return

        if self.writer is None:
            return

        if not self.writer.isOpened():

            print(
                "ERROR: VideoWriter is not opened."
            )

            return

        # Ensure correct frame dimensions

        if (
            frame.shape[1] != self.width
            or frame.shape[0] != self.height
        ):

            frame = cv2.resize(
                frame,
                (
                    self.width,
                    self.height
                )
            )

        self.writer.write(
            frame
        )

    # ------------------------------------------------------
    # RELEASE
    # ------------------------------------------------------

    def release(self):

        if self.writer is not None:

            self.writer.release()

        print(
            "VideoWriter released."
        )

        print(
            "Output exists:",
            os.path.exists(
                self.output_path
            )
        )

        if os.path.exists(
            self.output_path
        ):

            print(
                "Output size:",
                os.path.getsize(
                    self.output_path
                ),
                "bytes"
            )