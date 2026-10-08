export default function EmptyState({ title = "No data", subtitle = "" }) {
  return (
    <div className="py-10 text-center">
      <div className="font-medium">{title}</div>
      {subtitle ? <div className="text-sm text-gray-600 mt-1">{subtitle}</div> : null}
    </div>
  );
}
