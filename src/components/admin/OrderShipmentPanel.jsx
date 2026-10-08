import { useEffect, useMemo, useState } from "react";
import shippingService from "../../services/shippingService";

const STATUS = [
  "NotCreated",
  "Created",
  "PickedUp",
  "InTransit",
  "OutForDelivery",
  "Delivered",
  "Failed",
  "Cancelled",
];

export default function OrderShipmentPanel({ orderId, order }) {
  const [loading, setLoading] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);
  const [error, setError] = useState("");
  const [track, setTrack] = useState(null);

  const [provider, setProvider] = useState(order?.shippingProvider || "Shiprocket");
  const [shipmentStatus, setShipmentStatus] = useState(order?.shipmentStatus || "NotCreated");
  const [trackingUrl, setTrackingUrl] = useState(order?.trackingUrl || "");
  const [trackingCode, setTrackingCode] = useState(order?.trackingCode || "");
  const [awbNumber, setAwbNumber] = useState(order?.awbNumber || "");
  const [shipmentId, setShipmentId] = useState(order?.shipmentId || "");

  useEffect(() => {
    setProvider(order?.shippingProvider || "Shiprocket");
    setShipmentStatus(order?.shipmentStatus || "NotCreated");
    setTrackingUrl(order?.trackingUrl || "");
    setTrackingCode(order?.trackingCode || "");
    setAwbNumber(order?.awbNumber || "");
    setShipmentId(order?.shipmentId || "");
  }, [order]);

  const canCreate = useMemo(() => {
    // based on your backend logic
    return order?.paymentStatus === "Paid" && (order?.shipmentStatus === "NotCreated" || !order?.shipmentStatus);
  }, [order]);

  async function createShipment() {
    setError("");
    setLoading(true);
    try {
      const res = await shippingService.createShipment({
        orderId: Number(orderId),
        provider,
        method: "Standard",
      });

      const d = res.data?.data;
      setShipmentStatus(d?.shipmentStatus || "Created");
      setTrackingUrl(d?.trackingUrl || "");
      setTrackingCode(d?.trackingCode || "");
      setAwbNumber(d?.awbNumber || "");
      setShipmentId(d?.shipmentId || "");
      alert("Shipment created ✅");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function refreshTrack() {
    setError("");
    setTrackLoading(true);
    try {
      const res = await shippingService.track(orderId);
      setTrack(res.data?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed");
    } finally {
      setTrackLoading(false);
    }
  }

  async function updateStatusManual() {
    setError("");
    setLoading(true);
    try {
      await shippingService.adminUpdateShipmentStatus(orderId, {
        shipmentStatus,
        trackingUrl: trackingUrl || null,
        trackingCode: trackingCode || null,
        awbNumber: awbNumber || null,
        shipmentId: shipmentId || null,
        shippingMeta: track?.shippingMeta || undefined, // optional
      });
      alert("Shipment updated ✅");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Shipping / Shipment</h2>
          <p className="text-sm text-gray-600">
            Create shipment (after Paid) or update status manually.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="border rounded-lg px-3 py-2 text-sm"
            onClick={refreshTrack}
            disabled={trackLoading}
          >
            {trackLoading ? "Refreshing..." : "Refresh Track"}
          </button>

          <button
            className="bg-black text-white rounded-lg px-3 py-2 text-sm"
            onClick={updateStatusManual}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Status"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Provider</label>
          <select
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="Shiprocket">Shiprocket</option>
            <option value="Delhivery">Delhivery</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Shipment Status</label>
          <select
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={shipmentStatus}
            onChange={(e) => setShipmentStatus(e.target.value)}
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">AWB Number</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={awbNumber}
            onChange={(e) => setAwbNumber(e.target.value)}
            placeholder="e.g. 123456789"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Shipment ID</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
            placeholder="Provider Shipment ID"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Tracking Code</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Tracking URL</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t">
        <div className="text-sm text-gray-700">
          <div><b>Order Payment:</b> {order?.paymentStatus || "-"}</div>
          <div><b>Order Status:</b> {order?.status || "-"}</div>
        </div>

        <button
          className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          onClick={createShipment}
          disabled={!canCreate || loading}
          title={!canCreate ? "Payment must be Paid and Shipment must be NotCreated" : ""}
        >
          {loading ? "Creating..." : "Create Shipment"}
        </button>
      </div>

      {track && (
        <div className="bg-gray-50 border rounded-lg p-3 text-sm overflow-auto">
          <div className="font-semibold mb-2">Latest Track Data</div>
          <pre className="whitespace-pre-wrap">{JSON.stringify(track, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
