// src/components/Feed.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "./PostCard";

const TABS = ["Trending", "Newest", "For You"];
const GENRES = {
  Anime: ["Isekai", "Action", "Horror"],
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
    streaming_services: "",
  });

  const navigate = useNavigate();

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
      if (selectedSub.length > 0) {
        selectedSub.forEach((tag) => queryParams.append("tags", tag));
      }

      const res = await fetch(`/posts/?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!Array.isArray(body.posts)) throw new Error("Invalid response");
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

    const payload = {
      genre: (selectedMain || "Gaming").toLowerCase(),
      post_data: {
        title: formFields.title,
        tags: selectedSub,
        studio: formFields.studio || "",
        banner_image:
          formFields.banner_image || "https://via.placeholder.com/600x200",
        description: formFields.description,
        images:
          formFields.images
            .split(",")
            .map((u) => u.trim())
            .filter(Boolean) || [],
        ...(selectedMain === "Anime" && {
          streaming_services:
            formFields.streaming_services
              .split(",")
              .map((u) => u.trim())
              .filter(Boolean) || [],
        }),
      },
    };

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
        streaming_services: "",
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
      <div style={styles.header}>
        <h2 style={styles.title}>Discover Playtests</h2>
        <div style={styles.headerRight}>
          <button
            style={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            + Create Post
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
            onClick={() => {
              setSelectedMain(main);
              setSelectedSub([]);
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

      {selectedMain && (
        <div style={styles.subFilterBar}>
          {GENRES[selectedMain].map((sub) => (
            <button
              key={sub}
              onClick={() =>
                setSelectedSub((prev) =>
                  prev.includes(sub)
                    ? prev.filter((s) => s !== sub)
                    : [...prev, sub]
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

      <div style={styles.feed}>
        {loading ? (
          <p>Loading...</p>
        ) : posts.length === 0 ? (
          <p>No posts found</p>
        ) : (
          posts.map((post) => <PostCard key={post.post_id} post={post} />)
        )}
      </div>

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

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4 }}>
                Genre (required)
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {Object.keys(GENRES).map((main) => (
                  <button
                    key={main}
                    onClick={() => {
                      setSelectedMain(main);
                      setSelectedSub([]);
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

              {selectedMain && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {GENRES[selectedMain].map((sub) => (
                    <button
                      key={sub}
                      onClick={() =>
                        setSelectedSub((prev) =>
                          prev.includes(sub)
                            ? prev.filter((s) => s !== sub)
                            : [...prev, sub]
                        )
                      }
                      style={{
                        ...styles.subFilterButton,
                        ...(selectedSub.includes(sub)
                          ? styles.activeSubFilter
                          : {}),
                      }}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedMain === "Anime" && (
              <input
                style={styles.textInput}
                placeholder="Streaming Services (comma separated)"
                value={formFields.streaming_services}
                onChange={(e) =>
                  setFormFields({
                    ...formFields,
                    streaming_services: e.target.value,
                  })
                }
              />
            )}

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
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: 28,
  },
  headerRight: {
    display: "flex",
    gap: 16,
  },
  createButton: {
    padding: "10px 20px",
    background: "#2e2e2e",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: 8,
  },
  logoutButton: {
    padding: "10px 20px",
    background: "#d9534f",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: 8,
  },
  tabContainer: {
    marginBottom: 16,
  },
  tabButton: {
    padding: "8px 16px",
    background: "#2e2e2e",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    marginRight: 8,
    borderRadius: 4,
  },
  activeTab: {
    background: "#1d1d1d",
  },
  filterBar: {
    marginBottom: 16,
    marginTop: 24,
  },
  filterButton: {
    padding: "8px 16px",
    background: "#2e2e2e",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    marginRight: 8,
    borderRadius: 4,
  },
  activeFilter: {
    background: "#1d1d1d",
  },
  subFilterBar: {
    marginTop: 8,
  },
  subFilterButton: {
    padding: "8px 16px",
    background: "#2e2e2e",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  activeSubFilter: {
    background: "#1d1d1d",
  },
  feed: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: 16,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    background: "#222",
    padding: 24,
    borderRadius: 8,
    width: "80%",
    maxWidth: "600px",
    color: "#fff",
  },
  textInput: {
    width: "100%",
    padding: 10,
    marginBottom: 16,
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: 4,
  },
  cancelButton: {
    padding: "10px 20px",
    background: "#d9534f",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: 8,
  },
  submitButton: {
    padding: "10px 20px",
    background: "#5bc0de",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: 8,
  },
};
