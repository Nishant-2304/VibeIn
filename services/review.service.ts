import { AttendanceStatus, EventStatus } from "@prisma/client";
import { AppError, BusinessRuleError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "../utils/errors";
import { ReviewRepository } from "../repositories/review.repository";

type Actor = {
  userId?: string | null;
  isAdmin?: boolean;
};

function validateRating(value: unknown, fieldName = "rating") {
  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ValidationError(`${fieldName} must be an integer from 1 to 5.`);
  }

  return rating;
}

function validateComment(value: unknown, fieldName: string) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string.`);
  }

  if (value.length > 500) {
    throw new ValidationError(`${fieldName} must be 500 characters or fewer.`);
  }

  return value;
}

export class ReviewService {
  static async createReview(
    userId: string | null | undefined,
    eventId: string,
    data: any
  ) {
    if (!userId) {
      throw new UnauthorizedError("Authentication required.");
    }

    const event = await ReviewRepository.findEventById(eventId);

    if (!event) {
      throw new NotFoundError("Event not found.");
    }

    if (event.event_status !== EventStatus.COMPLETED) {
      throw new BusinessRuleError(
        "EVENT_NOT_COMPLETED",
        "Event must be completed before reviews can be submitted."
      );
    }

    const registration = await ReviewRepository.findRegistration(userId, eventId);

    if (!registration || registration.attendance_status !== AttendanceStatus.ATTENDED) {
      throw new BusinessRuleError(
        "REVIEW_NOT_ALLOWED",
        "Only attended participants can review this event."
      );
    }

    const existingReview = await ReviewRepository.findEventReviewByUserAndEvent(
      userId,
      eventId
    );

    if (existingReview) {
      throw new AppError("DUPLICATE_REVIEW", 409, "User has already reviewed this event.");
    }

    const eventRating = validateRating(data.eventRating, "eventRating");
    const hostRating = validateRating(data.hostRating, "hostRating");
    const eventComment = validateComment(data.eventComment, "eventComment");
    const hostComment = validateComment(data.hostComment, "hostComment");

    return ReviewRepository.createEventAndHostReviews({
      eventReview: {
        event_id: eventId,
        user_id: userId,
        rating: eventRating,
        description: eventComment,
      },
      hostReview: {
        host_id: event.host_id,
        reviewer_id: userId,
        event_id: eventId,
        rating: hostRating,
        description: hostComment,
      },
    });
  }

  static async getEventReviews(eventId: string) {
    const event = await ReviewRepository.findEventById(eventId);

    if (!event) {
      throw new NotFoundError("Event not found.");
    }

    return ReviewRepository.findEventReviews(eventId);
  }

  static async createParticipantReview(
    eventId: string,
    participantId: string,
    data: any,
    actor?: Actor
  ) {
    const event = await ReviewRepository.findEventById(eventId);

    if (!event) {
      throw new NotFoundError("Event not found.");
    }

    if (actor?.userId && actor.userId !== event.host_id) {
      throw new ForbiddenError("Only the event host can review participants.");
    }

    if (event.event_status !== EventStatus.COMPLETED) {
      throw new BusinessRuleError(
        "EVENT_NOT_COMPLETED",
        "Event must be completed before participant reviews can be submitted."
      );
    }

    const registration = await ReviewRepository.findRegistration(participantId, eventId);

    if (
      !registration ||
      ![AttendanceStatus.ATTENDED, AttendanceStatus.NO_SHOW].includes(
        registration.attendance_status
      )
    ) {
      throw new BusinessRuleError(
        "PARTICIPANT_REVIEW_NOT_ALLOWED",
        "Target user must have ATTENDED or NO_SHOW attendance status."
      );
    }

    const existingReview = await ReviewRepository.findParticipantReview(
      event.host_id,
      participantId,
      eventId
    );

    if (existingReview) {
      throw new AppError(
        "DUPLICATE_REVIEW",
        409,
        "Host has already reviewed this participant for this event."
      );
    }

    return ReviewRepository.createParticipantReview({
      participant_id: participantId,
      host_id: event.host_id,
      event_id: eventId,
      rating: validateRating(data.rating),
      description: validateComment(data.comment, "comment"),
    });
  }

  static async getParticipantReview(
    eventId: string,
    participantId: string,
    actor?: Actor
  ) {
    const event = await ReviewRepository.findEventById(eventId);

    if (!event) {
      throw new NotFoundError("Event not found.");
    }

    if (
      actor?.userId &&
      !actor.isAdmin &&
      actor.userId !== event.host_id &&
      actor.userId !== participantId
    ) {
      throw new ForbiddenError("You cannot view this participant review.");
    }

    const review = await ReviewRepository.findParticipantReview(
      event.host_id,
      participantId,
      eventId
    );

    if (!review) {
      throw new NotFoundError("Participant review not found.");
    }

    return review;
  }
}
