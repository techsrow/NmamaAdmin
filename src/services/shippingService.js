import api from "./api";

const shippingService = {
  // POST /api/shipping/rates
  getRates: (payload) => api.post("/shipping/rates", payload),

  // POST /api/shipping/create-shipment (Admin)
  createShipment: (payload) => api.post("/shipping/create-shipment", payload),

  // GET /api/shipping/track/:orderId
  track: (orderId) => api.get(`/shipping/track/${orderId}`),

  // PUT /api/shipping/admin/orders/:orderId/status (Admin)
  adminUpdateShipmentStatus: (orderId, payload) =>
    api.put(`/shipping/admin/orders/${orderId}/status`, payload),
};

export default shippingService;
