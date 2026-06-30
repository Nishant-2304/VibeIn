import {
  errorResponse,
  formatEventMutation,
  handleRouteError,
  jsonResponse,
} from "../../../../../lib/event-api";
import { EventService } from "../../../../../services/event.service";
import { requireAuth } from "../../../../../lib/auth";

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

    const actor = {
      userId: currentUser.id,
      isAdmin: currentUser.role === "ADMIN",
    };

    const event = await EventService.updateEventStatus(params.id, body, actor);

    return jsonResponse(formatEventMutation(event));
  } catch (error) {
    return handleRouteError(error);
  }
}
