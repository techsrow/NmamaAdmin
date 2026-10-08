import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);

  const [msg, setMsg] = useState("Verifying...");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setMsg("Verification token missing in URL.");
        setOk(false);
        return;
      }
      try {
        const res = await verifyEmail(token);
        setMsg(res?.message || "Email verified successfully.");
        setOk(true);
      } catch (err) {
        setMsg(err?.response?.data?.message || "Verification failed.");
        setOk(false);
      }
    };
    run();
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-2">Email Verification</h1>
        <div className={`text-sm ${ok ? "text-green-700" : "text-red-600"}`}>{msg}</div>

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}
