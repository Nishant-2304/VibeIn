/**
 * Admin Middleware
 *
 * Verifies that the bearer token belongs to a Supabase-authenticated user
 * whose Prisma record has `role === "ADMIN"`. Backed by `UserService` so it
 * uses the same auth flow as the rest of the app.
 */

import { UserService } from "../services/user.service";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

async function loadUser(userId: string) {
  return UserService.getUserProfile(userId);
}

/**
 * Verify admin status for an already-authenticated user id.
 */
export async function adminMiddleware(userId: string) {
  if (!userId) {
    throw new UnauthorizedError("Authentication required.");
  }

  const user = await loadUser(userId);

  if (user.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required.");
  }

  return { isAdmin: true, userId, user };
}

/**
 * Check if user is admin (used by routes that already have the user id).
 */
export async function isAdmin(userId: string) {
  const user = await loadUser(userId);

  return { isAdmin: user.role === "ADMIN", user };
}

/**
 * Check admin permissions — admin role grants all management actions.
 */
export async function checkAdminPermission(userId: string, _action: string) {
  const user = await loadUser(userId);

  return { allowed: user.role === "ADMIN", user };
}
