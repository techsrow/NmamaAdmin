import { useState } from "react";
import shippingService from "../../services/shippingService";

export default function ShippingRates() {
  const [toPincode, setToPincode] = useState("");
  const [cod, setCod] = useState(false);
  const [totalWeightKg, setTotalWeightKg] = useState(0.5);

  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState([]);
  const [error, setError] = useState("");

  async function fetchRates(e) {
    e.preventDefault();
    setError("");
    setRates([]);
    setLoading(true);

    try {
      const res = await shippingService.getRates({
        toPincode,
        cod,
        totalWeightKg: Number(totalWeightKg),
      });
      setRates(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow p-5">
        <h1 className="text-xl font-semibold">Shipping Rates</h1>
        <p className="text-sm text-gray-600 mt-1">
          Check Shiprocket + Delhivery rates using your backend aggregator.
        </p>

        <form onSubmit={fetchRates} className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium">To Pincode</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={toPincode}
              onChange={(e) => setToPincode(e.target.value)}
              placeholder="e.g. 400001"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={totalWeightKg}
              onChange={(e) => setTotalWeightKg(e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2">
            <input
              id="cod"
              type="checkbox"
              checked={cod}
              onChange={(e) => setCod(e.target.checked)}
            />
            <label htmlFor="cod" className="text-sm font-medium">
              COD
            </label>
          </div>

          <div className="flex items-end">
            <button
              className="w-full bg-black text-white rounded-lg py-2"
              disabled={loading}
            >
              {loading ? "Loading..." : "Get Rates"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold">Results</h2>

        {rates.length === 0 ? (
          <p className="text-sm text-gray-600 mt-2">No rates yet.</p>
        ) : (
          <div className="overflow-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Provider</th>
                  <th className="py-2">Service</th>
                  <th className="py-2">ETA</th>
                  <th className="py-2">COD</th>
                  <th className="py-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{r.provider || "-"}</td>
                    <td className="py-2">{r.service || r.courier || "-"}</td>
                    <td className="py-2">{r.eta || r.deliveryDays || "-"}</td>
                    <td className="py-2">{String(!!r.cod)}</td>
                    <td className="py-2">{r.price ?? r.rate ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
