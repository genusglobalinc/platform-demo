import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfileData, updateProfile } from "../api";

const profilePics = ["pic1", "pic2", "pic3"];

export default function ProfileSettings() {
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [selectedPic, setSelectedPic] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfileData();
        setProfile(data);
        setDisplayName(data.display_name || "");
        setSocialLinks(data.social_links || "");
        setSelectedPic(data.profile_picture || profilePics[0]);
      } catch {
        setStatus("Failed to load profile.");
      }
    })();
  }, []);

  const saveField = async (fieldName, value) => {
    try {
      await updateProfile({ [fieldName]: value });
      setStatus(`${fieldName.replace("_", " ")} updated!`);
      const data = await getProfileData();
      setProfile(data);
    } catch {
      setStatus(`Error updating ${fieldName.replace("_", " ")}.`);
    }
  };

  if (!profile) return <div style={styles.details}>Loading profile...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Profile Settings</h2>
        <div style={styles.headerRight}>
          <button style={styles.backButton} onClick={() => navigate("/feed")}>
            ← Feed
          </button>
          <button style={styles.settingsButton} onClick={() => navigate("/profile")}>
            Profile
          </button>
        </div>
      </div>

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
          onClick={() => saveField("display_name", displayName)}
          style={styles.button}
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
          onClick={() => saveField("social_links", socialLinks)}
          style={styles.button}
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
              style={{
                ...styles.picCircle,
                border: selectedPic === pic ? "3px solid #B388EB" : "2px solid #444",
              }}
              onClick={() => setSelectedPic(pic)}
            >
              {pic.toUpperCase()}
            </div>
          ))}
        </div>
        <button
          onClick={() => saveField("profile_picture", selectedPic)}
          style={styles.button}
        >
          Save
        </button>
      </div>

      {status && <p style={styles.status}>{status}</p>}
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
  section: {
    marginBottom: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  label: {
    flex: "0 0 140px",
    fontWeight: "bold",
  },
  input: {
    flex: 1,
    padding: "0.5rem",
    borderRadius: "6px",
    border: "1px solid #444",
    background: "#1e1e1e",
    color: "#fff",
  },
  button: {
    padding: "0.5rem 1rem",
    background: "#B388EB",
    color: "#121212",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  picsRow: {
    display: "flex",
    gap: "1rem",
  },
  picCircle: {
    width: 60,
    height: 60,
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
  details: {
    fontSize: "1.1rem",
    lineHeight: "1.7",
  },
};
