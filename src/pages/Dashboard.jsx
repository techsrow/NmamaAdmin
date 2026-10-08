import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  IndianRupee,
  Layers,
  AlertTriangle,
  MessageSquare,
  TicketPercent,
  Image as ImageIcon,
  CreditCard,
  Truck,
} from "lucide-react";

import StatsCard from "../components/StatsCard";
import { dashboardService } from "../services/dashboardService";

const rowTitle = "text-sm font-semibold text-gray-700 mb-3 mt-6";

const StatusBox = ({ title, items, icon: Icon }) => {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {Icon ? <Icon size={18} /> : null}
        <div className="font-semibold">{title}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {items.map((it) => (
          <div key={it.label} className="border rounded-lg px-3 py-2">
            <div className="text-xs text-gray-500">{it.label}</div>
            <div className="text-lg font-bold">{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    // Orders
    totalOrders: 0,
    totalRevenue: 0,

    // Catalog
    totalProducts: 0,
    totalVariants: 0,
    outOfStockVariants: 0,
    lowStockVariants: 0,

    // Catalog meta
    totalCategories: 0,
    totalSubCategories: 0,
    totalTags: 0,

    // Users / reviews / coupons / media
    totalUsers: 0,
    pendingReviews: 0,
    activeCoupons: 0,
    totalMediaAssets: 0,

    // NEW: status counts
    orderStatusCounts: {
      Pending: 0,
      Confirmed: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    },

    paymentStatusCounts: {
      Pending: 0,
      Created: 0,
      Paid: 0,
      Failed: 0,
      Refunded: 0,
    },

    shipmentStatusCounts: {
      NotCreated: 0,
      Created: 0,
      Picked: 0,
      InTransit: 0,
      OutForDelivery: 0,
      Delivered: 0,
      RTO: 0,
      Cancelled: 0,
      Failed: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await dashboardService.getStats();
      const data = res?.data?.data || res?.data || {};

      setStats((prev) => ({
        ...prev,

        // existing fields (safe)
        totalOrders: data.totalOrders ?? prev.totalOrders ?? 0,
        totalRevenue: data.totalRevenue ?? data.totalPaymentReceived ?? 0,

        totalProducts: data.totalProducts ?? 0,
        totalVariants: data.totalVariants ?? 0,
        outOfStockVariants: data.outOfStockVariants ?? data.outOfStockProducts ?? 0,
        lowStockVariants: data.lowStockVariants ?? 0,

        totalCategories: data.totalCategories ?? 0,
        totalSubCategories: data.totalSubCategories ?? 0,
        totalTags: data.totalTags ?? 0,

        totalUsers: data.totalUsers ?? 0,
        pendingReviews: data.pendingReviews ?? 0,
        activeCoupons: data.activeCoupons ?? 0,
        totalMediaAssets: data.totalMediaAssets ?? 0,

        // NEW: counts
        orderStatusCounts: {
          ...prev.orderStatusCounts,
          ...(data.orderStatusCounts || {}),
        },
        paymentStatusCounts: {
          ...prev.paymentStatusCounts,
          ...(data.paymentStatusCounts || {}),
        },
        shipmentStatusCounts: {
          ...prev.shipmentStatusCounts,
          ...(data.shipmentStatusCounts || {}),
        },
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formattedRevenue = useMemo(() => {
    const n = Number(stats.totalRevenue) || 0;
    return `₹ ${n.toLocaleString("en-IN")}`;
  }, [stats.totalRevenue]);

  const orderItems = useMemo(
    () => [
      { label: "Pending", value: stats.orderStatusCounts.Pending || 0 },
      { label: "Confirmed", value: stats.orderStatusCounts.Confirmed || 0 },
      { label: "Shipped", value: stats.orderStatusCounts.Shipped || 0 },
      { label: "Delivered", value: stats.orderStatusCounts.Delivered || 0 },
      { label: "Cancelled", value: stats.orderStatusCounts.Cancelled || 0 },
    ],
    [stats.orderStatusCounts]
  );

  const paymentItems = useMemo(
    () => [
      { label: "Pending", value: stats.paymentStatusCounts.Pending || 0 },
      { label: "Created", value: stats.paymentStatusCounts.Created || 0 },
      { label: "Paid", value: stats.paymentStatusCounts.Paid || 0 },
      { label: "Failed", value: stats.paymentStatusCounts.Failed || 0 },
      { label: "Refunded", value: stats.paymentStatusCounts.Refunded || 0 },
    ],
    [stats.paymentStatusCounts]
  );

  const shipmentItems = useMemo(
    () => [
      { label: "NotCreated", value: stats.shipmentStatusCounts.NotCreated || 0 },
      { label: "Created", value: stats.shipmentStatusCounts.Created || 0 },
      { label: "Picked", value: stats.shipmentStatusCounts.Picked || 0 },
      { label: "InTransit", value: stats.shipmentStatusCounts.InTransit || 0 },
      { label: "OutForDelivery", value: stats.shipmentStatusCounts.OutForDelivery || 0 },
      { label: "Delivered", value: stats.shipmentStatusCounts.Delivered || 0 },
      { label: "RTO", value: stats.shipmentStatusCounts.RTO || 0 },
      { label: "Cancelled", value: stats.shipmentStatusCounts.Cancelled || 0 },
      { label: "Failed", value: stats.shipmentStatusCounts.Failed || 0 },
    ],
    [stats.shipmentStatusCounts]
  );

  if (loading) return <p className="p-6">Loading dashboard...</p>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={loadDashboard}
          className="text-sm px-3 py-2 border rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} color="blue" />
        <StatsCard title="Delivered Orders" value={stats.orderStatusCounts.Delivered || 0} icon={TrendingUp} color="green" />
        <StatsCard title="Cancelled Orders" value={stats.orderStatusCounts.Cancelled || 0} icon={ShoppingCart} color="red" />
        <StatsCard title="Total Revenue (Paid)" value={formattedRevenue} icon={IndianRupee} color="purple" />
      </div>

      {/* Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <StatsCard title="Total Products" value={stats.totalProducts} icon={Package} color="blue" />
        <StatsCard title="Total Variants" value={stats.totalVariants} icon={Layers} color="indigo" />
        <StatsCard title="Out of Stock Variants" value={stats.outOfStockVariants} icon={Package} color="red" />
        <StatsCard title="Low Stock Variants" value={stats.lowStockVariants} icon={AlertTriangle} color="yellow" />
      </div>

      {/* Status breakdown */}
      <div className={rowTitle}>Status Overview</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatusBox title="Order Status" items={orderItems} icon={ShoppingCart} />
        <StatusBox title="Payment Status" items={paymentItems} icon={CreditCard} />
        <StatusBox title="Shipment Status" items={shipmentItems} icon={Truck} />
      </div>

      {/* Others */}
      <div className={rowTitle}>Store Overview</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard title="Total Users" value={stats.totalUsers} icon={Users} color="green" />
        <StatsCard title="Pending Reviews" value={stats.pendingReviews} icon={MessageSquare} color="red" />
        <StatsCard title="Active Coupons" value={stats.activeCoupons} icon={TicketPercent} color="purple" />
        <StatsCard title="Categories" value={stats.totalCategories} icon={Package} color="yellow" />
        <StatsCard title="SubCategories" value={stats.totalSubCategories} icon={Package} color="blue" />
        <StatsCard title="Media Assets" value={stats.totalMediaAssets} icon={ImageIcon} color="blue" />
      </div>
    </div>
  );
};

export default Dashboard;
