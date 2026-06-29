import { AppError } from "../../../utils/errors";

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return json(
      {
        error: error.code,
        message: error.message,
      },
      error.status
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected error";

  return json(
    {
      error: "INTERNAL_SERVER_ERROR",
      message,
    },
    500
  );
}

export function toPublicUser(user: any) {
  return {
    id: user.id,
    displayName: user.username,
    username: user.username,
    hostel: user.hostel,
    floor: user.floor,
    college: user.college,
    gender: user.gender,
    pfp: user.pfp,
    status: user.status,
    hostRating: user.ratingStats?.hostAverageRating ?? 0,
    hostRatingCount: user.ratingStats?.hostReviewsReceived ?? 0,
    participantRating: user.ratingStats?.participantAverageRating ?? 0,
    participantRatingCount: user.ratingStats?.participantReviewsReceived ?? 0,
    eventsHosted: user.eventsHosted ?? 0,
    eventsAttended: user.eventsAttended ?? 0,
    createdAt: user.createdAt,
  };
}

export function toPrivateUser(user: any) {
  return {
    ...toPublicUser(user),
    email: user.email,
    role: user.role,
    bannedAt: user.banned_at,
    banReason: user.ban_reason,
  };
}
