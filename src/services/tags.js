import api from "./api";

// List tags (optionally filter by status=Active)
export async function getTags(params = {}) {
  const res = await api.get("/tags", { params });
  return res.data;
}

export async function createTag(payload) {
  const res = await api.post("/tags", payload);
  return res.data;
}

export async function updateTag(id, payload) {
  const res = await api.put(`/tags/${id}`, payload);
  return res.data;
}

export async function updateTagStatus(id, status) {
  const res = await api.patch(`/tags/${id}/status`, { status });
  return res.data;
}

export async function deleteTag(id) {
  const res = await api.delete(`/tags/${id}`);
  return res.data;
}
