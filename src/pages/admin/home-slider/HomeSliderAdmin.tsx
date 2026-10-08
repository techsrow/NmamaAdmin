import React, { useEffect, useMemo, useState } from "react";
import styles from "./HomeSliderAdmin.module.css";

type Device = "DESKTOP" | "MOBILE";

type SliderItem = {
  id: string;
  sliderId: string;
  device: Device;
  imageUrl: string;
  heading: string | null;
  subHeading: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type SliderResponse = {
  desktop: SliderItem[];
  mobile: SliderItem[];
};

// ✅ API base from Vite env
// Example: VITE_API_URL=https://api.crescenthealthcare.co.in/api
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// ✅ Full endpoint
// => https://api.crescenthealthcare.co.in/api/home-slider
const ENDPOINT = `${API_BASE}/home-slider`;

const emptyForm = {
  id: "",
  device: "DESKTOP" as Device,
  imageUrl: "",
  heading: "",
  subHeading: "",
  ctaText: "",
  ctaHref: "",
  isActive: true,
  sortOrder: 0,
};

// ✅ safer JSON parser to avoid "Unexpected token <"
async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `API did not return JSON.\nStatus: ${res.status}\nContent-Type: ${ct}\n\n${text.slice(0, 300)}`
    );
  }

  const json = await res.json();
  return json;
}

export default function HomeSliderAdmin() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Device>("DESKTOP");
  const [data, setData] = useState<SliderResponse>({ desktop: [], mobile: [] });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const list = useMemo(() => {
    return activeTab === "DESKTOP" ? data.desktop : data.mobile;
  }, [activeTab, data]);

  async function fetchSlider() {
    setLoading(true);
    try {
      // ✅ Correct URL
      const res = await fetch(ENDPOINT, { cache: "no-store" });
      const json = await safeJson(res);

      if (!json?.success) throw new Error(json?.message || "Failed to load slider");

      setData({
        desktop: json.data?.desktop ?? [],
        mobile: json.data?.mobile ?? [],
      });
    } catch (err: any) {
      alert(err?.message || "Failed to load slider");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSlider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setIsEdit(false);
    setForm({ ...emptyForm, device: activeTab, sortOrder: list.length + 1 });
    setIsFormOpen(true);
  }

  function openEdit(item: SliderItem) {
    setIsEdit(true);
    setForm({
      id: item.id,
      device: item.device,
      imageUrl: item.imageUrl,
      heading: item.heading ?? "",
      subHeading: item.subHeading ?? "",
      ctaText: item.ctaText ?? "",
      ctaHref: item.ctaHref ?? "",
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setForm({ ...emptyForm });
  }

  function normalizeNullable(v: string) {
    const trimmed = v.trim();
    return trimmed.length ? trimmed : null;
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();

    if (!form.imageUrl.trim()) {
      alert("imageUrl is required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        device: form.device,
        imageUrl: form.imageUrl.trim(),
        heading: normalizeNullable(form.heading),
        subHeading: normalizeNullable(form.subHeading),
        ctaText: normalizeNullable(form.ctaText),
        ctaHref: normalizeNullable(form.ctaHref),
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (!isEdit) {
        // ✅ Correct URL: /home-slider/items
        const res = await fetch(`${ENDPOINT}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await safeJson(res);
        if (!json?.success) throw new Error(json?.message || "Create failed");
      } else {
        // ✅ Correct URL: /home-slider/items/:id
        const res = await fetch(`${ENDPOINT}/items/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await safeJson(res);
        if (!json?.success) throw new Error(json?.message || "Update failed");
      }

      closeForm();
      await fetchSlider();
    } catch (err: any) {
      alert(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(id: string) {
    if (!confirm("Delete this slider item?")) return;

    setLoading(true);
    try {
      // ✅ Correct URL: /home-slider/items/:id
      const res = await fetch(`${ENDPOINT}/items/${id}`, { method: "DELETE" });
      const json = await safeJson(res);
      if (!json?.success) throw new Error(json?.message || "Delete failed");

      await fetchSlider();
    } catch (err: any) {
      alert(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ----- ORDER MANAGEMENT (simple up/down) -----
  function moveUp(index: number) {
    if (index <= 0) return;
    const arr = [...list];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    setListToState(arr);
  }

  function moveDown(index: number) {
    if (index >= list.length - 1) return;
    const arr = [...list];
    [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
    setListToState(arr);
  }

  function setListToState(arr: SliderItem[]) {
    if (activeTab === "DESKTOP") setData((d) => ({ ...d, desktop: arr }));
    else setData((d) => ({ ...d, mobile: arr }));
  }

  async function saveOrder() {
    setLoading(true);
    try {
      const items = list.map((it, idx) => ({
        id: it.id,
        sortOrder: idx + 1,
      }));

      // ✅ Correct URL: /home-slider/reorder
      const res = await fetch(`${ENDPOINT}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device: activeTab, items }),
      });

      const json = await safeJson(res);
      if (!json?.success) throw new Error(json?.message || "Reorder failed");

      await fetchSlider();
      alert("Order saved!");
    } catch (err: any) {
      alert(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Home Slider Admin</h1>
          <p className={styles.p}>Manage Desktop & Mobile slider images (CRUD + order).</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.btn} onClick={openAdd} disabled={loading}>
            + Add Item
          </button>
          <button className={styles.btnOutline} onClick={saveOrder} disabled={loading || list.length === 0}>
            Save Order
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "DESKTOP" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("DESKTOP")}
        >
          Desktop
        </button>
        <button
          className={`${styles.tab} ${activeTab === "MOBILE" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("MOBILE")}
        >
          Mobile
        </button>
      </div>

      <div className={styles.card}>
        {loading && <div className={styles.loading}>Loading...</div>}

        {!loading && list.length === 0 && (
          <div className={styles.empty}>
            No {activeTab.toLowerCase()} items yet. Click <b>Add Item</b>.
          </div>
        )}

        {!loading && list.length > 0 && (
          <div className={styles.table}>
            <div className={styles.trHead}>
              <div>Order</div>
              <div>Preview</div>
              <div>Image URL</div>
              <div>Active</div>
              <div>Actions</div>
            </div>

            {list.map((item, idx) => (
              <div key={item.id} className={styles.tr}>
                <div className={styles.orderCell}>
                  <div className={styles.orderNum}>{idx + 1}</div>
                  <div className={styles.orderBtns}>
                    <button className={styles.iconBtn} onClick={() => moveUp(idx)} disabled={idx === 0}>
                      ↑
                    </button>
                    <button
                      className={styles.iconBtn}
                      onClick={() => moveDown(idx)}
                      disabled={idx === list.length - 1}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className={styles.preview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt="" className={styles.img} />
                </div>

                <div className={styles.url}>
                  <div className={styles.urlText}>{item.imageUrl}</div>
                  {(item.heading || item.subHeading) && (
                    <div className={styles.meta}>
                      {item.heading && (
                        <span>
                          <b>H:</b> {item.heading}
                        </span>
                      )}
                      {item.subHeading && (
                        <span>
                          <b>S:</b> {item.subHeading}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.active}>{item.isActive ? "Yes" : "No"}</div>

                <div className={styles.rowActions}>
                  <button className={styles.smallBtn} onClick={() => openEdit(item)}>
                    Edit
                  </button>
                  <button className={styles.smallBtnDanger} onClick={() => removeItem(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className={styles.modalBackdrop} onMouseDown={closeForm}>
          <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h2 className={styles.h2}>{isEdit ? "Update Item" : "Add Item"}</h2>
              <button className={styles.closeBtn} onClick={closeForm}>
                ×
              </button>
            </div>

            <form onSubmit={submitForm} className={styles.form}>
              <label className={styles.label}>
                Device
                <select
                  className={styles.input}
                  value={form.device}
                  onChange={(e) => setForm((f) => ({ ...f, device: e.target.value as Device }))}
                >
                  <option value="DESKTOP">DESKTOP</option>
                  <option value="MOBILE">MOBILE</option>
                </select>
              </label>

              <label className={styles.label}>
                Image URL <span className={styles.req}>*</span>
                <input
                  className={styles.input}
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://cdn.../image.jpg"
                />
              </label>

              <div className={styles.grid2}>
                <label className={styles.label}>
                  Heading (optional)
                  <input
                    className={styles.input}
                    value={form.heading}
                    onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))}
                    placeholder="nullable"
                  />
                </label>

                <label className={styles.label}>
                  Sub Heading (optional)
                  <input
                    className={styles.input}
                    value={form.subHeading}
                    onChange={(e) => setForm((f) => ({ ...f, subHeading: e.target.value }))}
                    placeholder="nullable"
                  />
                </label>
              </div>

              <div className={styles.grid2}>
                <label className={styles.label}>
                  CTA Text (optional)
                  <input
                    className={styles.input}
                    value={form.ctaText}
                    onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
                    placeholder="nullable"
                  />
                </label>

                <label className={styles.label}>
                  CTA Href (optional)
                  <input
                    className={styles.input}
                    value={form.ctaHref}
                    onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))}
                    placeholder="/contact or tel:+971..."
                  />
                </label>
              </div>

              <div className={styles.grid2}>
                <label className={styles.label}>
                  Sort Order (optional)
                  <input
                    className={styles.input}
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  />
                </label>

                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Active
                </label>
              </div>

              <div className={styles.formActions}>
                <button className={styles.btn} type="submit" disabled={loading}>
                  {isEdit ? "Update" : "Create"}
                </button>
                <button className={styles.btnOutline} type="button" onClick={closeForm} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
