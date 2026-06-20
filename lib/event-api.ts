import { AppError } from "../utils/errors";
import { calculateAverageRating } from "../utils/ratings";

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 50;

export function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export function errorResponse(error: string, message: string, status: number) {
  return jsonResponse({ error, message }, status);
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.status);
  }

  console.error(error);
  return errorResponse("INTERNAL_SERVER_ERROR", "Something went wrong.", 500);
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const requestedLimit = Number(searchParams.get("limit")) || DEFAULT_PAGE_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_PAGE_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function pagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}

function countCurrentAttendees(participants: any[] = []) {
  return participants.filter(
    (participant) => participant.attendance_status !== "CANCELLED"
  ).length;
}

function formatPublicHost(host: any) {
  const hostRatings =
    host.hostReviewsReceived?.map((review: any) => review.rating) ?? [];

  return {
    id: host.id,
    displayName: host.username,
    hostRating: calculateAverageRating(hostRatings),
    eventsHosted: host._count?.hostedEvents,
  };
}

export function formatEventListItem(event: any) {
  return {
    id: event.id,
    name: event.eventname,
    description: event.event_description,
    hostel: event.hostel_name,
    floor: event.floor,
    scheduledAt: event.event_time,
    status: event.event_status,
    maxAttendees: event.max_attendees,
    currentAttendees: countCurrentAttendees(event.participants),
    host: {
      id: event.host.id,
      displayName: event.host.username,
      hostRating: calculateAverageRating(
        event.host.hostReviewsReceived?.map((review: any) => review.rating) ?? []
      ),
    },
  };
}

export function formatEventDetail(event: any, includeRoomNumber: boolean) {
  const detail: any = {
    id: event.id,
    name: event.eventname,
    description: event.event_description,
    hostel: event.hostel_name,
    floor: event.floor,
    scheduledAt: event.event_time,
    status: event.event_status,
    maxAttendees: event.max_attendees,
    currentAttendees: countCurrentAttendees(event.participants),
    host: formatPublicHost(event.host),
    reviews: event.eventReviews.map((review: any) => ({
      id: review.id,
      type: "EVENT",
      rating: review.rating,
      comment: review.description,
      reviewer: {
        id: review.user.id,
        displayName: review.user.username,
      },
      createdAt: review.createdAt,
    })),
  };

  if (includeRoomNumber) {
    detail.roomNumber = event.room_no;
  }

  return detail;
}

export function formatEventMutation(event: any) {
  return {
    id: event.id,
    name: event.eventname,
    description: event.event_description,
    hostel: event.hostel_name,
    floor: event.floor,
    roomNumber: event.room_no,
    hostId: event.host_id,
    scheduledAt: event.event_time,
    durationMinutes: event.duration_minutes,
    status: event.event_status,
    maxAttendees: event.max_attendees,
    currentAttendees: countCurrentAttendees(event.participants),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

export function formatRegistration(registration: any) {
  return {
    id: registration.id,
    eventId: registration.event_id,
    userId: registration.user_id,
    attendanceStatus: registration.attendance_status,
    registeredAt: registration.createdAt,
  };
}

export function formatRegistrationListItem(registration: any) {
  return {
    id: registration.id,
    user: {
      id: registration.user.id,
      displayName: registration.user.username,
      participantRating: calculateAverageRating(
        registration.user.participantReviewsReceived?.map(
          (review: any) => review.rating
        ) ?? []
      ),
    },
    attendanceStatus: registration.attendance_status,
    registeredAt: registration.createdAt,
  };
}

export function formatRegistrationDetail(registration: any) {
  return {
    id: registration.id,
    eventId: registration.event_id,
    user: {
      id: registration.user.id,
      displayName: registration.user.username,
      email: registration.user.email,
    },
    attendanceStatus: registration.attendance_status,
    registeredAt: registration.createdAt,
    updatedAt: registration.updatedAt,
  };
}

export function formatEventReview(review: any) {
  return {
    id: review.id,
    type: "EVENT",
    rating: review.rating,
    comment: review.description,
    reviewer: {
      id: review.user.id,
      displayName: review.user.username,
    },
    createdAt: review.createdAt,
  };
}

export function formatCreateEventReviewResponse(result: any) {
  return {
    eventReview: {
      id: result.eventReview.id,
      rating: result.eventReview.rating,
      comment: result.eventReview.description,
    },
    hostReview: {
      id: result.hostReview.id,
      rating: result.hostReview.rating,
      comment: result.hostReview.description,
    },
  };
}

export function formatParticipantReview(review: any) {
  return {
    id: review.id,
    eventId: review.event_id,
    rating: review.rating,
    comment: review.description,
    participant: {
      id: review.participant.id,
      displayName: review.participant.username,
    },
    host: {
      id: review.host.id,
      displayName: review.host.username,
    },
    createdAt: review.createdAt,
  };
}
