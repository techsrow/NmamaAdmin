import { useEffect, useMemo, useState } from "react";
import orderService from "../../services/orderService";

export default function Payments() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      // If your backend has /orders/admin/all (as in your earlier code)
      const res = await orderService.adminAll?.() 
        ? await orderService.adminAll()
        : await orderService.list({ scope: "admin" }); // fallback (if you use different)
      setOrders(res.data?.data || res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;
    return orders.filter((o) => {
      return (
        String(o.id).includes(s) ||
        (o.customerName || "").toLowerCase().includes(s) ||
        (o.guestPhone || "").toLowerCase().includes(s) ||
        (o.razorpayOrderId || "").toLowerCase().includes(s) ||
        (o.paymentStatus || "").toLowerCase().includes(s)
      );
    });
  }, [orders, q]);

  return (
    <div className="p-6 space-y-4">
      <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Payments</h1>
          <p className="text-sm text-gray-600">Monitor payment status per order.</p>
        </div>

        <button className="border rounded-lg px-3 py-2 text-sm" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center gap-2">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Search by order id, customer, phone, razorpayOrderId, paymentStatus..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="overflow-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Order</th>
                <th className="py-2">Customer</th>
                <th className="py-2">Method</th>
                <th className="py-2">Payment Status</th>
                <th className="py-2">Razorpay OrderId</th>
                <th className="py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b">
                  <td className="py-2">#{o.id}</td>
                  <td className="py-2">{o.customerName || "Guest"}</td>
                  <td className="py-2">{o.paymentMethod || "-"}</td>
                  <td className="py-2">
                    <span className="px-2 py-1 rounded-full border">
                      {o.paymentStatus || "-"}
                    </span>
                  </td>
                  <td className="py-2">{o.razorpayOrderId || "-"}</td>
                  <td className="py-2">{String(o.totalAmount ?? "-")}</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td className="py-4 text-gray-600" colSpan={6}>
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
