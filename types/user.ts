/**
 * User Types
 * Type definitions for user-related data structures
 */

export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatar?: string;
  role: string;
  status: string;
  rating: number;
  reviewsCount: number;
  eventsHosted: number;
  eventsAttended: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInput {
  email: string;
  name: string;
  password: string;
  bio?: string;
}

export interface UserProfile {
  name: string;
  bio?: string;
  avatar?: string;
}

export interface UserFilter {
  search?: string;
  role?: string;
  status?: string;
}
