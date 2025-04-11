import axios from 'axios';

// Update API_BASE_URL with your deployed backend URL (without trailing slash)
const API_BASE_URL = 'https://lost-gates-mvp.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = (username, password) => {
  return api.post('/auth/token', { username, password });
};

export const registerUser = (username, email, password) => {
  return api.post('/auth/register', { username, email, password });
};

// Additional endpoints
export const forgotPassword = (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPassword = (token, new_password) => {
  return api.post('/auth/reset-password', { token, new_password });
};

export const updateProfile = (profileData) => {
  return api.put('/users/profile/update', profileData);
};

// For posts (create and get)
export const createPost = (postData, token) => {
  return api.post('/posts/create', postData, { headers: { Authorization: `Bearer ${token}` } });
};

export const getPost = (postId) => {
  return api.get(`/posts/${postId}`);
};
