import api from "./api";

const couponService = {
  // GET /coupons?search=&page=&limit=&isActive=
  list: (params) => api.get("/coupons", { params }),

  // GET /coupons/:id
  get: (id) => api.get(`/coupons/${id}`),

  // POST /coupons
  // payload: { code, description, isActive, discountType, percentOff, amountOff, minOrderAmount, maxDiscount, startAt, endAt, usageLimit, usagePerUser }
  create: (payload) => api.post("/coupons", payload),

  // PUT /coupons/:id
  update: (id, payload) => api.put(`/coupons/${id}`, payload),

  // PATCH /coupons/:id/active { isActive }
  toggleActive: (id, isActive) => api.patch(`/coupons/${id}/active`, { isActive }),

  // DELETE /coupons/:id
  remove: (id) => api.delete(`/coupons/${id}`),

  // --------- MAPPINGS ----------
  // PUT /coupons/:id/products { productIds: [] }
  setProducts: (id, productIds) => api.put(`/coupons/${id}/products`, { productIds }),

  // PUT /coupons/:id/categories { categoryIds: [] }
  setCategories: (id, categoryIds) => api.put(`/coupons/${id}/categories`, { categoryIds }),

  // PUT /coupons/:id/subcategories { subCategoryIds: [] }
  setSubCategories: (id, subCategoryIds) =>
    api.put(`/coupons/${id}/subcategories`, { subCategoryIds }),
};

export default couponService;
