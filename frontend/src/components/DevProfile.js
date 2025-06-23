import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import Layout, { sectionStyles } from './Layout';

const DevProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadDevProfile = async () => {
      try {
        setLoading(true);
        // Fetch the developer's profile
        const profileRes = await api.get(`/users/profile/by-username/${username}`);
        setProfile(profileRes.data);
        
        // Fetch all posts by this developer
        const postsRes = await api.get(`/users/by-username/${username}/posts`);
        setPosts(postsRes.data || []);
      } catch (err) {
        console.error('Error loading developer profile:', err);
        setError('Failed to load developer profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadDevProfile();
  }, [username]);
  
  // Helper to build Sanity asset URLs
  const buildSanityUrl = (ref, projectId = process.env.REACT_APP_SANITY_PROJECT_ID || "jpgxw2o8") => {
    if (!ref || !projectId) return null;
    const parts = ref.split("-");
    if (parts.length < 4) return null;
    const id = parts[1];
    const dims = parts[2];
    const fmt = parts[3];
    return `https://cdn.sanity.io/images/${projectId}/production/${id}-${dims}.${fmt}`;
  };

  if (loading) {
    return (
      <Layout pageTitle="Loading Profile">
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading developer profile...</p>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout pageTitle="Error" showBackButton={true} onBack={() => navigate(-1)}>
        <div style={styles.errorContainer}>
          <p>{error || "Developer profile not found"}</p>
        </div>
      </Layout>
    );
  }
  
  // Get developer name from profile
  const devName = profile.display_name || profile.username || "Developer";
  const studioName = profile.studio_name || profile.company_name || devName;
  
  // Use Steam profile picture if available
  const avatarUrl = profile.steam_profile?.avatar || profile.avatar_url || null;
  
  // Helper to render demographic information
  const renderDemographicInfo = () => {
    if (!profile.demographic_info || Object.keys(profile.demographic_info).length === 0) {
      return null;
    }
    
    // Helper to render a row with label and value
    const renderRow = (label, value) => {
      if (value === undefined || value === null || value === "" || 
          (Array.isArray(value) && value.length === 0)) {
        return null;
      }
      
      // Handle string values that should be arrays
      let processedValue = value;
      if (!Array.isArray(value) && typeof value === 'string' && 
          (label === "Favorite Genres" || label === "Preferred Platforms")) {
        processedValue = value.split(',').map(v => v.trim()).filter(Boolean);
      }
      
      const renderedValue = Array.isArray(processedValue) ? (
        <div style={styles.tagContainer}>
          {processedValue.map((v) => (
            <span key={v} style={styles.tag}>{v}</span>
          ))}
        </div>
      ) : typeof processedValue === 'boolean' ? (
        processedValue ? "Yes" : "No"
      ) : (
        processedValue
      );
      
      return (
        <div style={styles.demographicRow}>
          <span style={styles.demographicLabel}>{`${label}:`}</span>
          <span>{renderedValue}</span>
        </div>
      );
    };
    
    return (
      <div style={styles.demographicSection}>
        <h3 style={styles.demographicTitle}>Developer Information</h3>
        {profile.demographic_info.location && renderRow("Location", profile.demographic_info.location)}
        {profile.demographic_info.preferred_platforms && renderRow("Preferred Platforms", profile.demographic_info.preferred_platforms)}
        {profile.demographic_info.gaming_experience && renderRow("Gaming Experience", profile.demographic_info.gaming_experience)}
        {profile.demographic_info.favorite_genres && renderRow("Favorite Genres", profile.demographic_info.favorite_genres)}
        {profile.demographic_info.weekly_playtime && renderRow("Weekly Playtime", profile.demographic_info.weekly_playtime)}
      </div>
    );
  };

  return (
    <Layout pageTitle={devName} showBackButton={true} onBack={() => navigate(-1)}>
      <div style={styles.innerWrapper}>
        
        {/* Developer Header */}
        <div style={styles.devHeader}>
          {avatarUrl && (
            <img 
              src={avatarUrl}
              alt={devName}
              style={styles.avatar}
            />
          )}
          <div style={styles.devInfo}>
            <h1 style={styles.devName}>{devName}</h1>
            {studioName !== devName && (
              <h2 style={styles.studioName}>{studioName}</h2>
            )}
            {profile.bio && <p style={styles.bio}>{profile.bio}</p>}
            
            {/* Render demographic info rows */}
            {renderDemographicInfo()}
          </div>
        </div>
        
        {/* Stats */}
        <div style={styles.statsContainer}>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{posts.length}</span>
            <span style={styles.statLabel}>Posts</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>
              {posts.reduce((total, post) => total + (post.registrants?.length || 0), 0)}
            </span>
            <span style={styles.statLabel}>Total Registrants</span>
          </div>
        </div>
        
        {/* Posts Grid */}
        <h2 style={styles.sectionTitle}>All Posts</h2>
        {posts.length > 0 ? (
          <div style={styles.postsGrid}>
            {posts.map((post, idx) => {
              // Determine banner image
              const firstImageRef = Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : null;
              const bannerSrc =
                post.banner_image ||
                post.bannerImage?.url ||
                (post.bannerImage?.image && buildSanityUrl(post.bannerImage.image.asset?._ref)) ||
                (post.bannerImage && buildSanityUrl(post.bannerImage.asset?._ref)) ||
                (firstImageRef &&
                  (typeof firstImageRef === "string"
                    ? firstImageRef
                    : buildSanityUrl(firstImageRef.asset?._ref))) ||
                null;
              
              return (
                <div 
                  key={idx}
                  style={styles.postCard}
                  onClick={() => navigate(`/posts/${post.post_id || post._id}`)}
                >
                  {bannerSrc && (
                    <div style={styles.postImageContainer}>
                      <img src={bannerSrc} alt={post.title} style={styles.postImage} />
                    </div>
                  )}
                  <div style={styles.postContent}>
                    <h3 style={styles.postTitle}>{post.title}</h3>
                    <p style={styles.postDescription}>
                      {post.description?.substring(0, 120)}
                      {post.description?.length > 120 ? '...' : ''}
                    </p>
                    <div style={styles.postMeta}>
                      <span style={styles.postDate}>
                        {new Date(post.created_at || post.date || post._createdAt).toLocaleDateString()}
                      </span>
                      {post.registrants && (
                        <span style={styles.registrantsCount}>
                          {post.registrants.length} Registrants
                        </span>
                      )}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div style={styles.tagsContainer}>
                        {post.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} style={styles.tag}>#{tag}</span>
                        ))}
                        {post.tags.length > 3 && <span style={styles.tag}>+{post.tags.length - 3}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={styles.noPosts}>No posts available from this developer.</p>
        )}
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    fontFamily: "sans-serif",
  },
  innerWrapper: {
    maxWidth: "1000px",
    width: "100%",
  },
  
  // Demographic section styles
  demographicSection: {
    marginTop: "1.5rem",
    padding: "1rem 0",
    borderTop: "1px solid rgba(179, 136, 235, 0.3)",
  },
  demographicTitle: {
    fontSize: "1.2rem",
    marginBottom: "1rem",
    color: "#B388EB",
  },
  demographicRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "4px 0",
    marginBottom: "0.5rem",
    borderBottom: "1px solid #444",
  },
  demographicLabel: {
    color: "#B388EB",
    marginRight: "1rem",
    fontWeight: "500",
  },
  tagContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    maxWidth: "60%",
    justifyContent: "flex-end",
  },
  tag: {
    background: "rgba(179,136,235,0.1)",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "0.8rem",
    color: "#B388EB",
    marginBottom: "4px",
  },

  devHeader: {
    display: "flex",
    alignItems: "center",
    gap: "2rem",
    marginBottom: "2rem",
    ...sectionStyles.section,
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #B388EB",
  },
  devInfo: {
    flex: 1,
  },
  devName: {
    fontSize: "2.5rem",
    margin: "0 0 0.5rem 0",
    color: "#B388EB",
  },
  studioName: {
    fontSize: "1.5rem",
    margin: "0 0 1rem 0",
    color: "#eee",
    fontWeight: "normal",
  },
  bio: {
    fontSize: "1rem",
    lineHeight: "1.6",
    margin: "1rem 0 0 0",
    color: "#ccc",
  },
  statsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
    marginBottom: "3rem",
  },
  statItem: {
    flex: "1",
    minWidth: "120px",
    padding: "1.5rem",
    background: "rgba(40, 40, 40, 0.5)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#B388EB",
    marginBottom: "0.5rem",
  },
  statLabel: {
    fontSize: "0.9rem",
    color: "#aaa",
  },
  sectionTitle: {
    fontSize: "1.8rem",
    marginBottom: "1.5rem",
    color: "#B388EB",
    borderBottom: "1px solid rgba(179, 136, 235, 0.2)",
    paddingBottom: "0.5rem",
  },
  postsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  postCard: {
    backgroundColor: "rgba(40, 40, 40, 0.5)",
    borderRadius: "8px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    '&:hover': {
      transform: "translateY(-5px)",
      boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
    },
  },
  postImageContainer: {
    height: "160px",
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  postContent: {
    padding: "1.5rem",
    flex: "1",
    display: "flex",
    flexDirection: "column",
  },
  postTitle: {
    fontSize: "1.3rem",
    margin: "0 0 0.8rem 0",
    color: "#B388EB",
  },
  postDescription: {
    fontSize: "0.9rem",
    lineHeight: "1.5",
    color: "#ccc",
    marginBottom: "1.5rem",
    flex: "1",
  },
  postMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.8rem",
    fontSize: "0.85rem",
    color: "#aaa",
  },
  postDate: {},
  registrantsCount: {
    backgroundColor: "rgba(179, 136, 235, 0.2)",
    padding: "0.3rem 0.6rem",
    borderRadius: "4px",
    color: "#B388EB",
  },
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
  },
  tag: {
    padding: "0.2rem 0.5rem",
    backgroundColor: "rgba(179, 136, 235, 0.1)",
    color: "#B388EB",
    borderRadius: "4px",
    fontSize: "0.8rem",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #B388EB",
    borderTop: "5px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#B388EB",
    marginTop: "1rem",
    fontSize: "1.2rem",
  },
  errorContainer: {
    color: "#fff",
    textAlign: "center",
    padding: "2rem",
    minHeight: "50vh",
  },
  noPosts: {
    textAlign: "center",
    padding: "2rem",
    ...sectionStyles.section,
    color: "#aaa",
  }
};

export default DevProfile;
