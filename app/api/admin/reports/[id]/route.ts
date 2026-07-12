import {
  errorResponse,
  formatReport,
  handleRouteError,
  jsonResponse,
} from "../../../../../lib/admin-api";
import { AdminService } from "../../../../../services/admin.service";
import { requireAdmin } from "../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAdmin(request);

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return errorResponse("VALIDATION_ERROR", "Request body must be JSON.", 400);
    }

    const updatedReport = await AdminService.resolveReport(id, body);

    return jsonResponse(formatReport(updatedReport));
  } catch (error) {
    return handleRouteError(error);
  }
}