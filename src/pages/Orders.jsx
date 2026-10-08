import React, { useEffect, useState } from "react";
import {
  Search,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { orderService } from "../services/orderService";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  /* ================= FETCH ORDERS ================= */

  const fetchOrders = async () => {
    try {
      const data = await orderService.getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ================= UPDATE STATUS ================= */

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      fetchOrders();
    } catch (error) {
      alert(error.message);
    }
  };

  /* ================= HELPERS ================= */

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "Processing":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "Shipped":
        return <Truck className="w-4 h-4 text-purple-600" />;
      case "Delivered":
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Shipped":
        return "bg-purple-100 text-purple-800";
      case "Delivered":
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /* ================= FILTER ================= */

  const filteredOrders = orders.filter((o) =>
    o.id.toString().includes(searchTerm) ||
    o.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ================= LOADER ================= */

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="p-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <span className="text-gray-500">
          Total Orders: {orders.length}
        </span>
      </div>

      {/* SEARCH */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by ID, email, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border rounded w-full"
        />
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-6">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white border rounded-lg p-5 shadow-sm"
          >
            {/* HEADER */}
            <div className="flex justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Order #{order.id}
                </h2>
                <p className="text-sm text-gray-600">
                  Customer: {order.userName || "Guest"}
                </p>
                <p className="text-sm text-gray-600">
                  Email: {order.userEmail || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  Phone: {order.userPhone || "N/A"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold">
                  ₹{order.totalAmount}
                </p>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{order.status}</span>
                </div>
                <p className="text-sm mt-1">
                  Payment:{" "}
                  <strong>{order.paymentStatus}</strong>
                </p>
              </div>
            </div>

            {/* ITEMS */}
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Items</h4>
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-sm border-b py-2"
                >
                  <div>
                    <p className="font-medium">
                      {item.productName}
                    </p>
                    <p className="text-gray-500">
                      {item.variant}
                    </p>
                    <p>Qty: {item.quantity}</p>
                  </div>

                  <div className="text-right">
                    ₹{item.unitPrice} × {item.quantity}
                    <br />
                    <strong>₹{item.total}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              {order.status === "Pending" && (
                <button
                  onClick={() =>
                    handleStatusUpdate(order.id, "Processing")
                  }
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Process
                </button>
              )}

              {order.status === "Processing" && (
                <button
                  onClick={() =>
                    handleStatusUpdate(order.id, "Shipped")
                  }
                  className="px-3 py-1 bg-purple-600 text-white rounded"
                >
                  Ship
                </button>
              )}

              {order.status === "Shipped" && (
                <button
                  onClick={() =>
                    handleStatusUpdate(order.id, "Delivered")
                  }
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Deliver
                </button>
              )}

              {order.status === "Delivered" && (
                <button
                  onClick={() =>
                    handleStatusUpdate(order.id, "Completed")
                  }
                  className="px-3 py-1 bg-emerald-600 text-white rounded"
                >
                  Complete
                </button>
              )}

              {(order.status === "Pending" ||
                order.status === "Processing") && (
                <button
                  onClick={() =>
                    handleStatusUpdate(order.id, "Cancelled")
                  }
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY */}
      {filteredOrders.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          No orders found
        </div>
      )}
    </div>
  );
};

export default Orders;
