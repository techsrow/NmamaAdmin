import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import orderService from "../../services/orderService";
import shiprocketService from "../../services/shiprocketService";
import shippingAdminService from "../../services/shippingAdminService";
import {enabledOrderProviders} from "../../services/orderDocuments";
import OrderDocuments from "../../components/OrderDocuments";

const STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
const PAY_STATUSES = ["Pending", "Created", "Paid", "Failed", "Refunded"];

const SHIPMENT_STATUSES = [
  "NotCreated",
  "Created",
  "Draft",
  "ReadyToShip",
  "AwbAssigned",
  "PickupScheduled",
  "DeliveryFailed",
  "NDR",
  "RTOInitiated",
  "RTOInTransit",
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
  const [shippingFeedback, setShippingFeedback] = useState(null);

  const [order, setOrder] = useState(null);
  const [providers, setProviders] = useState([]);
  const [providerError, setProviderError] = useState("");
  useEffect(() => { let active=true; shippingAdminService.providers().then(rows=>{if(active)setProviders(rows)}).catch(()=>{if(active)setProviderError("Unable to load enabled shipping providers. Check Shipping configuration and reload.")}); return ()=>{active=false}; }, []);

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

  const load = async ({silent=false} = {}) => {
    try {
      if(!silent) setLoading(true);
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
      return true;
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message || "Failed to load order");
      return false;
    } finally {
      if(!silent) setLoading(false);
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
    setShippingFeedback(null);
    try {
      setSaving(true); setErr("");
      const fee=shippingFee === "" ? null : Number(shippingFee);
      if(fee!==null&&(!Number.isFinite(fee)||fee<0))throw new Error("Enter a valid shipping fee of zero or more, or leave it blank.");
      const carrierManaged=["Shiprocket","Shadowfax360"].includes(shippingProvider);
      const payload={shippingProvider:shippingProvider||null,shippingFee:fee,trackingCode:trackingCode||null,
        ...(carrierManaged?{}:{shipmentStatus:shipmentStatus||undefined,shipmentId:shipmentId||null,awbNumber:awbNumber||null,trackingUrl:trackingUrl||null})};
      const response=await orderService.updateShipping(orderId,payload);
      if(response?.data?.success===false)throw new Error(response.data.message||"The API could not save shipping details.");
      const refreshed=await load({silent:true});
      setShippingFeedback({type:refreshed?"success":"warning",message:refreshed?"Shipping details saved successfully. This saves order details; use Create / manage shipment to book a courier and generate an AWB.":"Shipping details were saved, but the order could not be refreshed. Reload this page to see the latest details."});
    } catch (e) {
      setShippingFeedback({type:"error",message:e?.response?.data?.message||e.message||"Failed to update shipping. Please try again."});
    } finally { setSaving(false); }
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
    !order.shipmentId &&
    !(order.shipments || []).some(s => s.status !== "Cancelled") &&
    order.shippingProvider !== "Shadowfax360";

  const canSyncShipment = order.shippingProvider === "Shiprocket" && !!order.shipmentId;

  const isShiprocket = ["Shiprocket","Shadowfax360"].includes(shippingProvider);
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

      <OrderDocuments order={order}/>
      {/* Shipping */}
      <div className="bg-white border rounded-xl p-4 mb-4">
        <h2 className="font-semibold mb-3">Shipping / Tracking</h2>
        <p className="text-sm text-gray-600 mb-3">Update the order’s shipping details here. Booking a courier and generating its label are separate actions in Shipping.</p>
        {providerError&&<p role="alert" className="text-red-700 mb-3">{providerError}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium">Provider</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={shippingProvider}
              onChange={(e) => setShippingProvider(e.target.value)}
            >
              <option value="">Select</option>
              {enabledOrderProviders(providers,order.shippingProvider).map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
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
              title={shiprocketFieldsLocked ? "Carrier status is managed through Shipping" : ""}
            >
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium">Shipping Fee (optional)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={shippingFee}
              onChange={(e) => setShippingFee(e.target.value)}
              type="number" min="0" step="0.01"
              placeholder="Leave blank if not set"
            />
          </div>

          <div>
            <label className="text-xs font-medium">Shipment ID</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-50"
              value={shipmentId}
              readOnly
              placeholder="Generated after courier booking"
              title="Generated by the shipping provider"
            />
          </div>

          <div>
            <label className="text-xs font-medium">AWB Number</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-50"
              value={awbNumber}
              readOnly
              placeholder="Generated after courier booking"
              title="Generated by the shipping provider"
            />
          </div>

          <div>
            <label className="text-xs font-medium">Tracking Code (optional)</label>
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
              placeholder="Generated after courier booking"
              title="Generated by the shipping provider"
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

        {shippingFeedback&&<div className={`mt-4 p-3 rounded-lg border ${shippingFeedback.type==='error'?'bg-red-50 text-red-800 border-red-200':shippingFeedback.type==='warning'?'bg-amber-50 text-amber-900 border-amber-200':'bg-green-50 text-green-800 border-green-200'}`} role={shippingFeedback.type==='error'?'alert':'status'}>{shippingFeedback.message}</div>}
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={saveShipping}
            disabled={saving}
            className="px-3 py-2 bg-black text-white rounded-lg disabled:opacity-60"
            title={isShiprocket ? "Carrier shipment fields are managed through Shipping" : ""}
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
          Create Shiprocket shipment
        </button>

        <button
          onClick={syncStatus}
          className="px-3 py-2 border rounded-lg disabled:opacity-60"
          disabled={saving || !canSyncShipment}
          title={!canSyncShipment ? "Create shipment first (needs shipmentId)" : ""}
        >
          Sync Shiprocket status
        </button>
      </div>
    </div>
  );
}
