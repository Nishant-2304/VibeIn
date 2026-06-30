import {
  formatAdminEventList,
  handleRouteError,
  jsonResponse,
  pagination,
  parsePagination,
} from "../../../../lib/admin-api";
import { AdminService } from "../../../../services/admin.service";
import { requireAdmin } from "../../../../lib/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const { events, reportCounts, total } = await AdminService.getAllEvents(
      {
        status: searchParams.get("status"),
        hostel: searchParams.get("hostel"),
        floor: searchParams.get("floor"),
        reportCount: searchParams.get("reportCount"),
        q: searchParams.get("q"),
      },
      { skip, limit }
    );

    return jsonResponse({
      events: formatAdminEventList(events, reportCounts),
      pagination: pagination(page, limit, total),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}