import axios from "axios";

const api = axios.create({
  timeout:30000,
   baseURL: import.meta.env.VITE_API_URL || "https://api.nmama.in/api",
 //baseURL: import.meta.env.VITE_API_URL || "https://crescenthealthcare.co.in/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && !window.location.pathname.includes("/login")) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
