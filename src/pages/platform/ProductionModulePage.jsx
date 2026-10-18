import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { adminPlatformService as api } from "../../services/adminPlatformService";
import "./production.css";

const arr = (v) => {
  const x = v?.data ?? v?.items ?? v?.results ?? v;
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.items)) return x.items;
  if (Array.isArray(x?.data)) return x.data;
  if (x && typeof x === "object" && Array.isArray(x.rows)) return x.rows;
  if (x && typeof x === "object" && Array.isArray(x.reports)) return x.reports;
  return x && typeof x === "object" ? [x] : [];
};
const pretty = (k) =>
  k
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase());
const scalar = (v) =>
  v == null
    ? "—"
    : typeof v === "boolean"
      ? v
        ? "Yes"
        : "No"
      : typeof v === "object"
        ? v.name || v.title || v.code || JSON.stringify(v)
        : String(v);
const errText = (e) =>
  e?.adminMessage ||
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  e?.message ||
  "Request failed";
const toPayload = (form, fields) => {
  const payload = {};
  for (const field of fields) {
    let v = form[field.name];
    if (field.type === "number" && v !== "" && v != null) v = Number(v);
    if (field.type === "textarea" && typeof v === "string") {
      const t = v.trim();
      if (
        (t.startsWith("{") && t.endsWith("}")) ||
        (t.startsWith("[") && t.endsWith("]"))
      ) {
        try {
          v = JSON.parse(t);
        } catch {
          /* keep text */
        }
      }
    }
    payload[field.name] = v;
  }
  return payload;
};

function Drawer({
  open,
  title,
  fields,
  value,
  onChange,
  onClose,
  onSave,
  saving,
  fieldOptions = {},
}) {
  if (!open) return null;
  return (
    <div
      className="pm-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="pm-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="pm-drawer-head">
          <div>
            <small>Namama Admin</small>
            <h2>{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <div className="pm-form">
          {fields.map((x) => (
            <label key={x.name} className={x.type === "textarea" ? "wide" : ""}>
              <span>{x.label}</span>
              {x.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={!!value[x.name]}
                  onChange={(e) =>
                    onChange({ ...value, [x.name]: e.target.checked })
                  }
                />
              ) : x.type === "select" ? (
                <select
                  value={value[x.name] ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, [x.name]: e.target.value })
                  }
                >
                  <option value="">Select {x.label}</option>
                  {(fieldOptions[x.name] || x.options || []).map((o) => (
                    <option key={typeof o === "object" ? o.value : o} value={typeof o === "object" ? o.value : o}>
                      {typeof o === "object" ? o.label : o}
                    </option>
                  ))}
                </select>
              ) : x.type === "textarea" ? (
                <textarea
                  rows="5"
                  value={
                    typeof value[x.name] === "object"
                      ? JSON.stringify(value[x.name], null, 2)
                      : (value[x.name] ?? "")
                  }
                  onChange={(e) =>
                    onChange({ ...value, [x.name]: e.target.value })
                  }
                />
              ) : (
                <input
                  type={x.type || "text"}
                  value={value[x.name] ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, [x.name]: e.target.value })
                  }
                />
              )}
            </label>
          ))}
        </div>
        <div className="pm-drawer-foot">
          <button className="pm-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="pm-btn primary" onClick={onSave} disabled={saving}>
            <Save size={16} />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductionModulePage({ config }) {
  const [tab, setTab] = useState(0),
    [rows, setRows] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [q, setQ] = useState(""),
    [page, setPage] = useState(1),
    [drawer, setDrawer] = useState(false),
    [editing, setEditing] = useState(null),
    [form, setForm] = useState({}),
    [saving, setSaving] = useState(false),
    [roleOptions, setRoleOptions] = useState([]);
  const refreshRoles = useCallback(async () => {
    const result = await api.get("/platform/admin/roles");
    setRoleOptions(arr(result).map(role => ({ value: String(role.id), label: role.name || `Role ${role.id}` })));
  }, []);
  const res = config.resources[tab]||config.resources[0];
  useEffect(() => {
    if (config.title === "Admin & Staff") refreshRoles().catch(e => setError(errText(e)));
  }, [config.title, refreshRoles]);
  const load = useCallback(
    async (pageToLoad = page, search = q) => {
      setLoading(true);
      setError("");
      try {
        if(res.unavailable){setRows([]);setError(res.unavailable);return;}
        setRows(
          arr(
            await api.get(res.path, {
              page: pageToLoad,
              limit: 25,
              search: search || undefined,
            }),
          ),
        );
      } catch (e) {
        setError(errText(e));
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [res.path, page, q],
  );
  useEffect(() => {
    setPage(1);
    setQ("");
    setDrawer(false);
    load(1, "");
  }, [tab, res.path]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = useMemo(
    () =>
      rows.filter(
        (x) => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase()),
      ),
    [rows, q],
  );
  const keys = useMemo(() => {
    const preferred = [
      "id",
      "name",
      "title",
      "code",
      "email",
      "type",
      "status",
      "price",
      "amount",
      "stockQuantity",
      "isActive",
      "createdAt",
    ];
    const all = [...new Set(filtered.flatMap((x) => Object.keys(x || {})))];
    return [
      ...preferred.filter((k) => all.includes(k)),
      ...all.filter((k) => !preferred.includes(k)),
    ].slice(0, 7);
  }, [filtered]);
  const openCreate = () => {
    setEditing(null);
    setForm(
      Object.fromEntries(
        res.fields.map((x) => [x.name, x.type === "checkbox" ? false : ""]),
      ),
    );
    setDrawer(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    setForm(Object.fromEntries(Object.entries(row).map(([k,v])=>[k, v&&typeof v==="object"?JSON.stringify(v,null,2):v])));
    setDrawer(true);
  };
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = toPayload(form, res.fields);
      if (res.key === "staff") {
        if (!payload.email?.trim()) throw new Error("Staff email is required");
        if (!payload.roleId || !Number.isInteger(Number(payload.roleId))) throw new Error("Select a valid staff role");
        payload.roleId = Number(payload.roleId);
        if (editing && !payload.password) delete payload.password;
        if (editing) {
          delete payload.password;
        }
      }
      if (res.key === "rules" && config.title === "Taxes & Invoicing") {
        if (!payload.name?.trim()) throw new Error("Tax rule name is required");
        if (!Number.isFinite(payload.rate) || payload.rate < 0 || payload.rate > 100) throw new Error("Tax rate must be between 0 and 100%");
      }
      if (res.key === "credit" && (!Number.isFinite(payload.amount) || payload.amount <= 0)) throw new Error("Credit note amount must be greater than zero");
      for(const field of res.fields){
        if(field.type==='password'&&!payload[field.name])delete payload[field.name];
        if(['date','datetime-local'].includes(field.type))payload[field.name]=payload[field.name]?new Date(payload[field.name]).toISOString():null;
        if(['permissions','events','countries'].includes(field.name)&&typeof payload[field.name]==='string')payload[field.name]=payload[field.name].split(',').map(x=>x.trim()).filter(Boolean);
      }
      if(res.integration){
        if(!payload.provider?.trim()||!payload.name?.trim())throw new Error('Provider and connection name are required.');
        await api.put(`${res.path}/${encodeURIComponent(payload.provider)}/${encodeURIComponent(payload.name)}`,payload);
      }else if(res.keyField){
        if(!payload[res.keyField]?.trim())throw new Error('Setting key is required.');
        await api.put(`${res.path}/${encodeURIComponent(payload[res.keyField])}`,payload);
      }else if(res.singleton)await api.put(res.path,payload);
      else if(editing?.id!=null)await api.patch(`${res.path}/${editing.id}`,payload);
      else await api.post(res.path,payload);
      setDrawer(false);
      await load();
      if (config.title === "Admin & Staff" && res.key === "roles") await refreshRoles();
    } catch (e) {
      setError(errText(e));
    } finally {
      setSaving(false);
    }
  };
  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.name || row.title || "this record"}?`))
      return;
    try {
      await api.delete(`${res.path}/${row.id}`);
      await load();
      if (config.title === "Admin & Staff" && res.key === "roles") await refreshRoles();
    } catch (e) {
      setError(errText(e));
    }
  };
  const changePage = (next) => {
    setPage(next);
    load(next, q);
  };
  return (
    <div className="pm-page">
      <div className="pm-title">
        <div>
          <p>STORE MANAGEMENT</p>
          <h1>{config.title}</h1>
          <span>{config.subtitle}</span>
        </div>
        <div className="pm-actions">
          <button
            className="pm-btn ghost"
            onClick={() => load()}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          {res.create !== false && (
            <button className="pm-btn primary" onClick={openCreate}>
              <Plus size={16} />
              Add {res.label.replace(/s$/, "")}
            </button>
          )}
        </div>
      </div>
      <div className="pm-tabs">
        {config.resources.map((x, i) => (
          <button
            className={i === tab ? "active" : ""}
            onClick={() => setTab(i)}
            key={x.key}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="pm-card">
        <div className="pm-toolbar">
          <div className="pm-search">
            <Search size={17} />
            <input
              placeholder={`Search ${res.label.toLowerCase()}…`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  load(1, q);
                }
              }}
            />
          </div>
          <div className="pm-count">{filtered.length} records</div>
        </div>
        {error && (
          <div className="pm-error">
            <AlertTriangle size={17} />
            <span>{error}</span>
          </div>
        )}
        {loading ? (
          <div className="pm-empty">Loading {res.label.toLowerCase()}…</div>
        ) : filtered.length ? (
          <div className="pm-table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  {keys.map((k) => (
                    <th key={k}>{pretty(k)}</th>
                  ))}
                  {(res.edit !== false || res.remove !== false) && (
                    <th className="right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id ?? i}>
                    {keys.map((k) => (
                      <td key={k}>
                        {k === "status" || k === "isActive" ? (
                          <span
                            className={`pm-status ${String(row[k]).toLowerCase()}`}
                          >
                            {scalar(row[k])}
                          </span>
                        ) : (
                          <span title={scalar(row[k])}>
                            {scalar(row[k]).slice(0, 80)}
                          </span>
                        )}
                      </td>
                    ))}
                    {(res.edit !== false || res.remove !== false) && (
                      <td className="right">
                        <div className="pm-row-actions">
                          {res.edit !== false && row.id != null && (
                            <button onClick={() => openEdit(row)} title="Edit">
                              <Pencil size={16} />
                            </button>
                          )}
                          {res.remove !== false && row.id != null && (
                            <button
                              className="danger"
                              onClick={() => remove(row)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pm-empty">
            <div>Nothing here yet</div>
            <p>
              {res.create !== false
                ? "Create your first record to get started."
                : "No records returned for this view."}
            </p>
            {res.create !== false && (
              <button className="pm-btn primary" onClick={openCreate}>
                <Plus size={16} />
                Add {res.label.replace(/s$/, "")}
              </button>
            )}
          </div>
        )}
        <div className="pm-pagination">
          <button
            disabled={page === 1 || loading}
            onClick={() => changePage(page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>Page {page}</span>
          <button
            disabled={loading || rows.length < 25}
            onClick={() => changePage(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <Drawer
        fieldOptions={{ roleId: roleOptions }}
        open={drawer}
        title={`${editing ? "Edit" : "Add"} ${res.label.replace(/s$/, "")}`}
        fields={res.fields}
        value={form}
        onChange={setForm}
        onClose={() => setDrawer(false)}
        onSave={save}
        saving={saving}
      />
    </div>
  );
}
