/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import {
  listProductsForPicker,
  listCategoriesForPicker,
  listSubCategoriesForPicker,
} from "../../services/coupons";

const TYPE_OPTIONS = [
  { label: "Percent (%)", value: "PERCENT" },
  { label: "Flat (₹)", value: "FLAT" },
];

const APPLY_OPTIONS = [
  { label: "All Products", value: "ALL" },
  { label: "Selected Products", value: "PRODUCTS" },
  { label: "Category", value: "CATEGORY" },
  { label: "SubCategory", value: "SUBCATEGORY" },
];

function toInputDateTime(value) {
  // value can be ISO string; convert to yyyy-MM-ddTHH:mm for datetime-local
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromInputDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function CouponModal({
  open,
  mode, // "create" | "edit"
  initial,
  onClose,
  onSave,
  saving,
}) {
  const isEdit = mode === "edit";

  const [code, setCode] = useState("");
  const [type, setType] = useState("PERCENT");
  const [value, setValue] = useState(10);

  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usagePerUser, setUsagePerUser] = useState("");

  const [usageLimit, setUsageLimit] = useState("");

  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  const [isActive, setIsActive] = useState(true);

  const [applyTo, setApplyTo] = useState("ALL");
  const [productQuery, setProductQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");

  const [subCategories, setSubCategories] = useState([]);
  const [subCategoryId, setSubCategoryId] = useState("");

  const [loadingPickers, setLoadingPickers] = useState(false);
  const [pickerError, setPickerError] = useState("");

  useEffect(() => {
    if (!open) return;

    setCode((initial?.code || "").toUpperCase());
    setType(initial?.type || "PERCENT");
    setValue(
      typeof initial?.value === "number"
        ? initial.value
        : initial?.value
        ? Number(initial.value)
        : 10
    );

    setMinOrderValue(
      initial?.minOrderValue != null ? String(initial.minOrderValue) : ""
    );
    setMaxDiscount(
      initial?.maxDiscount != null ? String(initial.maxDiscount) : ""
    );
    setUsageLimit(initial?.usageLimit != null ? String(initial.usageLimit) : "");

    setValidFrom(toInputDateTime(initial?.validFrom));
    setValidTo(toInputDateTime(initial?.validTo));

    setIsActive(
      typeof initial?.isActive === "boolean"
        ? initial.isActive
        : initial?.status
        ? initial.status === "Active"
        : true
    );

    // Mapping: support a couple backend shapes
    const initApply =
      initial?.applyTo ||
      initial?.scope ||
      (initial?.productIds?.length
        ? "PRODUCTS"
        : initial?.categoryId
        ? "CATEGORY"
        : initial?.subCategoryId
        ? "SUBCATEGORY"
        : "ALL");

    setApplyTo(initApply);

    setSelectedProductIds(initial?.productIds || initial?.productIdsCsv || []);
    setCategoryId(initial?.categoryId ? String(initial.categoryId) : "");
    setSubCategoryId(initial?.subCategoryId ? String(initial.subCategoryId) : "");

    setProductQuery("");
    setPickerError("");
  }, [open, initial]);

  const needsProducts = applyTo === "PRODUCTS";
  const needsCategories = applyTo === "CATEGORY" || applyTo === "SUBCATEGORY";
  const needsSubCategories = applyTo === "SUBCATEGORY";

  // Load categories when modal opens (or when applyTo needs it)
  useEffect(() => {
    if (!open) return;
    if (!needsCategories) return;

    (async () => {
      try {
        setLoadingPickers(true);
        setPickerError("");
        const data = await listCategoriesForPicker();
        const list = Array.isArray(data) ? data : data?.items || data?.data || [];
        setCategories(list);
      } catch (e) {
        setPickerError("Failed to load categories.");
      } finally {
        setLoadingPickers(false);
      }
    })();
  }, [open, needsCategories]);

  // Load subcategories when category selected and applyTo is SUBCATEGORY
  useEffect(() => {
    if (!open) return;
    if (!needsSubCategories) return;

    (async () => {
      try {
        setLoadingPickers(true);
        setPickerError("");
        const data = await listSubCategoriesForPicker(categoryId);
        const list = Array.isArray(data) ? data : data?.items || data?.data || [];
        setSubCategories(list);
      } catch (e) {
        setPickerError("Failed to load sub-categories.");
      } finally {
        setLoadingPickers(false);
      }
    })();
  }, [open, needsSubCategories, categoryId]);

  // Debounced products search
  useEffect(() => {
    if (!open) return;
    if (!needsProducts) return;

    const t = setTimeout(async () => {
      try {
        setLoadingPickers(true);
        setPickerError("");
        const data = await listProductsForPicker(productQuery);
        const list = Array.isArray(data) ? data : data?.items || data?.data || [];
        setProducts(list);
      } catch (e) {
        setPickerError("Failed to load products.");
      } finally {
        setLoadingPickers(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [open, needsProducts, productQuery]);

  const computedValueLabel = useMemo(() => {
    if (type === "PERCENT") return "Value (%)";
    return "Value (₹)";
  }, [type]);

  const canSave = useMemo(() => {
    if (!code.trim()) return false;
    if (!value || Number(value) <= 0) return false;
    if (type === "PERCENT" && Number(value) > 100) return false;
    if (applyTo === "PRODUCTS" && selectedProductIds.length === 0) return false;
    if (applyTo === "CATEGORY" && !categoryId) return false;
    if (applyTo === "SUBCATEGORY" && !subCategoryId) return false;
    if (validFrom && validTo) {
      const a = new Date(validFrom).getTime();
      const b = new Date(validTo).getTime();
      if (!Number.isNaN(a) && !Number.isNaN(b) && b <= a) return false;
    }
    return true;
  }, [code, value, type, applyTo, selectedProductIds, categoryId, subCategoryId, validFrom, validTo]);

  function toggleProduct(id) {
    setSelectedProductIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

 async function handleSubmit(e) {
  e?.preventDefault?.();

  const discountType = type; // keep UI select values: "PERCENT" | "FLAT"

  const payload = {
    code: code.trim().toUpperCase(),
    // description: description?.trim?.() || null, // add description input if you want
    isActive: !!isActive,

    discountType,

    // percentOff / amountOff
    percentOff: discountType === "PERCENT" ? Number(value) : null,
    amountOff: discountType === "FLAT" ? Number(value) : null,

    minOrderAmount: minOrderValue === "" ? null : Number(minOrderValue),
    maxDiscount: maxDiscount === "" ? null : Number(maxDiscount),

    startAt: validFrom ? new Date(validFrom).toISOString() : null,
    endAt: validTo ? new Date(validTo).toISOString() : null,

    usageLimit: usageLimit === "" ? null : Number(usageLimit),
    usagePerUser: usagePerUser === "" ? null : Number(usagePerUser),

    // mappings (your API supports multi arrays)
    productIds: applyTo === "PRODUCTS" ? selectedProductIds : [],
    categoryIds: applyTo === "CATEGORY" ? [Number(categoryId)] : [],
    subCategoryIds: applyTo === "SUBCATEGORY" ? [Number(subCategoryId)] : [],
  };

  onSave(payload);
}


  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h2>{isEdit ? "Edit Coupon" : "Create Coupon"}</h2>
          <button className="btn btn-light" onClick={onClose} disabled={saving}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="grid-2">
            <div className="field">
              <label>Coupon Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="E.g. REPUBLICDAY"
              />
              <div className="hint">Auto-uppercase. Avoid spaces.</div>
            </div>

            <div className="field">
              <label>Status</label>
              <select value={isActive ? "Active" : "Inactive"} onChange={(e) => setIsActive(e.target.value === "Active")}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>{computedValueLabel}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                min="1"
                max={type === "PERCENT" ? "100" : undefined}
              />
              {type === "PERCENT" && (
                <div className="hint">Percent must be ≤ 100</div>
              )}
            </div>
          </div>

          <div className="grid-3">
            <div className="field">
              <label>Min Order Value (optional)</label>
              <input
                type="number"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                min="0"
              />
            </div>

            <div className="field">
              <label>Max Discount (optional)</label>
              <input
                type="number"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                min="0"
                disabled={type !== "PERCENT"}
              />
              <div className="hint">
                {type !== "PERCENT"
                  ? "Only for Percent coupons"
                  : "Caps discount amount"}
              </div>
            </div>

           <div className="field">
  <label>Usage Per User (optional)</label>
  <input
    type="number"
    value={usagePerUser}
    onChange={(e) => setUsagePerUser(e.target.value)}
    min="0"
  />
</div>

          </div>

          <div className="grid-2">
            <div className="field">
              <label>Valid From (optional)</label>
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Valid To (optional)</label>
              <input
                type="datetime-local"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
              />
              <div className="hint">Valid To must be after Valid From</div>
            </div>
          </div>

          <hr className="divider" />

          <div className="field">
            <label>Apply To</label>
            <select
              value={applyTo}
              onChange={(e) => {
                setApplyTo(e.target.value);
                // reset mapping fields when switching
                setSelectedProductIds([]);
                setCategoryId("");
                setSubCategoryId("");
              }}
            >
              {APPLY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {pickerError ? <div className="error">{pickerError}</div> : null}

          {needsProducts && (
            <div className="picker">
              <div className="picker-top">
                <label>Pick Products</label>
                <input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search products..."
                />
              </div>

              <div className="picker-list">
                {loadingPickers ? (
                  <div className="muted">Loading products…</div>
                ) : products.length === 0 ? (
                  <div className="muted">No products found.</div>
                ) : (
                  products.map((p) => {
                    const id = p.id ?? p.productId;
                    const name = p.name ?? p.title ?? `#${id}`;
                    const checked = selectedProductIds.includes(id);
                    return (
                      <label key={id} className="picker-item">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(id)}
                        />
                        <span>{name}</span>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="hint">
                Selected: <b>{selectedProductIds.length}</b>
              </div>
            </div>
          )}

          {needsCategories && (
            <div className="grid-2">
              <div className="field">
                <label>Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubCategoryId("");
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {needsSubCategories ? (
                <div className="field">
                  <label>SubCategory</label>
                  <select
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    disabled={!categoryId}
                  >
                    <option value="">Select SubCategory</option>
                    {subCategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canSave || saving}>
              {saving ? "Saving..." : isEdit ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
