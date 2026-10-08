import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:6103/api",
});

// Add token if needed
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ✅ GET COLORS
export const getColors = (productId) =>
  API.get(`/admin/product-colors/${productId}`);

// ✅ ADD COLOR
export const addColor = (data) =>
  API.post(`/admin/product-colors`, data);

// ✅ ADD IMAGE
export const addColorImage = (data) =>
  API.post(`/admin/product-color-images`, data);

// ✅ DELETE COLOR
export const deleteColor = (id) =>
  API.delete(`/admin/product-colors/${id}`);