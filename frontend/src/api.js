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
  api.post('/api/auth/token', { username, password });

export const registerUser = (username, email, password) =>
  api.post('/api/auth/register', { username, email, password });

export const forgotPassword = (email) =>
  api.post('/api/auth/forgot-password', { email });

export const resetPassword = (token, new_password) =>
  api.post('/api/auth/reset-password', { token, new_password });

// Profile update endpoint (protected)
export const updateProfile = (profileData, token) =>
  api.put('/api/users/profile/update', profileData, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Post endpoints (create and get) (protected for creation)
export const createPost = (postData, token) =>
  api.post('/api/posts', postData, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getPost = (postId) =>
  api.get(`/api/posts/${postId}`);

// (Optional) Add a "get all posts" method if you're using that in Feed.js
export const getAllPosts = () =>
  api.get('/api/posts');
