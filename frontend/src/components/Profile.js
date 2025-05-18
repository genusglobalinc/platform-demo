import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfileData, getUserPosts } from "../api"; // Your existing API helper for fetching profile
import jwtDecode from "jwt-decode";
import axios from "axios";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [msg, setMsg] = useState("");
  const [postStatuses, setPostStatuses] = useState({}); // per-post notifications
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfileData(); // Get profile data
        setProfile(data);
        // Fetch posts for the user once the profile is fetched
        const userPosts = await fetchUserPosts(data.user_id);
        setPosts(userPosts);
      } catch (err) {
        console.error("Failed to load profile", err);
        // Optional: handle errors like redirecting to login
      }
    };

    fetchProfile();
  }, []);

  const fetchUserPosts = async (userId) => {
    try {
      const posts = await getUserPosts(userId);
      return posts;
    } catch (err) {
      console.error("Error fetching user posts", err);
      return [];
    }
  };

  // Determine admin quickly from token so we can show nav immediately
  let userType = "";
  let token = "";
  try {
    token = localStorage.getItem("token") || "";
    if (token) userType = jwtDecode(token).user_type;
  } catch {}
  const isDev = userType === "Dev";

  const setPostStatus = (id, message) =>
    setPostStatuses((prev) => ({ ...prev, [id]: message }));

  // --- Helpers ---
  const emailRegistrants = async (postId) => {
    try {
      setPostStatus(postId, "Sending email...");
      await axios.post(
        `/posts/${postId}/email-registrants`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPostStatus(postId, "Email sent!");
    } catch (err) {
      setPostStatus(postId, `Failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const parseVerified = (val) => {
    if (val === true) return true;
    if (val === false) return false;
    if (val === 1 || val === "1") return true;
    if (typeof val === "string") return val.toLowerCase() === "true";
    return false;
  };

  return (
    <div className="responsive-container" style={styles.container}>
      {/* Left Sidebar */}
      <div className="left-sidebar" style={styles.leftSidebar}>
        <h3 style={{ marginBottom: "24px" }}>Lost Gates</h3>
        <div style={{ marginBottom: "32px" }}>
          <div style={styles.navItem} onClick={() => navigate("/feed")}>Home</div>
          <div style={styles.navItem} onClick={() => navigate("/profile")}>Profile</div>
          <div style={styles.navItem} onClick={() => navigate("/profile/settings")}>Settings</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>My Profile</h2>
          {(isDev || (profile && profile.user_type === "Admin")) && (
            <button
              style={{ ...styles.logoutButton, background: "#B388EB" }}
              onClick={() => navigate("/admin")}
            >
              Go to Admin
            </button>
          )}
          <div style={styles.headerRight}>
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

        {profile ? (
          <div style={styles.details}>
            <p><strong>Username:</strong> {profile.username}</p>
            <p><strong>Display Name:</strong> {profile.display_name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Social Links:</strong> {profile.social_links}</p>
            {profile.steam_profile && (
              <div style={{marginTop: '1rem'}}>
                <h3 style={{color:'#66c0f4'}}>Steam Profile</h3>
                <div style={{display:'flex', alignItems:'center',gap:'1rem'}}>
                  {profile.steam_profile.avatar && (
                    <img src={profile.steam_profile.avatar} alt="Steam avatar" style={{width:64,height:64,borderRadius:8}} />
                  )}
                  <div>
                    <p><strong>Persona:</strong> {profile.steam_profile.persona_name}</p>
                    <a href={profile.steam_profile.profile_url} target="_blank" rel="noopener noreferrer" style={{color:'#66c0f4'}}>View on Steam</a>
                  </div>
                </div>
              </div>
            )}
            <p><strong>Followers:</strong> {profile.followers}</p>
            <p><strong>Following:</strong> {profile.following}</p>
            <p><strong>Liked Posts:</strong> {profile.liked_posts?.length || 0}</p>
            <p><strong>Profile Pic:</strong> {profile.profile_pic}</p>
            
            {profile.demographic_info && Object.keys(profile.demographic_info).length > 0 && (
              <div style={styles.demographicSection}>
                <h3 style={{color: '#B388EB', marginBottom: '1rem'}}>Demographic Information</h3>
                {profile.demographic_info.age && (
                  <p><strong>Age Range:</strong> {profile.demographic_info.age}</p>
                )}
                {profile.demographic_info.gender && (
                  <p><strong>Gender:</strong> {profile.demographic_info.gender}</p>
                )}
                {profile.demographic_info.location && (
                  <p><strong>Location:</strong> {profile.demographic_info.location}</p>
                )}
                {profile.demographic_info.preferred_platforms && (
                  <p><strong>Preferred Platforms:</strong> {profile.demographic_info.preferred_platforms}</p>
                )}
                {profile.demographic_info.gaming_experience && (
                  <p><strong>Gaming Experience:</strong> {profile.demographic_info.gaming_experience}</p>
                )}
                {profile.demographic_info.favorite_genres && (
                  <p><strong>Favorite Genres:</strong> {profile.demographic_info.favorite_genres}</p>
                )}
                {profile.demographic_info.weekly_playtime && (
                  <p><strong>Weekly Playtime:</strong> {profile.demographic_info.weekly_playtime}</p>
                )}
                {profile.demographic_info.previous_playtest_experience && (
                  <div>
                    <p><strong>Previous Playtest Experience:</strong></p>
                    <p style={{marginLeft: '1rem'}}>{profile.demographic_info.previous_playtest_experience}</p>
                  </div>
                )}
              </div>
            )}
            {profile && (
              <p style={{ color: parseVerified(profile.is_verified) ? "#0f0" : "#f66", marginBottom: 8 }}>
                Email status: {parseVerified(profile.is_verified) ? "Verified" : "Not verified"}
              </p>
            )}
          </div>
        ) : (
          <p style={styles.details}>Loading profile...</p>
        )}

        <div style={styles.postsContainer}>
          {isDev && <h3 style={styles.postsTitle}>My Posts</h3>}
          {isDev && (
            posts.length > 0 ? (
              <ul style={styles.postsList}>
                {posts.map((post, index) => (
                  <li key={index} style={styles.postItem}>
                    <h4>{post.title}</h4>
                    <p>{post.description}</p>
                    <p style={{ fontSize: "0.9rem", color: "#B388EB" }}>
                      Registrants: {post.registrants ? post.registrants.length : 0}
                    </p>
                    {post.registrants && post.registrants.length > 0 && (
                      <button
                        style={styles.emailRegistrantsBtn}
                        onClick={() => emailRegistrants(post.post_id || post._id)}
                      >
                        Collect Registrations
                      </button>
                    )}
                    {postStatuses[post.post_id || post._id] && (
                      <p style={{ marginTop: 4, fontSize: "0.85rem", color: "#B388EB" }}>
                        {postStatuses[post.post_id || post._id]}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No posts available.</p>
            )
          )}
          {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar" style={styles.rightSidebar}></div>
    </div>
  );
}

const styles = {
  container: {
    background: "#111",
    color: "#fff",
    minHeight: "100vh",
    fontFamily: "sans-serif",
    display: "flex",
  },
  demographicSection: {
    marginTop: '2rem',
    background: '#2a2a2a',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.3)',
  },
  leftSidebar: {
    width: "250px",
    padding: "24px 16px",
    borderRight: "1px solid #333",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
  },
  mainContent: {
    flex: 1,
    padding: "24px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  rightSidebar: {
    width: "250px",
    padding: "24px",
    borderLeft: "1px solid #333",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 28, margin: 0 },
  headerRight: { display: "flex", gap: 16 },
  logoutButton: {
    background: "#E57373",
    padding: "8px 16px",
    color: "#fff",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  navItem: {
    padding: "12px 8px",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "8px",
    transition: "background 0.2s",
  },
  details: {
    fontSize: "1.1rem",
    lineHeight: "1.7",
  },
  postsContainer: {
    marginTop: "2rem",
    background: "#2a2a2a",
    padding: "1rem",
    borderRadius: "8px",
  },
  postsTitle: {
    fontSize: "1.5rem",
    marginBottom: "1rem",
    color: "#B388EB",
  },
  postsList: {
    listStyleType: "none",
    padding: 0,
  },
  postItem: {
    background: "#333",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
  emailRegistrantsBtn: {
    background: "#B388EB",
    border: "none",
    padding: "6px 12px",
    color: "#fff",
    borderRadius: 6,
    cursor: "pointer",
    marginTop: 4,
  },
};
