import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = (username, password) => {
  return api.post('/auth/login', { username, password });
};

export const registerUser = (username, email, password) => {
  return api.post('/auth/register', { username, email, password });
};

// Additional API functions for posts and events...
