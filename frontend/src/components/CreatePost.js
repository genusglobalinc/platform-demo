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
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedSubgenres, setSelectedSubgenres] = useState([]);
  const [studio, setStudio] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState("");
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

    if (!title || selectedTags.length === 0 || selectedSubgenres.length === 0 || !studio || !bannerImage || !description || !images) {
      setError("All required fields must be filled.");
      return;
    }

    const basePost = {
      title,
      studio,
      banner_image: bannerImage,
      description,
      tags: selectedTags,
      subgenres: selectedSubgenres,
      images: images.split(",").map((img) => img.trim()),
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
        `${import.meta.env.VITE_API_BASE_URL || ""}/posts`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.post_id) {
        setTitle("");
        setSelectedTags([]);
        setSelectedSubgenres([]);
        setStudio("");
        setBannerImage("");
        setDescription("");
        setImages("");
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

  return (
    <form onSubmit={handleSubmit} className="create-post-form">
      <h2>Create Post</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <label>Tags:</label>
      <div className="checkbox-group">
        {GENRE_OPTIONS.map((tag) => (
          <label key={`tag-${tag}`}>
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

      <label>Subgenres:</label>
      <div className="checkbox-group">
        {GENRE_OPTIONS.map((genre) => (
          <label key={`subgenre-${genre}`}>
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
      />
      <input
        type="url"
        placeholder="Banner Image URL"
        value={bannerImage}
        onChange={(e) => setBannerImage(e.target.value)}
        required
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Image URLs (comma-separated)"
        value={images}
        onChange={(e) => setImages(e.target.value)}
        required
      />

      <label>
        Post Type:
        <select value={postType} onChange={(e) => setPostType(e.target.value)}>
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
          />
          <label>
            <input
              type="checkbox"
              checked={hasNda}
              onChange={(e) => setHasNda(e.target.checked)}
            />
            Has NDA
          </label>
          <input
            type="text"
            placeholder="Rewards (optional)"
            value={rewards}
            onChange={(e) => setRewards(e.target.value)}
          />
          <label>
            <input
              type="checkbox"
              checked={sharePostToSocials}
              onChange={(e) => setSharePostToSocials(e.target.checked)}
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
          />
          <input
            type="url"
            placeholder="Trailer URL (optional)"
            value={trailerUrl}
            onChange={(e) => setTrailerUrl(e.target.value)}
          />
        </>
      )}

      <button type="submit">Post</button>
    </form>
  );
};

export default CreatePost;
