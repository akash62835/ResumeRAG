import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post("/api/auth/login", { email, password }),
  register: (username, email, password, role) =>
    api.post("/api/auth/register", { username, email, password, role }),
};

export const resumeAPI = {
  upload: (formData, onUploadProgress) =>
    api.post("/api/resumes", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    }),
  getAll: (params) => api.get("/api/resumes", { params }),
  getById: (id) => api.get(`/api/resumes/${id}`),
};

export const searchAPI = {
  ask: (query, k) => api.post("/api/ask", { query, k }),
};

export const jobAPI = {
  create: (jobData) => api.post("/api/jobs", jobData),
  getAll: (params) => api.get("/api/jobs", { params }),
  getById: (id) => api.get(`/api/jobs/${id}`),
  match: (id, top_n) => api.post(`/api/jobs/${id}/match`, { top_n }),
};

export default api;
