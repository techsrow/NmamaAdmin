import ReviewRow from "./ReviewRow";

export default function ReviewTable({ reviews, loading, refresh }) {
  if (loading) return <p>Loading reviews...</p>;
  if (!reviews.length) return <p>No pending reviews</p>;

  return (
    <table className="w-full border">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Product</th>
          <th className="p-2">Rating</th>
          <th className="p-2">User</th>
          <th className="p-2">Comment</th>
          <th className="p-2">Images</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {reviews.map((review) => (
          <ReviewRow
            key={review.id}
            review={review}
            refresh={refresh}
          />
        ))}
      </tbody>
    </table>
  );
}
