import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfileData, getUserPosts, api } from "../api"; // Your existing API helper for fetching profile
import jwtDecode from "jwt-decode";
import axios from "axios";
import Cookies from 'js-cookie';
import SteamAuthButton from './SteamAuthButton';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postMsgs, setPostMsgs] = useState({}); // per-post feedback
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Sync localStorage token to cookie if needed
    const syncTokens = () => {
      const localToken = localStorage.getItem('token');
      const cookieToken = Cookies.get('access_token');
      
      if (localToken && !cookieToken) {
        // If we have a localStorage token but no cookie, set the cookie
        Cookies.set('access_token', localToken, { secure: true, sameSite: 'strict' });
        console.log('Synced token from localStorage to cookie');
      } else if (!localToken && cookieToken) {
        // If we have a cookie token but no localStorage, set localStorage
        localStorage.setItem('token', cookieToken);
        console.log('Synced token from cookie to localStorage');
      }
    };

    syncTokens();

    // Fetch profile data on component mount
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await getProfileData(); // Get profile data
        setProfile(data);
        // Fetch posts for the user once the profile is fetched
        const userPosts = await fetchUserPosts(data.user_id);
        setPosts(userPosts);
      } catch (err) {
        console.error("Failed to load profile", err);
        // If unauthorized, redirect to login
        if (err.response && err.response.status === 401) {
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [navigate]);

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
  try {
    const token = Cookies.get('access_token') || localStorage.getItem('token') || "";
    if (token) userType = jwtDecode(token).user_type;
  } catch (err) {
    console.error('Error decoding token:', err);
  }
  const isDev = userType === "Dev";

  // --- Helpers ---
  const collectRegistrations = async (postId) => {
    // Must have verified email first
    if (!profile?.is_email_verified) {
      setPostMsgs((prev) => ({ ...prev, [postId]: "Verify email first to export." }));
      return;
    }
    try {
      setPostMsgs((prev) => ({ ...prev, [postId]: "Sending..." }));
      await axios.post(`/posts/${postId}/email-registrants`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPostMsgs((prev) => ({ ...prev, [postId]: "Email sent ✔" }));
    } catch (err) {
      setPostMsgs((prev) => ({
        ...prev,
        [postId]: err.response?.data?.detail || err.message,
      }));
    }
  };

  const refreshSteamProfile = async () => {
    try {
      const response = await api.post('/users/refresh-steam', {});
      setProfile(prev => ({
        ...prev,
        steam_profile: response.data
      }));
    } catch (err) {
      console.error('Error refreshing Steam profile', err);
    }
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
                // Use the logout helper from API
                import('../api').then(api => {
                  api.logout();
                });
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
            <p><strong>Email Verified:</strong> {profile.is_email_verified ? "Yes" : "No"}</p>
            <p><strong>Social Links:</strong> {profile.social_links}</p>
            {profile.steam_profile ? (
              <div style={styles.steamSection}>
                <h3>Steam Profile</h3>
                <div style={styles.steamHeader}>
                  <img 
                    src={profile.steam_profile.avatar} 
                    alt="Steam Avatar" 
                    style={styles.steamAvatar}
                  />
                  <div>
                    <h4>{profile.steam_profile.persona_name}</h4>
                    {profile.steam_profile.real_name && (
                      <p>{profile.steam_profile.real_name}</p>
                    )}
                  </div>
                </div>
                <div style={styles.steamDetails}>
                  <p><strong>Steam ID:</strong> {profile.steam_profile.steam_id}</p>
                  {profile.steam_profile.time_created && (
                    <p><strong>Member since:</strong> {new Date(profile.steam_profile.time_created * 1000).toLocaleDateString()}</p>
                  )}
                  {profile.steam_profile.last_logoff && (
                    <p><strong>Last online:</strong> {new Date(profile.steam_profile.last_logoff * 1000).toLocaleString()}</p>
                  )}
                  {profile.steam_profile.visibility && (
                    <p>
                      <strong>Profile status:</strong> {' '}
                      {profile.steam_profile.visibility === 1 ? 'Private' :
                        profile.steam_profile.visibility === 2 ? 'Friends Only' :
                        profile.steam_profile.visibility === 3 ? 'Public' : 'Unknown'}
                    </p>
                  )}
                  {profile.steam_profile.game_extra_info && (
                    <p><strong>Playing:</strong> {profile.steam_profile.game_extra_info}</p>
                  )}
                  <button 
                    onClick={refreshSteamProfile}
                    style={styles.refreshButton}
                  >
                    Refresh Steam Data
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.steamSection}>
                <h3>Connect Steam Account</h3>
                <SteamAuthButton />
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
                        onClick={() => collectRegistrations(post.post_id || post._id)}
                      >
                        Collect Registrations
                      </button>
                    )}
                    {postMsgs[post.post_id || post._id] && (
                      <p style={{ fontSize: "0.8rem", marginTop: 4 }}>
                        {postMsgs[post.post_id || post._id]}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No posts available.</p>
            )
          )}
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
  steamSection: {
    marginTop: '2rem',
    background: '#2a2a2a',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.3)',
  },
  steamHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  steamAvatar: {
    width: '64px',
    height: '64px',
    marginRight: '1rem',
    borderRadius: '50%',
  },
  steamDetails: {
    lineHeight: '1.7',
  },
  refreshButton: {
    background: '#171a21',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '1rem',
  }
};
