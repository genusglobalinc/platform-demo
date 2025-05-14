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
export const setup2FA = (tempToken) => {
  return api.post('/auth/2fa/setup', {}, {
    headers: { Authorization: `Bearer ${tempToken}` },
  });
};

export const verify2FA = (code, tempToken) => {
  return api.post('/auth/2fa/verify', { code }, {
    headers: { Authorization: `Bearer ${tempToken}` },
  });
};

export const verify2FALogin = async (code, tempToken) => {
  return await api.post('/auth/2fa/login', { code }, {
    headers: { Authorization: `Bearer ${tempToken}` },
  });
};

export const registerUser = async (username, email, password, displayName, userType) => {
  return await api.post('/auth/register', {
    username,
    email,
    password,
    display_name: displayName,
    user_type: userType || "Tester",
  });
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

// Upload user avatar (multipart/form-data)
export const sendVerificationEmail = async () => {
  const token = localStorage.getItem("token");
  const res = await api.post('/users/profile/send-verification-email', {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const verifyEmailCode = async (code) => {
  const token = localStorage.getItem("token");
  const res = await api.post('/users/profile/verify-email-code', { code }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const uploadAvatar = async (file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/users/profile/upload-avatar', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};
