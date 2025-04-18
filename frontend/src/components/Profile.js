import React from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>My Profile</h2>
        <div style={styles.headerRight}>
          <button style={styles.backButton} onClick={() => navigate("/")}>
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
      <p style={styles.details}>
        Profile details, followers, and liked posts will be displayed here.
      </p>
      {/* ...you can render more profile info here */}
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
  },
};
