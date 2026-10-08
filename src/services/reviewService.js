import api from "./api";

const reviewService = {
  // GET /reviews?status=&productId=&userId=&search=&page=&limit=
  list: (params) => api.get("/reviews", { params }),

  // GET /reviews/:id
  get: (id) => api.get(`/reviews/${id}`),

  // PATCH /reviews/:id/status { status }  (Pending/Approved/Rejected)
  updateStatus: (id, status) => api.patch(`/reviews/${id}/status`, { status }),

  // PATCH /reviews/:id/active { isActive }
  toggleActive: (id, isActive) => api.patch(`/reviews/${id}/active`, { isActive }),

  // GET /reviews/:id/images (optional)
  images: (id) => api.get(`/reviews/${id}/images`),

  // DELETE /reviews/:id
  remove: (id) => api.delete(`/reviews/${id}`),
};

export default reviewService;
