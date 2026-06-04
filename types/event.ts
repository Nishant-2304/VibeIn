/**
 * Event Types
 * Type definitions for event-related data structures
 */

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  hostId: string;
  maxParticipants?: number;
  currentParticipants: number;
  status: string;
  category?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventInput {
  title: string;
  description: string;
  date: Date;
  location: string;
  maxParticipants?: number;
  category?: string;
  image?: string;
}

export interface EventFilter {
  search?: string;
  category?: string;
  dateRange?: { start: Date; end: Date };
  location?: string;
  hostId?: string;
}
