import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit, Tag, Package, Image as ImageIcon } from "lucide-react";

import categoryService from "../../services/categoryService";
import mediaService from "../../services/mediaService";

import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Toggle from "../../components/ui/Toggle";
import { slugify } from "../../components/ui/Slugify";

export default function Categories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    imageUrl: "",
    isActive: true,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => `${x.name} ${x.slug}`.toLowerCase().includes(s));
  }, [items, search]);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      // ✅ IMPORTANT: admin list
      const res = await categoryService.list();
      const data = res?.data?.data || res?.data || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErr("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", imageUrl: "", isActive: true });
    setSlugTouched(false);
    setUploadPct(0);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || "",
      slug: row.slug || "",
      imageUrl: row.imageUrl || "",
      isActive: row.isActive ?? true,
    });
    setSlugTouched(true); // keep existing slug unless user edits it
    setUploadPct(0);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setErr("");
    setUploading(false);
    setUploadPct(0);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      setUploadPct(0);

      // ✅ make sure your mediaService has uploadCategoryImage()
      const res = await mediaService.uploadCategoryImage(file, (p) => setUploadPct(p));
      const uploaded = res?.data?.data || res?.data;

      // backend can return {url} or {secureUrl}
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
      const name = form.name.trim();
      if (!name) throw new Error("Name is required");

      const finalSlug = slugify((form.slug || name).trim());

      const payload = {
        name,
        slug: finalSlug,
        imageUrl: form.imageUrl?.trim() || null,
        isActive: !!form.isActive,
      };

      if (editing?.id) {
        await categoryService.update(editing.id, payload);
      } else {
        await categoryService.create(payload);
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
      await categoryService.toggleActive(row.id, next);
    } catch (e) {
      console.error(e);
      await load();
      alert(e?.response?.data?.message || "Failed to update status");
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
      await categoryService.remove(deleteTarget.id);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>

        <div className="flex items-center gap-3">
          <input
            className="border rounded-lg px-4 py-2 w-64"
            placeholder="Search category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={openCreate}
            className="bg-black text-white px-4 py-2 rounded-lg flex items-center hover:opacity-90 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {err && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((row) => (
          <div key={row.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="h-36 bg-gray-50 flex items-center justify-center">
              {row.imageUrl ? (
                <img src={row.imageUrl} alt={row.name} className="h-full w-full object-cover" />
              ) : (
                <div className="text-gray-400 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm">No image</span>
                </div>
              )}
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center">
                  <Tag className="w-6 h-6 text-black" />
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{row.name}</h3>
                    <div className="text-xs text-gray-500 font-mono">{row.slug}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(row)}
                    className="p-2 border rounded-lg hover:bg-gray-50"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => askDelete(row)}
                    className="p-2 border rounded-lg text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  {row?.subCategories?.length || 0} subcategories
                </div>

                <Toggle checked={!!row.isActive} onChange={() => toggleActive(row)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Tag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first category.</p>
          <div className="mt-6">
            <button
              onClick={openCreate}
              className="inline-flex items-center px-4 py-2 rounded-md text-white bg-black hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} title={editing ? "Edit Category" : "Add Category"} onClose={closeModal}>
        <form onSubmit={submit} className="space-y-4">
          {/* Image upload */}
          <div>
            <label className="text-sm font-medium">Category Image</label>

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
                setForm((p) => ({ ...p, slug: slugify(e.target.value) })); // ✅ always slugify
              }}
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
              <div className="text-xs text-gray-500">Show this category on store</div>
            </div>
            <Toggle checked={!!form.isActive} onChange={(val) => setForm((p) => ({ ...p, isActive: val }))} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="px-3 py-2 border rounded-lg">
              Cancel
            </button>
            <button className="px-3 py-2 bg-black text-white rounded-lg disabled:opacity-60" disabled={saving || uploading}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Category?"
        message={`This will disable "${deleteTarget?.name}".`}
        confirmText="Delete"
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
        loading={deleting}
      />
    </div>
  );
}
