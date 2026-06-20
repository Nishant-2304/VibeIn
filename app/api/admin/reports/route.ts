import {
  formatReport,
  handleRouteError,
  jsonResponse,
  pagination,
  parsePagination,
} from "../../../../lib/admin-api";
import { AdminService } from "../../../../services/admin.service";

export async function GET(request: Request) {
  // TODO(oauth): enable once Supabase/OAuth auth is wired.
  // const auth = await requireAdmin(request);
  // if (!auth.isAdmin) {
  //   return errorResponse("FORBIDDEN", "Admin access required.", 403);
  // }

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  try {
    const { reports, total } = await AdminService.getReports(
      {
        status: searchParams.get("status"),
        targetType: searchParams.get("targetType"),
      },
      { skip, limit }
    );

    return jsonResponse({
      reports: reports.map(formatReport),
      pagination: pagination(page, limit, total),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
