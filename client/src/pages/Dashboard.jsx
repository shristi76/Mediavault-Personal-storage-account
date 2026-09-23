
import { useEffect, useState } from "react";
import "./Dashboard.css";

function Dashboard() {
  const [media, setMedia] = useState([]);
  const [shareLinks, setShareLinks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingShares, setLoadingShares] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 10;

  const fetchMedia = async (
    searchValue = "",
    typeValue = "",
    pageValue = 1
  ) => {
    try {
      const token = localStorage.getItem("token");

      const params = new URLSearchParams();

      if (searchValue) {
        params.append("search", searchValue);
      }

      if (typeValue) {
        params.append("type", typeValue);
      }

      params.append("page", pageValue);
      params.append("limit", limit);

      const response = await fetch(
        `http://localhost:5000/api/media?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      setMedia(data.media);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch media:", error);
    }
  };

  const fetchShareLinks = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/share",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      setShareLinks(data.shareLinks);
    } catch (error) {
      console.error("Failed to fetch share links:", error);
    } finally {
      setLoadingShares(false);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        await Promise.all([
          fetchMedia("", "", 1),
          fetchShareLinks(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    try {
      setUploading(true);

      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        "http://localhost:5000/api/media/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Upload successful!");

      setSelectedFile(null);

      const fileInput = document.getElementById("fileInput");

      if (fileInput) {
        fileInput.value = "";
      }

      await fetchMedia(search, type, page);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async (mediaId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/share",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mediaId,
            expiresInHours: 24,
            maxDownloads: 5,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      const shareUrl =
        `http://localhost:5173/share/${data.shareLink.token}`;

      await navigator.clipboard.writeText(shareUrl);

      alert(
        `Share link copied!\n\nExpires: ${data.shareLink.expiresAt}`
      );

      await fetchShareLinks();
    } catch (error) {
      console.error("Share failed:", error);
      alert("Failed to create share link");
    }
  };

  const handleRevokeShare = async (shareLinkId) => {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this share link?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/share/${shareLinkId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Share link revoked successfully!");

      setShareLinks((currentLinks) =>
        currentLinks.filter(
          (link) => link._id !== shareLinkId
        )
      );
    } catch (error) {
      console.error("Revoke failed:", error);
      alert("Failed to revoke share link");
    }
  };

  const handleCopyShareLink = async (token) => {
    try {
      const shareUrl =
        `http://localhost:5173/share/${token}`;

      await navigator.clipboard.writeText(shareUrl);

      alert("Share link copied!");
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Failed to copy share link");
    }
  };

  const handleDelete = async (mediaId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this media?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/media/${mediaId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Media deleted successfully!");

      setMedia((currentMedia) =>
        currentMedia.filter(
          (item) => item._id !== mediaId
        )
      );

      await fetchShareLinks();
      await fetchMedia(search, type, page);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleSearch = async () => {
    setPage(1);
    await fetchMedia(search, type, 1);
  };

  const handleClearFilters = async () => {
    setSearch("");
    setType("");
    setPage(1);

    await fetchMedia("", "", 1);
  };

  const handlePreviousPage = async () => {
    if (page <= 1) {
      return;
    }

    const previousPage = page - 1;

    setPage(previousPage);

    await fetchMedia(
      search,
      type,
      previousPage
    );
  };

  const handleNextPage = async () => {
    if (page >= totalPages) {
      return;
    }

    const nextPage = page + 1;

    setPage(nextPage);

    await fetchMedia(
      search,
      type,
      nextPage
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <h2>Loading MediaVault...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>MediaVault</h1>
          <p>Private Media Storage & Sharing</p>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <main className="dashboard-container">

        {/* Upload Section */}
        <section className="dashboard-card upload-card">
          <div className="section-heading">
            <h2>Upload Media</h2>
            <p>
              Store your images and videos securely.
            </p>
          </div>

          <div className="upload-area">
            <input
              id="fileInput"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                setSelectedFile(
                  e.target.files[0]
                );
              }}
            />

            <button
              className="primary-button"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading
                ? "Uploading..."
                : "Upload Media"}
            </button>
          </div>

          {selectedFile && (
            <div className="selected-file">
              Selected file:
              <strong>
                {" "}{selectedFile.name}
              </strong>
            </div>
          )}
        </section>

        {/* Media Section */}
        <section className="dashboard-card">
          <div className="section-heading">
            <h2>My Media</h2>
            <p>
              Manage your uploaded images and videos.
            </p>
          </div>

          {/* Search */}
          <div className="filter-bar">
            <input
              className="search-input"
              type="text"
              placeholder="Search by filename..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />

            <button
              className="secondary-button"
              onClick={handleSearch}
            >
              Search
            </button>

            <select
              className="filter-select"
              value={type}
              onChange={(e) => {
                const selectedType =
                  e.target.value;

                setType(selectedType);
                setPage(1);

                fetchMedia(
                  search,
                  selectedType,
                  1
                );
              }}
            >
              <option value="">
                All Types
              </option>

              <option value="image">
                Images
              </option>

              <option value="video">
                Videos
              </option>
            </select>

            <button
              className="clear-button"
              onClick={handleClearFilters}
            >
              Clear
            </button>
          </div>

          {/* Media List */}
          {media.length === 0 ? (
            <div className="empty-state">
              <h3>No media found</h3>
              <p>
                Upload your first image or video
                to get started.
              </p>
            </div>
          ) : (
            <div className="media-grid">
              {media.map((item) => (
                <div
                  className="media-card"
                  key={item._id}
                >
                  <div className="media-preview">
                    {item.resourceType ===
                    "image" ? (
                      <img
                        src={item.url}
                        alt={item.originalName}
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                      />
                    )}
                  </div>

                  <div className="media-info">
                    <h3 title={item.originalName}>
                      {item.originalName}
                    </h3>

                    <div className="media-meta">
                      <span>
                        {item.resourceType}
                      </span>

                      <span>
                        {item.format}
                      </span>
                    </div>

                    <div className="media-actions">
                      <button
                        className="share-button"
                        onClick={() =>
                          handleShare(
                            item._id
                          )
                        }
                      >
                        Share
                      </button>

                      <button
                        className="delete-button"
                        onClick={() =>
                          handleDelete(
                            item._id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={handlePreviousPage}
                disabled={page === 1}
              >
                Previous
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={
                  page === totalPages
                }
              >
                Next
              </button>
            </div>
          )}
        </section>

        {/* Share Links */}
        <section className="dashboard-card">
          <div className="section-heading">
            <h2>My Share Links</h2>
            <p>
              Manage your active shared media links.
            </p>
          </div>

          {loadingShares ? (
            <div className="empty-state">
              <p>Loading share links...</p>
            </div>
          ) : shareLinks.length === 0 ? (
            <div className="empty-state">
              <h3>No active share links</h3>
              <p>
                Create a share link from any media
                item.
              </p>
            </div>
          ) : (
            <div className="share-list">
              {shareLinks.map((link) => (
                <div
                  className="share-card"
                  key={link._id}
                >
                  <div className="share-info">
                    <h3>
                      {link.media?.originalName ||
                        "Media"}
                    </h3>

                    <p>
                      Type:{" "}
                      {link.media
                        ?.resourceType ||
                        "Unknown"}
                    </p>

                    <p>
                      Expires:{" "}
                      {new Date(
                        link.expiresAt
                      ).toLocaleString()}
                    </p>

                    <p>
                      Downloads:{" "}
                      <strong>
                        {link.downloadCount}
                      </strong>
                      {" / "}
                      {link.maxDownloads}
                    </p>
                  </div>

                  <div className="share-actions">
                    <button
                      className="secondary-button"
                      onClick={() =>
                        handleCopyShareLink(
                          link.token
                        )
                      }
                    >
                      Copy Link
                    </button>

                    <button
                      className="delete-button"
                      onClick={() =>
                        handleRevokeShare(
                          link._id
                        )
                      }
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default Dashboard;
