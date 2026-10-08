export default function StatusBadge({ value }) {
  const v = String(value || "").toLowerCase();
  const cls =
    v.includes("deliver") ? "bg-green-100 text-green-700" :
    v.includes("cancel") ? "bg-red-100 text-red-700" :
    v.includes("fail") ? "bg-red-100 text-red-700" :
    v.includes("transit") ? "bg-blue-100 text-blue-700" :
    "bg-gray-100 text-gray-700";

  return (
    <span className={`inline-flex px-2 py-1 rounded text-xs ${cls}`}>
      {value || "-"}
    </span>
  );
}
