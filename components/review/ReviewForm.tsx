/**
 * ReviewForm Component
 * Form for submitting or editing event reviews
 * Includes rating, title, and content fields
 */

interface ReviewFormProps {
  eventId: string;
  initialReview?: any;
  onSubmit?: (review: any) => void;
  isLoading?: boolean;
}

export function ReviewForm({
  eventId,
  initialReview,
  onSubmit,
  isLoading,
}: ReviewFormProps) {
  return (
    <form className="review-form" onSubmit={(e) => {
      e.preventDefault();
      onSubmit?.({});
    }}>
      <div className="form-group">
        <label>Rating</label>
        <select required>
          <option value="">Select rating</option>
          <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
          <option value="4">⭐⭐⭐⭐ Good</option>
          <option value="3">⭐⭐⭐ Average</option>
          <option value="2">⭐⭐ Poor</option>
          <option value="1">⭐ Bad</option>
        </select>
      </div>
      <div className="form-group">
        <label>Review Title</label>
        <input type="text" placeholder="Review title..." required />
      </div>
      <div className="form-group">
        <label>Your Review</label>
        <textarea
          placeholder="Share your experience..."
          required
          rows={5}
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
