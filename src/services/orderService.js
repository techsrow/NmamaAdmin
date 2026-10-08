// src/services/orderService.js
import api from "./api";





const orderService = {
  // ✅ admin list
  adminList: () => api.get("/orders/admin/all"),

  // ✅ admin single
  adminGet: (id) => api.get(`/orders/admin/${id}`),

  // ✅ patch status
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),

  // ✅ patch payment
  updatePayment: (id, payload) => api.patch(`/orders/${id}/payment`, payload),

  // ✅ patch shipping
  updateShipping: (id, payload) => api.patch(`/orders/${id}/shipping`, payload),
};

export default orderService;
