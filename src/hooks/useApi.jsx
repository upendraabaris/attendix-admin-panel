// src/api/api.js
import axios from "axios";
import { toast } from "sonner";

import BASE_URL from "../config/apiConfig";

const api = axios.create({
  //   baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api', // from .env
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // 👇 FormData ke case me Content-Type hata do
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      [
        "token",
        "user",
        "isAuthenticated",
        "orgID",
        "role",
        "employee_id",
        "employee_name",
        "lastActiveTime",
      ].forEach((key) => localStorage.removeItem(key));
      toast.warning("Session expired. Please log in again.", {
        duration: 3000,
      });
      setTimeout(() => window.location.replace("/login"), 1500);
    }
    return Promise.reject(error);
  },
);

export default api;
