import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tags,
  Star,
  Ticket,
  LogOut,
  Boxes,
  Search,
  Warehouse,
  CreditCard,
  Truck,
  Undo2,
  BadgePercent,
  Megaphone,
  FileText,
  Headphones,
  BarChart3,
  Activity,
  Receipt,
  ShieldCheck,
  Globe2,
  Plug,
  Zap,
  Accessibility,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
const groups = [
  {
    label: "Commerce",
    items: [
      ["Products", "/products", Package],
      ["Categories", "/categories", Tags],
      ["Subcategories", "/subcategories", Tags],
      ["Collections & Brands", "/manage/collections", Boxes],
      ["Search & Filters", "/manage/search", Search],
      ["Inventory", "/manage/inventory", Warehouse],
      ["Stock Ledger", "/manage/ledger", Boxes],
      ["Stock Reconciliation", "/manage/reconciliation", Warehouse],
      ["Barcodes & Labels", "/manage/barcodes", Tags],
      ["Orders", "/orders", ShoppingCart],
      ["Payments", "/manage/payments", CreditCard],
      ["Shipping", "/manage/shipping", Truck],
      ["Returns & Exchanges", "/manage/returns", Undo2],
      ["Promotions", "/manage/promotions", BadgePercent],
    ],
  },
  {
    label: "Customers & Growth",
    items: [
      ["Customers", "/users", Users],
      ["Reviews & Trust", "/manage/trust", Star],
      ["Marketing", "/manage/marketing", Megaphone],
      ["Support", "/manage/support", Headphones],
      ["Analytics", "/manage/analytics", BarChart3],
      ["Tracking & Ads", "/manage/tracking", Activity],
    ],
  },
  {
    label: "Storefront",
    items: [
      ["Home Slider", "/home-slider", FileText],
      ["Home Banner", "/banner-grid", FileText],
      ["Content", "/manage/content", FileText],
      ["Navigation Menus", "/manage/navigation", FileText],
      ["SEO", "/manage/seo", Search],
    ],
  },
  {
    label: "Operations",
    items: [
      ["Taxes & Invoicing", "/manage/tax", Receipt],
      ["Admin & Staff", "/manage/staff", Users],
      ["Security", "/manage/security", ShieldCheck],
      ["International", "/manage/international", Globe2],
      ["Integrations", "/manage/integrations", Plug],
      ["Mobile & Push", "/manage/mobile", Zap],
      ["Accessibility", "/manage/accessibility", Accessibility],
    ],
  },
];
export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { logout, user } = useAuth();
  return (
    <>
      <div
        className={`admin-backdrop ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <span className="brand-mark">n</span>
          <div>
            <b>Namama</b>
            <small>Commerce Admin</small>
          </div>
        </div>
        <div className="admin-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `navitem ${isActive ? "active" : ""}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          {groups.map((g) => (
            <div className="navgroup" key={g.label}>
              <div className="navlabel">{g.label}</div>
              {g.items.map(([name, to, Icon]) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `navitem ${isActive ? "active" : ""}`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={17} />
                  {name}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
        <div className="admin-user">
          <div>
            <b>
              {user?.firstName || "Admin"} {user?.lastName || ""}
            </b>
            <small>{user?.role || "Administrator"}</small>
          </div>
          <button onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
