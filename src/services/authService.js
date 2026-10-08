import api from "./api";

export const authService = {
  // POST /api/auth/login
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data; // { success, data: { token, user } }
  },

  // POST /api/auth/logout
  logout: async () => {
    const res = await api.post("/auth/logout");
    return res.data;
  },

  // GET /api/auth/profile
  getProfile: async () => {
    const res = await api.get("/auth/profile");
    return res.data; // { success, data: user }
  },

  // POST /api/auth/password/forgot
  forgotPassword: async (email) => {
    const res = await api.post("/auth/password/forgot", { email });
    return res.data;
  },

  // POST /api/auth/password/reset
  resetPassword: async (token, newPassword) => {
    const res = await api.post("/auth/password/reset", { token, newPassword });
    return res.data;
  },

  // GET /api/auth/verify-email?token=...
  verifyEmail: async (token) => {
    const res = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    return res.data;
  },

  // POST /api/auth/resend-verification
  resendVerification: async (email) => {
    const res = await api.post("/auth/resend-verification", { email });
    return res.data;
  },
};
