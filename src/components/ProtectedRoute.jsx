import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { token, user, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if(!["Admin","Staff"].includes(user?.role))return <div className="p-6">This account cannot access the admin.</div>;
  return <Outlet />;
}
