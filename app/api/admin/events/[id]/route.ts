import {
  formatAdminEventDetail,
  handleRouteError,
  jsonResponse,
} from "../../../../../lib/admin-api";
import { AdminService } from "../../../../../services/admin.service";
import { requireAdmin } from "../../../../../lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
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
  try {
    await requireAdmin(request);
    return jsonResponse(await AdminService.deleteEvent(params.id));
  } catch (error) {
    return handleRouteError(error);
  }
}