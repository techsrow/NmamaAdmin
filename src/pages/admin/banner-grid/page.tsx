import React, { useEffect, useMemo, useState } from "react";

type BannerGridPayload = {
  banner1ImageUrl: string;
  banner1CtaUrl: string;
  banner2ImageUrl: string;
  banner2CtaUrl: string;
};

const EMPTY: BannerGridPayload = {
  banner1ImageUrl: "",
  banner1CtaUrl: "",
  banner2ImageUrl: "",
  banner2CtaUrl: "",
};

export default function AdminBannerGridPage() {
  // ✅ single API_BASE only (Vite env)
  const API_BASE = useMemo(() => {
    return (import.meta.env.VITE_API_URL || "https://api.nmama.in/api").replace(/\/$/, "");
  }, []);

  const [form, setForm] = useState<BannerGridPayload>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // ✅ If env already contains /api (example: http://localhost:6001/api)
  // then DO NOT add /api again here.
  const apiUrl = API_BASE ? `${API_BASE}/banner-grid` : "";

  const onChange =
    (key: keyof BannerGridPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
    };

  const isValidHttpUrl = (v: string) => /^https?:\/\/.+/i.test(v);

  // ✅ image preview helper (handles invalid/broken url safely)
  const ImagePreview = ({ src, alt }: { src: string; alt: string }) => {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
      setFailed(false); // reset if URL changes
    }, [src]);

    const canShow = !!src && isValidHttpUrl(src) && !failed;

    return (
      <div
        style={{
          marginTop: 12,
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid #eee",
          height: 170,
          background: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {canShow ? (
          <img
            src={src}
            alt={alt}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setFailed(true)}
          />
        ) : (
          <span style={{ color: "#999", fontSize: 13 }}>
            {src ? "Invalid / broken image URL" : "Paste image URL to preview"}
          </span>
        )}
      </div>
    );
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!apiUrl) {
        setMsg("Missing VITE_API_URL in admin .env");
        setLoading(false);
        return;
      }

      setLoading(true);
      setMsg("");

      try {
        const res = await fetch(apiUrl, { cache: "no-store" });
        const json = await res.json();

        if (!alive) return;

        if (!res.ok) {
          setMsg(json?.message || "Failed to load banner grid.");
          setForm(EMPTY);
        } else {
          setForm({
            banner1ImageUrl: json?.data?.banner1ImageUrl || "",
            banner1CtaUrl: json?.data?.banner1CtaUrl || "",
            banner2ImageUrl: json?.data?.banner2ImageUrl || "",
            banner2CtaUrl: json?.data?.banner2CtaUrl || "",
          });
        }
      } catch (e) {
        if (!alive) return;
        setMsg("API not reachable. Check VITE_API_URL + backend CORS.");
        setForm(EMPTY);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [apiUrl]);

  const validate = () => {
    const errors: string[] = [];
    if (!isValidHttpUrl(form.banner1ImageUrl))
      errors.push("Banner 1 image URL must be a full http/https URL.");
    if (!isValidHttpUrl(form.banner1CtaUrl))
      errors.push("Banner 1 CTA URL must be a full http/https URL.");
    if (!isValidHttpUrl(form.banner2ImageUrl))
      errors.push("Banner 2 image URL must be a full http/https URL.");
    if (!isValidHttpUrl(form.banner2CtaUrl))
      errors.push("Banner 2 CTA URL must be a full http/https URL.");
    return errors;
  };

  const onSave = async () => {
    setMsg("");

    if (!apiUrl) {
      setMsg("Missing VITE_API_URL in admin .env");
      return;
    }

    const errors = validate();
    if (errors.length) {
      setMsg(errors.join(" "));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        setMsg(json?.message || JSON.stringify(json?.errors || "Failed to save"));
        return;
      }

      setMsg("✅ Saved successfully.");
    } catch (e) {
      setMsg("Failed to save. API not reachable / CORS issue.");
    } finally {
      setSaving(false);
    }
  };

  if (!API_BASE) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Banner Grid Admin</h1>
        <p style={{ color: "#b00020" }}>
          Missing <b>VITE_API_URL</b> in <code>.env</code>
        </p>
        <p style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
          Example: <code>VITE_API_URL=http://localhost:6001/api</code>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>Banner Grid</h1>
          <p style={{ marginTop: 6, color: "#555" }}>Manage 2 homepage banners (Image URL + CTA URL)</p>
          <p style={{ marginTop: 6, color: "#777", fontSize: 13 }}>
            API: <code>{apiUrl}</code>
          </p>
        </div>

        <button
          onClick={onSave}
          disabled={loading || saving}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: loading || saving ? "not-allowed" : "pointer",
            background: "#111",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {msg ? (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #eee",
            background: msg.startsWith("✅") ? "#f0fff4" : "#fff5f5",
            color: msg.startsWith("✅") ? "#0f5132" : "#b00020",
          }}
        >
          {msg}
        </div>
      ) : null}

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Banner 1 */}
        <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 16, background: "#fff" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Banner 1</h2>

          <label style={{ display: "block", marginTop: 12, fontSize: 13, color: "#444" }}>Image URL</label>
          <input
            value={form.banner1ImageUrl}
            onChange={onChange("banner1ImageUrl")}
            placeholder="https://..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", marginTop: 6 }}
          />

          {/* ✅ Preview */}
          <ImagePreview src={form.banner1ImageUrl} alt="Banner 1 preview" />

          <label style={{ display: "block", marginTop: 12, fontSize: 13, color: "#444" }}>CTA URL</label>
          <input
            value={form.banner1CtaUrl}
            onChange={onChange("banner1CtaUrl")}
            placeholder="https://..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", marginTop: 6 }}
          />

          {form.banner1CtaUrl && isValidHttpUrl(form.banner1CtaUrl) ? (
            <a href={form.banner1CtaUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 13 }}>
              Test CTA →
            </a>
          ) : null}
        </div>

        {/* Banner 2 */}
        <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 16, background: "#fff" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Banner 2</h2>

          <label style={{ display: "block", marginTop: 12, fontSize: 13, color: "#444" }}>Image URL</label>
          <input
            value={form.banner2ImageUrl}
            onChange={onChange("banner2ImageUrl")}
            placeholder="https://..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", marginTop: 6 }}
          />

          {/* ✅ Preview */}
          <ImagePreview src={form.banner2ImageUrl} alt="Banner 2 preview" />

          <label style={{ display: "block", marginTop: 12, fontSize: 13, color: "#444" }}>CTA URL</label>
          <input
            value={form.banner2CtaUrl}
            onChange={onChange("banner2CtaUrl")}
            placeholder="https://..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", marginTop: 6 }}
          />

          {form.banner2CtaUrl && isValidHttpUrl(form.banner2CtaUrl) ? (
            <a href={form.banner2CtaUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 13 }}>
              Test CTA →
            </a>
          ) : null}
        </div>
      </div>

      {loading ? <p style={{ marginTop: 16, color: "#777", fontSize: 13 }}>Loading current data…</p> : null}
    </div>
  );
}
