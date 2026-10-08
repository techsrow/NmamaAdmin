import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit, Image as ImageIcon } from "lucide-react";

import subCategoryService from "../../services/subCategoryService";
import categoryService from "../../services/categoryService";
import mediaService from "../../services/mediaService";

import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Toggle from "../../components/ui/Toggle";
import { slugify } from "../../components/ui/Slugify";

export default function SubCategories() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    slug: "",
    imageUrl: "",
    isActive: true,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const [subRes, catRes] = await Promise.all([
        subCategoryService.list(), // should be /subcategories/admin/all
        categoryService.list(), // should be /categories/admin/all
      ]);

      const subData = subRes?.data?.data || subRes?.data || [];
      const catData = catRes?.data?.data || catRes?.data || [];

      setItems(Array.isArray(subData) ? subData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (e) {
      console.error(e);
      setErr("Failed to load subcategories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter((x) => {
      const matchesSearch = !s || `${x.name} ${x.slug}`.toLowerCase().includes(s);
      const matchesCategory =
        !filterCategoryId || String(x.categoryId) === String(filterCategoryId);
      return matchesSearch && matchesCategory;
    });
  }, [items, search, filterCategoryId]);

  const openCreate = () => {
    setEditing(null);
    setSlugTouched(false);
    setUploadPct(0);
    setForm({
      categoryId: filterCategoryId || "",
      name: "",
      slug: "",
      imageUrl: "",
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setSlugTouched(true);
    setUploadPct(0);
    setForm({
      categoryId: row.categoryId ? String(row.categoryId) : "",
      name: row.name || "",
      slug: row.slug || "",
      imageUrl: row.imageUrl || "",
      isActive: row.isActive ?? true,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSaving(false);
    setUploading(false);
    setUploadPct(0);
    setErr("");
  };

  const handleUpload = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadPct(0);

      // IMPORTANT:
      // mediaService.upload expects FormData in your code
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "subcategories");

      const res = await mediaService.upload(fd, {
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setUploadPct(pct);
        },
      });

      const uploaded = res?.data?.data;
      const url = uploaded?.secureUrl || uploaded?.url;

      if (!url) throw new Error("Upload failed: missing URL");
      setForm((p) => ({ ...p, imageUrl: url }));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || e.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setForm((p) => ({ ...p, imageUrl: "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");

    try {
      const categoryId = Number(form.categoryId);
      const name = form.name.trim();

      if (!categoryId) throw new Error("Category is required");
      if (!name) throw new Error("Name is required");

      const payload = {
        categoryId,
        name,
        slug: slugify((form.slug || name).trim()),
        imageUrl: form.imageUrl?.trim() || null,
        isActive: !!form.isActive,
      };

      if (editing?.id) {
        await subCategoryService.update(editing.id, payload);
      } else {
        await subCategoryService.create(payload);
      }

      closeModal();
      await load();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row) => {
    const next = !(row.isActive ?? true);

    // optimistic UI
    setItems((prev) => prev.map((x) => (x.id === row.id ? { ...x, isActive: next } : x)));

    try {
      if (typeof subCategoryService.toggleActive === "function") {
        await subCategoryService.toggleActive(row.id, next);
      } else {
        await subCategoryService.update(row.id, { isActive: next });
      }
    } catch (e) {
      console.error(e);
      await load();
      alert("Failed to update status");
    }
  };

  const askDelete = (row) => {
    setDeleteTarget(row);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await subCategoryService.remove(deleteTarget.id);
      setConfirmOpen(false);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-6">Loading subcategories...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">SubCategories</h1>
        <button onClick={openCreate} className="px-3 py-2 bg-black text-white rounded-lg">
          + Add SubCategory
        </button>
      </div>

      {err && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{err}</div>}

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <input
          className="border rounded-lg px-3 py-2 w-full md:max-w-md"
          placeholder="Search subcategory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border rounded-lg px-3 py-2 w-full md:max-w-xs"
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button onClick={load} className="px-3 py-2 border rounded-lg hover:bg-gray-50">
          Refresh
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3">ID</th>
              <th className="p-3">Image</th>
              <th className="p-3">Category</th>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Active</th>
              <th className="p-3 w-40">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.id}</td>

                <td className="p-3">
                  <div className="h-10 w-10 rounded border bg-gray-50 overflow-hidden flex items-center justify-center">
                    {row.imageUrl ? (
                      <img src={row.imageUrl} alt={row.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </td>

                <td className="p-3">
                  {categories.find((c) => String(c.id) === String(row.categoryId))?.name || "-"}
                </td>
                <td className="p-3 font-medium">{row.name}</td>
                <td className="p-3 text-gray-600">{row.slug}</td>
                <td className="p-3">
                  <Toggle checked={!!row.isActive} onChange={() => toggleActive(row)} />
                </td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => openEdit(row)}
                    className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => askDelete(row)}
                    className="px-3 py-1.5 border rounded-lg text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={7}>
                  No subcategories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        title={editing ? "Edit SubCategory" : "Add SubCategory"}
        onClose={closeModal}
      >
        <form onSubmit={submit} className="space-y-4">
          {/* Image upload */}
          <div>
            <label className="text-sm font-medium">SubCategory Image</label>

            <div className="mt-2 flex items-center gap-3">
              <div className="h-16 w-16 rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                  disabled={uploading}
                />
                {uploading && (
                  <div className="text-xs text-gray-600">
                    Uploading... {uploadPct ? `${uploadPct}%` : ""}
                  </div>
                )}

                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-sm text-red-600 hover:underline w-fit"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={form.categoryId}
              onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((p) => ({
                  ...p,
                  name,
                  slug: slugTouched ? p.slug : slugify(name),
                }));
              }}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Slug</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((p) => ({ ...p, slug: e.target.value }));
              }}
              onBlur={() => setForm((p) => ({ ...p, slug: slugify(p.slug) }))}
              placeholder="auto-generated"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              Example: <span className="font-mono">hair-care</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Active</div>
              <div className="text-xs text-gray-500">Show this subcategory on store</div>
            </div>
            <Toggle
              checked={!!form.isActive}
              onChange={(val) => setForm((p) => ({ ...p, isActive: val }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="px-3 py-2 border rounded-lg">
              Cancel
            </button>
            <button
              className="px-3 py-2 bg-black text-white rounded-lg disabled:opacity-60"
              disabled={saving || uploading}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete SubCategory?"
        message={`This will disable "${deleteTarget?.name}".`}
        confirmText="Delete"
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
        loading={deleting}
      />
    </div>
  );
}
