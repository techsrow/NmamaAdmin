import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [params] = useSearchParams();

  const token = useMemo(() => params.get("token") || "", [params]);
  const [newPassword, setNewPassword] = useState("");

  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await resetPassword(token, newPassword);
      setMsg(res?.message || "Password updated successfully.");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
          <div className="text-red-600 text-sm">Reset token missing in URL.</div>
          <div className="mt-4">
            <Link to="/login" className="text-blue-600 hover:underline text-sm">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-1">Reset Password</h1>
        <p className="text-sm text-gray-500 mb-5">Enter your new password.</p>

        {msg && <div className="text-sm mb-4 text-green-700">{msg}</div>}

        <label className="text-sm font-medium">New Password</label>
        <input
          className="w-full border rounded-lg px-3 py-2 mt-1 mb-4"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          minLength={6}
          required
        />

        <button
          disabled={loading}
          className="w-full bg-black text-white rounded-lg py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update password"}
        </button>

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
