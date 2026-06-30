import {
  errorResponse,
  formatEventDetail,
  formatEventMutation,
  handleRouteError,
  jsonResponse,
} from "../../../../lib/event-api";
import { EventService } from "../../../../services/event.service";
import { requireAuth, getBearerToken } from "../../../../lib/auth";
import { UnauthorizedError } from "../../../../utils/errors";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Authentication is optional here. Presence of a valid bearer token unlocks
  // private event details (e.g. roomNumber). The same Supabase auth flow used
  // throughout the app is reused.
  let hasValidAuth = false;
  const token = getBearerToken(request);

  if (token) {
    try {
      await requireAuth(request);
      hasValidAuth = true;
    } catch (error) {
      if (!(error instanceof UnauthorizedError)) {
        throw error;
      }
    }
  }

  try {
    const event = await EventService.getEventById(params.id);

    return jsonResponse(formatEventDetail(event, hasValidAuth));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth(request);
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return errorResponse("VALIDATION_ERROR", "Request body must be JSON.", 400);
    }

    const actor = { userId: currentUser.id };

    const event = await EventService.updateEvent(params.id, body, actor);

    return jsonResponse(formatEventMutation(event));
  } catch (error) {
    return handleRouteError(error);
  }
}
