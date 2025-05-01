// src/components/Feed.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "./PostCard";

const TABS = ["Trending", "Newest", "For You"];
const GENRES = {
  Gaming: ["MMO", "First Person Shooter", "Hero Battler"],
};

export default function Feed() {
  const [activeTab, setActiveTab] = useState("Trending");
  const [selectedMain, setSelectedMain] = useState("");
  const [selectedSub, setSelectedSub] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formFields, setFormFields] = useState({
    title: "",
    description: "",
    studio: "",
    banner_image: "",
    images: "",
  });

  const navigate = useNavigate();

  // Re-fetch whenever genre or tags change
  useEffect(() => {
    fetchPosts();
  }, [selectedMain, selectedSub]);

  async function fetchPosts() {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const queryParams = new URLSearchParams();
      if (selectedMain) {
        queryParams.append("genre", selectedMain.toLowerCase());
      }
      // allow multiple ?tags= entries
      selectedSub.forEach((tag) => {
        queryParams.append("tags", tag);
      });

      const res = await fetch(`/posts/?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!Array.isArray(body.posts)) {
        throw new Error("Invalid response");
      }
      setPosts(body.posts);
    } catch (err) {
      console.error("Error loading posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handlePostSubmit() {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Not logged in");
      return;
    }
    if (!formFields.title.trim() || !formFields.description.trim()) {
      alert("Title and Description are required.");
      return;
    }

    // Build payload dynamically, only including non‑empty fields
    const payload = {
      genre: "gaming",
      post_data: {
        title: formFields.title.trim(),
        description: formFields.description.trim(),
        tags: selectedSub,
      },
    };

    if (formFields.studio.trim()) {
      payload.post_data.studio = formFields.studio.trim();
    }
    if (formFields.banner_image.trim()) {
      payload.post_data.banner_image = formFields.banner_image.trim();
    }
    const images = formFields.images
      .split(",")
      .map((img) => img.trim())
      .filter(Boolean);
    if (images.length > 0) {
      payload.post_data.images = images;
    }

    try {
      const res = await fetch("/posts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || res.statusText);
      }
      await res.json();
      setShowCreateModal(false);
      setFormFields({
        title: "",
        description: "",
        studio: "",
        banner_image: "",
        images: "",
      });
      setSelectedMain("");
      setSelectedSub([]);
      fetchPosts();
    } catch (err) {
      console.error("Create post failed:", err);
      alert("Failed to create post: " + err.message);
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Discover Playtests</h2>
        <div style={styles.headerRight}>
          <button
            style={styles.createButton}
            onClick={() => navigate('/create-post')}
          >
            + Create Post
          </button>

          {/* ← NEW Profile button → */}
          <button
            style={styles.profileButton}
            onClick={() => navigate("/profile")}
          >
            Profile
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            style={styles.logoutButton}
          >
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

      {/* Genre Filters */}
      <div style={styles.filterBar}>
        {Object.keys(GENRES).map((main) => (
          <button
            key={main}
            onClick={() => {
              setSelectedMain(main);
              setSelectedSub([]); // reset tags on genre change
            }}
            style={{
              ...styles.filterButton,
              ...(selectedMain === main ? styles.activeFilter : {}),
            }}
          >
            {main}
          </button>
        ))}
      </div>

      {/* Sub‑genre Filters */}
      {selectedMain && (
        <div style={styles.subFilterBar}>
          {GENRES[selectedMain].map((sub) => (
            <button
              key={sub}
              onClick={() =>
                setSelectedSub((prev) =>
                  prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
                )
              }
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

      {/* Feed */}
      <div style={styles.feed}>
        {loading ? (
          <p>Loading...</p>
        ) : posts.length === 0 ? (
          <p>No posts found</p>
        ) : (
          posts.map((post) => <PostCard key={post.post_id} post={post} />)
        )}
      </div>

      {/* Create‑Post Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Create a Post</h3>

            <input
              style={styles.textInput}
              placeholder="Title *"
              value={formFields.title}
              onChange={(e) =>
                setFormFields({ ...formFields, title: e.target.value })
              }
            />
            <textarea
              style={{ ...styles.textInput, height: 80 }}
              placeholder="Description *"
              value={formFields.description}
              onChange={(e) =>
                setFormFields({ ...formFields, description: e.target.value })
              }
            />

            {["studio", "banner_image", "images"].map((fld) => (
              <input
                key={fld}
                style={styles.textInput}
                placeholder={fld.replace("_", " ").toUpperCase()}
                value={formFields[fld]}
                onChange={(e) =>
                  setFormFields({ ...formFields, [fld]: e.target.value })
                }
              />
            ))}

            {/* Genre and Tag Selectors */}
            <div style={styles.modalSelectorContainer}>
              <h4>Genre</h4>
              {Object.keys(GENRES).map((main) => (
                <button
                  key={main}
                  onClick={() => setSelectedMain(main)}
                  style={{
                    ...styles.modalSelectorButton,
                    ...(selectedMain === main ? styles.activeSelector : {}),
                  }}
                >
                  {main}
                </button>
              ))}
              {selectedMain && (
                <div>
                  <h4>Tags</h4>
                  {GENRES[selectedMain].map((sub) => (
                    <button
                      key={sub}
                      onClick={() =>
                        setSelectedSub((prev) =>
                          prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
                        )
                      }
                      style={{
                        ...styles.modalSelectorButton,
                        ...(selectedSub.includes(sub) ? styles.activeSelector : {}),
                      }}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button style={styles.submitButton} onClick={handlePostSubmit}>
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: 24,
    background: "#111",
    color: "#fff",
    minHeight: "100vh",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 28, margin: 0 },
  headerRight: { display: "flex", gap: 16 },
  createButton: {
    background: "#5C6BC0",
    padding: "8px 16px",
    color: "#fff",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  profileButton: {
    background: "#4CAF50",
    padding: "8px 16px",
    color: "#fff",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  logoutButton: {
    background: "#E57373",
    padding: "8px 16px",
    color: "#fff",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  tabContainer: {
    display: "flex",
    marginBottom: 16,
    gap: 16,
  },
  tabButton: {
    padding: "8px 16px",
    background: "#333",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  activeTab: {
    background: "#5C6BC0",
  },
  filterBar: {
    display: "flex",
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    padding: "6px 12px",
    background: "#333",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  activeFilter: {
    background: "#5C6BC0",
  },
  subFilterBar: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  subFilterButton: {
    padding: "6px 12px",
    background: "#444",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  activeSubFilter: {
    background: "#5C6BC0",
  },
  feed: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    background: "#222",
    padding: 24,
    borderRadius: 8,
    width: "400px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
  },
  textInput: {
    width: "100%",
    padding: "8px 16px",
    background: "#333",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: 8,
    marginBottom: 12,
  },
  cancelButton: {
    background: "#E57373",
    padding: "8px 16px",
    color: "#fff",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  submitButton: {
    background: "#5C6BC0",
    padding: "8px 16px",
    color: "#fff",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  modalSelectorContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  modalSelectorButton: {
    padding: "6px 12px",
    background: "#444",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  activeSelector: {
    background: "#5C6BC0",
  },
};
