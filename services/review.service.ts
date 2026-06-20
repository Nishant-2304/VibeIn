/**
 * Review Service
 * Business logic for event reviews and ratings
 * Handles review creation, updates, and rating calculations
 */

import { AttendanceStatus, EventStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { ReviewRepository } from "../repositories/review.repository";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors";

type EventReviewInput = {
  eventRating?: number;
  eventComment?: string;
  hostRating?: number;
  hostComment?: string;
  rating?: number;
  description?: string;
};

type ParticipantReviewInput = {
  rating: number;
  comment?: string;
  description?: string;
};

export class ReviewService {
  /**
   * Create review for event
   */
  static async createReview(userId: string, eventId: string, data: EventReviewInput) {
    const event = await this.getEventOrThrow(eventId);

    if (event.event_status !== EventStatus.COMPLETED) {
      throw new ValidationError("Reviews can only be submitted for completed events");
    }

    if (event.host_id === userId) {
      throw new ForbiddenError("Hosts cannot review their own event as a participant");
    }

    const registration = await this.getRegistrationOrThrow(userId, eventId);

    if (registration.attendance_status !== AttendanceStatus.ATTENDED) {
      throw new ForbiddenError("Only attended participants can review this event");
    }

    const existing = await ReviewRepository.findByUserAndEvent(userId, eventId);

    if (existing.eventReview || existing.hostReview) {
      throw new ConflictError("User has already reviewed this event");
    }

    const eventRating = this.readRating(data.eventRating ?? data.rating, "eventRating");
    const hostRating = this.readRating(data.hostRating, "hostRating");

    return ReviewRepository.createEventAndHostReview({
      eventReview: {
        event_id: eventId,
        user_id: userId,
        rating: eventRating,
        description: this.normalizeComment(data.eventComment ?? data.description),
      },
      hostReview: {
        event_id: eventId,
        host_id: event.host_id,
        reviewer_id: userId,
        rating: hostRating,
        description: this.normalizeComment(data.hostComment),
      },
    });
  }

  /**
   * Update review
   */
  static async updateReview(reviewId: string, data: EventReviewInput) {
    const review = await ReviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    const rating = data.rating ?? data.eventRating;
    const description = data.description ?? data.eventComment ?? data.hostComment;
    const updateData: any = { type: review.type };

    if (rating !== undefined) {
      updateData.rating = this.readRating(rating, "rating");
    }

    if (description !== undefined) {
      updateData.description = this.normalizeComment(description);
    }

    if (Object.keys(updateData).length === 1) {
      throw new ValidationError("No valid review fields provided");
    }

    return ReviewRepository.update(reviewId, updateData);
  }

  /**
   * Delete review
   */
  static async deleteReview(reviewId: string) {
    const deleted = await ReviewRepository.delete(reviewId);

    if (!deleted) {
      throw new NotFoundError("Review not found");
    }

    return deleted;
  }

  /**
   * Get event reviews
   */
  static async getEventReviews(eventId: string) {
    await this.getEventOrThrow(eventId);

    return ReviewRepository.findByEventId(eventId);
  }

  /**
   * Get user's review for event
   */
  static async getUserReview(userId: string, eventId: string) {
    await this.getEventOrThrow(eventId);

    const review = await ReviewRepository.findByUserAndEvent(userId, eventId);

    if (!review.eventReview && !review.hostReview && !review.participantReview) {
      throw new NotFoundError("Review not found");
    }

    return review;
  }

  /**
   * Calculate event average rating
   */
  static async calculateEventRating(eventId: string) {
    await this.getEventOrThrow(eventId);

    const result = await ReviewRepository.calculateEventRating(eventId);
    const reviewCount = result._count.rating;
    const totalRating = result._sum.rating ?? 0;

    return {
      averageRating: reviewCount > 0 ? totalRating / reviewCount : 0,
      totalRating,
      reviewCount,
    };
  }

  /**
   * Create host review for a participant
   */
  static async createParticipantReview(
    hostId: string,
    eventId: string,
    participantId: string,
    data: ParticipantReviewInput
  ) {
    const event = await this.getEventOrThrow(eventId);

    if (event.host_id !== hostId) {
      throw new ForbiddenError("Only the event host can review participants");
    }

    if (event.event_status !== EventStatus.COMPLETED) {
      throw new ValidationError("Participant reviews require a completed event");
    }

    const registration = await this.getRegistrationOrThrow(participantId, eventId);

    if (
      registration.attendance_status !== AttendanceStatus.ATTENDED &&
      registration.attendance_status !== AttendanceStatus.NO_SHOW
    ) {
      throw new ValidationError("Participant must be marked attended or no-show");
    }

    const existing = await ReviewRepository.findParticipantReview(
      hostId,
      participantId,
      eventId
    );

    if (existing) {
      throw new ConflictError("Participant has already been reviewed for this event");
    }

    return ReviewRepository.create({
      type: "PARTICIPANT",
      event_id: eventId,
      host_id: hostId,
      participant_id: participantId,
      rating: this.readRating(data.rating, "rating"),
      description: this.normalizeComment(data.description ?? data.comment),
    });
  }

  /**
   * Get host's review of a participant
   */
  static async getParticipantReview(
    hostId: string,
    eventId: string,
    participantId: string
  ) {
    const review = await ReviewRepository.findParticipantReview(
      hostId,
      participantId,
      eventId
    );

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    return review;
  }

  /**
   * Get a participant review visible to participant, host, or admin
   */
  static async getParticipantReviewForViewer(
    viewerId: string,
    eventId: string,
    participantId: string
  ) {
    const event = await this.getEventOrThrow(eventId);
    const viewer = await prisma.user.findUnique({ where: { id: viewerId } });

    if (!viewer) {
      throw new NotFoundError("User not found");
    }

    const canView =
      viewerId === event.host_id || viewerId === participantId || viewer.role === "ADMIN";

    if (!canView) {
      throw new ForbiddenError("You cannot view this review");
    }

    return this.getParticipantReview(event.host_id, eventId, participantId);
  }

  private static async getEventOrThrow(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundError("Event not found");
    }

    return event;
  }

  private static async getRegistrationOrThrow(userId: string, eventId: string) {
    const registration = await prisma.eventParticipant.findUnique({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: eventId,
        },
      },
    });

    if (!registration) {
      throw new ForbiddenError("User is not registered for this event");
    }

    return registration;
  }

  private static readRating(value: number | undefined, field: string) {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new ValidationError(`${field} must be an integer from 1 to 5`);
    }

    return value;
  }

  private static normalizeComment(comment?: string) {
    if (comment === undefined || comment === null) {
      return null;
    }

    const normalized = comment.trim();

    if (normalized.length > 500) {
      throw new ValidationError("Review comment must be 500 characters or fewer");
    }

    return normalized || null;
  }
}
