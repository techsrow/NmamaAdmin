import { getAuthUser, logout } from "../../utils/auth";

export default function Topbar() {
  const user = getAuthUser();

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6">
      <div className="font-semibold">Crescent Admin</div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">
          {user?.name || user?.email || "Admin"}
        </div>
        <button
          onClick={logout}
          className="px-3 py-2 rounded bg-black text-white text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
