/**
 * Review Types
 * Type definitions for review-related data structures
 */

export interface Review {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewInput {
  rating: number;
  title: string;
  content: string;
}

export interface ReviewFilter {
  eventId?: string;
  userId?: string;
  minRating?: number;
  maxRating?: number;
}
