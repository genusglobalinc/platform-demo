import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import PostCard from "./PostCard";  // Make sure this component exists and correctly displays a post

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line
  }, [activeTab, selectedMain, selectedSub]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // IMPORTANT: Update this URL if your backend API route is different.
      const response = await fetch(`/api/posts?tab=${activeTab}&main=${selectedMain || ""}&subs=${selectedSub.join(',')}`);
      // Ensure the response is JSON (an array)
      const data = await response.json();
      console.log("Posts fetched:", data);
      // If data is not an array, try to handle or log an error.
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setPosts([]);
    }
    setLoading(false);
  };

  const handleMainGenre = (genre) => {
    setSelectedMain(genre);
    setSelectedSub([]);
  };

  const toggleSubtype = (sub) => {
    setSelectedSub((prev) =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
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
          <button onClick={() => alert("Notifications coming soon")} style={styles.iconButton}>🔔</button>
          <img
            src="/your-profile-pic.jpg"
            alt="Profile"
            style={styles.profilePic}
            onClick={() => navigate("/profile")}
          />
          <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
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
              ...(activeTab === tab ? styles.activeTab : {})
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Main Genre Filters */}
      <div style={styles.filterBar}>
        {Object.keys(GENRES).map((main) => (
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
      {/* Sub-Genre Filters */}
      {selectedMain && (
        <div style={styles.subFilterBar}>
          {GENRES[selectedMain].map((sub) => (
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
      {/* Post Feed */}
      <div style={styles.feed}>
        {loading ? (
          <p>Loading...</p>
        ) : posts.length === 0 ? (
          <p>No posts found</p>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
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
    flexWrap: 'wrap'
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  iconButton: {
    fontSize: '1.5rem',
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer'
  },
  logoutButton: {
    background: '#B388EB',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#1e1e1e'
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    cursor: 'pointer',
    objectFit: 'cover'
  },
  tabContainer: {
    display: 'flex',
    margin: '1rem 0',
    gap: '0.5rem',
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
  subFilterBar: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '1rem'
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
  }
};

export default Feed;
