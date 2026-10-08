import api from "./api";

const categoryService = {
  // GET /categories?search=&page=&limit=&isActive=
  list: (params) => api.get("/categories", { params }),

  // GET /categories/:id
  get: (id) => api.get(`/categories/${id}`),

  // POST /categories
  // payload: { name, slug, isActive? }
  create: (payload) => api.post("/categories", payload),

  // PUT /categories/:id
  update: (id, payload) => api.put(`/categories/${id}`, payload),

  // PATCH /categories/:id/active
  toggleActive: (id, isActive) => api.patch(`/categories/${id}/active`, { isActive }),

  // DELETE /categories/:id
  remove: (id) => api.delete(`/categories/${id}`),
};

export default categoryService;
