import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import deliveryService from "../../services/deliveryService";

function money(v) {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `₹${n.toFixed(2)}`;
}

export default function DeliveryManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await deliveryService.list();
      setItems(res?.data?.data || []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Failed to load delivery list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const syncOne = async (orderId) => {
    try {
      setSyncing(true);
      await deliveryService.syncOne(orderId);
      await load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const syncBulk = async () => {
    try {
      setSyncing(true);
      await deliveryService.syncBulk(25);
      await load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Bulk sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="p-6">Loading delivery manager...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Delivery Manager</h1>

        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            disabled={syncing}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={syncBulk}
            className="px-3 py-2 bg-black text-white rounded-lg disabled:opacity-60"
            disabled={syncing}
          >
            {syncing ? "Syncing..." : "Sync All"}
          </button>
        </div>
      </div>

      {err && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{err}</div>}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3">Order</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Shipment</th>
              <th className="p-3">AWB</th>
              <th className="p-3 w-36">Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{o.orderNo || `#${o.id}`}</div>
                  <div className="text-xs text-gray-500">{new Date(o.orderDate).toLocaleString()}</div>
                </td>

                <td className="p-3">{money(o.totalAmount)}</td>

                <td className="p-3">
                  <div className="font-medium">{o.paymentStatus}</div>
                  <div className="text-xs text-gray-500">{o.status}</div>
                </td>

                <td className="p-3">{o.shipmentStatus}</td>

                <td className="p-3">
                  <div className="font-mono text-xs break-all">{o.awbNumber || "-"}</div>
                </td>

                <td className="p-3">
                  <button
                    onClick={() => syncOne(o.id)}
                    disabled={syncing}
                    className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-60"
                  >
                    Sync
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={6}>
                  No active shipments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
