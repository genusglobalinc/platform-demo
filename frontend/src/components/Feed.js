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
  const [formFields, setFormFields] = useState({
    title: "",
    studio: "",
    banner_image: "",
    description: "",
    images: "",
    streaming_services: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

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

      console.log("fetchPosts - status:", res.status);
      const rawText = await res.text();
      console.log("fetchPosts - raw body:", rawText);

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error("Response not valid JSON. Something still wrong here in Feed.js line 50 as of rn..");
      }

      if (!Array.isArray(data.posts)) {
        throw new Error("Expected posts to be an array.");
      }

      setPosts(data.posts);
    } catch (err) {
      console.error("⚠️ Error in fetchPosts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Only title and description are required
    if (!formFields.title || !formFields.description) {
      console.error("Title and Description are required fields.");
      return;
    }

    const postData = {
      content: formContent,
      genre: selectedMain || "DefaultGenre", // Default to "DefaultGenre" if empty
      subgenres: selectedSub.length > 0 ? selectedSub : [], // Send an empty array if no subgenres
      title: formFields.title,
      description: formFields.description,
      studio: formFields.studio || "", // Send empty string if studio is not provided
      banner_image: formFields.banner_image || "", // Empty string for missing banner_image
      images: formFields.images ? formFields.images.split(",").map((img) => img.trim()) : [], // Ensure images is an empty array if not provided
      streaming_services: selectedMain === "Anime" && formFields.streaming_services ? formFields.streaming_services.split(",").map((s) => s.trim()) : [], // Only send streaming_services if main genre is Anime
    };

    try {
      const response = await fetch("/posts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ post_data: postData }),
      });

      if (!response.ok) throw new Error("Failed to create post");

      setFormContent("");
      setSelectedMain("");
      setSelectedSub([]);
      setFormFields({
        title: "",
        studio: "",
        banner_image: "",
        description: "",
        images: "",
        streaming_services: "",
      });
      setShowCreateModal(false);
      fetchPosts();
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  const handleMainGenre = (genre) => {
    setSelectedMain(genre);
    setSelectedSub([]);
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

      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom: "1rem" }}>Create a Post</h3>

            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="What's on your mind?"
              style={styles.textarea}
            />

            {["title", "studio", "banner_image", "description", "images"].map((field) => (
              <input
                key={field}
                type="text"
                placeholder={field.replace("_", " ").toUpperCase()}
                value={formFields[field]}
                onChange={(e) => setFormFields({ ...formFields, [field]: e.target.value })}
                style={styles.textInput}
              />
            ))}

            {selectedMain === "Anime" && (
              <input
                type="text"
                placeholder="Streaming Services (comma separated)"
                value={formFields.streaming_services}
                onChange={(e) =>
                  setFormFields({ ...formFields, streaming_services: e.target.value })
                }
                style={styles.textInput}
              />
            )}

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
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    background: "#111",
    color: "#fff",
    minHeight: "100vh",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "2rem",
  },
  headerRight: {
    display: "flex",
    gap: "1rem",
  },
  createButton: {
    padding: "0.5rem 1rem",
    background: "#0a84ff",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  logoutButton: {
    padding: "0.5rem 1rem",
    background: "#f44336",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  tabContainer: {
    display: "flex",
    gap: "1rem",
    margin: "1rem 0",
  },
  tabButton: {
    padding: "0.5rem 1rem",
    background: "#333",
    color: "#fff",
    border: "1px solid #444",
    cursor: "pointer",
  },
  activeTab: {
    background: "#0a84ff",
  },
  filterBar: {
    marginTop: "1rem",
    display: "flex",
    gap: "1rem",
    marginBottom: "1rem",
  },
  filterButton: {
    padding: "0.5rem 1rem",
    background: "#333",
    color: "#fff",
    border: "1px solid #444",
    cursor: "pointer",
  },
  activeFilter: {
    background: "#0a84ff",
  },
  subFilterBar: {
    marginTop: "1rem",
    display: "flex",
    gap: "1rem",
  },
  subFilterButton: {
    padding: "0.5rem 1rem",
    background: "#333",
    color: "#fff",
    border: "1px solid #444",
    cursor: "pointer",
  },
  activeSubFilter: {
    background: "#0a84ff",
  },
  feed: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    background: "#222",
    padding: "2rem",
    borderRadius: "8px",
    maxWidth: "600px",
    width: "100%",
  },
  textarea: {
    width: "100%",
    height: "150px",
    padding: "1rem",
    background: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
  textInput: {
    width: "100%",
    padding: "0.5rem",
    background: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
  cancelButton: {
    padding: "0.5rem 1rem",
    background: "#f44336",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  submitButton: {
    padding: "0.5rem 1rem",
    background: "#0a84ff",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
};

export default Feed;
