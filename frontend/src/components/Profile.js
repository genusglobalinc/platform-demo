import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfileData, getUserPosts } from "../api";
import PostCard from "./PostCard";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // 1) Load profile
        const data = await getProfileData();
        setProfile(data);

        // 2) Then load *that* user’s posts
        const posts = await getUserPosts(data.user_id);
        setMyPosts(posts);
      } catch (err) {
        console.error("Failed to load profile or posts", err);
      }
    })();
  }, []);

  if (!profile) {
    return <p style={styles.loading}>Loading profile…</p>;
  }

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

      <h3 style={styles.sectionTitle}>My Posts</h3>
      {myPosts.length > 0 ? (
        <div style={styles.postsGrid}>
          {myPosts.map((post) => (
            <PostCard key={post.post_id} post={post} />
          ))}
        </div>
      ) : (
        <p style={styles.noPosts}>You haven’t created any posts yet.</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    background: "#1e1e1e",
    color: "#eee",
    minHeight: "100vh",
    fontFamily: "sans-serif",
  },
  loading: {
    padding: "2rem",
    color: "#eee",
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
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    color: "#B388EB",
    marginBottom: "1rem",
  },
  postsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  noPosts: {
    fontStyle: "italic",
    color: "#888",
  },
};
