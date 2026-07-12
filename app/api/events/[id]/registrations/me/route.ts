import {
  errorResponse,
  handleRouteError,
  jsonResponse,
} from "../../../../../../lib/event-api";
import { RegistrationService } from "../../../../../../services/registration.service";
import { requireAuth } from "../../../../../../lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth(request);
    const result = await RegistrationService.cancelRegistration(
      currentUser.id,
      id
    );

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
