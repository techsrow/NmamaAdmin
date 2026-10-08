import api from "./api";

const unwrap = (r) => r?.data?.data ?? r?.data ?? r;

const shippingAdminService = {
  rates: async (payload) => unwrap(await api.post("/shipping/rates", payload)),
  dashboard: async () => unwrap(await api.get("/shipping/dashboard")),

  fulfillmentOrders: async (params = {}) => unwrap(await api.get("/shipping/fulfillment/orders", { params })),
  fulfillmentOrder: async (orderId) => unwrap(await api.get(`/shipping/fulfillment/orders/${orderId}`)),
  fulfillmentRates: async (orderId, payload = {}) => unwrap(await api.post(`/shipping/fulfillment/orders/${orderId}/rates`, payload)),
  createFulfillment: async (orderId, payload) => unwrap(await api.post(`/shipping/fulfillment/orders/${orderId}/create`, payload)),

  providerCatalog: async () => unwrap(await api.get("/shipping/providers/catalog")),
  providers: async () => unwrap(await api.get("/shipping/providers")),
  saveProvider: async (provider, payload) => unwrap(await api.put(`/shipping/providers/${provider}`, payload)),
  testProvider: async (provider) => unwrap(await api.post(`/shipping/providers/${provider}/test`)),
  setProviderStatus: async (provider, isEnabled) => unwrap(await api.patch(`/shipping/providers/${provider}/status`, { isEnabled })),

  pickupLocations: async (params = {}) => unwrap(await api.get("/shipping/pickup-locations", { params })),
  createPickupLocation: async (payload) => unwrap(await api.post("/shipping/pickup-locations", payload)),
  updatePickupLocation: async (id, payload) => unwrap(await api.put(`/shipping/pickup-locations/${id}`, payload)),
  deletePickupLocation: async (id) => unwrap(await api.delete(`/shipping/pickup-locations/${id}`)),

  rules: async (params = {}) => unwrap(await api.get("/shipping/rules", { params })),
  createRule: async (payload) => unwrap(await api.post("/shipping/rules", payload)),
  updateRule: async (id, payload) => unwrap(await api.put(`/shipping/rules/${id}`, payload)),
  deleteRule: async (id) => unwrap(await api.delete(`/shipping/rules/${id}`)),

  shipments: async (params = {}) => unwrap(await api.get("/shipping/shipments", { params })),
  shipment: async (id) => unwrap(await api.get(`/shipping/shipments/${id}`)),
  schedulePickup: async (id, payload = {}) => unwrap(await api.post(`/shipping/shipments/${id}/pickup`, payload)),
  label: async (id, payload = {}) => unwrap(await api.post(`/shipping/shipments/${id}/label`, payload)),
  track: async (id) => unwrap(await api.post(`/shipping/shipments/${id}/track`)),
  cancel: async (id, payload = {}) => unwrap(await api.post(`/shipping/shipments/${id}/cancel`, payload)),
  manualStatus: async (id, payload) => unwrap(await api.post(`/shipping/shipments/${id}/manual-status`, payload)),
  ndr: async (id, payload) => unwrap(await api.post(`/shipping/shipments/${id}/ndr`, payload)),
};

export default shippingAdminService;
