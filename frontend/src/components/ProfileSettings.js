// src/components/ProfileSettings.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { uploadAvatar, sendVerificationEmail, verifyEmailCode } from "../api";
import Layout, { sectionStyles } from "./Layout";

// Pre-defined profile pictures configurable by platform admins
const profilePics = ["default1", "default2", "default3"];

// Dropdown option lists
const usStates = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const platformOptions = ["PC","PlayStation","Xbox","Switch","Mobile"];

const genreOptions = [
  "Action","Adventure","RPG","Shooter","Strategy","Sports","Puzzle","Simulation","Horror","Racing",
  "MMO","Hero Battler","First Person Shooter"
];

export default function ProfileSettings() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [steamId, setSteamId] = useState("");
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
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [gamingExperience, setGamingExperience] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
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
        console.log("Profile settings data:", data);
        setProfile(data);
        setDisplayName(data.display_name || "");
        setEmail(data.email || "");
        setSocialLinks(data.social_links || "");
        setSteamId(data.steam_id || "");
        setSelectedPic(data.profile_picture || profilePics[0]);
        
        // Set email verification status
        setIsEmailVerified(data.is_email_verified || false);
        
        // Set demographic information if available
        if (data.demographic_info) {
          setAge(data.demographic_info.age || "");
          setGender(data.demographic_info.gender || "");
          setLocationCity(data.demographic_info.location_city || "");
          setLocationState(data.demographic_info.location_state || "");
          
          // Handle platforms as either array or comma-separated string
          const platforms = data.demographic_info.preferred_platforms;
          setSelectedPlatforms(
            Array.isArray(platforms) ? platforms : 
            (platforms || "").split(',').map(s => s.trim()).filter(Boolean)
          );
          
          // Handle genres as either array or comma-separated string
          const genres = data.demographic_info.favorite_genres;
          console.log("Raw genres data:", genres);
          setSelectedGenres(
            Array.isArray(genres) ? genres :
            (genres || "").split(',').map(s => s.trim()).filter(Boolean)
          );
          console.log("Processed genres:", 
            Array.isArray(genres) ? genres : 
            (genres || "").split(',').map(s => s.trim()).filter(Boolean)
          );
          
          setGamingExperience(data.demographic_info.gaming_experience || "");
          setWeeklyPlaytime(data.demographic_info.weekly_playtime || "");
          setPreviousPlaytestExperience(data.demographic_info.previous_playtest_experience || "");
        }
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
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
    return <div className="responsive-container" style={styles.container}>Loading profile...</div>;
  }

  const renderLoadingSpinner = () => (
    <div style={styles.loadingSpinner}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading...</p>
    </div>
  );

  return (
    <Layout pageTitle="Profile Settings">
      {loading && renderLoadingSpinner()}
      <div style={styles.mainContent}>
        
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

        {/* Email */}
        <div style={styles.section}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <button style={styles.button} onClick={() => saveField("email", email)}>
            Update Email
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

        {/* Steam Account */}
        <div style={styles.section}>
          <label style={styles.label}>Steam ID or Vanity URL</label>
          <input
            type="text"
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            placeholder="e.g. 76561198012345678 or mycoolname"
            style={styles.input}
          />
          <button
            style={styles.button}
            onClick={() => saveField("steam_id", steamId)}
          >
            Connect Steam
          </button>
        </div>

        {/* Email Verification */}
        <div style={styles.section}>
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
                <p>Verify your email to access the full features.</p>
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="City"
                style={{ ...styles.input, flex: 2 }}
              />
              <select
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                style={{ ...styles.input, flex: 1 }}
              >
                <option value="">State</option>
                {usStates.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Favorite Genres */}
          <div style={styles.demoField}>
            <label style={styles.label}>Favorite Genres:</label>
            <div style={styles.checkboxGrid}>
              {genreOptions.map((genre) => (
                <span key={genre} style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id={`genre_${genre}`}
                    checked={selectedGenres.includes(genre)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGenres([...selectedGenres, genre]);
                      } else {
                        setSelectedGenres(
                          selectedGenres.filter((g) => g !== genre)
                        );
                      }
                    }}
                  />
                  <label htmlFor={`genre_${genre}`} style={styles.checkboxLabel}>{genre}</label>
                </span>
              ))}
            </div>
            <div style={{marginTop: '8px', fontSize: '0.9rem'}}>
              Selected: {selectedGenres.join(', ') || 'None'}
            </div>
          </div>
          
          {/* Preferred Platforms */}
          <div style={styles.demoField}>
            <label style={styles.label}>Preferred Gaming Platforms</label>
            <div style={styles.checkboxGrid}>
              {platformOptions.map((platform) => (
                <span key={platform} style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id={`platform_${platform}`}
                    checked={selectedPlatforms.includes(platform)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPlatforms([...selectedPlatforms, platform]);
                      } else {
                        setSelectedPlatforms(
                          selectedPlatforms.filter((p) => p !== platform)
                        );
                      }
                    }}
                  />
                  <label htmlFor={`platform_${platform}`} style={styles.checkboxLabel}>{platform}</label>
                </span>
              ))}
            </div>
            <div style={{marginTop: '8px', fontSize: '0.9rem'}}>
              Selected: {selectedPlatforms.join(', ') || 'None'}
            </div>
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
          
          {/* Weekly Playtime section follows */}
          
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
              // Preserve existing data that's not being updated
              const existingDemographicInfo = profile?.demographic_info || {};
              
              const demographicData = {
                ...existingDemographicInfo,
                age,
                gender,
                location_city: locationCity,
                location_state: locationState,
                preferred_platforms: selectedPlatforms,
                gaming_experience: gamingExperience,
                favorite_genres: selectedGenres,
                weekly_playtime: weeklyPlaytime,
                previous_playtest_experience: previousPlaytestExperience,
              };
              
              console.log("Saving demographic data with genres:", selectedGenres);
              saveField("demographic_info", demographicData);
            }}
          >
            Save Demographic Information
          </button>
        </div>
        
        {status && <p style={styles.status}>{status}</p>}
      </div>
    </Layout>
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
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '8px',
    marginTop: '8px',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    background: '#2a2a2a',
    borderRadius: '4px',
  },
  checkboxLabel: {
    marginLeft: '8px',
    cursor: 'pointer',
    userSelect: 'none',
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
  mainContent: {
    width: '100%',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem',
    ...sectionStyles.section,
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
    ...sectionStyles.button,
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
