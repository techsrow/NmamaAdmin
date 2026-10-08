import api from "./api";

const subCategoryService = {
  // GET /subcategories?categoryId=&search=&page=&limit=&isActive=
  list: (params) => api.get("/subcategories", { params }),

  // GET /subcategories/:id
  get: (id) => api.get(`/subcategories/${id}`),

  // POST /subcategories
  // payload: { categoryId, name, slug, isActive? }
  create: (payload) => api.post("/subcategories", payload),

  // PUT /subcategories/:id
  update: (id, payload) => api.put(`/subcategories/${id}`, payload),

  // PATCH /subcategories/:id/active
  toggleActive: (id, isActive) => api.patch(`/subcategories/${id}/active`, { isActive }),

  // DELETE /subcategories/:id
  remove: (id) => api.delete(`/subcategories/${id}`),
};

export default subCategoryService;
