import {
  formatReport,
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