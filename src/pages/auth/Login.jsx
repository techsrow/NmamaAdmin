import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const { login, resendVerification } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await login(email, password);
      nav("/");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await resendVerification(email);
      setMessage(res?.message || "Verification link sent if email exists.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to resend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-1">Admin Login</h1>
        <p className="text-sm text-gray-500 mb-5">Sign in to manage your store</p>

        {message && <div className="text-sm mb-4 text-red-600">{message}</div>}

        <label className="text-sm font-medium">Email</label>
        <input
          className="w-full border rounded-lg px-3 py-2 mt-1 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <label className="text-sm font-medium">Password</label>
        <input
          className="w-full border rounded-lg px-3 py-2 mt-1 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        <button
          disabled={loading}
          className="w-full bg-black text-white rounded-lg py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <div className="flex items-center justify-between mt-4 text-sm">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>

          <button
            type="button"
            onClick={onResend}
            className="text-blue-600 hover:underline"
            disabled={!email || loading}
          >
            Resend verification
          </button>
        </div>
      </form>
    </div>
  );
}
