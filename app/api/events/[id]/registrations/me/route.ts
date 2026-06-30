import {
  errorResponse,
  handleRouteError,
  jsonResponse,
} from "../../../../../../lib/event-api";
import { RegistrationService } from "../../../../../../services/registration.service";
import { requireAuth } from "../../../../../../lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth(request);
    const result = await RegistrationService.cancelRegistration(
      currentUser.id,
      params.id
    );

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
