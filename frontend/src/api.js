import axios from 'axios';
import Cookies from 'js-cookie';

// Helper function to get token from any source
const getAuthToken = () => {
  return Cookies.get('access_token') || localStorage.getItem('token') || '';
};

// Use the environment variable if defined; otherwise, fallback to the deployed URL.
const API_BASE_URL = process.env.REACT_APP_API_BASE || 'https://lost-gates-mvp.onrender.com';

// Create an axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  // Include cookies in requests by default
  withCredentials: true,
});

// Add interceptor to automatically add auth token to requests
api.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
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
  localStorage.setItem('token', accessToken);
};

export const clearAuthTokens = () => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  localStorage.removeItem('token');
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
  try {
    // Don't use the api instance for this since it would use our interceptor
    // Instead use a fresh axios instance since we need to use the tempToken
    const response = await axios.post(`${API_BASE_URL}/auth/2fa/login`, { code }, {
      headers: { Authorization: `Bearer ${tempToken}` },
      withCredentials: true
    });
    
    // If successful, store the tokens immediately
    if (response?.data?.access_token) {
      setAuthTokens(response.data.access_token, response.data.refresh_token || '');
      console.log('2FA login successful, tokens saved');
    }
    
    return response;
  } catch (error) {
    console.error('2FA verification failed:', error);
    throw error;
  }
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
  return api.put('/users/profile', profileData);
};

export const getProfileData = async () => {
  // No need to manually get the token - the interceptor handles it
  try {
    const res = await api.get('/users/profile');
    return res.data;
  } catch (err) {
    console.error('Profile fetch error:', err.response?.data || err.message);
    throw err;
  }
};

// ─── NEW ───
export const getUserPosts = (user_id) => {
  return api
    .get(`/users/${user_id}/posts`)
    .then((r) => r.data);
};

// Post endpoints (create and get) (protected for creation)
export const createPost = (postData) => {
  return api.post('/posts/', postData);
};

export const getPost = (postId) =>
  api.get(`/posts/${postId}`);

// Upload user avatar (multipart/form-data)
export const sendVerificationEmail = async () => {
  const res = await api.post('/users/profile/send-verification-email', {});
  return res.data;
};

export const verifyEmailCode = async (code) => {
  const res = await api.post('/users/profile/verify-email-code', { code });
  return res.data;
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/users/profile/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};
