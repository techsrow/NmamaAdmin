import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await forgotPassword(email);
      setMsg(res?.message || "If the email exists, a reset link was sent.");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-1">Forgot Password</h1>
        <p className="text-sm text-gray-500 mb-5">We’ll email you a reset link.</p>

        {msg && <div className="text-sm mb-4 text-green-700">{msg}</div>}

        <label className="text-sm font-medium">Email</label>
        <input
          className="w-full border rounded-lg px-3 py-2 mt-1 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <button
          disabled={loading}
          className="w-full bg-black text-white rounded-lg py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"}
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
