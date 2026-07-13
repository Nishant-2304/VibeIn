// Cross-component registration notifications.
//
// When the user registers or unregisters from any page (home, events feed,
// event detail, etc.), other open pages that show registration state need to
// know. We use a `BroadcastChannel` when available so the update reaches
// other tabs/windows in real time, and we also persist the last-known
// registration set in `sessionStorage` so that a page that mounts *right
// after* the user clicks "Join" on the previous page can pick up the change
// without waiting for a network round-trip.

export type RegistrationChange =
  | { type: "registered"; eventId: string }
  | { type: "unregistered"; eventId: string };

const STORAGE_KEY = "vibein:registered-events";
const CHANNEL_NAME = "vibein:registration";

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.sessionStorage;
  } catch {
    return false;
  }
}

function hasBroadcastChannel(): boolean {
  try {
    return typeof window !== "undefined" && typeof BroadcastChannel !== "undefined";
  } catch {
    return false;
  }
}

export function getRegisteredEventIds(): Set<string> {
  if (!hasStorage()) return new Set();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((v): v is string => typeof v === "string"));
    }
  } catch {
    // ignore parse errors
  }
  return new Set();
}

export function setRegisteredEventIds(ids: Iterable<string>): void {
  if (!hasStorage()) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore quota errors
  }
}

export function recordRegistered(eventId: string): void {
  const ids = getRegisteredEventIds();
  ids.add(eventId);
  setRegisteredEventIds(ids);
  emitRegistrationChange({ type: "registered", eventId });
}

export function recordUnregistered(eventId: string): void {
  const ids = getRegisteredEventIds();
  ids.delete(eventId);
  setRegisteredEventIds(ids);
  emitRegistrationChange({ type: "unregistered", eventId });
}

function emitRegistrationChange(change: RegistrationChange): void {
  if (hasBroadcastChannel()) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(change);
      channel.close();
    } catch {
      // ignore
    }
  }
}

/**
 * Subscribe to registration changes from any tab/window. Returns an
 * unsubscribe function. The handler is called for both BroadcastChannel
 * events from other tabs AND for in-tab events fired via the same bus
 * (e.g. if two components on the same page both want to react).
 */
export function subscribeRegistrationChanges(
  handler: (change: RegistrationChange) => void
): () => void {
  if (!hasBroadcastChannel()) return () => {};

  const channel = new BroadcastChannel(CHANNEL_NAME);
  const onMessage = (event: MessageEvent<RegistrationChange>) => {
    if (
      event.data &&
      (event.data.type === "registered" || event.data.type === "unregistered") &&
      typeof event.data.eventId === "string"
    ) {
      handler(event.data);
    }
  };
  channel.addEventListener("message", onMessage);
  return () => {
    channel.removeEventListener("message", onMessage);
    channel.close();
  };
}
