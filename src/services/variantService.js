import api from "./api";

const variantService = {
  // GET /variants?productId=&search=&page=&limit=&isActive=
  list: (params) => api.get("/variants", { params }),

  // GET /variants/:id
  get: (id) => api.get(`/variants/${id}`),

  // GET /products/:productId/variants
  listByProduct: (productId, params) =>
    api.get(`/products/${productId}/variants`, { params }),

  // POST /products/:productId/variants
  // payload: { weight,size,color,colorHex,colorImageUrl,price,discountPrice,stockQuantity,lowStockAlertAt,sku,isActive }
  createForProduct: (productId, payload) =>
    api.post(`/products/${productId}/variants`, payload),

  // PUT /variants/:id
  update: (id, payload) => api.put(`/variants/${id}`, payload),

  // PATCH /variants/:id/active
  toggleActive: (id, isActive) => api.patch(`/variants/${id}/active`, { isActive }),

  // DELETE /variants/:id
  remove: (id) => api.delete(`/variants/${id}`),

  // GET /variants/low-stock
  lowStock: (params) => api.get("/variants/low-stock", { params }),

  // ---------- VARIANT IMAGES ----------
  // POST /variants/:id/images
  addImage: (id, payload) => api.post(`/variants/${id}/images`, payload),

  // PUT /variants/:id/images/:imageId
  updateImage: (id, imageId, payload) => api.put(`/variants/${id}/images/${imageId}`, payload),

  // DELETE /variants/:id/images/:imageId
  removeImage: (id, imageId) => api.delete(`/variants/${id}/images/${imageId}`),
};

export default variantService;
