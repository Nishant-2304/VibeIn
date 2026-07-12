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
import { RegistrationRepository } from "../../../../repositories/registration.repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Authentication is optional here. Private event details (e.g. roomNumber)
  // are only returned to the host, admins, or registered participants.
  let currentUser: Awaited<ReturnType<typeof requireAuth>> | null = null;
  const token = getBearerToken(request);

  if (token) {
    try {
      currentUser = await requireAuth(request);
    } catch (error) {
      if (!(error instanceof UnauthorizedError)) {
        throw error;
      }
    }
  }

  try {
    const event = await EventService.getEventById(id);
    let includeRoomNumber = false;

    if (currentUser) {
      includeRoomNumber =
        currentUser.role === "ADMIN" || event.host_id === currentUser.id;

      if (!includeRoomNumber) {
        const registration = await RegistrationRepository.findByUserAndEvent(
          currentUser.id,
          id
        );

        includeRoomNumber =
          registration?.attendance_status === "REGISTERED" ||
          registration?.attendance_status === "ATTENDED";
      }
    }

    return jsonResponse(formatEventDetail(event, includeRoomNumber));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth(request);
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return errorResponse("VALIDATION_ERROR", "Request body must be JSON.", 400);
    }

    const actor = { userId: currentUser.id };

    const event = await EventService.updateEvent(id, body, actor);

    return jsonResponse(formatEventMutation(event));
  } catch (error) {
    return handleRouteError(error);
  }
}
