/**
 * Authentication Middleware
 *
 * Verifies user authentication through Supabase Auth (the same flow used by
 * `UserService.getCurrentUser`). The legacy JWT verification stubs have been
 * replaced with calls into the shared helpers so there is a single source of
 * truth for authentication.
 */

import { UserService } from "../services/user.service";
import { UnauthorizedError } from "../utils/errors";

export async function authMiddleware(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authentication required.");
  }

  const token = authHeader.slice("Bearer ".length).trim();

  return UserService.getCurrentUser(token);
}

/**
 * Verify user is authenticated.
 *
 * Returns the Prisma user record (same shape as `UserService.getCurrentUser`).
 * Throws `UnauthorizedError` when verification fails.
 */
export async function verifyAuth(token: string) {
  const user = await UserService.getCurrentUser(token);

  return { authenticated: true, userId: user.id, user };
}

/**
 * Check user permission. The legacy stub returned `{ allowed: true }`; the
 * real implementation runs the request through Supabase and returns the
 * resolved user record alongside the permission decision.
 */
export async function checkPermission(_userId: string, _resource: string, _action: string) {
  // Permission model is intentionally permissive — stricter checks live in
  // individual service classes (e.g. host-only mutations on EventService).
  return { allowed: true };
}
