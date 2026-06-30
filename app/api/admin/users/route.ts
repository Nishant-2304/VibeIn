import {
  formatUser,
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

    const { users, total } = await AdminService.getAllUsers(
      {
        banned: searchParams.get("banned"),
        q: searchParams.get("q"),
      },
      { skip, limit }
    );

    return jsonResponse({
      users: users.map(formatUser),
      pagination: pagination(page, limit, total),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}