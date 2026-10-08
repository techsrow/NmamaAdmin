/* eslint-disable no-unused-vars */
import api from "./api";

/**
 * Primary routes (recommended):
 *  POST /api/shipping/shiprocket/:orderId/push
 *  POST /api/shipping/shiprocket/:orderId/sync
 *
 * Fallback routes (if you mounted /api/shiprocket instead):
 *  POST /api/shiprocket/create-shipment/:orderId
 *  GET  /api/shiprocket/track/:orderId
 */
const shiprocketService = {
  async createShipment(orderId) {
    try {
      return await api.post(`/shipping/shiprocket/${orderId}/push`);
    } catch (e) {
      // fallback route
      return api.post(`/shiprocket/create-shipment/${orderId}`);
    }
  },

  async syncTracking(orderId) {
    try {
      return await api.post(`/shipping/shiprocket/${orderId}/sync`);
    } catch (e) {
      // fallback route
      return api.get(`/shiprocket/track/${orderId}`);
    }
  },
};

export default shiprocketService;
