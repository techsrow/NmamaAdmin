import api from "./api"; // axios instance

export const dashboardService = {
  getStats: () => api.get("/admin/dashboard/stats"),
};
