import {
  errorResponse,
  formatReport,
  handleRouteError,
  jsonResponse,
} from "../../../../../lib/admin-api";
import { AdminService } from "../../../../../services/admin.service";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // TODO(oauth): enable once Supabase/OAuth auth is wired.
  // const auth = await requireAdmin(request);
  // if (!auth.isAdmin) {
  //   return errorResponse("FORBIDDEN", "Admin access required.", 403);
  // }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return errorResponse("VALIDATION_ERROR", "Request body must be JSON.", 400);
  }

  try {
    const updatedReport = await AdminService.resolveReport(params.id, body);

    return jsonResponse(formatReport(updatedReport));
  } catch (error) {
    return handleRouteError(error);
  }
}
