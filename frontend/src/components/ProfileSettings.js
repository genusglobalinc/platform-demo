import React, { useState, useEffect } from "react";
import axios from "axios";

const ProfileSettings = () => {
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
        setDisplayName(res.data.display_name || "");
      } catch (err) {
        setStatus("Failed to load profile");
      }
    };
    fetchProfile();
  }, [token]);

  const updateProfile = async () => {
    try {
      await axios.put(
        "/users/profile",
        { display_name: displayName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus("Profile updated!");
    } catch (err) {
      setStatus("Error updating profile.");
    }
  };

  const changePassword = async () => {
    try {
      await axios.post(
        "/auth/change-password",
        { old_password: oldPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus("Password changed!");
    } catch (err) {
      setStatus("Error changing password.");
    }
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div style={{ padding: "1rem", maxWidth: "600px", margin: "auto" }}>
      <h2>Profile Settings</h2>
      <p><strong>Username:</strong> {profile.username}</p>
      <p><strong>Email:</strong> {profile.email}</p>

      <hr />

      <h3>Update Display Name</h3>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Display Name"
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
      />
      <button onClick={updateProfile}>Save Display Name</button>

      <hr />

      <h3>Change Password</h3>
      <input
        type="password"
        placeholder="Old Password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
      />
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
      />
      <button onClick={changePassword}>Change Password</button>

      <p style={{ marginTop: "1rem", color: "green" }}>{status}</p>
    </div>
  );
};

export default ProfileSettings;
