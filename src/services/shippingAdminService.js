import api from "./api";

const unwrap = (r) => r?.data?.data ?? r?.data ?? r;

const shippingAdminService = {
 reverseDetails: async id=>unwrap(await api.get(`/shipping/operations/returns/${id}`)),
 bookReverse: async(id,b)=>unwrap(await api.post(`/shipping/operations/returns/${id}/book`,b)),
 syncReverse: async(id,awb)=>unwrap(await api.post(`/shipping/operations/returns/${id}/sync`,{awb})),
 cancelReverse: async id=>unwrap(await api.post(`/shipping/operations/returns/${id}/cancel`)),
 receiveReverse: async(id,b)=>unwrap(await api.post(`/shipping/operations/returns/${id}/receive`,b)),

 operations: async()=>unwrap(await api.get('/shipping/operations')),
 saveAutomation: async b=>unwrap(await api.put('/shipping/operations/settings',b)),
 enqueue: async id=>unwrap(await api.post(`/shipping/operations/orders/${id}/enqueue`)),
 retryJob: async id=>unwrap(await api.post(`/shipping/operations/jobs/${id}/retry`)),
 resolveJob: async id=>unwrap(await api.post(`/shipping/operations/jobs/${id}/resolve`)),
 shiprocketBooking: async id=>unwrap(await api.get(`/shipping/operations/orders/${id}/shiprocket-booking`)),
 reconcileShiprocket: async(id,shipmentId)=>unwrap(await api.post(`/shipping/operations/orders/${id}/reconcile-shiprocket`,{shipmentId})),
 localAction: async(id,b)=>unwrap(await api.post(`/shipping/operations/shipments/${id}/local`,b)),
 recordCost: async(id,b)=>unwrap(await api.post(`/shipping/operations/shipments/${id}/cost`,b)),
 receiveReturn: async(id,b)=>unwrap(await api.post(`/shipping/operations/shipments/${id}/receive-return`,b)),
 localLabel: async id=>(await api.get(`/shipping/operations/shipments/${id}/local-label`,{responseType:'blob'})).data,

  shadowfaxBooking: async id => unwrap(await api.get(`/shipping/shadowfax/orders/${id}/booking`)),
  retrySavedShadowfax: async (id,expectedClientOrderId) => unwrap(await api.post(`/shipping/shadowfax/orders/${id}/retry-saved`,{expectedClientOrderId})),
  correctShadowfaxPickup: async (id,payload) => unwrap(await api.post(`/shipping/shadowfax/orders/${id}/correct-pickup`,payload)),
  recoverShadowfax: async (id,awb) => unwrap(await api.post(`/shipping/shadowfax/orders/${id}/recover`,{awb})),
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
