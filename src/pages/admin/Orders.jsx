import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Eye } from "lucide-react";
import orderService from "../../services/orderService";

function money(v) {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `₹${n.toFixed(2)}`;
}

const STATUS_BADGE = {
  Pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
  Confirmed: "bg-blue-50 text-blue-800 border-blue-200",
  Shipped: "bg-purple-50 text-purple-800 border-purple-200",
  Delivered: "bg-green-50 text-green-800 border-green-200",
  Cancelled: "bg-red-50 text-red-800 border-red-200",
};

function getLatestPayment(o) {
  // backend sends `payments` array (orderBy desc)
  if (Array.isArray(o?.payments) && o.payments.length) return o.payments[0];
  // fallback shapes if any
  return o?.payment || null;
}

function normalizePaymentMethod(pm) {
  const s = String(pm || "").toLowerCase();
  if (!s) return "";
  if (s === "cod" || s.includes("cash")) return "COD";
  return "Prepaid";
}

export default function Orders() {
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const res = await orderService.adminList();

      // ✅ FIX: backend returns { success:true, data:[...] }
      const raw = res?.data?.data || [];

      const normalized = raw.map((o) => {
        const latestPay = getLatestPayment(o);

        const customerName =
          o.customerName ||
          o.user?.name ||
          `${o.user?.firstName || ""} ${o.user?.lastName || ""}`.trim() ||
          "Customer";

        const orderDate = o.orderDate || o.createdAt || o.created_date || null;

        const paymentStatus =
          o.paymentStatus ||
          latestPay?.paymentStatus ||
          latestPay?.status ||
          "Pending";

        const paymentMethod = normalizePaymentMethod(
          latestPay?.paymentMethod || o.paymentMethod
        );

        return {
          ...o,
          orderNo: o.orderNo || `#${o.id}`,
          orderDate,

          customerName,
          customerEmail: o.customerEmail || o.user?.email || "",
          guestPhone: o.guestPhone || o.user?.phone || "",

          orderItems: o.orderItems || o.items || [],
          itemsCount:
            o.itemsCount ??
            (Array.isArray(o.orderItems) ? o.orderItems.length : Array.isArray(o.items) ? o.items.length : 0),

          paymentStatus,
          paymentMethod, // ✅ NEW

          razorpayOrderId: o.razorpayOrderId || latestPay?.razorpayOrderId || "",

          shipmentStatus: o.shipmentStatus || o.shipment?.status || "NotCreated",
          shippingProvider:
            o.shippingProvider || o.shipment?.provider || o.shipment?.shippingProvider || "",
          awbNumber: o.awbNumber || o.shipment?.awb || o.shipment?.awbNumber || "",
        };
      });

      setItems(Array.isArray(normalized) ? normalized : []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;

    return items.filter((o) => {
      const name = `${o.customerName || ""} ${o.customerEmail || ""} ${o.guestPhone || ""} ${o.orderNo || ""} ${o.id || ""}`
        .toLowerCase();
      return name.includes(s);
    });
  }, [items, search]);

  if (loading) return <div className="p-6">Loading orders...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Orders</h1>

        <div className="flex items-center gap-2">
          <input
            className="border rounded-lg px-3 py-2 w-80"
            placeholder="Search by customer / email / phone / order no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            onClick={load}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {err && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{err}</div>}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Shipment</th>
              <th className="p-3">Status</th>
              <th className="p-3 w-40">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{o.orderNo}</div>
                  <div className="text-xs text-gray-500">
                    {o.orderDate ? new Date(o.orderDate).toLocaleString() : "-"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Items: {o.itemsCount ?? o.orderItems?.length ?? 0}
                  </div>
                </td>

                <td className="p-3">
                  <div className="font-medium">{o.customerName}</div>
                  <div className="text-xs text-gray-500">{o.customerEmail || "-"}</div>
                  <div className="text-xs text-gray-500">{o.guestPhone || "-"}</div>
                </td>

                <td className="p-3">
                  <div className="font-medium">{money(o.totalAmount)}</div>
                  <div className="text-xs text-gray-500">
                    Paid: {o.paidAmount ? money(o.paidAmount) : "-"}
                  </div>
                </td>

                <td className="p-3">
                  <div className="font-medium">
                    {o.paymentStatus}{" "}
                    {o.paymentMethod ? (
                      <span className="ml-2 inline-flex text-xs px-2 py-0.5 rounded-full border bg-gray-50">
                        {o.paymentMethod}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-500 font-mono break-all">
                    {o.razorpayOrderId ? `RZP: ${o.razorpayOrderId}` : "No Razorpay order"}
                  </div>
                </td>

                <td className="p-3">
                  <div className="font-medium">{o.shipmentStatus || "NotCreated"}</div>
                  <div className="text-xs text-gray-500">{o.shippingProvider || "-"}</div>
                  <div className="text-xs text-gray-500">
                    {o.awbNumber ? `AWB: ${o.awbNumber}` : ""}
                  </div>
                </td>

                <td className="p-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md border text-xs ${
                      STATUS_BADGE[o.status] || "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {o.status}
                  </span>
                </td>

                <td className="p-3">
                  <button
                    onClick={() => nav(`/orders/${o.id}`)}
                    className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={7}>
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
