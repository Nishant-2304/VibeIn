import {
  formatUser,
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
