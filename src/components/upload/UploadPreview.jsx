import { Video, Trash2, Play } from "lucide-react";

export default function UploadPreview({
  file,
  removeVideo,
  analyzeVideo,
}) {
  return (
    <div className="preview-card">

      <div className="preview-header">

        <Video size={40} />

        <div>

          <h2>{file.name}</h2>

          <p>

            {(file.size / (1024 * 1024)).toFixed(2)} MB

          </p>

        </div>

      </div>

      <video
        controls
        className="preview-video"
        src={URL.createObjectURL(file)}
      />

      <div className="preview-buttons">

        <button
          className="remove-btn"
          onClick={removeVideo}
        >

          <Trash2 size={18} />

          Remove

        </button>

        <button
          className="analyze-btn"
          onClick={analyzeVideo}
        >

          <Play size={18} />

          Analyze Video

        </button>

      </div>

    </div>
  );
}