import {
  errorResponse,
  formatUser,
  handleRouteError,
  jsonResponse,
} from "../../../../../lib/admin-api";
import { AdminService } from "../../../../../services/admin.service";
import { requireAdmin } from "../../../../../lib/auth";

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

    const updatedUser = await AdminService.updateUserBan(params.id, body);

    return jsonResponse(formatUser(updatedUser));
  } catch (error) {
    return handleRouteError(error);
  }
}