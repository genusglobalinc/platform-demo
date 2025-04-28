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

// 2FA endpoints
export const setup2FA = () => {
  const token = localStorage.getItem("token");
  return api.post('/auth/2fa/setup', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const verify2FA = (code) => {
  const token = localStorage.getItem("token");
  return api.post('/auth/2fa/verify', { code }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const verify2FALogin = async (code) => {
  return await axios.post(`${API_BASE_URL}/2fa/verify`, { code });
};

export const registerUser = async (username, email, password, displayName, socialLinks, profilePic) => {
  const response = await axios.post(`${API_BASE_URL}/register`, {
    username,
    email,
    password,
    display_name: displayName,
    social_links: socialLinks,
    profile_pic: profilePic,
  });
  return response;
};

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword = (token, new_password) =>
  api.post('/auth/reset-password', { token, new_password });

// Profile endpoints (protected)
export const updateProfile = (profileData) => {
  const token = localStorage.getItem("token");
  return api.put('/users/profile', profileData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getProfileData = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No token found");
  }

  const res = await api.get('/users/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

// ─── NEW ───
export const getUserPosts = (user_id) => {
  const token = localStorage.getItem("token");
  return api
    .get(`/users/${user_id}/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
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
