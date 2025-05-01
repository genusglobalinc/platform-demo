// src/components/ProfileSettings.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { uploadAvatar } from "../api";

// Pre-defined profile pictures configurable by platform admins
const profilePics = ["default1", "default2", "default3"];

export default function ProfileSettings() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [selectedPic, setSelectedPic] = useState(profilePics[0]);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
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

      {/* Left Sidebar */}
      <div style={styles.leftSidebar}>
        <h3 style={{ marginBottom: "24px" }}>Lost Gates</h3>
        <div style={{ marginBottom: "32px" }}>
          <div style={styles.navItem} onClick={() => navigate('/feed')}>Home</div>
          <div style={styles.navItem} onClick={() => navigate('/profile')}>Profile</div>
          <div style={styles.navItem} onClick={() => navigate('/profile/settings')}>Settings</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h2 style={styles.title}>Profile Settings</h2>
          <div style={styles.headerRight}>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/login');
              }}
              style={styles.logoutButton}
            >
              Logout
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
            placeholder="e.g. https://twitter.com/yourhandle"
            style={styles.input}
          />
          <button
            style={styles.button}
            onClick={() => saveField("social_links", socialLinks)}
          >
            Save
          </button>
        </div>

        {/* Profile Picture (choose from curated list or upload custom)*/}
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
            Save Picture
          </button>
          {/* Upload custom avatar */}
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              try {
                setUploading(true);
                const res = await uploadAvatar(file);
                setSelectedPic(res.profile_picture);
                setStatus("Profile picture updated!");
              } catch {
                setStatus("Error uploading avatar.");
              } finally {
                setUploading(false);
              }
            }}
            style={{ marginTop: "1rem" }}
          />
          {uploading && <p style={styles.loadingText}>Uploading...</p>}
        </div>

        {status && <p style={styles.status}>{status}</p>}
      </div>

      {/* Right Sidebar */}
      <div style={styles.rightSidebar}></div>
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
    background: '#111',
    color: '#fff',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
    display: 'flex',
  },
  leftSidebar: {
    width: '250px',
    padding: '24px 16px',
    borderRight: '1px solid #333',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  mainContent: {
    flex: 1,
    padding: '24px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  rightSidebar: {
    width: '250px',
    padding: '24px',
    borderLeft: '1px solid #333',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 28, margin: 0 },
  headerRight: { display: 'flex', gap: 16 },
  logoutButton: {
    background: '#E57373',
    padding: '8px 16px',
    color: '#fff',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
  },
  navItem: {
    padding: '12px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '8px',
    transition: 'background 0.2s',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem',
    padding: '1.5rem',
    background: '#1f1f1f',
    borderRadius: '12px',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.3)',
  },
  label: {
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #555',
    background: '#2a2a2a',
    color: '#fff',
    fontSize: '1rem',
  },
  button: {
    alignSelf: 'flex-start',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: '#B388EB',
    color: '#121212',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  picsRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  picCircle: {
    width: 70,
    height: 70,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: '#2a2a2a',
    color: '#B388EB',
    fontWeight: 'bold',
    transition: 'transform 0.15s ease',
  },
  status: {
    marginTop: '1rem',
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    background: 'rgba(40, 167, 69, 0.15)',
    border: '1px solid rgba(40, 167, 69, 0.3)',
    color: '#28a745',
    textAlign: 'center',
  },
};
