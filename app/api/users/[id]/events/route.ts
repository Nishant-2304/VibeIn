/**
 * User Events API Route Handler (public)
 * GET: Retrieve all events (hosted and attended) for a specific user.
 *
 * Mirrors the shape of /api/users/me/events so the client can reuse the
 * MyEventItem type. Supports `role` (hosting | attending) and `status`
 * (UPCOMING | ACTIVE | COMPLETED | CANCELLED) query params.
 */

import { EventStatus } from "@prisma/client";
import { UserService } from "../../../../../services/user.service";
import { ValidationError } from "../../../../../utils/errors";
import { handleRouteError, json } from "../../route-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const type = parseRole(role);
    const events = await UserService.getUserEvents(id, type);
    const response: Record<string, unknown> = {};

    if ("hosted" in events) {
      response.hosting = filterByStatus(events.hosted, status);
    }

    if ("attended" in events) {
      response.attending = filterByStatus(events.attended, status);
    }

    return json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}

function parseRole(role: string | null) {
  if (!role) {
    return undefined;
  }

  if (role === "hosting") {
    return "hosted";
  }

  if (role === "attending") {
    return "attended";
  }

  throw new ValidationError("role must be either hosting or attending");
}

function filterByStatus<T extends { event_status?: EventStatus }>(
  events: T[],
  status: string | null
) {
  if (!status) {
    return events;
  }

  if (!Object.values(EventStatus).includes(status as EventStatus)) {
    throw new ValidationError("Invalid event status");
  }

  return events.filter((event) => event.event_status === status);
}
