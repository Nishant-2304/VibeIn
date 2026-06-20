import {
  errorResponse,
  formatRegistration,
  formatRegistrationListItem,
  handleRouteError,
  jsonResponse,
} from "../../../../../lib/event-api";
import { RegistrationService } from "../../../../../services/registration.service";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // TODO(oauth): enable once Supabase/OAuth auth is wired.
  // const auth = await requireAuth(request);
  // const actor = { userId: auth.userId, isAdmin: auth.user.role === "ADMIN" };
  // const allowed = await requireHostOrAdmin(actor, params.id);
  // if (!allowed) {
  //   return errorResponse("FORBIDDEN", "Only the host or an admin can view registrations.", 403);
  // }

  const actor = {
    userId: request.headers.get("x-user-id"),
    isAdmin: request.headers.get("x-admin") === "true",
  };

  try {
    const registrations = await RegistrationService.getEventRegistrations(
      params.id,
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
  { params }: { params: { id: string } }
) {
  // TODO(oauth): enable once Supabase/OAuth auth is wired.
  // const auth = await requireAuth(request);
  // if (!auth.userId) {
  //   return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  // }

  const body = await request.json().catch(() => ({}));
  const userId = request.headers.get("x-user-id") ?? body.userId;

  try {
    const registration = await RegistrationService.registerForEvent(
      userId,
      params.id
    );

    return jsonResponse(formatRegistration(registration), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
