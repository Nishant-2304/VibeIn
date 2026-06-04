/**
 * RatingDisplay Component
 * Displays user rating with star visualization
 * Shows overall rating and breakdown by category
 */

interface RatingDisplayProps {
  rating: number;
  count?: number;
  breakdown?: { [key: string]: number };
}

export function RatingDisplay({ rating, count, breakdown }: RatingDisplayProps) {
  return (
    <div className="rating-display">
      <div className="overall-rating">
        <span className="stars">{"⭐".repeat(Math.round(rating))}</span>
        <span className="value">{rating.toFixed(1)}/5</span>
        {count && <span className="count">({count} reviews)</span>}
      </div>
      {breakdown && (
        <div className="breakdown">
          {Object.entries(breakdown).map(([category, value]) => (
            <div key={category} className="breakdown-item">
              <span>{category}</span>
              <div className="bar" style={{ width: `${(value / 5) * 100}%` }}></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
