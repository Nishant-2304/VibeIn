export type ApiErrorBody = {
  error?: string;
  message?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type EventReview = {
  id: string;
  type: "EVENT";
  rating: number;
  comment: string | null;
  reviewer: { id: string; displayName: string };
  createdAt: string;
};

export type EventDetail = {
  id: string;
  name: string;
  description: string;
  hostel: string;
  floor: number;
  roomNumber?: string;
  scheduledAt: string;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  maxAttendees: number;
  currentAttendees: number;
  host: {
    id: string;
    displayName: string;
    hostRating: number;
    eventsHosted?: number;
  };
  reviews: EventReview[];
};

export type Registration = {
  id: string;
  user: {
    id: string;
    displayName: string;
    participantRating: number;
  };
  attendanceStatus: "REGISTERED" | "ATTENDED" | "NO_SHOW" | "CANCELLED";
  registeredAt: string;
};

export type CreateEventInput = {
  name: string;
  description: string;
  hostel: string;
  floor: number;
  roomNumber: string;
  scheduledAt: string;
  maxAttendees: number;
};

export type CreatedEvent = CreateEventInput & {
  id: string;
  hostId: string;
  status: EventDetail["status"];
  currentAttendees: number;
};

export type SubmitEventReviewInput = {
  eventRating: number;
  eventComment?: string;
  hostRating: number;
  hostComment?: string;
};

export type SubmitParticipantReviewInput = {
  rating: number;
  comment?: string;
};

function accessToken() {
  if (typeof window === "undefined") return null;

  // Auth integration has one deliberate seam: store the Supabase JWT here,
  // or replace this function with the project's session provider.
  return window.localStorage.getItem("vibein.accessToken");
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  authenticated = false
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = authenticated ? accessToken() : null;

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(
      body.message || "Something went wrong. Please try again.",
      response.status,
      body.error
    );
  }

  return (await response.json()) as T;
}

export type EventListItem = {
  id: string;
  name: string;
  description: string;
  hostel: string;
  floor: number;
  scheduledAt: string;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  maxAttendees: number;
  currentAttendees: number;
  host: {
    id: string;
    displayName: string;
    hostRating: number;
  };
};

export type EventListResponse = {
  events: EventListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type EventListQuery = {
  q?: string;
  hostel?: string;
  floor?: number;
  status?: "UPCOMING" | "ACTIVE" | "COMPLETED";
  page?: number;
  limit?: number;
};

export const eventApi = {
  list(query: EventListQuery = {}) {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.hostel) params.set("hostel", query.hostel);
    if (typeof query.floor === "number") params.set("floor", String(query.floor));
    if (query.status) params.set("status", query.status);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));

    const qs = params.toString();
    const path = qs ? `/api/events?${qs}` : "/api/events";
    return apiRequest<EventListResponse>(path, {}, false);
  },

  get(id: string) {
    // Authentication is optional here, but supplying it reveals roomNumber.
    return apiRequest<EventDetail>(
      `/api/events/${encodeURIComponent(id)}`,
      {},
      true
    );
  },

  create(input: CreateEventInput) {
    return apiRequest<CreatedEvent>(
      "/api/events",
      { method: "POST", body: JSON.stringify(input) },
      true
    );
  },

  register(id: string) {
    return apiRequest<{ id: string; attendanceStatus: string }>(
      `/api/events/${encodeURIComponent(id)}/registrations`,
      { method: "POST" },
      true
    );
  },

  registrations(id: string) {
    return apiRequest<{ registrations: Registration[] }>(
      `/api/events/${encodeURIComponent(id)}/registrations`,
      {},
      true
    );
  },

  submitEventReview(id: string, input: SubmitEventReviewInput) {
    return apiRequest<{ eventReview: EventReview; hostReview: unknown }>(
      `/api/events/${encodeURIComponent(id)}/reviews`,
      { method: "POST", body: JSON.stringify(input) },
      true
    );
  },

  submitParticipantReview(
    eventId: string,
    userId: string,
    input: SubmitParticipantReviewInput
  ) {
    return apiRequest<unknown>(
      `/api/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(userId)}/review`,
      { method: "POST", body: JSON.stringify(input) },
      true
    );
  },
  
};

export function apiErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Could not reach the server. Please try again.";
}
