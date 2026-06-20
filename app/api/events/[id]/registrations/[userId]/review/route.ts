/**
 * Per-participant Review API Route Handler
 * POST: Host — submit a review of a specific participant for this event.
 * GET: Participant, host, or admin — retrieve the host's review of a
 *      specific participant for this event (404 if none exists).
 */

// TODO(oauth): wire Supabase/OAuth auth once auth is set up.

import {
  errorResponse,
  formatParticipantReview,
  handleRouteError,
  jsonResponse,
} from "../../../../../../../lib/event-api";
import { ReviewService } from "../../../../../../../services/review.service";

export async function GET(
  _request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const review = await ReviewService.getParticipantReview(
      params.id,
      params.userId
    );

    return jsonResponse(formatParticipantReview(review));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return errorResponse("VALIDATION_ERROR", "Request body must be JSON.", 400);
  }

  try {
    const review = await ReviewService.createParticipantReview(
      params.id,
      params.userId,
      body
    );

    return jsonResponse(formatParticipantReview(review), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}