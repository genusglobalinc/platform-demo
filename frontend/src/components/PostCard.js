// frontend/src/components/PostCard.js
import React, { useState } from "react";

const PostCard = ({ post }) => {
  const [hovering, setHovering] = useState(false);

  const getContentPreview = (text, maxLength = 100) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  return (
    <div
      style={styles.card}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div style={styles.thumbnail}>
        {/* If not hovering, display the image; otherwise, display the video */}
        {!hovering && post.image ? (
          <img src={post.image} alt={post.title || "Post image"} style={styles.image} />
        ) : (
          post.video && (
            <video
              src={post.video}
              style={styles.video}
              autoPlay
              loop
              muted
            />
          )
        )}
      </div>

      <div style={styles.content}>
        {/* Studio name and location */}
        {post.studioName && (
          <div style={styles.studioInfo}>
            <h4 style={styles.studioName}>{post.studioName}</h4>
            {post.location && <span style={styles.location}>{post.location}</span>}
          </div>
        )}

        {/* Optional title */}
        {post.title && <h3 style={styles.title}>{post.title}</h3>}

        {/* Content preview */}
        {post.description && (
          <p style={styles.description}>{getContentPreview(post.description, 150)}</p>
        )}

        {/* Content preview */}
        {post.content && <p style={styles.contentText}>{getContentPreview(post.content)}</p>}

        {/* Tags if present */}
        {post.tags && post.tags.length > 0 && (
          <div style={styles.tags}>
            {post.tags.map((tag, index) => (
              <span key={index} style={styles.tag}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Additional metadata */}
        <div style={styles.metadata}>
          {post.createdAt && (
            <span style={styles.date}>
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          )}
          {post.eventType && <span style={styles.eventType}>{post.eventType}</span>}
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
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    },
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
  video: {
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
  location: {
    fontSize: '0.9rem',
    color: '#888',
  },
  title: {
    margin: '0.5rem 0',
    fontSize: '1.2rem',
    color: '#fff',
    lineHeight: '1.4',
  },
  description: {
    fontSize: '1rem',
    color: '#ddd',
    marginBottom: '0.75rem',
    lineHeight: '1.5',
  },
  contentText: {
    fontSize: '0.95rem',
    color: '#aaa',
    marginBottom: '0.75rem',
    lineHeight: '1.4',
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
  eventType: {
    color: '#B388EB',
    fontWeight: '500',
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
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "10px",
  },
  title: {
    margin: "0.5rem 0",
    fontSize: "1.1rem",
    color: "#fff",
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
};

export default PostCard;
