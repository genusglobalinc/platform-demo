// frontend/src/components/Feed.js
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import CreatePost from "./CreatePost"; // ✅ Make sure this component exists

const TABS = ["Trending", "Newest", "For You"];
const GENRES = {
  Anime: ["Isekai", "Action", "Horror"],
  Gaming: ["MMO", "First Person Shooter", "Hero Battler"]
};

function Feed() {
  const [activeTab, setActiveTab] = useState("Trending");
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSub, setSelectedSub] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPosts();
  }, [activeTab, selectedMain, selectedSub]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        tab: activeTab,
        main: selectedMain || "",
        subs: selectedSub.join(',')
      }).toString();

      const response = await fetch(`/api/posts?${query}`);
      const data = await response.json();
      console.log("[DEBUG] Fetched posts:", data); // TODO: remove for production
      setPosts(data || []);
    } catch (err) {
      console.error("[ERROR] Failed to fetch posts:", err);
      setPosts([]);
    }
    setLoading(false);
  };

  const handleMainGenre = (genre) => {
    setSelectedMain(genre === selectedMain ? null : genre); // Toggle main
    setSelectedSub([]);
  };

  const toggleSubtype = (sub) => {
    setSelectedSub(prev =>
      prev.includes(sub)
        ? prev.filter(s => s !== sub)
        : [...prev, sub]
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
        <h2 style={styles.title}>🎮 Discover Playtests</h2>
        <div style={styles.headerRight}>
          <button
            onClick={() => alert("Notifications coming soon!")}
            style={styles.iconButton}
          >🔔</button>

          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>

          <button
            onClick={() => setShowCreatePost(prev => !prev)}
            style={styles.createPostButton}
          >
            {showCreatePost ? "Cancel" : "Create Post"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab ? styles.activeTab : {})
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        {Object.keys(GENRES).map(main => (
          <button
            key={main}
            onClick={() => handleMainGenre(main)}
            style={{
              ...styles.filterButton,
              ...(selectedMain === main ? styles.activeFilter : {})
            }}
          >
            {main}
          </button>
        ))}
      </div>
      {selectedMain && (
        <div style={styles.subFilterBar}>
          {GENRES[selectedMain].map(sub => (
            <button
              key={sub}
              onClick={() => toggleSubtype(sub)}
              style={{
                ...styles.subFilterButton,
                ...(selectedSub.includes(sub) ? styles.activeSubFilter : {})
              }}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Create Post */}
      {showCreatePost && (
        <CreatePost
          token={token}
          onPostCreated={(newPostId) => {
            console.log("[DEBUG] Post created with ID:", newPostId); // TODO: remove
            fetchPosts();
            setShowCreatePost(false);
          }}
        />
      )}

      {/* Feed */}
      <div style={styles.feed}>
        {loading ? (
          <p>Loading...</p>
        ) : posts.length === 0 ? (
          <p>No posts found for selected filters.</p>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}

// 🔄 Individual Post Component
function PostCard({ post }) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      style={styles.postCard}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div style={styles.thumbnail}>
        {!hovering ? (
          <img src={post.image} alt={post.title} style={styles.postImage} />
        ) : (
          <video
            src={post.video}
            style={styles.videoPreview}
            autoPlay
            loop
            muted
          />
        )}
      </div>
      <h3 style={styles.postTitle}>{post.title}</h3>
      <p style={styles.postTags}>{post.tags?.join(", ")}</p>
    </div>
  );
}

const styles = {
  container: {
    padding: '1rem',
    background: '#121212',
    color: '#fff',
    minHeight: '100vh',
    fontFamily: 'sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '1rem'
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 'bold'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  iconButton: {
    fontSize: '1.5rem',
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer'
  },
  logoutButton: {
    background: '#E74C3C',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#fff'
  },
  createPostButton: {
    background: '#2ECC71',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#fff'
  },
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap'
  },
  tabButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #444',
    background: '#1e1e1e',
    color: '#ccc',
    borderRadius: '20px',
    cursor: 'pointer'
  },
  activeTab: {
    background: '#B388EB',
    color: '#1e1e1e',
    fontWeight: 'bold'
  },
  filterBar: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '0.5rem'
  },
  subFilterBar: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '1rem'
  },
  filterButton: {
    padding: '0.4rem 0.8rem',
    border: '1px solid #555',
    borderRadius: '15px',
    background: '#2a2a2a',
    color: '#eee',
    cursor: 'pointer'
  },
  activeFilter: {
    background: '#B388EB',
    color: '#1e1e1e'
  },
  subFilterButton: {
    padding: '0.3rem 0.7rem',
    border: '1px solid #555',
    borderRadius: '12px',
    background: '#333',
    color: '#ddd',
    cursor: 'pointer'
  },
  activeSubFilter: {
    background: '#B388EB',
    color: '#1e1e1e'
  },
  feed: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem'
  },
  postCard: {
    background: '#1f1f1f',
    borderRadius: '10px',
    padding: '1rem',
    transition: 'all 0.3s'
  },
  thumbnail: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '10px',
    height: '200px'
  },
  postImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '10px'
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '10px'
  },
  postTitle: {
    marginTop: '0.5rem',
    fontSize: '1.1rem'
  },
  postTags: {
    color: '#aaa',
    fontSize: '0.9rem'
  }
};

export default Feed;
