// frontend/src/components/PostDetails.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import jwtDecode from "jwt-decode";
import { api } from "../api";
import Layout, { sectionStyles } from "./Layout";

// Helper to build Sanity asset URLs similar to PostCard
const buildSanityUrl = (ref, projectId = process.env.REACT_APP_SANITY_PROJECT_ID || "jpgxw2o8") => {
  if (!ref || !projectId) return null;
  const parts = ref.split("-"); // image-<id>-<dims>-<fmt>
  if (parts.length < 4) return null;
  const id = parts[1];
  const dims = parts[2];
  const fmt = parts[3];
  return `https://cdn.sanity.io/images/${projectId}/production/${id}-${dims}.${fmt}`;
};

export default function PostDetails() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devProfile, setDevProfile] = useState(null);
  const [devPosts, setDevPosts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch the post
        const res = await fetch(`/posts/${postId}`);
        if (!res.ok) throw new Error("Failed to fetch post");
        const data = await res.json();
        console.log("Post data:", data); // Debug post data structure
        
        // Extract developer ID from possible locations
        let developerId = null;
        if (data.testerId) {
          developerId = data.testerId;
        } else if (data.user_id) {
          developerId = data.user_id;
        } else if (data.createdBy && data.createdBy._ref) {
          developerId = data.createdBy._ref;
        } else if (data.author && data.author._ref) {
          developerId = data.author._ref.replace('user-', '');
        } else if (data.dev_id) {
          developerId = data.dev_id;
        }
        console.log("Determined developer ID:", developerId);

        // Store developer ID on post object for later use
        const enhancedData = {
          ...data,
          developer_id: developerId
        };
        
        setPost(enhancedData);
        
        // Always attempt to fetch developer profile if we have any ID
        if (developerId) {
          await fetchDevProfile(developerId);
        } else {
          console.warn("No developer ID found for post", postId);
        }
      } catch (e) {
        console.error(e);
        setError("Unable to load post.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [postId]);
  
  // Fetch developer profile using ID, will lookup username first
  const fetchDevProfile = async (developerId) => {
    try {
      console.log("Fetching username for developer ID:", developerId);
      // First get the username for this developer ID
      const usernameRes = await api.get(`/users/username/${developerId}`);
      const username = usernameRes.data.username;
      console.log("Found username:", username);
      
      // Then fetch the profile using that username
      console.log("Fetching profile for username:", username);
      const profileRes = await api.get(`/users/profile/by-username/${username}`);
      console.log("Developer profile:", profileRes.data);
      setDevProfile(profileRes.data);
      
      // Set the username on the post for navigation
      setPost(prevPost => ({
        ...prevPost,
        developer_username: username
      }));

      // Also fetch other posts by this developer
      console.log("Fetching posts for username:", username);
      const postsRes = await api.get(`/users/by-username/${username}/posts`);
      console.log("Developer posts:", postsRes.data);
      setDevPosts(postsRes.data || []);
    } catch (e) {
      console.error("Error fetching developer data:", e);
      // Don't show an error to the user, just log it
    }
  };

  // --- Registration ---
  const registerForEvent = async () => {
    const token = localStorage.getItem("token") || "";
    let userType = "";
    try {
      if (token) userType = jwtDecode(token).user_type;
    } catch {}
    if (userType !== "Tester") {
      alert("Only Tester accounts can sign up for events");
      return;
    }

    const name = prompt("Enter your name:");
    if (!name) return;
    const email = prompt("Enter your email:");
    if (!email) return;

    try {
      const res = await fetch(`/posts/${postId}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error("Registration failed");
      alert("Successfully registered!");
    } catch (e) {
      alert(e.message);
    }
  };

  // Render dev profile section
  const renderDevProfileSection = () => {
    if (!devProfile) return null;
    
    // Helper function to render a row with label and value (similar to Profile.js)
    const renderRow = (label, value) => {
      if (value === undefined || value === null || value === "") return null;
      
      return (
        <div style={styles.devInfoRow}>
          <span style={styles.devInfoLabel}>{`${label}:`}</span>
          <span>{value}</span>
        </div>
      );
    };
    
    return (
      <div style={styles.devProfileSection}>
        <h3 style={styles.devProfileTitle}>About {post.studio || devProfile.display_name || 'Developer'}</h3>
        
        <div style={styles.devProfileContent}>
          {/* Dev avatar and info */}
          <div style={styles.devProfileHeader}>
            {devProfile.steam_profile?.avatar && (
              <img 
                src={devProfile.steam_profile.avatar} 
                alt="Developer" 
                style={styles.devAvatar}
              />
            )}
            <div style={styles.devInfo}>
              {renderRow("Developer Username", devProfile.username)}
              {renderRow("Display Name", devProfile.display_name)}
              {renderRow("Studio Name", post.studio)}
              {devProfile.bio && renderRow("Bio", devProfile.bio)}
            </div>
          </div>
          
          {/* More posts by this dev */}
          {devPosts.length > 0 && (
            <div style={styles.morePostsSection}>
              <h4 style={styles.morePostsTitle}>More posts by this developer</h4>
              <div style={styles.morePostsGrid}>
                {devPosts
                  .filter(devPost => devPost.post_id !== postId && devPost._id !== postId) // Don't show current post
                  .slice(0, 4) // Limit to 4 posts
                  .map((devPost, idx) => (
                    <div 
                      key={idx} 
                      style={styles.morePostCard}
                      onClick={() => navigate(`/posts/${devPost.post_id || devPost._id}`)}
                    >
                      <h5 style={styles.morePostTitle}>{devPost.title}</h5>
                      <p style={styles.morePostDescription}>
                        {devPost.description?.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout pageTitle="Loading Post">
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: "1rem", color: "#B388EB" }}>Loading post...</p>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout pageTitle="Error" showBackButton={true} onBack={() => navigate(-1)}>
        <div style={styles.errorContainer}>
          <p>{error || "Post not found."}</p>
        </div>
      </Layout>
    );
  }

  // Determine banner image similarly to PostCard logic
  const firstImageRef = Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : null;
  const bannerSrc =
    post.banner_image ||
    post.bannerImage?.url ||
    (post.bannerImage?.image && buildSanityUrl(post.bannerImage.image.asset?._ref)) ||
    (post.bannerImage && buildSanityUrl(post.bannerImage.asset?._ref)) ||
    (firstImageRef &&
      (typeof firstImageRef === "string"
        ? firstImageRef
        : buildSanityUrl(firstImageRef.asset?._ref))) ||
    null;

  return (
    <Layout pageTitle="Post Details" showBackButton={true} onBack={() => navigate(-1)}>
      <div style={sectionStyles.contentSection}>
        {/* Banner */}
        {bannerSrc && <img src={bannerSrc} alt="banner" style={styles.banner} />}

        {/* Title */}
        <h1 style={styles.title}>{post.title}</h1>
        
        {/* Post Information with clear labels */}
        <div style={styles.postInfoRow}>
          <span style={styles.postInfoLabel}>Posted By:</span>
          <span>{post.developer_username || post.author_display_name || "Unknown"}</span>
        </div>
        
        {post.studio && (
          <div style={styles.postInfoRow}>
            <span style={styles.postInfoLabel}>Studio Name:</span>
            <span 
              style={styles.studioLink}
              onClick={() => {
                if (post.developer_username) {
                  console.log("Navigating to dev profile with username:", post.developer_username);
                  navigate(`/dev-profile/${post.developer_username}`);
                } else if (post.developer_id) {
                  console.log("Looking up username for ID:", post.developer_id);
                  // Lookup the username first
                  api.get(`/users/username/${post.developer_id}`)
                    .then(res => {
                      const username = res.data.username;
                      console.log("Got username:", username, "for ID:", post.developer_id);
                      navigate(`/dev-profile/${username}`);
                    })
                    .catch(err => {
                      console.error("Error looking up username:", err);
                      alert("Developer profile not available for this studio");
                    });
                } else {
                  console.warn("No developer ID found for this post");
                  alert("Developer profile not available for this studio");
                }
              }}
            >
              {post.studio}
            </span>
          </div>
        )}

        {(post.created_at || post.date || post._createdAt) && (
          <div style={styles.postInfoRow}>
            <span style={styles.postInfoLabel}>Date:</span>
            <span>{new Date(post.created_at || post.date || post._createdAt).toLocaleDateString()}</span>
          </div>
        )}

        {/* Description */}
        {post.description && (
          <div style={styles.postInfoRow}>
            <span style={styles.postInfoLabel}>Description:</span>
            <span style={{flex: 1}}>{post.description}</span>
          </div>
        )}

        {/* Additional Fields with updated formatting */}
        {post.access_instructions && (
          <div style={styles.postInfoRow}>
            <span style={styles.postInfoLabel}>Access Instructions:</span>
            <span>{post.access_instructions}</span>
          </div>
        )}
        
        {post.rewards && (
          <div style={styles.postInfoRow}>
            <span style={styles.postInfoLabel}>Rewards:</span>
            <span>{post.rewards}</span>
          </div>
        )}
        
        {typeof post.has_nda !== "undefined" && (
          <div style={styles.postInfoRow}>
            <span style={styles.postInfoLabel}>NDA Required:</span>
            <span>{post.has_nda ? "Yes" : "No"}</span>
          </div>
        )}

        {/* Images Gallery */}
        {Array.isArray(post.images) && post.images.length > 0 && (
          <div style={styles.gallery}>
            {post.images.map((img, idx) => {
              const src = typeof img === "string" ? img : buildSanityUrl(img.asset?._ref);
              return src ? <img key={idx} src={src} alt={`img-${idx}`} style={styles.galleryImg} /> : null;
            })}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={styles.tagsContainer}>
            {post.tags.map((tag, i) => (
              <span key={i} style={styles.tag}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Registration Button */}
        <div style={{ marginTop: "2rem" }}>
          <button onClick={registerForEvent} style={sectionStyles.button}>
            Sign Up For Playtest
          </button>
        </div>
        
        {/* Dev Profile Section */}
        {renderDevProfileSection()}
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    fontFamily: "sans-serif",
  },
  innerWrapper: {
    width: "100%",
  },
  banner: {
    width: "100%",
    maxHeight: "400px",
    objectFit: "cover",
    borderRadius: "12px",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "2rem",
    margin: "0 0 1rem 0",
    color: "#B388EB",
  },
  metaText: {
    fontSize: "1rem",
    margin: "0.25rem 0",
    color: "#ccc",
  },
  description: {
    margin: "1.5rem 0",
    lineHeight: 1.6,
    fontSize: "1.05rem",
  },
  gallery: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
    marginTop: "1.5rem",
  },
  galleryImg: {
    width: "100%",
    borderRadius: "8px",
    objectFit: "cover",
  },
  tagsContainer: {
    marginTop: "1rem",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  tag: {
    fontSize: "0.9rem",
    color: "#B388EB",
    background: "rgba(179,136,235,0.1)",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#111",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #B388EB",
    borderTop: "5px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    color: "#fff",
    textAlign: "center",
    paddingTop: "4rem",
  },
  studioLink: {
    color: "#B388EB",
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
  },
  devProfileSection: {
    marginTop: "2rem",
    ...sectionStyles.section,
  },
  devProfileTitle: {
    fontSize: "1.4rem",
    marginBottom: "1.5rem",
    color: "#B388EB",
    borderBottom: "1px solid rgba(179, 136, 235, 0.3)",
    paddingBottom: "0.5rem",
  },
  devProfileContent: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  devProfileHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
  },
  devInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    flex: 1,
  },
  devInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "4px 0",
    borderBottom: "1px solid #444",
  },
  devInfoLabel: {
    color: "#B388EB",
    marginRight: "1rem",
    fontWeight: "500",
  },
  devAvatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #B388EB",
  },
  devName: {
    margin: "0 0 0.5rem 0",
    fontSize: "1.2rem",
    color: "#eee",
  },
  devBio: {
    margin: 0,
    fontSize: "0.95rem",
    lineHeight: "1.5",
    color: "#ccc",
  },
  morePostsSection: {
    marginTop: "1rem",
  },
  morePostsTitle: {
    fontSize: "1.1rem",
    marginBottom: "1rem",
    color: "#B388EB",
  },
  morePostsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "1rem",
  },
  morePostCard: {
    background: "rgba(30, 30, 30, 0.7)",
    padding: "1rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    '&:hover': {
      transform: "translateY(-3px)",
      boxShadow: "0 4px 12px rgba(179, 136, 235, 0.2)",
    },
  },
  morePostTitle: {
    margin: "0 0 0.5rem 0",
    fontSize: "1rem",
    color: "#eee",
  },
  morePostDescription: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#aaa",
    lineHeight: "1.4",
  },
  postInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "8px 0",
    borderBottom: "1px solid #444",
  },
  postInfoLabel: {
    color: "#B388EB",
    marginRight: "1rem",
    fontWeight: "500",
  },
};
