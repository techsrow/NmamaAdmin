import api from "../../../services/api";


export default function ReviewRow({ review, refresh }) {
  const approve = async () => {
    await api.put(`/reviews/admin/${review.id}/approve`);
    refresh();
  };

  const reject = async () => {
    await api.put(`/reviews/admin/${review.id}/reject`);
    refresh();
  };

  const remove = async () => {
    if (!confirm("Delete this review?")) return;
    await api.delete(`/reviews/admin/${review.id}`);
    refresh();
  };

  return (
    <tr className="border-t">
      <td className="p-2">{review.product?.name}</td>
      <td className="p-2 text-center">{review.rating} ⭐</td>
      <td className="p-2">
        {review.user
          ? `${review.user.firstName} ${review.user.lastName}`
          : "Guest"}
        <br />
        <span className="text-xs text-gray-500">
          {review.user?.email}
        </span>
      </td>
      <td className="p-2 max-w-xs truncate">{review.comment}</td>
      <td className="p-2">
        <div className="flex gap-2">
          {review.images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="w-10 h-10 object-cover rounded"
            />
          ))}
        </div>
      </td>
      <td className="p-2 flex gap-2">
        <button
          onClick={approve}
          className="bg-green-600 text-white px-2 py-1 rounded"
        >
          Approve
        </button>
        <button
          onClick={reject}
          className="bg-yellow-500 text-white px-2 py-1 rounded"
        >
          Reject
        </button>
        <button
          onClick={remove}
          className="bg-red-600 text-white px-2 py-1 rounded"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
