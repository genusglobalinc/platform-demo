import axios from 'axios';
import Cookies from 'js-cookie';

// Use the environment variable if defined; otherwise, fallback to the deployed URL.
const API_BASE_URL = process.env.REACT_APP_API_BASE || 'https://lost-gates-mvp.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable cookie handling
});

// Interceptor to handle token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        // Handle refresh token failure (logout user)
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Helper functions for token management
export const setAuthTokens = (accessToken, refreshToken) => {
  Cookies.set('access_token', accessToken, { 
    secure: true, 
    sameSite: 'strict',
    expires: 1/24 // 1 hour
  });
  Cookies.set('refresh_token', refreshToken, {
    secure: true,
    sameSite: 'strict',
    expires: 7 // 7 days
  });
};

export const clearAuthTokens = () => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
};

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
  const accessToken = Cookies.get('access_token');
  return api.put('/users/profile', profileData, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
};

export const getProfileData = async () => {
  const accessToken = Cookies.get('access_token');
  if (!accessToken) {
    throw new Error("No token found");
  }

  const res = await api.get('/users/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return res.data;
};

// ─── NEW ───
export const getUserPosts = (user_id) => {
  const accessToken = Cookies.get('access_token');
  return api
    .get(`/users/${user_id}/posts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then((r) => r.data);
};

// Post endpoints (create and get) (protected for creation)
export const createPost = (postData) => {
  const accessToken = Cookies.get('access_token');
  return api.post('/posts/', postData, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
};

export const getPost = (postId) =>
  api.get(`/posts/${postId}`);

// Upload user avatar (multipart/form-data)
export const sendVerificationEmail = async () => {
  const accessToken = Cookies.get('access_token');
  const res = await api.post('/users/profile/send-verification-email', {}, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.data;
};

export const verifyEmailCode = async (code) => {
  const accessToken = Cookies.get('access_token');
  const res = await api.post('/users/profile/verify-email-code', { code }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.data;
};

export const uploadAvatar = async (file) => {
  const accessToken = Cookies.get('access_token');
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/users/profile/upload-avatar', formData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};
