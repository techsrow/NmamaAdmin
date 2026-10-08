import api from "./api";

const productService = {
  /* ------------------------------------
   * PRODUCTS
   * ---------------------------------- */

  // GET /products
  list: (params) => api.get("/products", { params }),

  // GET /products/:id
  get: (id) => api.get(`/products/${id}`),
  getById: (id) => api.get(`/products/${id}`),

  // POST /products
  create: (payload) => api.post("/products", payload),

  // PUT /products/:id
  update: (id, payload) => api.put(`/products/${id}`, payload),

  // PATCH /products/:id/active
  toggleActive: (id, isActive) =>
    api.patch(`/products/${id}/active`, { isActive }),

  // DELETE /products/:id
  remove: (id) => api.delete(`/products/${id}`),


  /* ------------------------------------
 * PRODUCT IMPORT / EXPORT
 * ---------------------------------- */

// EXPORT PRODUCTS
export: () =>
  api.get(
    "/admin/products/export",
    {
      responseType:
        "blob",
    }
  ),

// IMPORT PRODUCTS
import: (
  formData
) =>
  api.post(
    "/admin/products/import",
    formData
  ),

  /* ------------------------------------
   * PRODUCT TAGS
   * ---------------------------------- */

  updateTags: (productId, tagIds) =>
    api.put(`/products/${productId}/tags`, { tagIds }),

  /* ------------------------------------
   * PRODUCT IMAGES
   * ---------------------------------- */

  addImage: (productId, payload) =>
    api.post(`/products/${productId}/images`, payload),

  updateImage: (productId, imageId, payload) =>
    api.put(`/products/${productId}/images/${imageId}`, payload),

  setMainImage: (productId, imageId) =>
    api.patch(`/products/${productId}/images/${imageId}/main`),

  removeImage: (productId, imageId) =>
    api.delete(`/products/${productId}/images/${imageId}`),

  /* ------------------------------------
   * PRODUCT VARIANTS
   * ---------------------------------- */

  // GET variants
  getVariants: (productId) => {
    if (!productId) throw new Error("productId missing");
    return api.get(`/products/${Number(productId)}/variants`);
  },

  // ADD variant
  addVariant: (productId, payload) => {
    if (!productId) throw new Error("productId missing");

    return api.post(`/products/${Number(productId)}/variants`, {
      ...payload,
      price: Number(payload.price),
      discountPrice:
        payload.discountPrice === "" || payload.discountPrice == null
          ? null
          : Number(payload.discountPrice),
      stockQuantity: Number(payload.stockQuantity),
    });
  },

  // UPDATE variant
  updateVariant: (productId, variantId, payload) => {
    if (!productId || !variantId) {
      console.error("❌ Invalid IDs:", { productId, variantId });
      throw new Error("Invalid productId or variantId");
    }

    return api.put(
      `/products/${Number(productId)}/variants/${Number(variantId)}`,
      {
        ...payload,
        price: Number(payload.price),
        discountPrice:
          payload.discountPrice === "" || payload.discountPrice == null
            ? null
            : Number(payload.discountPrice),
        stockQuantity: Number(payload.stockQuantity),
      }
    );
  },

  // DELETE variant
  // deleteVariant: (productId, variantId) => {
  //   if (!productId || !variantId) {
  //     throw new Error("Invalid productId or variantId");
  //   }

  //   return api.delete(
  //     `/products/${Number(productId)}/variants/${Number(variantId)}`
  //   );
  // },


  deleteVariant: (productId, variantId) => {
  if (!variantId) {
    throw new Error("Invalid variantId");
  }

  return api.delete(`/products/variants/${Number(variantId)}`);
},
  /* ------------------------------------
   * PRODUCT COLORS
   * ---------------------------------- */

  // CREATE color group
  createColorGroup: (payload) =>
    api.post("/admin/product-colors", payload),

  // GET color groups by product
  getColorGroups: (productId) =>
    api.get(`/admin/product-colors/${productId}`),

  // GET images of a color group
  getColorImages: (colorGroupId) =>
    api.get(`/admin/product-colors/color-images/${colorGroupId}`),

  // ADD images to color group
  addColorImages: (payload) =>
    api.post("/admin/product-colors/color-images", payload),


  /* ------------------------------------
 * PRODUCT COLORS - PRO
 * ---------------------------------- */

// UPDATE color
updateColorGroup: (colorGroupId, payload) =>
  api.put(`/admin/product-colors/${colorGroupId}`, payload),

// DELETE color
deleteColorGroup: (colorGroupId) =>
  api.delete(`/admin/product-colors/${colorGroupId}`),

// DELETE color image
deleteColorImage: (imageId) =>
  api.delete(`/admin/product-colors/color-images/${imageId}`),

// SET MAIN IMAGE
setMainColorImage: (imageId) =>
  api.patch(`/admin/product-colors/color-images/${imageId}/main`),

  /* ------------------------------------
 * PRODUCT COLORS - PRO
 * ---------------------------------- */



  /* ------------------------------------
   * VARIANT IMAGES
   * ---------------------------------- */

  addVariantImage: (productId, variantId, payload) =>
    api.post(
      `/products/${productId}/variants/${variantId}/images`,
      payload
    ),

  removeVariantImage: (productId, variantId, imageId) =>
    api.delete(
      `/products/${productId}/variants/${variantId}/images/${imageId}`
    ),
};

export default productService;