/**
 * Authentication helpers
 *
 * VibeIn uses Supabase Auth (Google OAuth) as the only authentication provider.
 * API routes should authenticate requests exclusively through:
 *
 *   - requireAuth(request)
 *   - requireAdmin(request)
 *
 * These helpers:
 * 1. Read the Bearer token from the Authorization header.
 * 2. Validate it through Supabase.
 * 3. Load the corresponding Prisma user.
 * 4. Return the authenticated user.
 */

import { UserService } from "../services/user.service";
import { UnauthorizedError } from "../utils/errors";

/**
 * Extract the Bearer token from the Authorization header.
 */
export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

/**
 * Authenticate the request and return the current Prisma user.
 *
 * Throws UnauthorizedError if:
 * - the Authorization header is missing
 * - the bearer token is invalid
 * - no matching Prisma user exists
 */
export async function requireAuth(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    throw new UnauthorizedError("Authentication required.");
  }

  return await UserService.getCurrentUser(token);
}

/**
 * Authenticate the request and ensure the user is an admin.
 *
 * Throws:
 * - UnauthorizedError if authentication fails.
 * - ForbiddenError if the authenticated user is not an admin.
 */
export async function requireAdmin(request: Request) {
  const user = await requireAuth(request);

  UserService.assertAdmin(user);

  return user;
}