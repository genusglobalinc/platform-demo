import React, { useState } from "react";
import axios from "axios";

const CreatePost = ({ token, onPostCreated }) => {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState(""); // Tags input
  const [studio, setStudio] = useState(""); // Studio input
  const [bannerImage, setBannerImage] = useState(""); // Banner image URL
  const [description, setDescription] = useState(""); // Post description
  const [images, setImages] = useState(""); // List of image URLs
  const [genre, setGenre] = useState("gaming"); // Default genre
  const [accessInstructions, setAccessInstructions] = useState(""); // Optional for gaming posts
  const [hasNda, setHasNda] = useState(false); // Optional for gaming posts
  const [rewards, setRewards] = useState(""); // Optional for gaming posts
  const [sharePostToSocials, setSharePostToSocials] = useState(false); // Optional for gaming posts
  const [streamingServices, setStreamingServices] = useState(""); // Optional for anime posts
  const [trailerUrl, setTrailerUrl] = useState(""); // Optional for anime posts
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !tags || !studio || !bannerImage || !description || !images) {
      setError("All fields are required.");
      return;
    }

    const postData = {
      genre, // 'gaming' or 'anime'
      post_data: genre === "gaming" ? {
        title,
        tags: tags.split(","),
        studio,
        banner_image: bannerImage,
        description,
        images: images.split(","),
        access_instructions: accessInstructions,
        has_nda: hasNda,
        rewards,
        share_post_to_socials: sharePostToSocials,
      } : {
        title,
        tags: tags.split(","),
        studio,
        banner_image: bannerImage,
        description,
        images: images.split(","),
        streaming_services: streamingServices.split(","),
        trailer_url: trailerUrl,
      },
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
        setTags("");
        setStudio("");
        setBannerImage("");
        setDescription("");
        setImages("");
        setGenre("gaming");
        setAccessInstructions("");
        setHasNda(false);
        setRewards("");
        setSharePostToSocials(false);
        setStreamingServices("");
        setTrailerUrl("");
        onPostCreated?.(response.data.post_id);
      }
    } catch (err) {
      setError("Failed to create post.");
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
      <input
        type="text"
        placeholder="Tags (comma-separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        required
      />
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
        placeholder="Images URLs (comma-separated)"
        value={images}
        onChange={(e) => setImages(e.target.value)}
        required
      />
      
      <div>
        <label>
          Genre:
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="gaming">Gaming</option>
            <option value="anime">Anime</option>
          </select>
        </label>
      </div>

      {genre === "gaming" && (
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

      {genre === "anime" && (
        <>
          <input
            type="text"
            placeholder="Streaming Services (comma-separated)"
            value={streamingServices}
            onChange={(e) => setStreamingServices(e.target.value)}
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
