// frontend/src/components/Feed.js
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
  const [dynamicGenres, setDynamicGenres] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchGenres();  // Fetch the genres dynamically if needed
    fetchPosts();
  }, [activeTab, selectedMain, selectedSub]);

  const fetchGenres = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found, redirecting to login.");
      navigate("/login");
      return;
    }
    try {
      const response = await fetch("/genres", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        navigate("/login");
        return;
      }
      const data = await response.json();
      setDynamicGenres(data); // Assuming data is an object with dynamic genres
    } catch (err) {
      console.error("Error fetching genres:", err);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found, redirecting to login.");
      navigate("/login");
      return;
    }
    try {
      const response = await fetch(
        `/events?tab=${activeTab}&main=${selectedMain || ""}&subs=${selectedSub.join(",")}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 401) {
        navigate("/login");
        return;
      }
      const data = await response.json();
      setPosts(Array.isArray(data.events) ? data.events : []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: formContent }),
      });

      if (!response.ok) throw new Error("Failed to create post");

      setFormContent("");
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

      {/* Genre Filters */}
      <div style={styles.filterBar}>
        {Object.keys(dynamicGenres).map((main) => (
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
          {dynamicGenres[selectedMain]?.map((sub) => (
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

      {/* Modal */}
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
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "1.8rem",
  },
  headerRight: {
    display: "flex",
    gap: "1rem",
  },
  createButton: {
    background: "#B388EB",
    color: "#000",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  logoutButton: {
    background: "#333",
    color: "#fff",
    padding: "0.5rem 1rem",
    border: "1px solid #555",
    borderRadius: "6px",
    cursor: "pointer",
  },
  tabContainer: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  tabButton: {
    padding: "0.5rem 1rem",
    background: "#222",
    color: "#ccc",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
  },
  activeTab: {
    background: "#B388EB",
    color: "#000",
  },
  filterBar: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    marginBottom: "0.5rem",
  },
  filterButton: {
    padding: "0.4rem 0.8rem",
    background: "#2a2a2a",
    color: "#eee",
    border: "1px solid #444",
    borderRadius: "15px",
    cursor: "pointer",
  },
  activeFilter: {
    background: "#B388EB",
    color: "#1e1e1e",
  },
  subFilterBar: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    marginBottom: "1.5rem",
  },
  subFilterButton: {
    padding: "0.3rem 0.7rem",
    background: "#333",
    color: "#ddd",
    border: "1px solid #444",
    borderRadius: "12px",
    cursor: "pointer",
  },
  activeSubFilter: {
    background: "#B388EB",
    color: "#1e1e1e",
  },
  feed: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1rem",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    width: "100vw",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modal: {
    background: "#222",
    padding: "2rem",
    borderRadius: "10px",
    width: "80%",
    maxWidth: "500px",
    color: "#fff",
  },
  textarea: {
    width: "100%",
    height: "150px",
    padding: "1rem",
    borderRadius: "10px",
    border: "1px solid #444",
    marginBottom: "1rem",
    background: "#333",
    color: "#fff",
    fontSize: "1rem",
  },
  cancelButton: {
    background: "#777",
    color: "#fff",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  submitButton: {
    background: "#B388EB",
    color: "#000",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default Feed;
