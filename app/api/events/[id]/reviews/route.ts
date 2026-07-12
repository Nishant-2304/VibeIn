/**
 * Event Reviews API Route Handler
 * GET: Retrieve list of all reviews for an event
 * POST: Create new review for event
 */

import { ReviewService } from "../../../../../services/review.service";
import { UserService } from "../../../../../services/user.service";
import { UnauthorizedError } from "../../../../../utils/errors";
import {
  getBearerToken,
  handleRouteError,
  json,
} from "../../../users/route-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reviews = await ReviewService.getEventReviews(id);

    return json({
      reviews: reviews.eventReviews.map(toEventReviewResponse),
      hostReviews: reviews.hostReviews.map(toHostReviewResponse),
      participantReviews: reviews.participantReviews.map(
        toParticipantReviewResponse
      ),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getBearerToken(request);

    if (!token) {
      throw new UnauthorizedError("Authentication token is required");
    }

    const currentUser = await UserService.getCurrentUser(token);
    const body = await request.json();
    const review = await ReviewService.createReview(
      currentUser.id,
      id,
      body
    );

    return json(
      {
        eventReview: toEventReviewResponse(review.eventReview),
        hostReview: toHostReviewResponse(review.hostReview),
      },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

function toEventReviewResponse(review: any) {
  return {
    id: review.id,
    type: "EVENT",
    rating: review.rating,
    comment: review.description,
    reviewer: toReviewer(review.user),
    createdAt: review.createdAt,
  };
}

function toHostReviewResponse(review: any) {
  return {
    id: review.id,
    type: "HOST",
    rating: review.rating,
    comment: review.description,
    host: toReviewer(review.host),
    reviewer: toReviewer(review.reviewer),
    createdAt: review.createdAt,
  };
}

function toParticipantReviewResponse(review: any) {
  return {
    id: review.id,
    type: "PARTICIPANT",
    rating: review.rating,
    comment: review.description,
    participant: toReviewer(review.participant),
    reviewer: toReviewer(review.host),
    createdAt: review.createdAt,
  };
}

function toReviewer(user: any) {
  return {
    id: user.id,
    displayName: user.username,
  };
}
