import React, { useState } from "react";
import axios from "axios";

const GENRE_OPTIONS = [
  "Anime",
  "Gaming",
  "MMO",
  "First Person Shooter",
  "Hero Battler",
  "Isekai",
  "Action",
  "Horror",
];

const CreatePost = ({ token, onPostCreated }) => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";
  const authToken = token || localStorage.getItem("token") || sessionStorage.getItem("token");

  const styles = {
    container: {
      width: '90%',
      maxWidth: '800px',
      margin: '2rem auto',
      padding: '1.5rem',
      background: '#1a1a1a',
      color: '#eee',
      borderRadius: '12px',
      boxShadow: '0 0 20px rgba(128,0,128,0.3)',
      boxSizing: 'border-box',
      '@media (min-width: 768px)': {
        padding: '2rem',
      },
    },
    title: {
      color: '#B388EB',
      marginBottom: '1.5rem',
      fontSize: '1.75rem',
      textAlign: 'center',
    },
    error: {
      color: '#ff6b6b',
      marginBottom: '1rem',
      padding: '0.75rem',
      background: 'rgba(255, 107, 107, 0.1)',
      border: '1px solid rgba(255, 107, 107, 0.3)',
      borderRadius: '8px',
      textAlign: 'center',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      marginBottom: '1rem',
      borderRadius: '8px',
      border: '2px solid #444',
      background: '#2a2a2a',
      color: '#fff',
      fontSize: '1rem',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease',
      '&:focus': {
        outline: 'none',
        borderColor: '#B388EB',
        boxShadow: '0 0 0 2px rgba(179, 136, 235, 0.3)',
      },
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      marginBottom: '1rem',
      borderRadius: '8px',
      border: '2px solid #444',
      background: '#2a2a2a',
      color: '#fff',
      fontSize: '1rem',
      boxSizing: 'border-box',
      minHeight: '100px',
      maxHeight: '300px',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      '&:focus': {
        outline: 'none',
        borderColor: '#B388EB',
        boxShadow: '0 0 0 2px rgba(179, 136, 235, 0.3)',
      },
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      marginBottom: '1rem',
      borderRadius: '8px',
      border: '2px solid #444',
      background: '#2a2a2a',
      color: '#fff',
      fontSize: '1rem',
      boxSizing: 'border-box',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:focus': {
        outline: 'none',
        borderColor: '#B388EB',
        boxShadow: '0 0 0 2px rgba(179, 136, 235, 0.3)',
      },
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#B388EB',
      fontSize: '1rem',
    },
    checkboxGroup: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      marginBottom: '1rem',
      padding: '1rem',
      background: '#2a2a2a',
      borderRadius: '8px',
      border: '2px solid #444',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#fff',
      cursor: 'pointer',
      padding: '0.5rem',
      borderRadius: '4px',
      transition: 'background 0.2s',
      '&:hover': {
        background: 'rgba(179, 136, 235, 0.1)',
      },
    },
    checkbox: {
      width: '1.2rem',
      height: '1.2rem',
      cursor: 'pointer',
    },
    button: {
      width: '100%',
      padding: '0.75rem',
      marginTop: '1rem',
      borderRadius: '8px',
      border: 'none',
      background: '#B388EB',
      color: '#121212',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(179, 136, 235, 0.3)',
      },
      '&:active': {
        transform: 'translateY(1px)',
      },
    },
  };
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedSubgenres, setSelectedSubgenres] = useState([]);
  const [studio, setStudio] = useState("");
  const [bannerImage, setBannerImage] = useState(""); // url fallback
  const [bannerRef, setBannerRef] = useState(null);     // sanity reference
  const [description, setDescription] = useState("");
  const [images, setImages] = useState("");            // csv fallback
  const [imageRefs, setImageRefs] = useState([]);       // sanity references
  const [postType, setPostType] = useState("gaming");
  const [accessInstructions, setAccessInstructions] = useState("");
  const [hasNda, setHasNda] = useState(false);
  const [rewards, setRewards] = useState("");
  const [sharePostToSocials, setSharePostToSocials] = useState(false);
  const [streamingServices, setStreamingServices] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [error, setError] = useState("");

  const toggleCheckbox = (value, setFunction, currentState) => {
    if (currentState.includes(value)) {
      setFunction(currentState.filter((item) => item !== value));
    } else {
      setFunction([...currentState, value]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || selectedTags.length === 0 || selectedSubgenres.length === 0 || !studio || (!bannerRef && !bannerImage) || !description || (!imageRefs.length && !images)) {
      setError("All required fields must be filled.");
      return;
    }

    const basePost = {
      title,
      studio,
      banner_image: bannerRef || bannerImage,
      description,
      tags: selectedTags,
      subgenres: selectedSubgenres,
      images: imageRefs.length ? imageRefs : images.split(",").map((img) => img.trim()),
    };

    let fullPostData = {};

    if (postType === "gaming") {
      fullPostData = {
        ...basePost,
        access_instructions: accessInstructions,
        has_nda: hasNda,
        rewards,
        share_post_to_socials: sharePostToSocials,
      };
    } else if (postType === "anime") {
      if (!streamingServices) {
        setError("Streaming services are required for anime posts.");
        return;
      }

      fullPostData = {
        ...basePost,
        streaming_services: streamingServices.split(",").map((s) => s.trim()),
        trailer_url: trailerUrl,
      };
    }

    const postData = {
      post_type: postType,
      post_data: fullPostData,
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/posts`,
        postData,
        {
          headers: {
            Authorization: authToken ? `Bearer ${authToken}` : "",
          },
        }
      );

      if (response.data?.post_id) {
        setTitle("");
        setSelectedTags([]);
        setSelectedSubgenres([]);
        setStudio("");
        setBannerImage("");
        setBannerRef(null);
        setDescription("");
        setImages("");
        setImageRefs([]);
        setPostType("gaming");
        setAccessInstructions("");
        setHasNda(false);
        setRewards("");
        setSharePostToSocials(false);
        setStreamingServices("");
        setTrailerUrl("");
        setError("");
        onPostCreated?.(response.data.post_id);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create post.");
    }
  };

  const uploadFile = async (file, setter) => {
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await axios.post(`${API_BASE_URL}/uploads/image`, form, {
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : "",
          "Content-Type": "multipart/form-data",
        },
      });
      if (resp.data?.image) {
        setter(resp.data.image);
      }
    } catch (e) {
      console.error(e);
      setError("Image upload failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.container}>
      <h2 style={styles.title}>Create Post</h2>
      {error && <p style={styles.error}>{error}</p>}

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        style={styles.input}
      />

      <label style={styles.label}>Tags:</label>
      <div style={styles.checkboxGroup}>
        {GENRE_OPTIONS.map((tag) => (
          <label key={`tag-${tag}`} style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={selectedTags.includes(tag)}
              onChange={() =>
                toggleCheckbox(tag, setSelectedTags, selectedTags)
              }
            />
            {tag}
          </label>
        ))}
      </div>

      <label style={styles.label}>Subgenres:</label>
      <div style={styles.checkboxGroup}>
        {GENRE_OPTIONS.map((genre) => (
          <label key={`subgenre-${genre}`} style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={selectedSubgenres.includes(genre)}
              onChange={() =>
                toggleCheckbox(genre, setSelectedSubgenres, selectedSubgenres)
              }
            />
            {genre}
          </label>
        ))}
      </div>

      <input
        type="text"
        placeholder="Studio"
        value={studio}
        onChange={(e) => setStudio(e.target.value)}
        required
        style={styles.input}
      />
      <label style={styles.label}>Banner Image:</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            uploadFile(e.target.files[0], setBannerRef);
          }
        }}
        style={styles.input}
      />
      <small style={{ color: "#888" }}>or paste URL below</small>
      <input
        type="url"
        placeholder="Banner Image URL"
        value={bannerImage}
        onChange={(e) => setBannerImage(e.target.value)}
        style={styles.input}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        style={styles.textarea}
      />
      <label style={styles.label}>Gallery Images:</label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach((f) => uploadFile(f, (ref) => setImageRefs((prev) => [...prev, ref])));
        }}
        style={styles.input}
      />
      <small style={{ color: "#888" }}>or paste URLs below (comma separated)</small>
      <input
        type="text"
        placeholder="Image URLs (comma-separated)"
        value={images}
        onChange={(e) => setImages(e.target.value)}
        style={styles.input}
      />

      <label style={styles.label}>
        Post Type:
        <select value={postType} onChange={(e) => setPostType(e.target.value)} style={styles.select}>
          <option value="gaming">Gaming</option>
          <option value="anime">Anime</option>
        </select>
      </label>

      {postType === "gaming" && (
        <>
          <input
            type="text"
            placeholder="Access Instructions (optional)"
            value={accessInstructions}
            onChange={(e) => setAccessInstructions(e.target.value)}
            style={styles.input}
          />
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={hasNda}
              onChange={(e) => setHasNda(e.target.checked)}
              style={styles.checkbox}
            />
            Has NDA
          </label>
          <input
            type="text"
            placeholder="Rewards (optional)"
            value={rewards}
            onChange={(e) => setRewards(e.target.value)}
            style={styles.input}
          />
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={sharePostToSocials}
              onChange={(e) => setSharePostToSocials(e.target.checked)}
              style={styles.checkbox}
            />
            Share to socials
          </label>
        </>
      )}

      {postType === "anime" && (
        <>
          <input
            type="text"
            placeholder="Streaming Services (comma-separated)"
            value={streamingServices}
            onChange={(e) => setStreamingServices(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="url"
            placeholder="Trailer URL (optional)"
            value={trailerUrl}
            onChange={(e) => setTrailerUrl(e.target.value)}
            style={styles.input}
          />
        </>
      )}

      <button type="submit" style={styles.button}>Post</button>
    </form>
  );
};

export default CreatePost;
