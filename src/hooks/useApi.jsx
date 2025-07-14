// src/api/api.js
import axios from 'axios';

import BASE_URL from "../config/apiConfig";

const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api', // from .env
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
