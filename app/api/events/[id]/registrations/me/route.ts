// TODO(oauth): wire Supabase/OAuth auth once auth is set up.

import {
  errorResponse,
  handleRouteError,
  jsonResponse,
} from "../../../../../../lib/event-api";
import { RegistrationService } from "../../../../../../services/registration.service";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => ({}));
  const userId = request.headers.get("x-user-id") ?? body.userId;

  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const result = await RegistrationService.cancelRegistration(userId, params.id);

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}