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
        throw new Error("Response not valid JSON.");
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
    if (!token) {
      alert("No token found, please login again.");
      navigate("/login");
      return;
    }

    if (!formFields.title || !formFields.description) {
      alert("Please fill in both Title and Description.");
      return;
    }

    const postData = {
      content: formContent,
      genre: selectedMain || "",
      subgenres: selectedSub,
      title: formFields.title,
      description: formFields.description,
      studio: formFields.studio || "",
      banner_image: formFields.banner_image || "",
      images: formFields.images
        ? formFields.images.split(",").map((i) => i.trim())
        : [],
      streaming_services:
        selectedMain === "Anime" && formFields.streaming_services
          ? formFields.streaming_services.split(",").map((s) => s.trim())
          : [],
    };

    try {
      const res = await fetch(`/posts/?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_data: postData, genre: selectedMain }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Create post failed:", err);
        alert(`Error: ${err.detail?.[0]?.msg || res.statusText}`);
        return;
      }

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
    } catch (e) {
      console.error("Error creating post:", e);
      alert("An unexpected error occurred.");
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
        <h2>Feed</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div style={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(tab === activeTab ? styles.activeTab : {}),
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={styles.createSection}>
        <button onClick={() => setShowCreateModal(true)}>Create Post</button>
      </div>

      {showCreateModal && (
        <div style={styles.modal}>
          <textarea
            placeholder="Post content..."
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            style={styles.textarea}
          />

          <input
            placeholder="Title *"
            value={formFields.title}
            onChange={(e) =>
              setFormFields({ ...formFields, title: e.target.value })
            }
          />
          <input
            placeholder="Description *"
            value={formFields.description}
            onChange={(e) =>
              setFormFields({ ...formFields, description: e.target.value })
            }
          />
          <input
            placeholder="Studio"
            value={formFields.studio}
            onChange={(e) =>
              setFormFields({ ...formFields, studio: e.target.value })
            }
          />
          <input
            placeholder="Banner Image URL"
            value={formFields.banner_image}
            onChange={(e) =>
              setFormFields({ ...formFields, banner_image: e.target.value })
            }
          />
          <input
            placeholder="Image URLs (comma separated)"
            value={formFields.images}
            onChange={(e) =>
              setFormFields({ ...formFields, images: e.target.value })
            }
          />
          {selectedMain === "Anime" && (
            <input
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

          <div>
            <h4>Main Genre</h4>
            {Object.keys(GENRES).map((main) => (
              <button
                key={main}
                onClick={() => handleMainGenre(main)}
                style={{
                  margin: 4,
                  background: selectedMain === main ? "lightblue" : "white",
                }}
              >
                {main}
              </button>
            ))}
          </div>

          {selectedMain && (
            <div>
              <h4>Subgenres</h4>
              {GENRES[selectedMain].map((sub) => (
                <button
                  key={sub}
                  onClick={() => toggleSubtype(sub)}
                  style={{
                    margin: 4,
                    background: selectedSub.includes(sub)
                      ? "lightgreen"
                      : "white",
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          <button onClick={handlePostSubmit}>Submit</button>
          <button onClick={() => setShowCreateModal(false)}>Cancel</button>
        </div>
      )}

      {loading ? (
        <p>Loading posts...</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  tabs: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
  },
  tab: {
    padding: "6px 12px",
    border: "1px solid gray",
    borderRadius: 4,
    background: "white",
    cursor: "pointer",
  },
  activeTab: {
    background: "lightgray",
  },
  createSection: {
    marginBottom: 20,
  },
  modal: {
    border: "1px solid black",
    padding: 10,
    marginBottom: 20,
    background: "#f7f7f7",
  },
  textarea: {
    width: "100%",
    height: 60,
    marginBottom: 10,
  },
};

export default Feed;
