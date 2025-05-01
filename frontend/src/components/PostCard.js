// frontend/src/components/PostCard.js
import React from "react";
import axios from "axios";
import jwtDecode from "jwt-decode";

const PostCard = ({ post }) => {
  const getContentPreview = (text, maxLength = 100) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  // Ensure we can still build asset URLs even if env var isn't set in Render
  const projectId =
    process.env.REACT_APP_SANITY_PROJECT_ID || "jpgxw2o8"; // fallback to default project id

  const buildSanityUrl = (ref) => {
    if (!ref || !projectId) return null;
    const parts = ref.split("-"); // image-<id>-<dims>-<fmt>
    if (parts.length < 4) return null;
    const id = parts[1];
    const dims = parts[2];
    const fmt = parts[3];
    return `https://cdn.sanity.io/images/${projectId}/production/${id}-${dims}.${fmt}`;
  };

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

  // Determine ownership
  const authToken = localStorage.getItem("token") || sessionStorage.getItem("token");
  let currentUser = null;
  try {
    if (authToken) currentUser = jwtDecode(authToken);
  } catch {}

  const canDelete = currentUser && (post.user_id === currentUser.sub || post.testerId === currentUser.sub);

  const handleDelete = async () => {
    if (!canDelete) return;
    if (!window.confirm("Delete this post?")) return;
    try {
      await axios.delete(`/posts/${post._id || post.post_id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      window.location.reload();
    } catch (e) {
      console.error("Delete failed", e);
      alert("Failed to delete post");
    }
  };

  return (
    <div style={styles.card}>
      {/* Date at the top */}
      {(post.created_at || post.date || post._createdAt) && (
        <div style={styles.dateContainer}>
          <span style={styles.date}>
            {new Date(post.created_at || post.date || post._createdAt).toLocaleDateString()}
          </span>
        </div>
      )}
      
      <div style={styles.thumbnail}>
        {bannerSrc ? (
          <img src={bannerSrc} alt={post.title || "Post banner"} style={styles.image} />
        ) : (
          <div style={{...styles.image, background: '#333', display:'flex',alignItems:'center',justifyContent:'center',color:'#777'}}>No Image</div>
        )}
      </div>

      <div style={styles.content}>
        {/* Studio */}
        {post.studio && (
          <p style={styles.labelText}>
            <strong>Studio:</strong> {post.studio}
          </p>
        )}

        {/* Title */}
        {post.title && (
          <p style={styles.labelText}>
            <strong>Title:</strong> {post.title}
          </p>
        )}

        {/* Description */}
        {post.description && (
          <p style={styles.labelText}>
            <strong>Description:</strong> {getContentPreview(post.description, 150)}
          </p>
        )}

        {/* Tags if present */}
        {post.tags && post.tags.length > 0 && (
          <div style={styles.tags}>
            {post.tags.map((tag, index) => (
              <span key={index} style={styles.tag}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Delete button for owner */}
        {canDelete && (
          <button style={styles.deleteBtn} onClick={handleDelete}>
            Delete
          </button>
        )}

        {/* Additional metadata - date has been moved to the top */}
        <div style={styles.metadata}>
          {/* Placeholder for additional metadata if needed */}
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: '#1f1f1f',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'transform 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    marginBottom: '24px',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    },
  },
  dateContainer: {
    padding: '0.5rem 1rem 0',
    display: 'flex',
    justifyContent: 'flex-start',
  },
  date: {
    fontSize: '0.85rem',
    color: '#888',
    fontStyle: 'italic',
  },
  thumbnail: {
    position: 'relative',
    overflow: 'hidden',
    height: '200px',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  content: {
    padding: '1rem',
  },
  studioInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  studioName: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#B388EB',
  },
  labelText: {
    margin: "0.25rem 0",
    fontSize: "0.95rem",
    color: "#ddd",
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  tag: {
    fontSize: '0.85rem',
    color: '#B388EB',
    padding: '0.2rem 0.5rem',
    background: 'rgba(179, 136, 235, 0.1)',
    borderRadius: '4px',
    transition: 'background 0.2s',
    '&:hover': {
      background: 'rgba(179, 136, 235, 0.2)',
    },
  },
  metadata: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: '#888',
  },
  date: {
    color: '#888',
  },
  thumbnail: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "10px",
    height: "200px",
    marginBottom: "0.5rem",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "10px",
  },
  content: {
    fontSize: "1rem",
    color: "#ccc",
    marginTop: "0.5rem",
  },
  tags: {
    fontSize: "0.9rem",
    color: "#aaa",
    marginTop: "0.3rem",
  },
  deleteBtn: {
    background: "#e74c3c",
    border: "none",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 4,
    cursor: "pointer",
    marginBottom: 8,
  },
};

export default PostCard;
