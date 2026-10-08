import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Search,
  Upload,
  Download,
  MoreHorizontal,
  Pencil,
  Eye,
  Archive,
  Trash2,
  Package,
  ChevronDown,
  X,
} from "lucide-react";

import productService from "../../services/productService";

/* =========================================================
   HELPERS
========================================================= */

function getProductsFromResponse(response) {
  const payload = response?.data?.data ?? response?.data ?? [];

  // Direct array
  if (Array.isArray(payload)) {
    return payload;
  }

  // Paginated API shapes
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.products)) {
    return payload.products;
  }

  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }

  return [];
}

function getThumb(product) {
  const mainGallery =
    product?.images?.find((image) => image?.isMain)?.url;

  const firstGallery =
    product?.images?.[0]?.url;

  const firstVariantImage =
    product?.variants?.find(
      (variant) => variant?.images?.length
    )?.images?.[0]?.url;

  return (
    product?.imageUrl ||
    mainGallery ||
    firstGallery ||
    firstVariantImage ||
    ""
  );
}

function getInventory(product) {
  const variants = product?.variants || [];

  if (!variants.length) {
    return 0;
  }

  return variants.reduce(
    (total, variant) =>
      total + Number(variant?.stockQuantity || 0),
    0
  );
}

function getPriceRange(product) {
  const variants = product?.variants || [];

  const prices = variants
    .map((variant) => {
      const selling =
        variant?.discountPrice !== null &&
        variant?.discountPrice !== undefined &&
        variant?.discountPrice !== ""
          ? Number(variant.discountPrice)
          : Number(variant?.price);

      return selling;
    })
    .filter((price) => Number.isFinite(price));

  if (!prices.length) {
    return "—";
  }

  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);

  const format = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  if (minimum === maximum) {
    return format(minimum);
  }

  return `${format(minimum)} – ${format(maximum)}`;
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ product }) {
  const active = !!product?.isActive;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1",
        "text-xs font-medium",
        active
          ? "bg-emerald-100 text-emerald-800"
          : "bg-gray-100 text-gray-600",
      ].join(" ")}
    >
      {active ? "Active" : "Draft"}
    </span>
  );
}

/* =========================================================
   ACTION MENU
========================================================= */

function ProductActions({
  onEdit,
  onPreview,
  onDisable,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);

    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-block text-left"
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="
          inline-flex h-9 w-9 items-center justify-center
          rounded-lg border border-gray-200
          bg-white text-gray-600
          hover:bg-gray-50 hover:text-gray-900
        "
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="
            absolute right-0 top-11 z-50
            w-48 overflow-hidden
            rounded-xl border border-gray-200
            bg-white py-1 shadow-xl
          "
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onEdit();
            }}
            className="
              flex w-full items-center gap-3
              px-3 py-2 text-left text-sm
              text-gray-700 hover:bg-gray-50
            "
          >
            <Pencil className="h-4 w-4" />
            Edit product
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onPreview();
            }}
            className="
              flex w-full items-center gap-3
              px-3 py-2 text-left text-sm
              text-gray-700 hover:bg-gray-50
            "
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>

          <div className="my-1 border-t border-gray-100" />

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onDisable();
            }}
            className="
              flex w-full items-center gap-3
              px-3 py-2 text-left text-sm
              text-red-600 hover:bg-red-50
            "
          >
            <Archive className="h-4 w-4" />
            Disable product
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PRODUCTS
========================================================= */

export default function Products() {
  const navigate = useNavigate();

  const importInputRef = useRef(null);

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedIds, setSelectedIds] = useState([]);

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  /* =========================================================
     LOAD PRODUCTS
  ========================================================= */

  const load = async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await productService.list();

      setItems(getProductsFromResponse(response));
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load products."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =========================================================
     FILTER
  ========================================================= */

  const filtered = useMemo(() => {
    let result = [...items];

    const term = search.trim().toLowerCase();

    if (term) {
      result = result.filter((product) => {
        const searchable = [
          product?.name,
          product?.slug,
          product?.category?.name,
          product?.subCategory?.name,
          product?.productType,

          ...(product?.variants || []).map(
            (variant) => variant?.sku
          ),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(term);
      });
    }

    if (statusFilter === "active") {
      result = result.filter(
        (product) => !!product?.isActive
      );
    }

    if (statusFilter === "draft") {
      result = result.filter(
        (product) => !product?.isActive
      );
    }

    return result;
  }, [items, search, statusFilter]);

  /* =========================================================
     COUNTS
  ========================================================= */

  const activeCount = useMemo(
    () =>
      items.filter((product) => !!product?.isActive).length,
    [items]
  );

  const draftCount = items.length - activeCount;

  /* =========================================================
     SELECT
  ========================================================= */

  const allVisibleSelected =
    filtered.length > 0 &&
    filtered.every((product) =>
      selectedIds.includes(product.id)
    );

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(
        filtered.map((product) => product.id)
      );

      setSelectedIds((previous) =>
        previous.filter((id) => !visibleIds.has(id))
      );

      return;
    }

    setSelectedIds((previous) => [
      ...new Set([
        ...previous,
        ...filtered.map((product) => product.id),
      ]),
    ]);
  };

  const toggleSelected = (productId) => {
    setSelectedIds((previous) =>
      previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId]
    );
  };

  /* =========================================================
     EXPORT
  ========================================================= */

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await productService.export();

      const blob = new Blob([response.data]);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "namama-products.xlsx";

      document.body.appendChild(link);

      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Product export failed."
      );
    } finally {
      setExporting(false);
    }
  };

  /* =========================================================
     IMPORT
  ========================================================= */

  const handleImport = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setImporting(true);

      const formData = new FormData();

      formData.append("file", file);

      await productService.import(formData);

      await load(true);

      alert("Products imported successfully.");
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Product import failed."
      );
    } finally {
      setImporting(false);
    }
  };

  /* =========================================================
     DISABLE PRODUCT
  ========================================================= */

  const disableProduct = async (product) => {
    const confirmed = window.confirm(
      `Disable "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await productService.remove(product.id);

      setSelectedIds((previous) =>
        previous.filter((id) => id !== product.id)
      );

      await load(true);
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Failed to disable product."
      );
    }
  };

  /* =========================================================
     PREVIEW
  ========================================================= */

  const previewProduct = (product) => {
    /*
      Change this URL later if your storefront product URL
      convention is different.
    */

    if (!product?.slug) {
      alert("This product does not have a slug.");

      return;
    }

    window.open(
      `/products/${product.slug}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f6f7] p-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 h-8 w-40 animate-pulse rounded bg-gray-200" />

          <div className="overflow-hidden rounded-xl border bg-white">
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <div
                key={row}
                className="
                  flex items-center gap-4
                  border-b p-4 last:border-b-0
                "
              >
                <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />

                <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200" />

                <div className="flex-1">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-28 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto max-w-[1400px] p-6">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Products
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your products, pricing, inventory and
              variants.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* REFRESH */}

            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="
                inline-flex items-center gap-2
                rounded-lg border border-gray-300
                bg-white px-3.5 py-2
                text-sm font-medium text-gray-700
                shadow-sm hover:bg-gray-50
                disabled:opacity-50
              "
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />

              Refresh
            </button>

            {/* EXPORT */}

            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="
                inline-flex items-center gap-2
                rounded-lg border border-gray-300
                bg-white px-3.5 py-2
                text-sm font-medium text-gray-700
                shadow-sm hover:bg-gray-50
                disabled:opacity-50
              "
            >
              <Download className="h-4 w-4" />

              {exporting ? "Exporting..." : "Export"}
            </button>

            {/* IMPORT */}

            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
              className="
                inline-flex items-center gap-2
                rounded-lg border border-gray-300
                bg-white px-3.5 py-2
                text-sm font-medium text-gray-700
                shadow-sm hover:bg-gray-50
                disabled:opacity-50
              "
            >
              <Upload className="h-4 w-4" />

              {importing ? "Importing..." : "Import"}
            </button>

            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={handleImport}
            />

            {/* ADD */}

            <button
              type="button"
              onClick={() => navigate("/products/new")}
              className="
                inline-flex items-center gap-2
                rounded-lg bg-gray-900
                px-4 py-2
                text-sm font-medium text-white
                shadow-sm
                hover:bg-black
              "
            >
              <Plus className="h-4 w-4" />

              Add product
            </button>
          </div>
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div
            className="
              mb-5 flex items-center justify-between
              rounded-xl border border-red-200
              bg-red-50 px-4 py-3
              text-sm text-red-700
            "
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ===================================================
            MAIN CARD
        =================================================== */}

        <div className="overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* =================================================
              TABS
          ================================================= */}

          <div className="border-b border-gray-200 px-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={[
                  "border-b-2 px-3 py-3 text-sm font-medium",
                  statusFilter === "all"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-800",
                ].join(" ")}
              >
                All
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {items.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={[
                  "border-b-2 px-3 py-3 text-sm font-medium",
                  statusFilter === "active"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-800",
                ].join(" ")}
              >
                Active
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("draft")}
                className={[
                  "border-b-2 px-3 py-3 text-sm font-medium",
                  statusFilter === "draft"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-800",
                ].join(" ")}
              >
                Draft
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {draftCount}
                </span>
              </button>
            </div>
          </div>

          {/* =================================================
              SEARCH / FILTER
          ================================================= */}

          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search
                className="
                  absolute left-3 top-1/2
                  h-4 w-4 -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products, SKU, category..."
                className="
                  w-full rounded-lg border border-gray-300
                  py-2 pl-9 pr-3
                  text-sm outline-none
                  focus:border-gray-500
                  focus:ring-2 focus:ring-gray-900/10
                "
              />
            </div>

            <div className="text-sm text-gray-500">
              {filtered.length}{" "}
              {filtered.length === 1 ? "product" : "products"}
            </div>
          </div>

          {/* =================================================
              BULK BAR
          ================================================= */}

          {selectedIds.length > 0 && (
            <div
              className="
                flex items-center justify-between
                border-b border-gray-200
                bg-gray-50 px-4 py-3
              "
            >
              <div className="text-sm font-medium text-gray-700">
                {selectedIds.length} selected
              </div>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="
                  text-sm font-medium text-gray-600
                  hover:text-gray-900
                "
              >
                Clear selection
              </button>
            </div>
          )}

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Product
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Inventory
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Price
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Category
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Variants
                  </th>

                  <th className="w-16 px-4 py-3" />
                </tr>
              </thead>

              <tbody>
                {filtered.map((product) => {
                  const thumbnail = getThumb(product);

                  const inventory = getInventory(product);

                  const selected = selectedIds.includes(
                    product.id
                  );

                  return (
                    <tr
                      key={product.id}
                      onClick={() =>
                        navigate(
                          `/products/${product.id}/edit`
                        )
                      }
                      className={`
                        cursor-pointer border-b border-gray-100
                        transition-colors
                        hover:bg-gray-50
                        ${selected ? "bg-blue-50/40" : ""}
                      `}
                    >
                      {/* CHECKBOX */}

                      <td
                        className="px-4 py-3"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleSelected(product.id)
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>

                      {/* PRODUCT */}

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="
                              flex h-12 w-12 flex-shrink-0
                              items-center justify-center
                              overflow-hidden rounded-lg
                              border border-gray-200
                              bg-gray-50
                            "
                          >
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt={product.name || ""}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-gray-300" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div
                              className="
                                max-w-[300px] truncate
                                font-medium text-gray-900
                              "
                            >
                              {product.name || "Untitled product"}
                            </div>

                            <div
                              className="
                                mt-0.5 max-w-[300px]
                                truncate text-xs text-gray-500
                              "
                            >
                              {product.slug || `Product #${product.id}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-3">
                        <StatusBadge product={product} />
                      </td>

                      {/* INVENTORY */}

                      <td className="px-4 py-3">
                        {inventory > 0 ? (
                          <div>
                            <span className="font-medium text-gray-900">
                              {inventory}
                            </span>

                            <span className="ml-1 text-gray-500">
                              in stock
                            </span>
                          </div>
                        ) : (
                          <span className="text-red-600">
                            Out of stock
                          </span>
                        )}
                      </td>

                      {/* PRICE */}

                      <td className="px-4 py-3 font-medium text-gray-900">
                        {getPriceRange(product)}
                      </td>

                      {/* CATEGORY */}

                      <td className="px-4 py-3">
                        <div className="text-gray-800">
                          {product?.category?.name || "—"}
                        </div>

                        {product?.subCategory?.name && (
                          <div className="mt-0.5 text-xs text-gray-500">
                            {product.subCategory.name}
                          </div>
                        )}
                      </td>

                      {/* VARIANTS */}

                      <td className="px-4 py-3">
                        <span className="text-gray-700">
                          {product?.variants?.length || 0}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td
                        className="px-4 py-3 text-right"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <ProductActions
                          product={product}
                          onEdit={() =>
                            navigate(
                              `/products/${product.id}/edit`
                            )
                          }
                          onPreview={() =>
                            previewProduct(product)
                          }
                          onDisable={() =>
                            disableProduct(product)
                          }
                        />
                      </td>
                    </tr>
                  );
                })}

                {/* ===========================================
                    EMPTY STATE
                =========================================== */}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center"
                    >
                      <div
                        className="
                          mx-auto mb-4 flex h-12 w-12
                          items-center justify-center
                          rounded-full bg-gray-100
                        "
                      >
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>

                      <h3 className="font-medium text-gray-900">
                        {search
                          ? "No products found"
                          : "Add your first product"}
                      </h3>

                      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                        {search
                          ? "Try changing your search or product status filter."
                          : "Create products with media, colors, sizes, pricing and inventory."}
                      </p>

                      {!search && items.length === 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate("/products/new")
                          }
                          className="
                            mt-4 inline-flex items-center gap-2
                            rounded-lg bg-gray-900
                            px-4 py-2 text-sm font-medium
                            text-white hover:bg-black
                          "
                        >
                          <Plus className="h-4 w-4" />

                          Add product
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          {filtered.length > 0 && (
            <div
              className="
                flex items-center justify-between
                border-t border-gray-200
                px-4 py-3 text-xs text-gray-500
              "
            >
              <span>
                Showing {filtered.length} of {items.length} products
              </span>

              {refreshing && <span>Refreshing...</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}