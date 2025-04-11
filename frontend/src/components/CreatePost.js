// frontend/src/components/CreatePost.js
import React, { useState } from "react";
import axios from "axios";

const CreatePost = ({ token, onPostCreated }) => {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !details) {
      setError("Both title and details are required.");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || ""}/posts`,
        { title, details },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.post_id) {
        setTitle("");
        setDetails("");
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
      <textarea
        placeholder="Details"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        required
      />
      <button type="submit">Post</button>
    </form>
  );
};

export default CreatePost;
