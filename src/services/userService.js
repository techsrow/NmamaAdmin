import api from "./api";

const userService = {
  // GET /users?role=&search=&page=&limit=&isActive=
  list: (params) => api.get("/users", { params }),

  // GET /users/:id
  get: (id) => api.get(`/users/${id}`),

  // PATCH /users/:id/active { isActive }
  toggleActive: (id, isActive) => api.patch(`/users/${id}/active`, { isActive }),

  // PATCH /users/:id/role { role }  (Admin/Customer)
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
};

export default userService;
