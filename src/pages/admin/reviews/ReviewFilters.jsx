export default function ReviewFilters({ rating, setRating }) {
  return (
    <div className="flex gap-4 mb-4">
      <select
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        className="border px-3 py-2 rounded"
      >
        <option value="all">All Ratings</option>
        {[5, 4, 3, 2, 1].map((r) => (
          <option key={r} value={r}>
            {r} Stars
          </option>
        ))}
      </select>
    </div>
  );
}
