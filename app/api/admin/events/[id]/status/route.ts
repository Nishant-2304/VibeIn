import {
  errorResponse,
  formatEvent,
  handleRouteError,
  jsonResponse,
} from "../../../../../../lib/admin-api";
import { AdminService } from "../../../../../../services/admin.service";
import { requireAdmin } from "../../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return errorResponse("VALIDATION_ERROR", "Request body must be JSON.", 400);
    }

    const updatedEvent = await AdminService.updateEventStatus(params.id, body);

    return jsonResponse(formatEvent(updatedEvent));
  } catch (error) {
    return handleRouteError(error);
  }
}