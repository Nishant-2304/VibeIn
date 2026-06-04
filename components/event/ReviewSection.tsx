/**
 * ReviewSection Component
 * Displays event reviews and ratings
 * Shows average rating, individual reviews, and review form
 */

interface ReviewSectionProps {
  eventId: string;
  reviews: Array<any>;
  averageRating?: number;
  onReviewSubmit?: (review: any) => void;
}

export function ReviewSection({
  eventId,
  reviews,
  averageRating,
  onReviewSubmit,
}: ReviewSectionProps) {
  return (
    <div className="review-section">
      {averageRating && (
        <div className="rating-summary">
          <h3>Average Rating: {averageRating}/5</h3>
        </div>
      )}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p>No reviews yet</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="reviewer">{review.author}</div>
              <div className="rating">{"⭐".repeat(review.rating)}</div>
              <div className="content">{review.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
