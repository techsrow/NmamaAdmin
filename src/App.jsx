import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/auth/Login";

function AppLayout() {
  const { token, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // If not logged in → show login
  if (!token) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-auto p-6">
          <Outlet /> {/* ✅ THIS IS IMPORTANT */}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;