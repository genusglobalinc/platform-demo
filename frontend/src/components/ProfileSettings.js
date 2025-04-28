// src/components/ProfileSettings.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const profilePics = ["pic1", "pic2", "pic3"];

export default function ProfileSettings() {
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      setStatus('');
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
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div style={styles.container}>Loading profile...</div>;
  }

  const renderLoadingSpinner = () => (
    <div style={styles.loadingSpinner}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      {loading && renderLoadingSpinner()}
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


    </div>
  );
}

const styles = {
  loadingSpinner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #B388EB',
    borderTop: '5px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#B388EB',
    marginTop: '1rem',
    fontSize: '1.2rem',
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  '@keyframes slideIn': {
    '0%': { transform: 'translateY(20px)', opacity: 0 },
    '100%': { transform: 'translateY(0)', opacity: 1 },
  },
  container: {
    maxWidth: '100%',
    margin: '0',
    padding: '1rem',
    background: '#1e1e1e',
    color: '#eee',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
    '@media (min-width: 768px)': {
      padding: '2rem',
      margin: '0 auto',
      maxWidth: '800px',
    },
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
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    padding: '1rem',
    background: '#1a1a1a',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    animation: 'slideIn 0.3s ease-out',
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      alignItems: 'center',
      gap: '1rem',
    },
  },
  label: {
    flex: "0 0 130px",
    fontWeight: "bold",
  },
  input: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '8px',
    border: '2px solid #444',
    background: '#2a2a2a',
    color: '#fff',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#B388EB',
      boxShadow: '0 0 0 2px rgba(179, 136, 235, 0.3)',
    },
  },
  button: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: '#B388EB',
    color: '#121212',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(179, 136, 235, 0.3)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
  },
  picsRow: {
    display: "flex",
    gap: "1rem",
  },
  picCircle: {
    width: 60,
    height: 60,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: '#2a2a2a',
    color: '#B388EB',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 4px 12px rgba(179, 136, 235, 0.3)',
    },
  },
  status: {
    marginTop: '1rem',
    padding: '0.75rem',
    borderRadius: '8px',
    background: 'rgba(40, 167, 69, 0.1)',
    border: '1px solid rgba(40, 167, 69, 0.2)',
    color: '#28a745',
    animation: 'slideIn 0.3s ease-out',
  },
};
