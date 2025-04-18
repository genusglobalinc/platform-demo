import axios from 'axios';

// Use the environment variable if defined; otherwise, fallback to the deployed URL.
const API_BASE_URL = process.env.REACT_APP_API_BASE || 'https://lost-gates-mvp.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication endpoints
export const loginUser = (username, password) =>
  api.post('/auth/token', { username, password });

export const registerUser = (username, email, password, display_name, social_links, profile_picture) =>
  api.post('/auth/register', {
    username,
    email,
    password,
    display_name,
    social_links,
    profile_picture,
  });

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword = (token, new_password) =>
  api.post('/auth/reset-password', { token, new_password });

// Profile endpoints (protected)
export const updateProfile = (profileData) => {
  const token = localStorage.getItem("token");
  return api.put('/users/profile/update', profileData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getProfileData = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No token found");
  }
  
  const res = await axios.get(`${API_BASE_URL}/users/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  return res.data;
};

// Post endpoints (create and get) (protected for creation)
export const createPost = (postData) => {
  const token = localStorage.getItem("token");
  return api.post('/posts/', postData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getPost = (postId) =>
  api.get(`/posts/${postId}`);
