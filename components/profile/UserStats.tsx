/**
 * UserStats Component
 * Displays user statistics and achievements
 * Shows events hosted, attended, ratings, reviews received
 */

interface UserStatsProps {
  stats: {
    eventsHosted: number;
    eventsAttended: number;
    totalRating: number;
    averageRating: number;
    reviewsReceived: number;
  };
}

export function UserStats({ stats }: UserStatsProps) {
  return (
    <div className="user-stats">
      <div className="stat-item">
        <span className="stat-label">Events Hosted</span>
        <span className="stat-value">{stats.eventsHosted}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Events Attended</span>
        <span className="stat-value">{stats.eventsAttended}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Average Rating</span>
        <span className="stat-value">{stats.averageRating.toFixed(1)}/5</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Reviews Received</span>
        <span className="stat-value">{stats.reviewsReceived}</span>
      </div>
    </div>
  );
}
