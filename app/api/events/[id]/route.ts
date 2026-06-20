import {
  errorResponse,
  formatEventDetail,
  formatEventMutation,
  handleRouteError,
  jsonResponse,
} from "../../../../lib/event-api";
import { EventService } from "../../../../services/event.service";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // TODO(oauth): replace this with auth-aware detail visibility.
  // const auth = await getOptionalAuth(request);
  // const includeRoomNumber = Boolean(auth.userId);
  const includeRoomNumber = Boolean(request.headers.get("authorization"));

  try {
    const event = await EventService.getEventById(params.id);

    return jsonResponse(formatEventDetail(event, includeRoomNumber));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // TODO(oauth): enable once Supabase/OAuth auth is wired.
  // const auth = await requireAuth(request);
  // const host = await requireHost(auth.userId, params.id);
  // if (!host.isHost) {
  //   return errorResponse("FORBIDDEN", "Only the event host can edit this event.", 403);
  // }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return errorResponse("VALIDATION_ERROR", "Request body must be JSON.", 400);
  }

  const actor = {
    userId: request.headers.get("x-user-id") ?? body.hostId,
  };

  try {
    const event = await EventService.updateEvent(params.id, body, actor);

    return jsonResponse(formatEventMutation(event));
  } catch (error) {
    return handleRouteError(error);
  }
}
