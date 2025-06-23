import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfileData, getUserPosts, api } from "../api"; // Your existing API helper for fetching profile
import jwtDecode from "jwt-decode";
import axios from "axios";
import Cookies from 'js-cookie';
import SteamAuthButton from './SteamAuthButton';
import Layout, { sectionStyles } from "./Layout";

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
        
        // Log profile data for debugging
        console.log("Profile data:", data);
        console.log("Profile demographic_info:", data.demographic_info);
        console.log("Favorite genres:", data.demographic_info?.favorite_genres);
        
        // Normalize demographic info if needed
        if (data.demographic_info) {
          // Make sure favorite_genres is always an array if it exists
          if (data.demographic_info.favorite_genres && !Array.isArray(data.demographic_info.favorite_genres)) {
            data.demographic_info.favorite_genres = data.demographic_info.favorite_genres
              .split(',').map(g => g.trim()).filter(Boolean);
          }
        }
        
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

  // Helper to render a label/value row with consistent styling
  const renderRow = (label, value) => {
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) return null;
    
    // Handle string values that should be arrays
    let processedValue = value;
    if (!Array.isArray(value) && typeof value === 'string' && (label === "Favorite Genres" || label === "Preferred Platforms")) {
      processedValue = value.split(',').map(v => v.trim()).filter(Boolean);
    }
    
    const renderedValue = Array.isArray(processedValue) ? (
      <div style={styles.tagContainer}>
        {processedValue.map((v) => (
          <span key={v} style={styles.tag}>{v}</span>
        ))}
      </div>
    ) : (
      <span>{processedValue}</span>
    );

    return (
      <div style={styles.infoRow}>
        <span style={styles.infoLabel}>{label}</span>
        {renderedValue}
      </div>
    );
  };

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
    <Layout pageTitle="My Profile">
      {isLoading && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: "1rem", color: "#B388EB" }}>Loading profile...</p>
        </div>
      )}
      {!isLoading && profile && (
        <div style={styles.mainContent}>
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

          <div style={styles.details}>
            {profile.steam_profile?.avatar && (
              <img 
                src={profile.steam_profile.avatar} 
                alt="Profile" 
                style={styles.profileAvatar}
              />
            )}
            <h3>Your Profile</h3>
            {renderRow("Username", profile.username)}
            {renderRow("Display Name", profile.display_name)}
            {renderRow("Email", profile.email)}
            {renderRow("Email Verified", profile.is_email_verified ? "Yes" : "No")}
            {renderRow("Social Links", profile.social_links)}
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
            {renderRow("Followers", profile.followers)}
            {renderRow("Following", profile.following)}
            {renderRow("Liked Posts", profile.liked_posts?.length || 0)}
            {renderRow("Profile Pic", profile.profile_pic)}
            
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
                {profile.demographic_info.gaming_experience && renderRow("Gaming Experience", profile.demographic_info.gaming_experience)}
                {profile.demographic_info?.favorite_genres && (
                  <>
                    {/* Show how data is stored for debugging */}
                    <div style={{fontSize: '0.7rem', color: '#666', marginBottom: '5px'}}>
                      Raw data: {typeof profile.demographic_info.favorite_genres === 'string' ? 
                        profile.demographic_info.favorite_genres : 
                        JSON.stringify(profile.demographic_info.favorite_genres)}
                    </div>
                    {renderRow("Favorite Genres", profile.demographic_info.favorite_genres)}
                  </>
                )}
                {profile.demographic_info.weekly_playtime && renderRow("Weekly Playtime", profile.demographic_info.weekly_playtime)}
                {profile.demographic_info.previous_playtest_experience && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Previous Playtest Experience</span>
                    <span>{profile.demographic_info.previous_playtest_experience}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        
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
      )}
    </Layout>
  );
}

const styles = {
  profileAvatar: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #B388EB",
    marginBottom: "1rem",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #B388EB",
    borderTop: "5px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  mainContent: {
    width: "100%",
  },
  details: {
    fontSize: "1.1rem",
    lineHeight: "1.7",
  },
  postsContainer: {
    marginTop: "2rem",
    ...sectionStyles.section,
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
    ...sectionStyles.section,
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
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '4px 0',
    borderBottom: '1px solid #444',
  },
  infoLabel: {
    color: '#B388EB',
    marginRight: '1rem',
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  tag: {
    background: '#555',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem',
  }
};
