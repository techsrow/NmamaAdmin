import api from "./api";

/* ---------------------------
   ADMIN COUPONS (matches backend)
   GET/POST /api/coupons/admin
   PUT/DELETE /api/coupons/admin/:id
---------------------------- */

export async function listCouponsAdmin() {
  const res = await api.get("/coupons/admin");
  return res.data; // { success, data }
}

export async function createCouponAdmin(payload) {
  const res = await api.post("/coupons/admin", payload);
  return res.data;
}

export async function updateCouponAdmin(id, payload) {
  const res = await api.put(`/coupons/admin/${id}`, payload);
  return res.data;
}

export async function disableCouponAdmin(id) {
  const res = await api.delete(`/coupons/admin/${id}`);
  return res.data;
}

/* ---------------------------
   PUBLIC APPLY
---------------------------- */

export async function applyCoupon(payload) {
  const res = await api.post("/coupons/apply", payload);
  return res.data;
}

/* ---------------------------
   PICKERS (adjust to your existing routes)
   These are placeholders—use your real admin list endpoints.
---------------------------- */

export async function listProductsForPicker(q = "") {
  const res = await api.get("/products/admin/all", {
    params: { q: q || undefined },
  });
  return res.data;
}

export async function listCategoriesForPicker() {
  const res = await api.get("/categories/admin/all");
  return res.data;
}

export async function listSubCategoriesForPicker(categoryId) {
  const res = await api.get("/subcategories/admin/all", {
    params: { categoryId: categoryId || undefined },
  });
  return res.data;
}
