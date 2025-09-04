import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // Adjust if API hosted elsewhere
});

// Add JWT token to each request headers if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
