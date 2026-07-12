/**
 * User Profile API Route Handler
 * GET: Retrieve specific user's profile by ID
 */

import { UserService } from "../../../../services/user.service";
import { handleRouteError, json, toPublicUser } from "../route-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await UserService.getUserProfile(id);

    return json(toPublicUser(user));
  } catch (error) {
    return handleRouteError(error);
  }
}
