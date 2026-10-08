import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import tagService from "../../services/tagService";
import { slugify } from "../../components/ui/Slugify";

function normalizeList(res) {
  // supports: {data:{data:[]}} OR {data:[]} OR {data:{items:[]}}
  const d = res?.data?.data ?? res?.data?.items ?? res?.data ?? [];
  return Array.isArray(d) ? d : [];
}

const StatusBadge = ({ status, isActive }) => {
  const active =
    typeof isActive === "boolean"
      ? isActive
      : ["active", "true", "1"].includes(String(status || "").toLowerCase());

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full border ${
        active
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-gray-50 text-gray-700 border-gray-200"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
};


function TagModal({ open, mode, initial, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    status: "Active",
  });

  useEffect(() => {
    if (!open) return;
    setErr("");
    setSlugTouched(false); // ✅ reset
    setForm({
      name: initial?.name || "",
      slug: initial?.slug || (initial?.name ? slugify(initial.name) : ""),
      status: initial?.status || "Active",
    });
  }, [open, initial]);

  if (!open) return null;

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    const name = form.name.trim();
    if (!name) return setErr("Name is required");

    const slug = slugify((form.slug || name).trim());

    try {
      setSaving(true);

      const payload = { name, slug,status: "Active",
  isActive: true, };

      if (mode === "edit") {
        await tagService.update(initial.id, payload);
      } else {
        await tagService.create(payload);
      }

      onSaved?.();
      onClose?.();
    } catch (e2) {
      console.error(e2);
      setErr(e2?.response?.data?.message || e2.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-xl shadow-lg border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {mode === "edit" ? "Edit Tag" : "Create Tag"}
          </h2>
          <button className="px-2 py-1 border rounded" onClick={onClose} disabled={saving}>
            ✕
          </button>
        </div>

        {err && <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">{err}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                 
                setForm((p) => ({ ...p, name, slug: slugTouched ? p.slug : slugify(name),}));
              }}
              placeholder="e.g. Hair Care"
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
    setField("slug", e.target.value);
  }}
  onBlur={() => setField("slug", slugify(form.slug))}
  placeholder="hair-care"
  required
/>

          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-2 border rounded-lg" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="px-3 py-2 bg-black text-white rounded-lg disabled:opacity-60" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TagsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [editing, setEditing] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await tagService.list();
      setItems(normalizeList(res));
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message || "Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((t) => {
      return (
        String(t?.name || "").toLowerCase().includes(s) ||
        String(t?.slug || "").toLowerCase().includes(s)
      );
    });
  }, [items, q]);

  const openCreate = () => {
    setEditing(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEdit = (tag) => {
    setEditing(tag);
    setModalMode("edit");
    setModalOpen(true);
  };

 const toggleStatus = async (tag) => {
  try {
    // If backend uses boolean
    if (typeof tag.isActive === "boolean") {
      await tagService.updateStatus(tag.id, !tag.isActive);
    } else {
      const current = String(tag.status || "").toLowerCase();
      const next = current === "active" ? "Inactive" : "Active";
      await tagService.updateStatus(tag.id, next);
    }
    await fetchAll();
  } catch (e) {
    console.error(e);
    alert(e?.response?.data?.message || e.message || "Status update failed");
  }
};


  const remove = async (tag) => {
    const ok = confirm(`Delete tag "${tag.name}"?`);
    if (!ok) return;
    try {
      await tagService.remove(tag.id);
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || e.message || "Delete failed");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold">Tags</h1>
          <div className="text-sm text-gray-600">Create, edit and manage product tags.</div>
        </div>

        <button
          onClick={openCreate}
          className="px-3 py-2 bg-black text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      {err && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{err}</div>}

      <div className="bg-white border rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <input
            className="w-full md:max-w-sm border rounded-lg px-3 py-2"
            placeholder="Search by name or slug..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="text-sm text-gray-600">
            Total: <b>{filtered.length}</b>
          </div>
        </div>

        {loading ? (
          <div className="p-4 text-gray-600">Loading tags...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-gray-600">No tags found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Slug</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium">{t.name}</td>
                    <td className="py-2 pr-4 text-gray-700">{t.slug}</td>
                    <td className="py-2 pr-4">
                     <StatusBadge status={t.status} isActive={t.isActive} />

                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-2 py-1 border rounded hover:bg-gray-50 flex items-center gap-1"
                          onClick={() => openEdit(t)}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          className="px-2 py-1 border rounded hover:bg-gray-50 flex items-center gap-1"
                          onClick={() => toggleStatus(t)}
                          title="Activate/Deactivate"
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <button
                          className="px-2 py-1 border rounded hover:bg-gray-50 text-red-600 flex items-center gap-1"
                          onClick={() => remove(t)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TagModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        
        onClose={() => setModalOpen(false)}
        
        onSaved={fetchAll}
      />
    </div>
  );
}
