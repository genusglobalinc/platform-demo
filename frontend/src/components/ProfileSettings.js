// src/components/ProfileSettings.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { uploadAvatar, sendVerificationEmail, verifyEmailCode } from "../api";

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
  
  // Email verification states
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  
  // Demographic information states
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [preferredPlatforms, setPreferredPlatforms] = useState("");
  const [gamingExperience, setGamingExperience] = useState("");
  const [favoriteGenres, setFavoriteGenres] = useState("");
  const [weeklyPlaytime, setWeeklyPlaytime] = useState("");
  const [previousPlaytestExperience, setPreviousPlaytestExperience] = useState("");
  
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
        
        // Set email verification status
        setIsEmailVerified(data.is_email_verified || false);
        
        // Set demographic information if available
        setAge(data.age || "");
        setGender(data.gender || "");
        setLocation(data.location || "");
        setPreferredPlatforms(data.preferred_platforms || "");
        setGamingExperience(data.gaming_experience || "");
        setFavoriteGenres(data.favorite_genres || "");
        setWeeklyPlaytime(data.weekly_playtime || "");
        setPreviousPlaytestExperience(data.previous_playtest_experience || "");
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
  
  // Email verification handlers
  const handleSendVerificationEmail = async () => {
    try {
      setIsEmailSending(true);
      setVerificationStatus('');
      await sendVerificationEmail();
      setShowVerification(true);
      setVerificationStatus('Verification code sent! Check your email.');
    } catch (error) {
      setVerificationStatus(`Error sending verification email: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsEmailSending(false);
    }
  };
  
  const handleVerifyEmail = async () => {
    try {
      setLoading(true);
      setVerificationStatus('');
      await verifyEmailCode(verificationCode);
      setIsEmailVerified(true);
      setShowVerification(false);
      setVerificationStatus('');
      setStatus('Email verified successfully!');
    } catch (error) {
      setVerificationStatus(`Verification failed: ${error.response?.data?.detail || error.message}`);
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
    <div style={styles.container} className="app-layout">
      {loading && renderLoadingSpinner()}

      {/* Left Sidebar - desktop only */}
      <div style={styles.leftSidebar} className="sidebar hide-on-small">
        <h3 style={{ marginBottom: "24px" }}>Lost Gates</h3>
        <div style={{ marginBottom: "32px" }}>
          <div style={styles.navItem} onClick={() => navigate('/feed')}>Home</div>
          <div style={styles.navItem} onClick={() => navigate('/profile')}>Profile</div>
          <div style={styles.navItem} onClick={() => navigate('/profile/settings')}>Settings</div>
        </div>
        <div
          style={styles.navItem}
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
        >
          Logout
        </div>
      </div>

      {/* Mobile navigation bar - only shown on small screens */}
      <div className="hide-on-medium" style={styles.mobileNav}>
        <button style={styles.mobileNavButton} onClick={() => navigate("/feed")}>Feed</button>
        <button style={styles.mobileNavButton} onClick={() => navigate("/profile")}>Profile</button>
        <button style={{...styles.mobileNavButton, background: "#333"}}>Settings</button>
          localStorage.clear();
          navigate('/login');
        }}>Logout</button>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent} className="main-content-responsive responsive-container">
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
          <button
            style={styles.button}
            className="responsive-button"
            onClick={() => {
              saveField("display_name", displayName);
              saveField("social_links", socialLinks);
            }}
          >
            Save Profile Info
          </button>
        </div>

        {/* Email Verification */}
        <div style={styles.section} className="responsive-container">
          <label style={styles.label}>Email Verification</label>
          <div style={styles.emailVerificationContainer}>
            {isEmailVerified ? (
              <div style={styles.verifiedEmail}>
                <p>
                  <span role="img" aria-label="verified">✅</span> Your email is verified
                </p>
              </div>
            ) : showVerification ? (
              <div style={styles.verificationForm}>
                <p style={styles.verificationInstructions}>
                  Enter the verification code sent to your email:
                </p>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  style={styles.input}
                  placeholder="Verification code"
                  maxLength={6}
                />
                <div style={styles.verificationActions}>
                  <button
                    style={styles.button}
                    onClick={handleVerifyEmail}
                    disabled={loading || !verificationCode}
                  >
                    Verify Email
                  </button>
                  <button
                    style={{...styles.button, background: '#333'}}
                    onClick={() => {
                      setShowVerification(false);
                      setVerificationCode('');
                      setVerificationStatus('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {verificationStatus && (
                  <p style={styles.verificationStatus}>
                    {verificationStatus}
                  </p>
                )}
              </div>
            ) : (
              <div style={styles.unverifiedEmail}>
                <p>Your email is not verified. Verify your email to increase your chances of being selected for playtests.</p>
                <button
                  style={styles.button}
                  onClick={handleSendVerificationEmail}
                  disabled={isEmailSending}
                >
                  {isEmailSending ? 'Sending...' : 'Verify Email Now'}
                </button>
                {verificationStatus && (
                  <p style={styles.verificationStatus}>
                    {verificationStatus}
                  </p>
                )}
              </div>
            )}
          </div>
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
                  border: selectedPic === pic ? "2px solid #b388eb" : "none",
                }}
                onClick={() => setSelectedPic(pic)}
              >
                {pic}
              </div>
            ))}
          </div>
          <button
            style={styles.button}
            onClick={() => saveField("profile_picture", selectedPic)}
          >
            Save
          </button>

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

        {/* Demographic Information Section */}
        <div style={{...styles.section, marginTop: '2rem'}}>
          <h3 style={{marginBottom: '1rem', color: '#B388EB'}}>Demographic Information</h3>
          <p style={{marginBottom: '1rem', fontSize: '0.9rem', opacity: '0.8'}}>
            Providing detailed demographic information can increase your chances of being selected for playtests
          </p>
          
          {/* Age */}
          <div style={styles.demoField}>
            <label style={styles.label}>Age</label>
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Age Range</option>
              <option value="Under 18">Under 18</option>
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-44">35-44</option>
              <option value="45-54">45-54</option>
              <option value="55+">55+</option>
            </select>
          </div>
          
          {/* Gender */}
          <div style={styles.demoField}>
            <label style={styles.label}>Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          
          {/* Location */}
          <div style={styles.demoField}>
            <label style={styles.label}>Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
              style={styles.input}
            />
          </div>
          
          {/* Preferred Platforms */}
          <div style={styles.demoField}>
            <label style={styles.label}>Preferred Gaming Platforms</label>
            <input
              type="text"
              value={preferredPlatforms}
              onChange={(e) => setPreferredPlatforms(e.target.value)}
              placeholder="e.g. PC, PlayStation, Xbox, Switch, Mobile"
              style={styles.input}
            />
          </div>
          
          {/* Gaming Experience */}
          <div style={styles.demoField}>
            <label style={styles.label}>Gaming Experience</label>
            <select
              value={gamingExperience}
              onChange={(e) => setGamingExperience(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Experience Level</option>
              <option value="Casual">Casual</option>
              <option value="Regular">Regular</option>
              <option value="Enthusiast">Enthusiast</option>
              <option value="Competitive">Competitive</option>
              <option value="Professional">Professional</option>
            </select>
          </div>
          
          {/* Favorite Genres */}
          <div style={styles.demoField}>
            <label style={styles.label}>Favorite Game Genres</label>
            <input
              type="text"
              value={favoriteGenres}
              onChange={(e) => setFavoriteGenres(e.target.value)}
              placeholder="e.g. RPG, FPS, Strategy, Adventure"
              style={styles.input}
            />
          </div>
          
          {/* Weekly Playtime */}
          <div style={styles.demoField}>
            <label style={styles.label}>Weekly Gameplay Hours</label>
            <select
              value={weeklyPlaytime}
              onChange={(e) => setWeeklyPlaytime(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Hours per Week</option>
              <option value="0-5">0-5 hours</option>
              <option value="6-10">6-10 hours</option>
              <option value="11-20">11-20 hours</option>
              <option value="21-30">21-30 hours</option>
              <option value="30+">30+ hours</option>
            </select>
          </div>
          
          {/* Previous Playtest Experience */}
          <div style={styles.demoField}>
            <label style={styles.label}>Previous Playtest Experience</label>
            <textarea
              value={previousPlaytestExperience}
              onChange={(e) => setPreviousPlaytestExperience(e.target.value)}
              placeholder="Please describe any previous experience with game playtesting"
              style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
            />
          </div>
          
          <button
            style={styles.button}
            onClick={() => {
              const demographicData = {
                age,
                gender,
                location,
                preferred_platforms: preferredPlatforms,
                gaming_experience: gamingExperience,
                favorite_genres: favoriteGenres,
                weekly_playtime: weeklyPlaytime,
                previous_playtest_experience: previousPlaytestExperience
              };
              saveField("demographic_info", demographicData);
            }}
          >
            Save Demographic Information
          </button>
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
  demoField: {
    marginBottom: '1rem',
  },
  emailVerificationContainer: {
    marginTop: '0.5rem',
  },
  verifiedEmail: {
    padding: '0.75rem',
    background: 'rgba(40, 167, 69, 0.1)',
    border: '1px solid rgba(40, 167, 69, 0.2)',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  unverifiedEmail: {
    padding: '0.75rem',
    background: 'rgba(255, 193, 7, 0.1)',
    border: '1px solid rgba(255, 193, 7, 0.2)',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  verificationForm: {
    padding: '1rem',
    background: '#222',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  verificationInstructions: {
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  verificationActions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  verificationStatus: {
    marginTop: '1rem',
    padding: '0.5rem',
    borderRadius: '4px',
    background: 'rgba(0, 0, 0, 0.2)',
    fontSize: '0.9rem',
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
