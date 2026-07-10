// app/api/events/route.ts
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
import { requireAuth, getBearerToken } from "../../../lib/auth";
import { UserService } from "../../../services/user.service";
import { getHostelsForGender } from "../../../lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);

  // Soft auth: if a valid bearer token is present, derive the caller's
  // gender to scope the feed to their hostels. Anonymous or invalid
  // tokens fall through to the unfiltered feed.
  let genderHostels: string[] | null = null;
  try {
    const token = getBearerToken(request);
    if (token) {
      const currentUser = await UserService.getCurrentUser(token);
      if (currentUser?.gender) {
        genderHostels = getHostelsForGender(currentUser.gender);
      }
    }
  } catch {
    // anonymous or invalid token — fall through to no filter
  }

  try {
    const { events, total } = await EventService.getAllEvents(
      {
        q: searchParams.get("q"),
        hostel: searchParams.get("hostel"),
        floor: searchParams.get("floor"),
        status: searchParams.get("status"),
        hostels: genderHostels,
        // Passing down search param explicitly if filtering specifically for online formats
        isOnline: searchParams.get("isOnline") === "true" ? true : undefined,
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

    // INFERENCE LOGIC: If hostel comes in as "ONLINE", mark database boolean true
    const isOnline = body.hostel === "ONLINE";

    const normalizedPayload = {
      eventname: body.name,
      event_description: body.description,
      is_online: isOnline,
      hostel_name: body.hostel, // Will be stored cleanly as "ONLINE"
      floor: isOnline ? 0 : Number(body.floor),
      room_no: body.roomNumber?.trim() || "", // Holds our meeting URL string or room text
      event_time: body.scheduledAt,
      duration_minutes: body.durationMinutes,
      max_attendees: Number(body.maxAttendees),
    };

    const event = await EventService.createEvent(normalizedPayload, actor);

    return jsonResponse(formatEventMutation(event), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}