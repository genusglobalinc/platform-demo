import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "./PostCard";

const TABS = ["Trending", "Newest", "For You"];
const GENRES = {
  Anime: ["Isekai", "Action", "Horror"],
  Gaming: ["MMO", "First Person Shooter", "Hero Battler"],
};

function Feed() {
  const [activeTab, setActiveTab] = useState("Trending");
  const [selectedMain, setSelectedMain] = useState("");
  const [selectedSub, setSelectedSub] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formContent, setFormContent] = useState("");
  const [previewContent, setPreviewContent] = useState(null);  // For preview data
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []); // no longer depends on filters

  const fetchPosts = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found, redirecting to login.");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("/posts/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error("Response not valid JSON.");
      }

      if (!Array.isArray(data.posts)) {
        throw new Error("Expected posts to be an array.");
      }

      setPosts(data.posts);
    } catch (err) {
      console.error("Error in fetchPosts:", err);
      setPosts([]);  // Clear posts on error
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Ensure the genre is selected
    if (!selectedMain) {
      console.error("Please select a genre.");
      return;
    }

    try {
      const response = await fetch("/posts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_data: {
            content: formContent,
            genre: selectedMain,
            subgenres: selectedSub,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to create post");

      setFormContent("");
      setSelectedMain("");
      setSelectedSub([]);
      setShowCreateModal(false);
      fetchPosts();
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  const handleMainGenre = (genre) => {
    setSelectedMain(genre);
    setSelectedSub([]);  // Reset subgenre when main genre changes
  };

  const toggleSubtype = (sub) => {
    setSelectedSub((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Discover Playtests</h2>
        <div style={styles.headerRight}>
          <button style={styles.createButton} onClick={() => setShowCreateModal(true)}>
            + Create Post
          </button>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab ? styles.activeTab : {}),
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div style={styles.feed}>
        {loading ? (
          <p>Loading...</p>
        ) : posts.length === 0 ? (
          <p>No posts found</p>
        ) : (
          posts.map((post) => (
            <PostCard key={post.post_id || post.id} post={post} />
          ))
        )}
      </div>

      {/* Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom: "1rem" }}>Create a Post</h3>

            {/* Preview Section (display existing post data) */}
            {previewContent && (
              <div style={styles.previewContainer}>
                <h4>Preview</h4>
                <p><strong>Content:</strong> {previewContent.content}</p>
                <p><strong>Created At:</strong> {previewContent.created_at}</p>
                <p><strong>User ID:</strong> {previewContent.user_id}</p>
              </div>
            )}

            {/* Form Section for creating a new post */}
            <div style={styles.formContainer}>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="What's on your mind?"
                style={styles.textarea}
              />

              {/* Genre Selection */}
              <div style={styles.filterBar}>
                {Object.keys(GENRES).map((main) => (
                  <button
                    key={main}
                    onClick={() => handleMainGenre(main)}
                    style={{
                      ...styles.filterButton,
                      ...(selectedMain === main ? styles.activeFilter : {}),
                    }}
                  >
                    {main}
                  </button>
                ))}
              </div>

              {/* Subtype Filters */}
              {selectedMain && (
                <div style={styles.subFilterBar}>
                  {GENRES[selectedMain].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => toggleSubtype(sub)}
                      style={{
                        ...styles.subFilterButton,
                        ...(selectedSub.includes(sub) ? styles.activeSubFilter : {}),
                      }}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button onClick={() => setShowCreateModal(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handlePostSubmit} style={styles.submitButton}>
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
  },
  headerRight: {
    display: "flex",
    gap: "15px",
  },
  createButton: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  logoutButton: {
    padding: "10px 20px",
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  tabContainer: {
    display: "flex",
    marginBottom: "20px",
  },
  tabButton: {
    padding: "10px 20px",
    backgroundColor: "#f1f1f1",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  activeTab: {
    backgroundColor: "#ddd",
  },
  feed: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    width: "50%",
  },
  previewContainer: {
    marginBottom: "20px",
    padding: "10px",
    backgroundColor: "#f9f9f9",
    borderRadius: "5px",
  },
  formContainer: {
    marginTop: "20px",
  },
  textarea: {
    width: "100%",
    height: "150px",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
  },
  filterBar: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  filterButton: {
    padding: "8px 16px",
    backgroundColor: "#f1f1f1",
    border: "none",
    cursor: "pointer",
  },
  activeFilter: {
    backgroundColor: "#ddd",
  },
  subFilterBar: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  subFilterButton: {
    padding: "8px 16px",
    backgroundColor: "#f1f1f1",
    border: "none",
    cursor: "pointer",
  },
  activeSubFilter: {
    backgroundColor: "#ddd",
  },
  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#ccc",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  submitButton: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default Feed;
