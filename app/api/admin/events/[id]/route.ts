import {
  errorResponse,
  formatAdminEventDetail,
  handleRouteError,
  jsonResponse,
} from "../../../../../lib/admin-api";
import { AdminService } from "../../../../../services/admin.service";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // TODO(oauth): enable once Supabase/OAuth auth is wired.
  // const auth = await requireAdmin(request);
  // if (!auth.isAdmin) {
  //   return errorResponse("FORBIDDEN", "Admin access required.", 403);
  // }

  try {
    const { event, reports } = await AdminService.getEventDetail(params.id);

    return jsonResponse(formatAdminEventDetail(event, reports));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // TODO(oauth): enable once Supabase/OAuth auth is wired.
  // const auth = await requireAdmin(request);
  // if (!auth.isAdmin) {
  //   return errorResponse("FORBIDDEN", "Admin access required.", 403);
  // }

  try {
    return jsonResponse(await AdminService.deleteEvent(params.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
