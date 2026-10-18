import AppLayout from "./App";
import React,{lazy,Suspense} from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./index.css";
import "./assets/admin.css";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";


// Pages
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

import Dashboard from "./pages/Dashboard";
import Categories from "./pages/catalog/Categories";
import SubCategories from "./pages/catalog/SubCategories";
const Products=lazy(()=>import("./pages/admin/Products"));
const ProductForm=lazy(()=>import("./pages/admin/ProductForm"));
const OrderDetails=lazy(()=>import("./pages/admin/OrderDetails"));
import Orders from "./pages/admin/Orders";
import TagsPage from "./pages/tags/TagsPage";
import CouponsPage from "./pages/CouponsPage";
import ReviewsPage from "./pages/admin/reviews/ReviewsPage";
import Users from "./pages/Users";
import HomeSliderAdmin from "./pages/admin/home-slider/HomeSliderAdmin";
import BannerGridAdmin from "./pages/admin/banner-grid/page";

const ModuleRoute=lazy(()=>import("./pages/platform/ModuleRoute"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>

      {/* ✅ Removed basename="/admin" */}
      <BrowserRouter>
        <Suspense fallback={<div className="p-6">Loading page…</div>}><Routes>

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />
          <Route
            path="/verify-email"
            element={<VerifyEmail />}
          />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>

              <Route index element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />

              <Route
                path="/categories"
                element={<Categories />}
              />

              <Route
                path="/subcategories"
                element={<SubCategories />}
              />

              <Route
                path="/products"
                element={<Products />}
              />

              <Route
                path="/products/new"
                element={<ProductForm mode="create" />}
              />

              <Route
                path="/products/:id/edit"
                element={<ProductForm mode="edit" />}
              />

              
            

              <Route
                path="/orders"
                element={<Orders />}
              />

              <Route
                path="/orders/:id"
                element={<OrderDetails />}
              />

              <Route
                path="/tags"
                element={<TagsPage />}
              />

              <Route
                path="/coupons"
                element={<CouponsPage />}
              />

              <Route
                path="/reviews"
                element={<ReviewsPage />}
              />

              <Route
                path="/users"
                element={<Users />}
              />

              <Route
                path="/home-slider"
                element={<HomeSliderAdmin />}
              />

              <Route
                path="/banner-grid"
                element={<BannerGridAdmin />}
              />

              <Route path="/manage/:module" element={<ModuleRoute />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes></Suspense>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);