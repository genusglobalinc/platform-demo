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

      {/* Optional title */}
      {post.title && <h3 style={styles.title}>{post.title}</h3>}

      {/* Content preview */}
      {post.content && <p style={styles.content}>{getContentPreview(post.content)}</p>}

      {/* Tags if present */}
      {post.tags && post.tags.length > 0 && (
        <p style={styles.tags}>{post.tags.join(", ")}</p>
      )}
    </div>
  );
};

const styles = {
  card: {
    background: "#1f1f1f",
    borderRadius: "10px",
    padding: "1rem",
    transition: "transform 0.3s",
    cursor: "pointer",
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
