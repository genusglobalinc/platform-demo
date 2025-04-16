// frontend/src/components/Feed.js
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

  // Fields for your full post schema:
  const [title, setTitle] = useState("");
  const [studio, setStudio] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState("");
  const [accessInstructions, setAccessInstructions] = useState("");
  const [hasNda, setHasNda] = useState(false);
  const [rewards, setRewards] = useState("");
  const [shareSocials, setShareSocials] = useState(false);
  const [streamingServices, setStreamingServices] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");

  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_BASE_URL || "";

  // Load feed whenever filters change
  useEffect(() => {
    fetchPosts();
  }, [activeTab, selectedMain, selectedSub]);

  async function fetchPosts() {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      const res = await fetch(
        `${API}/posts/filter?tab=${encodeURIComponent(activeTab)}&main=${encodeURIComponent(selectedMain)}&subs=${encodeURIComponent(selectedSub.join(","))}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) return navigate("/login");
      const json = await res.json();
      setPosts(json.posts || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handlePostSubmit() {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    // Build the proper Pydantic schema payload
    const postPayload = {
      genre: selectedMain.toLowerCase(), // "gaming" or "anime"
      post_data: {
        title,
        tags: [],          // if you had tag inputs, parse them similarly
        studio,
        banner_image: bannerImage,
        description,
        images: images.split(","),  // assume comma‑separated URLs
        // gaming‑only:
        ...(selectedMain === "Gaming" && {
          access_instructions: accessInstructions,
          has_nda: hasNda,
          rewards,
          share_post_to_socials: shareSocials,
        }),
        // anime‑only:
        ...(selectedMain === "Anime" && {
          streaming_services: streamingServices.split(","),
          trailer_url: trailerUrl,
        }),
      }
    };

    try {
      const res = await fetch(`${API}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postPayload),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      // clear form & reload feed
      setShowCreateModal(false);
      setTitle(""); setStudio(""); setBannerImage("");
      setDescription(""); setImages("");
      setAccessInstructions(""); setHasNda(false);
      setRewards(""); setShareSocials(false);
      setStreamingServices(""); setTrailerUrl("");
      fetchPosts();
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post");
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2>Discover Playtests</h2>
        <div>
          <button onClick={() => setShowCreateModal(true)} style={styles.createButton}>
            + Create Post
          </button>
          <button onClick={() => { localStorage.removeItem("token"); navigate("/"); }} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={ tab===activeTab ? styles.activeTab : styles.tabButton }
          >{tab}</button>
        ))}
      </div>

      {/* Main Genre Filters */}
      <div style={styles.filterBar}>
        {Object.keys(GENRES).map(main => (
          <button
            key={main}
            onClick={() => { setSelectedMain(main); setSelectedSub([]); }}
            style={ main===selectedMain ? styles.activeFilter : styles.filterButton }
          >{main}</button>
        ))}
      </div>

      {/* Subtype Filters */}
      {selectedMain && (
        <div style={styles.subFilterBar}>
          {GENRES[selectedMain].map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSub(s =>
                s.includes(sub) ? s.filter(x=>x!==sub) : [...s,sub]
              )}
              style={ selectedSub.includes(sub) ? styles.activeSubFilter : styles.subFilterButton }
            >{sub}</button>
          ))}
        </div>
      )}

      {/* Feed */}
      <div style={styles.feed}>
        {loading
          ? <p>Loading…</p>
          : (posts.length
            ? posts.map(p => <PostCard key={p.post_id} post={p} />)
            : <p>No posts found</p>
          )
        }
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Create a {selectedMain || "Post"}</h3>

            {/* Common fields */}
            <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
            <input placeholder="Studio" value={studio} onChange={e=>setStudio(e.target.value)} />
            <input placeholder="Banner Image URL" value={bannerImage} onChange={e=>setBannerImage(e.target.value)} />
            <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />

            {/* Images */}
            <input
              placeholder="Gameplay Images (comma-separated URLs)"
              value={images}
              onChange={e=>setImages(e.target.value)}
            />

            {selectedMain === "Gaming" && <>
              <textarea
                placeholder="Access Instructions"
                value={accessInstructions}
                onChange={e=>setAccessInstructions(e.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  checked={hasNda}
                  onChange={e=>setHasNda(e.target.checked)}
                /> Has NDA
              </label>
              <input
                placeholder="Rewards"
                value={rewards}
                onChange={e=>setRewards(e.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  checked={shareSocials}
                  onChange={e=>setShareSocials(e.target.checked)}
                /> Share post to socials
              </label>
            </>}

            {selectedMain === "Anime" && <>
              <input
                placeholder="Streaming Services (comma-separated URLs)"
                value={streamingServices}
                onChange={e=>setStreamingServices(e.target.value)}
              />
              <input
                placeholder="Trailer URL"
                value={trailerUrl}
                onChange={e=>setTrailerUrl(e.target.value)}
              />
            </>}

            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button onClick={()=>setShowCreateModal(false)} style={styles.cancelButton}>Cancel</button>
              <button onClick={handlePostSubmit} style={styles.submitButton}>Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sharedBtn = {
  padding: "0.5rem 1rem",
  borderRadius: 6,
  cursor: "pointer",
  margin: "0 0.5rem"
};

const styles = {
  container: { padding: "2rem", background: "#111", color: "#fff" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  createButton: { ...sharedBtn, background: "#B388EB", color: "#000" },
  logoutButton: { ...sharedBtn, background: "#333", color: "#fff", border: "1px solid #555" },
  tabContainer: { margin: "1rem 0" },
  tabButton: { ...sharedBtn, background: "#222", color: "#ccc" },
  activeTab: { ...sharedBtn, background: "#B388EB", color: "#000", fontWeight: "bold" },
  filterBar: { display: "flex", gap: "0.5rem", marginBottom: "0.5rem" },
  filterButton: { ...sharedBtn, background: "#2a2a2a", color: "#eee", border: "1px solid #444" },
  activeFilter: { ...sharedBtn, background: "#B388EB", color: "#000" },
  subFilterBar: { display: "flex", gap: "0.5rem", marginBottom: "1rem" },
  subFilterButton: { ...sharedBtn, background: "#333", color: "#ddd", border: "1px solid #444" },
  activeSubFilter: { ...sharedBtn, background: "#B388EB", color: "#000" },
  feed: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))",
    gap: "1rem"
  },
  modalOverlay: {
    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
    background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center"
  },
  modal: {
    background: "#1e1e1e", padding: "1.5rem", borderRadius: 10, width: "90%", maxWidth: 500
  },
  cancelButton: { ...sharedBtn, background: "transparent", color: "#ccc", border: "1px solid #666" },
  submitButton: { ...sharedBtn, background: "#B388EB", color: "#000", fontWeight: "bold" },
};
