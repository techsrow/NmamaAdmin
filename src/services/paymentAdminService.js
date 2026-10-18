import api from "./api";

const unwrap = (res) => res?.data?.data ?? res?.data ?? res;

export const paymentAdminService = {
  async transactions(params = {}) {
    return unwrap(await api.get("/payments", { params }));
  },
  async refunds(params = {}) {
    return unwrap(await api.get("/payments/refunds", { params }));
  },
  async orderPayments(orderId) {
    return unwrap(await api.get(`/payments/order/${orderId}`));
  },
  async providerCatalog() {
    return unwrap(await api.get("/payments/providers/catalog"));
  },
  async providers() {
    return unwrap(await api.get("/payments/providers"));
  },
  async provider(provider) {
    return unwrap(await api.get(`/payments/providers/${provider}`));
  },
  async saveProvider(provider, payload) {
    return unwrap(await api.put(`/payments/providers/${provider}`, payload));
  },
  async testProvider(provider) {
    return unwrap(await api.post(`/payments/providers/${provider}/test`));
  },
  async setProviderStatus(provider, isEnabled) {
    return unwrap(await api.patch(`/payments/providers/${provider}/status`, { isEnabled }));
  },
  async refund(paymentId, payload, requestKey) {
    return unwrap(await api.post(`/payments/${paymentId}/refund`, payload, {headers:{"Idempotency-Key":requestKey}}));
  },
  async manualPayment(payload) {
    return unwrap(await api.post("/payments/manual", payload));
  },
};

export default paymentAdminService;
