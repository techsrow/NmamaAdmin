export default function ConfirmDialog({
  open,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Yes",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold">{title}</h2>
          </div>
          <div className="p-4 text-sm text-gray-700">{message}</div>
          <div className="px-4 py-3 border-t flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Please wait..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
