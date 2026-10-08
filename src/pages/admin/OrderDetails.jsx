import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import orderService from "../../services/orderService";
import shiprocketService from "../../services/shiprocketService";

const STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
const PAY_STATUSES = ["Pending", "Created", "Paid", "Failed", "Refunded"];
const PROVIDERS = ["Shiprocket", "Delhivery", "Manual"];
const SHIPMENT_STATUSES = [
  "NotCreated",
  "Created",
  "Picked",
  "InTransit",
  "OutForDelivery",
  "Delivered",
  "RTO",
  "Cancelled",
  "Failed",
];

function money(v) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `₹${n.toFixed(2)}`;
}

function safeDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function getLatestPayment(order) {
  if (Array.isArray(order?.payments) && order.payments.length) return order.payments[0];
  return order?.payment || null;
}

function isCOD(order) {
  const p = getLatestPayment(order);
  const method = String(p?.paymentMethod || order?.paymentMethod || "").toLowerCase();
  const provider = String(p?.provider || "").toLowerCase();

  return (
    method === "cod" ||
    method === "cashondelivery" ||
    method === "cash on delivery" ||
    method.includes("cash") ||
    provider === "cod"
  );
}

function paymentMethodLabel(order) {
  return isCOD(order) ? "COD" : "Prepaid";
}

function normalizePhone(phone) {
  const s = String(phone || "").replace(/\D/g, "");
  // keep last 10 digits
  return s.length > 10 ? s.slice(-10) : s;
}

function hasBasicShiprocketAddress(order) {
  const phone = normalizePhone(order?.guestPhone);
  const pincode = String(order?.shippingPostalCode || "").trim();
  const city = String(order?.shippingCity || "").trim();
  const address = String(order?.shippingAddress || "").trim();
  const name = String(order?.customerName || "").trim();

  if (!name) return { ok: false, reason: "Customer name is missing." };
  if (!phone || phone.length !== 10) return { ok: false, reason: "Valid 10-digit phone is missing." };
  if (!address) return { ok: false, reason: "Shipping address is missing." };
  if (!city) return { ok: false, reason: "Shipping city is missing." };
  if (!pincode || pincode.length < 5) return { ok: false, reason: "Shipping pincode is missing." };
  return { ok: true };
}

export default function OrderDetails() {
  const nav = useNavigate();
  const { id } = useParams();
  const orderId = Number(id);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [order, setOrder] = useState(null);

  // local edit fields
  const [status, setStatus] = useState("Pending");
  const [paymentStatus, setPaymentStatus] = useState("Pending");

  const [shippingProvider, setShippingProvider] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState("NotCreated");
  const [shipmentId, setShipmentId] = useState("");
  const [awbNumber, setAwbNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [shippingFee, setShippingFee] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const res = await orderService.adminGet(orderId);
      const data = res?.data?.data;
      if (!data) throw new Error("Order not found");

      setOrder(data);

      setStatus(data.status || "Pending");
      setPaymentStatus(data.paymentStatus || "Pending");

      setShippingProvider(data.shippingProvider || "");
      setShipmentStatus(data.shipmentStatus || "NotCreated");

      // IMPORTANT: these must come only from backend (Shiprocket push)
      setShipmentId(data.shipmentId || "");
      setAwbNumber(data.awbNumber || "");
      setTrackingUrl(data.trackingUrl || "");

      setTrackingCode(data.trackingCode || "");
      setShippingFee(
        data.shippingFee !== null && data.shippingFee !== undefined
          ? String(Number(data.shippingFee))
          : ""
      );
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const saveStatus = async () => {
    try {
      setSaving(true);
      setErr("");
      await orderService.updateStatus(orderId, status);
      await load();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async () => {
    try {
      setSaving(true);
      setErr("");
      const payload = {
        paymentStatus,
        paidAmount: order?.paidAmount ? Number(order.paidAmount) : undefined,
      };
      await orderService.updatePayment(orderId, payload);
      await load();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Failed to update payment");
    } finally {
      setSaving(false);
    }
  };

  const saveShipping = async () => {
    try {
      setSaving(true);
      setErr("");

      const isShiprocket = String(shippingProvider || "").toLowerCase() === "shiprocket";

      // ✅ IMPORTANT: do NOT allow faking Shiprocket shipment fields
      // These must be set by push/sync APIs only.
      const payload = {
        shippingProvider: shippingProvider || null,
        shippingFee: shippingFee === "" ? null : Number(shippingFee),

        // allow trackingCode manual if you want
        trackingCode: trackingCode || null,

        // Allow manual provider updates ONLY
        ...(isShiprocket
          ? {}
          : {
              shipmentStatus: shipmentStatus || null,
              shipmentId: shipmentId || null,
              awbNumber: awbNumber || null,
              trackingUrl: trackingUrl || null,
            }),
      };

      await orderService.updateShipping(orderId, payload);
      await load();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Failed to update shipping");
    } finally {
      setSaving(false);
    }
  };

  const createShipment = async () => {
    try {
      if (!order) return;

      const cod = isCOD(order);

      // ✅ rule: Paid OR COD
      if (order.paymentStatus !== "Paid" && !cod) {
        alert("Only PAID or COD orders can be pushed to Shiprocket.");
        return;
      }

      // ✅ validate required address fields (prevents Shiprocket failures)
      const chk = hasBasicShiprocketAddress(order);
      if (!chk.ok) {
        alert(`Cannot create shipment: ${chk.reason}\n\nFill shipping details in order first.`);
        return;
      }

      if (!window.confirm("Create shipment in Shiprocket?")) return;

      setSaving(true);
      setErr("");

      // ✅ This must call POST /api/shipping/shiprocket/:orderId/push
      await shiprocketService.createShipment(order.id);

      await load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to create shipment");
    } finally {
      setSaving(false);
    }
  };

  const syncStatus = async () => {
    try {
      if (!order) return;

      // ✅ must have shipmentId (Shiprocket generates it)
      if (order.shippingProvider !== "Shiprocket" || !order.shipmentId) {
        alert("Shipment not created in Shiprocket yet. Click Create Shipment first.");
        return;
      }

      setSaving(true);
      setErr("");

      // ✅ This must call POST /api/shipping/shiprocket/:orderId/sync
      await shiprocketService.syncTracking(order.id);

      await load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to sync status");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading order...</div>;
  if (!order) return <div className="p-6">Order not found</div>;

  const cod = isCOD(order);

  const canCreateShipment =
    (order.paymentStatus === "Paid" || cod) &&
    !(order.shippingProvider === "Shiprocket" && order.shipmentId);

  const canSyncShipment = order.shippingProvider === "Shiprocket" && !!order.shipmentId;

  const isShiprocket = String(shippingProvider || "").toLowerCase() === "shiprocket";
  const shiprocketFieldsLocked = isShiprocket; // lock fields when provider is shiprocket

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Order {order.orderNo || `#${order.id}`}</h1>
          <div className="text-sm text-gray-500">{safeDate(order.orderDate || order.createdAt)}</div>
        </div>

        <button
          onClick={() => nav("/orders")}
          className="px-3 py-2 border rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      {err && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{err}</div>}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-lg font-semibold">{money(order.totalAmount)}</div>
          <div className="text-xs text-gray-500">
            Paid: {order.paidAmount ? money(order.paidAmount) : "-"}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-gray-500">Payment</div>
          <div className="text-lg font-semibold">
            {order.paymentStatus}{" "}
            <span className="ml-2 inline-flex text-xs px-2 py-0.5 rounded-full border bg-gray-50">
              {paymentMethodLabel(order)}
            </span>
          </div>

          {order.razorpayOrderId ? (
            <div className="text-xs text-gray-500 font-mono break-all">
              RZP: {order.razorpayOrderId}
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              {cod ? "COD order (no Razorpay)" : "No Razorpay Order"}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-gray-500">Shipment</div>
          <div className="text-lg font-semibold">{order.shipmentStatus}</div>
          <div className="text-xs text-gray-500">{order.shippingProvider || "No provider"}</div>
          {order.shipmentId ? (
            <div className="text-xs text-gray-500 font-mono">Shipment: {order.shipmentId}</div>
          ) : null}
          {order.awbNumber ? (
            <div className="text-xs text-gray-500 font-mono">AWB: {order.awbNumber}</div>
          ) : null}
        </div>
      </div>

      {/* Status + Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Order Status</h2>
          <div className="flex gap-2">
            <select
              className="border rounded-lg px-3 py-2 flex-1"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={saveStatus}
              disabled={saving}
              className="px-3 py-2 bg-black text-white rounded-lg disabled:opacity-60"
            >
              {saving ? "Saving..." : "Update"}
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Payment Status</h2>
          <div className="flex gap-2">
            <select
              className="border rounded-lg px-3 py-2 flex-1"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              {PAY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={savePayment}
              disabled={saving}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Update"}
            </button>
          </div>
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white border rounded-xl p-4 mb-4">
        <h2 className="font-semibold mb-3">Shipping / Tracking</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium">Provider</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={shippingProvider}
              onChange={(e) => setShippingProvider(e.target.value)}
            >
              <option value="">Select</option>
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium">Shipment Status</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={shipmentStatus}
              onChange={(e) => setShipmentStatus(e.target.value)}
              disabled={shiprocketFieldsLocked}
              title={shiprocketFieldsLocked ? "Shiprocket status is managed by Sync" : ""}
            >
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium">Shipping Fee</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={shippingFee}
              onChange={(e) => setShippingFee(e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-xs font-medium">Shipment ID</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-50"
              value={shipmentId}
              readOnly
              title="Generated by Shiprocket"
            />
          </div>

          <div>
            <label className="text-xs font-medium">AWB Number</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-50"
              value={awbNumber}
              readOnly
              title="Generated by Shiprocket"
            />
          </div>

          <div>
            <label className="text-xs font-medium">Tracking Code</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-medium">Tracking URL</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-50"
              value={trackingUrl}
              readOnly
              title="Generated by Shiprocket"
            />
            {trackingUrl ? (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 underline mt-1 inline-block"
              >
                Open Tracking
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={saveShipping}
            disabled={saving}
            className="px-3 py-2 bg-black text-white rounded-lg disabled:opacity-60"
            title={isShiprocket ? "Only provider + fee + tracking code can be updated for Shiprocket" : ""}
          >
            {saving ? "Saving..." : "Update Shipping"}
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Items</h2>

        {order.orderItems?.length ? (
          <div className="space-y-3">
            {order.orderItems.map((it) => (
              <div key={it.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 border rounded bg-gray-50 overflow-hidden">
                    {it.imageUrl ? <img src={it.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div>
                    <div className="font-medium">{it.productName}</div>
                    <div className="text-xs text-gray-500">
                      {it.variantLabel || it.sku || ""} • Qty: {it.quantity}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium">{money(it.unitPrice)}</div>
                  <div className="text-xs text-gray-500">
                    Line: {money(Number(it.unitPrice) * Number(it.quantity))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No items.</div>
        )}
      </div>

      {/* Shiprocket Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={createShipment}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
          disabled={saving || !canCreateShipment}
          title={!canCreateShipment ? "Only PAID or COD orders & not already pushed" : ""}
        >
          Create Shipment
        </button>

        <button
          onClick={syncStatus}
          className="px-3 py-2 border rounded-lg disabled:opacity-60"
          disabled={saving || !canSyncShipment}
          title={!canSyncShipment ? "Create shipment first (needs shipmentId)" : ""}
        >
          Sync Status
        </button>
      </div>
    </div>
  );
}
