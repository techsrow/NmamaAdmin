import axios from "./api";

const BASE = "/admin/product-colors";

const colorService = {
  // GET COLORS
  getColors(productId) {
    return axios.get(`${BASE}/${productId}`);
  },

  // ADD COLOR ✅ (renamed)
  addColor(data) {
    return axios.post(BASE, data);
  },

  // GET IMAGES
  getColorImages(colorId) {
    return axios.get(`${BASE}/color-images/${colorId}`);
  },

  // ADD IMAGE ✅ (renamed)
  addColorImage(data) {
    return axios.post(`${BASE}/color-images`, data);
  },
};

export default colorService;