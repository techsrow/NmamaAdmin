import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn, isAdmin } from "../../utils/auth";

export default function AdminRoute() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/login" replace />;
  return <Outlet />;
}
