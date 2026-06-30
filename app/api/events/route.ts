import {
  errorResponse,
  formatEventListItem,
  formatEventMutation,
  handleRouteError,
  jsonResponse,
  pagination,
  parsePagination,
} from "../../../lib/event-api";
import { EventService } from "../../../services/event.service";
import { requireAuth } from "../../../lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);

  try {
    const { events, total } = await EventService.getAllEvents(
      {
        q: searchParams.get("q"),
        hostel: searchParams.get("hostel"),
        floor: searchParams.get("floor"),
        status: searchParams.get("status"),
      },
      { skip, limit }
    );

    return jsonResponse({
      events: events.map(formatEventListItem),
      pagination: pagination(page, limit, total),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth(request);
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return errorResponse("VALIDATION_ERROR", "Request body must be JSON.", 400);
    }

    const actor = { userId: currentUser.id };

    const event = await EventService.createEvent(body, actor);

    return jsonResponse(formatEventMutation(event), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
