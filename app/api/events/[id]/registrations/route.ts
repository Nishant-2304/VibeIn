import {
  errorResponse,
  formatRegistration,
  formatRegistrationListItem,
  handleRouteError,
  jsonResponse,
} from "../../../../../lib/event-api";
import { RegistrationService } from "../../../../../services/registration.service";
import { requireAuth } from "../../../../../lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth(request);
    const actor = {
      userId: currentUser.id,
      isAdmin: currentUser.role === "ADMIN",
    };

    const registrations = await RegistrationService.getEventRegistrations(
      id,
      actor
    );

    return jsonResponse({
      registrations: registrations.map(formatRegistrationListItem),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth(request);
    const registration = await RegistrationService.registerForEvent(
      currentUser.id,
      id
    );

    return jsonResponse(formatRegistration(registration), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
