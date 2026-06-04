/**
 * Ratings Utility
 * Handles rating calculations and aggregations
 */

/**
 * Calculate average rating
 */
export function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

/**
 * Calculate rating distribution
 */
export function calculateRatingDistribution(ratings: number[]) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  ratings.forEach((rating) => {
    if (rating >= 1 && rating <= 5) {
      distribution[rating as keyof typeof distribution]++;
    }
  });

  return distribution;
}

/**
 * Format rating display
 */
export function formatRatingDisplay(rating: number): string {
  const stars = Math.round(rating);
  return "⭐".repeat(stars);
}

/**
 * Get rating label
 */
export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Good";
  if (rating >= 2.5) return "Average";
  if (rating >= 1.5) return "Poor";
  return "Bad";
}
