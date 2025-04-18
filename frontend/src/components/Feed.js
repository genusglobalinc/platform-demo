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
        description: formFields.description,
        tags: selectedSub,
      },
    };

    if (formFields.studio.trim()) {
      payload.post_data.studio = formFields.studio;
    }
    if (formFields.banner_image.trim()) {
      payload.post_data.banner_image = formFields.banner_image;
    }
    const images = formFields.images
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    if (images.length > 0) {
      payload.post_data.images = images;
    }
    if (selectedMain === "Anime") {
      const services = formFields.streaming_services
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);
      if (services.length > 0) {
        payload.post_data.streaming_services = services;
      }
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
    minHeight: "100vh",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 24 },
  headerRight: { display: "flex", gap: 8 },
  createButton: {
    background: "#B388EB",
    color: "#000",
    padding: "8px 16px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  logoutButton: {
    background: "#333",
    color: "#fff",
    padding: "8px 16px",
    border: "1px solid #555",
    borderRadius: 6,
    cursor: "pointer",
  },
  tabContainer: { display: "flex", gap: 8, marginBottom: 16 },
  tabButton: {
    padding: "6px 12px",
    background: "#222",
    color: "#ccc",
    border: "none",
    borderRadius: 20,
    cursor: "pointer",
  },
  activeTab: { background: "#B388EB", color: "#000" },
  filterBar: { display: "flex", gap: 8, margin: "12px 0" },
  filterButton: {
    padding: "4px 8px",
    background: "#2a2a2a",
    color: "#eee",
    border: "1px solid #444",
    borderRadius: 15,
    cursor: "pointer",
  },
  activeFilter: { background: "#B388EB", color: "#000" },
  subFilterBar: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  subFilterButton: {
    padding: "4px 8px",
    background: "#333",
    color: "#ddd",
    border: "1px solid #444",
    borderRadius: 12,
    cursor: "pointer",
  },
  activeSubFilter: { background: "#B388EB", color: "#000" },
  feed: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
    gap: 16,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#1e1e1e",
    padding: 24,
    borderRadius: 10,
    width: "90%",
    maxWidth: 500,
  },
  textInput: {
    width: "100%",
    padding: 8,
    marginBottom: 12,
    background: "#1c1c1c",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: 6,
  },
  cancelButton: {
    background: "transparent",
    color: "#ccc",
    border: "1px solid #666",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
  },
  submitButton: {
    background: "#B388EB",
    color: "#000",
    padding: "8px 16px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
  },
};
