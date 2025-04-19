import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfileData } from "../api"; // Your existing API helper for fetching profile

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
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
      const token = localStorage.getItem("authToken"); // Ensure token is retrieved
      const res = await fetch(`${API_BASE_URL}/users/${userId}/posts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Include token in the request headers
        },
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Error fetching user posts", err);
      return []; // Return an empty array if there's an error
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>My Profile</h2>
        <div style={styles.headerRight}>
          <button style={styles.backButton} onClick={() => navigate("/feed")}>
            ← Feed
          </button>
          <button
            style={styles.settingsButton}
            onClick={() => navigate("/profile/settings")}
          >
            Settings
          </button>
        </div>
      </div>

      {profile ? (
        <div style={styles.details}>
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Display Name:</strong> {profile.display_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Social Links:</strong> {profile.social_links}</p>
          <p><strong>Followers:</strong> {profile.followers}</p>
          <p><strong>Following:</strong> {profile.following}</p>
          <p><strong>Liked Posts:</strong> {profile.liked_posts?.length || 0}</p>
          <p><strong>Profile Pic:</strong> {profile.profile_pic}</p>
        </div>
      ) : (
        <p style={styles.details}>Loading profile...</p>
      )}

      <div style={styles.postsContainer}>
        <h3 style={styles.postsTitle}>My Posts</h3>
        {posts.length > 0 ? (
          <ul style={styles.postsList}>
            {posts.map((post, index) => (
              <li key={index} style={styles.postItem}>
                <h4>{post.title}</h4>
                <p>{post.description}</p>
                {/* Add any other post details here */}
              </li>
            ))}
          </ul>
        ) : (
          <p>No posts available.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    background: "#1e1e1e",
    color: "#eee",
    minHeight: "80vh",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "2rem",
    color: "#B388EB",
    margin: 0,
  },
  headerRight: {
    display: "flex",
    gap: "12px",
  },
  backButton: {
    background: "#5C6BC0",
    padding: "8px 16px",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  settingsButton: {
    background: "#4DB6AC",
    padding: "8px 16px",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
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
};
