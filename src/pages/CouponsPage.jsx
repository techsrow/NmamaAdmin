/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import CouponModal from "../components/coupons/CouponModal";
import {
  listCouponsAdmin,
  createCouponAdmin,
  updateCouponAdmin,
  disableCouponAdmin,
} from "../services/coupons";

/* ---------------------------
   Helpers
---------------------------- */

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function badgeClass(active) {
  return active ? "badge badge-success" : "badge badge-muted";
}

function getIsActive(c) {
  if (typeof c?.isActive === "boolean") return c.isActive;
  // fallback if any old data contains status string
  if (typeof c?.status === "string") return c.status === "Active";
  return false;
}

// UI value label for discount
function renderDiscountValue(c) {
  if (c.discountType === "PERCENT") {
    return `${c.percentOff ?? 0}%`;
  }
  return `₹${c.amountOff ?? 0}`;
}

function summarizeApply(c) {
  const p = c?.couponProducts?.length || 0;
  const cat = c?.couponCategories?.length || 0;
  const sub = c?.couponSubCategories?.length || 0;

  if (p === 0 && cat === 0 && sub === 0) return "All products";

  return [p ? `Products(${p})` : null, cat ? `Categories(${cat})` : null, sub ? `SubCategories(${sub})` : null]
    .filter(Boolean)
    .join(", ");
}

export default function CouponsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL"); // ALL | PERCENT | FLAT
  const [status, setStatus] = useState("ALL"); // ALL | Active | Inactive

  // modal state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
      setErr("");
      const res = await listCouponsAdmin(); // { success, data }
      setItems(res?.data || []);
    } catch (e) {
      setErr("Failed to load coupons. Check GET /api/coupons/admin");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Client-side filtering (backend list has no search params)
  const filteredItems = useMemo(() => {
    const query = q.trim().toUpperCase();

    return items.filter((c) => {
      // search by code
      const matchQ = query ? (c.code || "").toUpperCase().includes(query) : true;

      // type filter (discountType)
      const matchType = type === "ALL" ? true : c.discountType === type;

      // status filter (isActive)
      const active = getIsActive(c);
      const matchStatus =
        status === "ALL"
          ? true
          : status === "Active"
          ? active
          : !active;

      return matchQ && matchType && matchStatus;
    });
  }, [items, q, type, status]);

  const filteredCount = filteredItems.length;

  function handleCreate() {
    setMode("create");
    setCurrent(null);
    setOpen(true);
  }

  function handleEdit(c) {
    setMode("edit");
    setCurrent(c);
    setOpen(true);
  }

  async function handleToggle(c) {
    const id = c.id;
    const next = !getIsActive(c);

    try {
      // optimistic update
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, isActive: next } : x))
      );

      // backend: PUT /api/coupons/admin/:id
      await updateCouponAdmin(id, { isActive: next });
    } catch (e) {
      setErr("Failed to update status.");
      fetchData();
    }
  }

  async function handleDelete(c) {
    const ok = window.confirm(`Disable coupon "${c.code}"?`);
    if (!ok) return;

    try {
      // backend: DELETE /api/coupons/admin/:id (soft disable)
      await disableCouponAdmin(c.id);
      await fetchData();
    } catch (e) {
      setErr("Failed to disable coupon.");
    }
  }

  async function handleCopy(code) {
    try {
      await navigator.clipboard.writeText(code);
      alert(`Copied: ${code}`);
    } catch {
      alert("Copy failed. Please copy manually.");
    }
  }

  async function handleSave(payload) {
    try {
      setSaving(true);
      setErr("");

      if (mode === "create") {
        await createCouponAdmin(payload);
      } else {
        await updateCouponAdmin(current.id, payload);
      }

      setOpen(false);
      setCurrent(null);
      await fetchData();
    } catch (e) {
      setErr("Save failed. Check payload fields vs AdminCouponSchema.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Coupons</h1>
          <p className="muted">
            Create, map, activate/deactivate and manage usage limits.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Add Coupon
        </button>
      </div>

      <div className="card">
        <div className="toolbar">
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search code..."
          />

          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="PERCENT">Percent</option>
            <option value="FLAT">Flat</option>
          </select>

          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className="toolbar-right muted">
            Showing: <b>{filteredCount}</b>
          </div>
        </div>

        {err ? <div className="error">{err}</div> : null}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Order</th>
                <th>Max Discount</th>
                <th>Usage</th>
                <th>Validity</th>
                <th>Applies To</th>
                <th>Status</th>
                <th style={{ width: 260 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="muted">
                    Loading…
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="10" className="muted">
                    No coupons found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((c) => {
                  const active = getIsActive(c);
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="code-cell">
                          <b>{c.code}</b>
                          <button
                            className="btn btn-mini"
                            onClick={() => handleCopy(c.code)}
                          >
                            Copy
                          </button>
                        </div>
                      </td>

                      {/* backend field: discountType */}
                      <td>{c.discountType}</td>

                      {/* backend fields: percentOff / amountOff */}
                      <td>{renderDiscountValue(c)}</td>

                      {/* backend field: minOrderAmount */}
                      <td>
                        {c.minOrderAmount != null
                          ? `₹${c.minOrderAmount}`
                          : "-"}
                      </td>

                      {/* backend field: maxDiscount (only meaningful for percent) */}
                      <td>
                        {c.discountType === "PERCENT"
                          ? c.maxDiscount != null
                            ? `₹${c.maxDiscount}`
                            : "-"
                          : "-"}
                      </td>

                      {/* backend fields: usedCount, usageLimit */}
                      <td>
                        {(c.usedCount ?? 0)}
                        {c.usageLimit != null ? ` / ${c.usageLimit}` : " / ∞"}
                      </td>

                      {/* backend fields: startAt, endAt */}
                      <td>
                        <div className="small">
                          <div>
                            <span className="muted">From:</span>{" "}
                            {formatDate(c.startAt)}
                          </div>
                          <div>
                            <span className="muted">To:</span>{" "}
                            {formatDate(c.endAt)}
                          </div>
                        </div>
                      </td>

                      {/* based on relations included in list */}
                      <td>{summarizeApply(c)}</td>

                      <td>
                        <span className={badgeClass(active)}>
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="actions">
                          <button
                            className="btn btn-light"
                            onClick={() => handleEdit(c)}
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-light"
                            onClick={() => handleToggle(c)}
                          >
                            {active ? "Deactivate" : "Activate"}
                          </button>

                          {/* soft delete = disable */}
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(c)}
                          >
                            Disable
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CouponModal
        open={open}
        mode={mode}
        initial={current}
        onClose={() => {
          if (saving) return;
          setOpen(false);
          setCurrent(null);
        }}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
