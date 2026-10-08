export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-lg border">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="px-2 py-1 rounded hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
