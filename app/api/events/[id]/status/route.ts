import {
  errorResponse,
  formatEventMutation,
  handleRouteError,
  jsonResponse,
} from "../../../../../lib/event-api";
import { EventService } from "../../../../../services/event.service";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // TODO(oauth): enable once Supabase/OAuth auth is wired.
  // const auth = await requireAuth(request);
  // const actor = { userId: auth.userId, isAdmin: auth.user.role === "ADMIN" };
  // const host = actor.isAdmin ? { isHost: true } : await requireHost(auth.userId, params.id);
  // if (!actor.isAdmin && !host.isHost) {
  //   return errorResponse("FORBIDDEN", "Only the event host or an admin can update status.", 403);
  // }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return errorResponse("VALIDATION_ERROR", "Request body must be JSON.", 400);
  }

  const actor = {
    userId: request.headers.get("x-user-id") ?? body.hostId,
    isAdmin: request.headers.get("x-admin") === "true" || body.admin === true,
  };

  try {
    const event = await EventService.updateEventStatus(params.id, body, actor);

    return jsonResponse(formatEventMutation(event));
  } catch (error) {
    return handleRouteError(error);
  }
}
