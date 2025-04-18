import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch {
        navigate("/login");
      }
    };
    fetchProfile();
  }, [navigate, token]);

  if (!profile) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate("/feed")}>← Back to Feed</button>
      <h2 style={styles.title}>{profile.display_name}</h2>
      <div style={styles.profilePic}>{profile.profile_picture?.toUpperCase() || "PIC"}</div>
      <p style={styles.details}><strong>Username:</strong> {profile.username}</p>
      <p style={styles.details}><strong>Email:</strong> {profile.email}</p>
      <p style={styles.details}><strong>Socials:</strong> {profile.social_links}</p>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    background: '#1e1e1e',
    color: '#eee',
    minHeight: '80vh',
    maxWidth: '600px',
    margin: 'auto',
    textAlign: 'center'
  },
  title: {
    fontSize: '2rem',
    color: '#B388EB',
    marginBottom: '1rem'
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: '#333',
    color: '#B388EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.25rem',
    margin: '0 auto 1rem'
  },
  details: {
    marginBottom: '0.5rem'
  },
  backBtn: {
    marginBottom: '1rem',
    padding: '0.5rem 1rem',
    background: '#B388EB',
    border: 'none',
    borderRadius: '6px',
    color: '#121212',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default Profile;
