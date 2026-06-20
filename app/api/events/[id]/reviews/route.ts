/**
 * Event Reviews API Route Handler
 * GET: Public — list all event-level reviews for the given event.
 * POST: Authenticated participant — submit an event review and a host review
 *       together for a COMPLETED event the user ATTENDED.
 */

// TODO(oauth): wire Supabase/OAuth auth once auth is set up.

import {
  errorResponse,
  formatCreateEventReviewResponse,
  formatEventReview,
  handleRouteError,
  jsonResponse,
} from "../../../../../lib/event-api";
import { ReviewService } from "../../../../../services/review.service";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reviews = await ReviewService.getEventReviews(params.id);

    return jsonResponse({
      reviews: reviews.map(formatEventReview),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return errorResponse("VALIDATION_ERROR", "Request body must be JSON.", 400);
  }

  const userId = request.headers.get("x-user-id") ?? body.userId;

  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const result = await ReviewService.createReview(userId, params.id, body);

    return jsonResponse(formatCreateEventReviewResponse(result), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}