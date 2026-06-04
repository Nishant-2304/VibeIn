/**
 * ReviewCard Component
 * Displays individual review card
 * Shows reviewer info, rating, and review content
 */

interface ReviewCardProps {
  review: any;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  return (
    <div className="review-card">
      <div className="review-header">
        <span className="reviewer-name">{review.reviewerName}</span>
        <span className="rating">{"⭐".repeat(review.rating)}</span>
      </div>
      <p className="review-content">{review.content}</p>
      <p className="review-date">{new Date(review.createdAt).toLocaleDateString()}</p>
      <div className="review-actions">
        {onEdit && <button onClick={onEdit}>Edit</button>}
        {onDelete && <button onClick={onDelete}>Delete</button>}
      </div>
    </div>
  );
}
