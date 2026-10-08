import { useEffect, useMemo, useState } from "react";
import { getTags } from "../services/tags";

/**
 * value: number[] (tagIds)
 * onChange: (ids:number[]) => void
 */
export default function TagMultiSelect({
  value = [],
  onChange,
  disabled = false,
  onlyActive = true,
}) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // If backend supports params like status=Active use it;
        // otherwise remove params and filter on frontend.
        const data = await getTags(onlyActive ? { status: "Active" } : {});
        const list = Array.isArray(data) ? data : data?.items || data?.data || [];

        if (!alive) return;
        setTags(list);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [onlyActive]);

  const selectedSet = useMemo(() => new Set(value), [value]);

  function toggle(id) {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading tags...</div>
    );
  }

  if (!tags.length) {
    return (
      <div className="text-sm text-gray-500">No tags found.</div>
    );
  }

  return (
    <div className="border rounded-lg p-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t.id)}
            disabled={disabled}
            className={[
              "px-3 py-1 rounded-full text-sm border",
              selectedSet.has(t.id)
                ? "bg-black text-white border-black"
                : "bg-white text-gray-800 border-gray-300",
              disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-sm",
            ].join(" ")}
            title={t.slug}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Optional: show selected count */}
      <div className="mt-2 text-xs text-gray-500">
        Selected: {value.length}
      </div>
    </div>
  );
}
