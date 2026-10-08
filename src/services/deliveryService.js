import api from "./api";

const deliveryService = {
  list: () => api.get("/delivery/admin/list"),
  syncOne: (orderId) => api.post(`/delivery/admin/sync/${orderId}`),
  syncBulk: (limit = 25) => api.post("/delivery/admin/sync-bulk", { limit }),
};

export default deliveryService;
