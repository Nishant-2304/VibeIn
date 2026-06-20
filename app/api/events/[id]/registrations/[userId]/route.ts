/**
 * Per-user Registration API Route Handler
 * GET: Host/admin retrieves a participant's registration details for an event.
 * PATCH: Host updates the participant's attendance status (ATTENDED or NO_SHOW).
 */

// TODO(oauth): wire Supabase/OAuth auth once auth is set up.

import {
  errorResponse,
  formatRegistrationDetail,
  handleRouteError,
  jsonResponse,
} from "../../../../../../lib/event-api";
import { RegistrationService } from "../../../../../../services/registration.service";
import { RegistrationRepository } from "../../../../../../repositories/registration.repository";

export async function GET(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const registration = await RegistrationRepository.findByUserAndEvent(
      params.userId,
      params.id
    );

    if (!registration) {
      return errorResponse("NOT_FOUND", "Registration not found.", 404);
    }

    return jsonResponse(formatRegistrationDetail(registration));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return errorResponse("VALIDATION_ERROR", "Request body must be JSON.", 400);
  }

  try {
    const registration = await RegistrationService.updateRegistrationStatus(
      params.userId,
      params.id,
      body.attendanceStatus
    );

    return jsonResponse({
      id: registration.id,
      eventId: registration.event_id,
      userId: registration.user_id,
      attendanceStatus: registration.attendance_status,
      registeredAt: registration.createdAt,
      updatedAt: registration.updatedAt,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}