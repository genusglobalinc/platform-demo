import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfileData } from "../api"; // You'll create this helper if not done

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfileData(); // Uses auth token internally
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile", err);
        // Optional: redirect if not authenticated
      }
    };

    fetchProfile();
  }, []);

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
};
