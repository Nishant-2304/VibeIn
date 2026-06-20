/**
 * User Review API Route Handler
 * GET: Get review by specific user for an event
 * POST: Submit/update review by user for event
 * DELETE: Delete user's review
 */

import { ReviewService } from "../../../../../../../services/review.service";
import { UserService } from "../../../../../../../services/user.service";
import { UnauthorizedError } from "../../../../../../../utils/errors";
import {
  getBearerToken,
  handleRouteError,
  json,
} from "../../../../../users/route-utils";

export async function GET(
  _request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    const review = await ReviewService.getParticipantReviewForViewer(
      currentUser.id,
      params.id,
      params.userId
    );

    return json(toParticipantReviewResponse(review));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    const body = await request.json();
    const review = await ReviewService.createParticipantReview(
      currentUser.id,
      params.id,
      params.userId,
      body
    );

    return json(toParticipantReviewResponse(review), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    const review = await ReviewService.getParticipantReview(
      currentUser.id,
      params.id,
      params.userId
    );

    await ReviewService.deleteReview(review.id);

    return json({ message: "Review deleted." });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function getCurrentUser(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    throw new UnauthorizedError("Authentication token is required");
  }

  return UserService.getCurrentUser(token);
}

function toParticipantReviewResponse(review: any) {
  return {
    id: review.id,
    type: "PARTICIPANT",
    rating: review.rating,
    comment: review.description,
    participant: toUser(review.participant),
    reviewer: toUser(review.host),
    eventId: review.event_id,
    createdAt: review.createdAt,
  };
}

function toUser(user: any) {
  return {
    id: user.id,
    displayName: user.username,
  };
}
