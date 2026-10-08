import api from "./api";

const tagService = {
  // GET /tags?search=&page=&limit=&isActive=
  list: (params) => api.get("/tags", { params }),

  // GET /tags/:id
  get: (id) => api.get(`/tags/${id}`),

  // POST /tags
  // payload: { name, slug, isActive? }
  create: (payload) => api.post("/tags", payload),

  // PUT /tags/:id
  update: (id, payload) => api.put(`/tags/${id}`, payload),

  // PATCH /tags/:id/active
  toggleActive: (id, isActive) => api.patch(`/tags/${id}/active`, { isActive }),

  // DELETE /tags/:id
  remove: (id) => api.delete(`/tags/${id}`),
};

export default tagService;
