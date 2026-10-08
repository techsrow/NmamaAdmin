import { useEffect, useState } from "react";
import api from "../../../services/api";
import ReviewTable from "./ReviewTable";
import ReviewFilters from "./ReviewFilters";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState("all");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reviews/admin/pending");
      setReviews(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews =
    rating === "all"
      ? reviews
      : reviews.filter((r) => r.rating === Number(rating));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Reviews Manager</h1>

      <ReviewFilters rating={rating} setRating={setRating} />

      <ReviewTable
        reviews={filteredReviews}
        loading={loading}
        refresh={fetchReviews}
      />
    </div>
  );
}
