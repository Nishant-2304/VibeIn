/**
 * Current User Profile API Route Handler
 * GET: Retrieve current authenticated user's profile
 * PUT: Update current user's profile
 */

import { UserService } from "../../../../services/user.service";
import { UnauthorizedError } from "../../../../utils/errors";
import {
  getBearerToken,
  handleRouteError,
  json,
  toPrivateUser,
} from "../route-utils";

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      throw new UnauthorizedError("Authentication token is required");
    }

    const user = await UserService.getCurrentUser(token);

    return json(toPrivateUser(user));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  return updateCurrentUser(request);
}

export async function PATCH(request: Request) {
  return updateCurrentUser(request);
}

async function updateCurrentUser(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      throw new UnauthorizedError("Authentication token is required");
    }

    const currentUser = await UserService.getCurrentUser(token);
    const body = await request.json();
    const user = await UserService.updateUserProfile(currentUser.id, body);

    return json(toPrivateUser(user));
  } catch (error) {
    return handleRouteError(error);
  }
}
