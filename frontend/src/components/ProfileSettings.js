// src/components/ProfileSettings.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TwoFactorSetup from './TwoFactorSetup';

const profilePics = ["pic1", "pic2", "pic3"];

export default function ProfileSettings() {
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [selectedPic, setSelectedPic] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Fetch current profile
    axios
      .get("/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        setProfile(data);
        setDisplayName(data.display_name || "");
        setSocialLinks(data.social_links || "");
        setSelectedPic(data.profile_picture || profilePics[0]);
      })
      .catch(() => {
        setStatus("Failed to load profile.");
      });
  }, [token]);

  // Generic field updater
  const saveField = async (field, value) => {
    try {
      await axios.put(
        "/users/profile",
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus(`${field.replace("_", " ")} updated!`);
      // Re-fetch to show updated data
      const res = await axios.get("/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    } catch {
      setStatus(`Error updating ${field.replace("_", " ")}.`);
    }
  };

  if (!profile) {
    return <div style={styles.container}>Loading profile...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Top navigation */}
      <div style={styles.topNav}>
        <button style={styles.navButton} onClick={() => navigate("/feed")}>
          ← Feed
        </button>
        <button style={styles.navButton} onClick={() => navigate("/profile")}>
          ← Profile
        </button>
      </div>

      <h2 style={styles.header}>Profile Settings</h2>

      {/* Display Name */}
      <div style={styles.section}>
        <label style={styles.label}>Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={styles.input}
        />
        <button
          style={styles.button}
          onClick={() => saveField("display_name", displayName)}
        >
          Save
        </button>
      </div>

      {/* Social Links */}
      <div style={styles.section}>
        <label style={styles.label}>Social Links</label>
        <input
          type="text"
          value={socialLinks}
          onChange={(e) => setSocialLinks(e.target.value)}
          style={styles.input}
        />
        <button
          style={styles.button}
          onClick={() => saveField("social_links", socialLinks)}
        >
          Save
        </button>
      </div>

      {/* Profile Picture */}
      <div style={styles.section}>
        <label style={styles.label}>Profile Picture</label>
        <div style={styles.picsRow}>
          {profilePics.map((pic) => (
            <div
              key={pic}
              onClick={() => setSelectedPic(pic)}
              style={{
                ...styles.picCircle,
                border:
                  selectedPic === pic ? "3px solid #B388EB" : "2px solid #444",
              }}
            >
              {pic.toUpperCase()}
            </div>
          ))}
        </div>
        <button
          style={styles.button}
          onClick={() => saveField("profile_picture", selectedPic)}
        >
          Save
        </button>
      </div>

      {status && <p style={styles.status}>{status}</p>}

      {/* 2FA Setup */}
      <div style={styles.twoFactorSection}>
        <h3 style={styles.subHeader}>Two-Factor Authentication</h3>
        <TwoFactorSetup />
      </div>
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
  topNav: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  navButton: {
    background: "#5C6BC0",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    cursor: "pointer",
  },
  header: {
    fontSize: "1.75rem",
    color: "#B388EB",
    marginBottom: "1.5rem",
  },
  section: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1.25rem",
  },
  label: {
    flex: "0 0 130px",
    fontWeight: "bold",
  },
  input: {
    flex: 1,
    padding: "0.5rem",
    borderRadius: "6px",
    border: "1px solid #444",
    background: "#2a2a2a",
    color: "#fff",
  },
  button: {
    background: "#B388EB",
    color: "#121212",
    border: "none",
    borderRadius: "6px",
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontWeight: "bold",
  },
  picsRow: {
    display: "flex",
    gap: "1rem",
  },
  picCircle: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: "#333",
    color: "#B388EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontWeight: "bold",
  },
  status: {
    marginTop: "1rem",
    color: "lightgreen",
  },
  twoFactorSection: {
    marginTop: "2rem",
    padding: "1.5rem",
    background: "#121212",
    borderRadius: "12px",
  },
  subHeader: {
    fontSize: "1.25rem",
    color: "#B388EB",
    marginBottom: "1rem",
  },
};
