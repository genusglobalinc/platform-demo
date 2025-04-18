import React, { useState, useEffect } from "react";
import { getProfileData, updateProfile } from "../api";
 // ✅ use your shared api helpers

const profilePics = ["pic1", "pic2", "pic3"];

const ProfileSettings = () => {
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [selectedPic, setSelectedPic] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfileData(); // ✅ pulls from api.js
        setProfile(data);
        setDisplayName(data.display_name || "");
        setSocialLinks(data.social_links || "");
        setSelectedPic(data.profile_picture || profilePics[0]);
      } catch (err) {
        setStatus("Failed to load profile");
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      await updateProfile({
        display_name: displayName,
        social_links: socialLinks,
        profile_picture: selectedPic
      });
      setStatus("Profile updated!");
    } catch {
      setStatus("Error updating profile.");
    }
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto", color: "#eee" }}>
      <h2 style={{ color: "#B388EB" }}>Profile Settings</h2>

      <label>Display Name</label>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        style={inputStyle}
      />

      <label>Social Links (comma separated)</label>
      <input
        type="text"
        value={socialLinks}
        onChange={(e) => setSocialLinks(e.target.value)}
        style={inputStyle}
      />

      <p style={{ marginTop: "1rem" }}>Choose a Profile Picture:</p>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        {profilePics.map((pic) => (
          <div
            key={pic}
            style={{
              ...picStyle,
              border: selectedPic === pic ? "3px solid #B388EB" : "2px solid #444"
            }}
            onClick={() => setSelectedPic(pic)}
          >
            {pic.toUpperCase()}
          </div>
        ))}
      </div>

      <button onClick={handleUpdate} style={buttonStyle}>Save Changes</button>
      <p style={{ marginTop: "1rem", color: "lightgreen" }}>{status}</p>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  marginBottom: "1rem",
  borderRadius: "6px",
  border: "1px solid #444",
  background: "#1e1e1e",
  color: "#fff"
};

const buttonStyle = {
  padding: "0.75rem 1.5rem",
  background: "#B388EB",
  color: "#121212",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold"
};

const picStyle = {
  width: 60,
  height: 60,
  borderRadius: "50%",
  background: "#333",
  color: "#B388EB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontWeight: "bold"
};

export default ProfileSettings;
