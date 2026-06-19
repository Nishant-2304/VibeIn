/**
 * Current User Events API Route Handler
 * GET: Retrieve all events (hosted and attended) for current user
 */

import { EventStatus } from "@prisma/client";
import { UserService } from "../../../../../services/user.service";
import { UnauthorizedError, ValidationError } from "../../../../../utils/errors";
import { getBearerToken, handleRouteError, json } from "../../route-utils";

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      throw new UnauthorizedError("Authentication token is required");
    }

    const currentUser = await UserService.getCurrentUser(token);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const type = parseRole(role);
    const events = await UserService.getUserEvents(currentUser.id, type);
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
