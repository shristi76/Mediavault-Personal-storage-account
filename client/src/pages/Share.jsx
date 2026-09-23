
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Share.css";

function Share() {
  const { token } = useParams();

  const [media, setMedia] = useState(null);
  const [downloadsRemaining, setDownloadsRemaining] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSharedMedia = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/share/${token}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message);
          return;
        }

        setMedia(data.media);
      } catch (error) {
        console.error(
          "Failed to fetch shared media:",
          error
        );

        setError("Failed to load shared media");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedMedia();
  }, [token]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/share/${token}/download`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      setDownloadsRemaining(
        data.downloadsRemaining
      );

      const link = document.createElement("a");

      link.href = data.url;
      link.download = data.originalName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);

      setError("Failed to download media");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="share-page">
        <div className="share-loading">
          <h2>Loading shared media...</h2>
        </div>
      </div>
    );
  }

  if (error && !media) {
    return (
      <div className="share-page">
        <div className="share-error-card">
          <h1>MediaVault</h1>
          <h2>Unable to access media</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="share-page">
        <div className="share-error-card">
          <h2>Media not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="share-page">
      <div className="share-container">

        <div className="share-header">
          <h1>MediaVault</h1>
          <p>Shared Media</p>
        </div>

        <div className="share-card">

          <div className="share-title">
            <h2>{media.originalName}</h2>
          </div>

          <div className="shared-media-preview">
            {media.resourceType === "image" ? (
              <img
                src={media.url}
                alt={media.originalName}
              />
            ) : (
              <video
                src={media.url}
                controls
              />
            )}
          </div>

          <div className="media-details">

            <div className="detail-item">
              <span>Type</span>
              <strong>
                {media.resourceType}
              </strong>
            </div>

            <div className="detail-item">
              <span>Format</span>
              <strong>
                {media.format}
              </strong>
            </div>

            <div className="detail-item">
              <span>Size</span>
              <strong>
                {Math.round(
                  media.size / 1024
                )} KB
              </strong>
            </div>

          </div>

          {error && (
            <div className="download-error">
              {error}
            </div>
          )}

          <button
            className="download-button"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading
              ? "Downloading..."
              : "Download Media"}
          </button>

          {downloadsRemaining !== null && (
            <p className="downloads-remaining">
              Downloads remaining:{" "}
              <strong>
                {downloadsRemaining}
              </strong>
            </p>
          )}

        </div>

        <p className="share-footer">
          Shared securely with MediaVault
        </p>

      </div>
    </div>
  );
}

export default Share;

