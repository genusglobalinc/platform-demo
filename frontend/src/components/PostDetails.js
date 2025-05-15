// frontend/src/components/PostDetails.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Helper to build Sanity asset URLs similar to PostCard
const buildSanityUrl = (ref, projectId = process.env.REACT_APP_SANITY_PROJECT_ID || "jpgxw2o8") => {
  if (!ref || !projectId) return null;
  const parts = ref.split("-"); // image-<id>-<dims>-<fmt>
  if (parts.length < 4) return null;
  const id = parts[1];
  const dims = parts[2];
  const fmt = parts[3];
  return `https://cdn.sanity.io/images/${projectId}/production/${id}-${dims}.${fmt}`;
};

export default function PostDetails() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/posts/${postId}`);
        if (!res.ok) throw new Error("Failed to fetch post");
        const data = await res.json();
        setPost(data);
      } catch (e) {
        console.error(e);
        setError("Unable to load post.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "1rem", color: "#B388EB" }}>Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={styles.errorContainer}>
        <p>{error || "Post not found."}</p>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  // Determine banner image similarly to PostCard logic
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
    <div style={styles.container}>
      <div style={styles.innerWrapper}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* Banner */}
        {bannerSrc && <img src={bannerSrc} alt="banner" style={styles.banner} />}

        {/* Title & Meta */}
        <h1 style={styles.title}>{post.title}</h1>
        {post.studio && (
          <p style={styles.metaText}>
            <strong>Studio:</strong> {post.studio}
          </p>
        )}
        {(post.created_at || post.date || post._createdAt) && (
          <p style={styles.metaText}>
            <strong>Date:</strong> {new Date(post.created_at || post.date || post._createdAt).toLocaleDateString()}
          </p>
        )}

        {/* Description */}
        {post.description && <p style={styles.description}>{post.description}</p>}

        {/* Additional Fields */}
        {post.access_instructions && (
          <p style={styles.metaText}>
            <strong>Access Instructions:</strong> {post.access_instructions}
          </p>
        )}
        {post.rewards && (
          <p style={styles.metaText}>
            <strong>Rewards:</strong> {post.rewards}
          </p>
        )}
        {typeof post.has_nda !== "undefined" && (
          <p style={styles.metaText}>
            <strong>NDA Required:</strong> {post.has_nda ? "Yes" : "No"}
          </p>
        )}

        {/* Images Gallery */}
        {Array.isArray(post.images) && post.images.length > 0 && (
          <div style={styles.gallery}>
            {post.images.map((img, idx) => {
              const src = typeof img === "string" ? img : buildSanityUrl(img.asset?._ref);
              return src ? <img key={idx} src={src} alt={`img-${idx}`} style={styles.galleryImg} /> : null;
            })}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={styles.tagsContainer}>
            {post.tags.map((tag, i) => (
              <span key={i} style={styles.tag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#111",
    minHeight: "100vh",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    padding: "2rem 1rem",
    fontFamily: "sans-serif",
  },
  innerWrapper: {
    maxWidth: "900px",
    width: "100%",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "#B388EB",
    cursor: "pointer",
    fontSize: "1rem",
    marginBottom: "1rem",
  },
  banner: {
    width: "100%",
    maxHeight: "400px",
    objectFit: "cover",
    borderRadius: "12px",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "2rem",
    margin: "0 0 1rem 0",
    color: "#B388EB",
  },
  metaText: {
    fontSize: "1rem",
    margin: "0.25rem 0",
    color: "#ccc",
  },
  description: {
    margin: "1.5rem 0",
    lineHeight: 1.6,
    fontSize: "1.05rem",
  },
  gallery: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
    marginTop: "1.5rem",
  },
  galleryImg: {
    width: "100%",
    borderRadius: "8px",
    objectFit: "cover",
  },
  tagsContainer: {
    marginTop: "1rem",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  tag: {
    fontSize: "0.9rem",
    color: "#B388EB",
    background: "rgba(179,136,235,0.1)",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#111",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #B388EB",
    borderTop: "5px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    color: "#fff",
    textAlign: "center",
    paddingTop: "4rem",
  },
};
