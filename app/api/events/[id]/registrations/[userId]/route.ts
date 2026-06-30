/**
 * Per-user Registration API Route Handler
 * GET: Host/admin retrieves a participant's registration details for an event.
 * PATCH: Host updates the participant's attendance status (ATTENDED or NO_SHOW).
 */

import {
  errorResponse,
  formatRegistrationDetail,
  handleRouteError,
  jsonResponse,
} from "../../../../../../lib/event-api";
import { RegistrationService } from "../../../../../../services/registration.service";
import prisma from "../../../../../../lib/prisma";
import { requireAuth } from "../../../../../../lib/auth";
import { RegistrationRepository } from "../../../../../../repositories/registration.repository";

export async function GET(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const currentUser = await requireAuth(request);
    const registration = await RegistrationRepository.findByUserAndEvent(
      params.userId,
      params.id
    );

    if (!registration) {
      return errorResponse("NOT_FOUND", "Registration not found.", 404);
    }

    // Hosts can view any participant's registration on their own events;
    // admins can view any registration; participants may view their own.
    const isAdmin = currentUser.role === "ADMIN";
    const isSelf = currentUser.id === params.userId;

    if (!isAdmin && !isSelf) {
      const event = await prisma.event.findUnique({
        where: { id: params.id },
        select: { host_id: true },
      });

      if (!event || event.host_id !== currentUser.id) {
        return errorResponse(
          "FORBIDDEN",
          "You do not have permission to view this registration.",
          403
        );
      }
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

    const registration = await RegistrationService.updateRegistrationStatus(
      params.userId,
      params.id,
      body.attendanceStatus,
      actor
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
