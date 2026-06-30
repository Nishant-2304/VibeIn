/**
 * Host Middleware
 *
 * Verifies the authenticated user is the host of the supplied event. Reads
 * the host_id from the Prisma Event record, so these checks now rely on the
 * same authenticated user that the rest of the app resolves via Supabase.
 *
 * This file used to return `{ isHost: true }` placeholders — those have been
 * replaced with real ownership lookups so protected endpoints can actually
 * enforce "host only" rules.
 */

import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/errors";

async function loadEvent(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw new NotFoundError("Event not found.");
  }

  return event;
}

/**
 * Returns true when the authenticated user is the host of the event.
 *
 * Admins are intentionally NOT treated as hosts here — callers that want
 * "host OR admin" semantics must check `isAdmin` separately (see the
 * RegistrationService for an example).
 */
export async function hostMiddleware(userId: string, eventId: string) {
  if (!userId) {
    return { isHost: false };
  }

  const event = await loadEvent(eventId);

  return { isHost: event.host_id === userId };
}

/**
 * Check if user can edit event. Same ownership rule as `hostMiddleware`.
 */
export async function canEditEvent(userId: string, eventId: string) {
  const event = await loadEvent(eventId);

  return { canEdit: event.host_id === userId };
}

/**
 * Check if user can view participants. Same ownership rule as above.
 */
export async function canViewParticipants(userId: string, eventId: string) {
  const event = await loadEvent(eventId);

  return { canView: event.host_id === userId };
}
