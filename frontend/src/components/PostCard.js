// frontend/src/components/PostCard.js
import React, { useState } from "react";

const PostCard = ({ post }) => {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      style={styles.card}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div style={styles.thumbnail}>
        {/* If not hovering, display the image; otherwise, display the video */}
        {!hovering && post.image ? (
          <img src={post.image} alt={post.title} style={styles.image} />
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
      <h3 style={styles.title}>{post.title}</h3>
      {post.tags && (
        <p style={styles.tags}>
          {post.tags.join(", ")}
        </p>
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
  tags: {
    fontSize: "0.9rem",
    color: "#aaa",
  },
};

export default PostCard;
