import React, { useState } from "react";
import axios from "axios";

const CreatePost = ({ token, onPostCreated }) => {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [subgenres, setSubgenres] = useState(""); // NEW
  const [studio, setStudio] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState("");
  const [genre, setGenre] = useState("gaming");
  const [accessInstructions, setAccessInstructions] = useState("");
  const [hasNda, setHasNda] = useState(false);
  const [rewards, setRewards] = useState("");
  const [sharePostToSocials, setSharePostToSocials] = useState(false);
  const [streamingServices, setStreamingServices] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !tags || !subgenres || !studio || !bannerImage || !description || !images) {
      setError("All required fields must be filled.");
      return;
    }

    const postData = {
      genre,
      post_data: {
        title,
        tags: tags.split(",").map(tag => tag.trim()),
        subgenres: subgenres.split(",").map(sg => sg.trim()),
        studio,
        banner_image: bannerImage,
        description,
        images: images.split(",").map(img => img.trim()),
        ...(genre === "gaming"
          ? {
              access_instructions: accessInstructions,
              has_nda: hasNda,
              rewards,
              share_post_to_socials: sharePostToSocials,
            }
          : {
              streaming_services: streamingServices.split(",").map(s => s.trim()),
              trailer_url: trailerUrl,
            }),
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
        setSubgenres(""); // Reset
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
      console.error(err);
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
        placeholder="Subgenres (comma-separated)"
        value={subgenres}
        onChange={(e) => setSubgenres(e.target.value)}
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
        placeholder="Image URLs (comma-separated)"
        value={images}
        onChange={(e) => setImages(e.target.value)}
        required
      />

      <label>
        Genre:
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="gaming">Gaming</option>
          <option value="anime">Anime</option>
        </select>
      </label>

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
