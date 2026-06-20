import { EventStatus, ReportStatus, ReportTargetType } from "@prisma/client";
import { AppError } from "../utils/errors";
import { calculateAverageRating } from "../utils/ratings";

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 50;

export function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export function errorResponse(error: string, message: string, status: number) {
  return jsonResponse({ error, message }, status);
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.status);
  }

  console.error(error);
  return errorResponse("INTERNAL_SERVER_ERROR", "Something went wrong.", 500);
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const requestedLimit = Number(searchParams.get("limit")) || DEFAULT_PAGE_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_PAGE_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function pagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}

export function isValidEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown
): value is T[keyof T] {
  return typeof value === "string" && Object.values(enumObject).includes(value);
}

export function formatUser(user: any) {
  return {
    id: user.id,
    displayName: user.username,
    email: user.email,
    hostel: user.hostel,
    floor: user.floor,
    role: user.role,
    banned: Boolean(user.banned_at),
    bannedAt: user.banned_at,
    banReason: user.ban_reason,
    createdAt: user.createdAt,
  };
}

export function formatReportedBy(user: any) {
  return {
    id: user.id,
    displayName: user.username,
  };
}

export function formatReport(report: any) {
  return {
    id: report.id,
    targetType: report.target_type,
    targetId: report.target_id,
    reason: report.reason,
    description: report.description,
    reportedBy: report.reporter ? formatReportedBy(report.reporter) : null,
    status: report.status,
    adminNote: report.admin_note,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

export function formatEvent(event: any) {
  return {
    id: event.id,
    name: event.eventname,
    description: event.event_description,
    hostel: event.hostel_name,
    floor: event.floor,
    roomNumber: event.room_no,
    hostId: event.host_id,
    scheduledAt: event.event_time,
    durationMinutes: event.duration_minutes,
    maxAttendees: event.max_attendees,
    currentAttendees: event.participants?.length,
    status: event.event_status,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function countCurrentAttendees(participants: any[] = []) {
  return participants.filter(
    (participant) => participant.attendance_status !== "CANCELLED"
  ).length;
}

function buildReportCountMap(reportCounts: any[] = []) {
  return new Map(
    reportCounts.map((reportCount) => [
      reportCount.target_id,
      reportCount._count?.target_id ?? 0,
    ])
  );
}

function formatAdminEventHost(host: any) {
  return {
    id: host.id,
    displayName: host.username,
    email: host.email,
    hostRating: calculateAverageRating(
      host.hostReviewsReceived?.map((review: any) => review.rating) ?? []
    ),
  };
}

export function formatAdminEventListItem(event: any, reportCount = 0) {
  return {
    id: event.id,
    name: event.eventname,
    description: event.event_description,
    hostel: event.hostel_name,
    floor: event.floor,
    roomNumber: event.room_no,
    scheduledAt: event.event_time,
    status: event.event_status,
    maxAttendees: event.max_attendees,
    currentAttendees: countCurrentAttendees(event.participants),
    reportCount,
    host: formatAdminEventHost(event.host),
    createdAt: event.createdAt,
  };
}

export function formatAdminEventList(events: any[], reportCounts: any[]) {
  const reportCountMap = buildReportCountMap(reportCounts);

  return events.map((event) =>
    formatAdminEventListItem(event, reportCountMap.get(event.id) ?? 0)
  );
}

export function formatAdminEventDetail(event: any, reports: any[]) {
  return {
    id: event.id,
    name: event.eventname,
    description: event.event_description,
    hostel: event.hostel_name,
    floor: event.floor,
    roomNumber: event.room_no,
    scheduledAt: event.event_time,
    status: event.event_status,
    maxAttendees: event.max_attendees,
    currentAttendees: countCurrentAttendees(event.participants),
    host: formatAdminEventHost(event.host),
    registrations: event.participants.map((participant: any) => ({
      user: {
        id: participant.user.id,
        displayName: participant.user.username,
        email: participant.user.email,
      },
      attendanceStatus: participant.attendance_status,
      registeredAt: participant.createdAt,
    })),
    reports: reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      description: report.description,
      reportedBy: report.reporter ? formatReportedBy(report.reporter) : null,
      status: report.status,
      createdAt: report.createdAt,
    })),
    createdAt: event.createdAt,
  };
}

export { EventStatus, ReportStatus, ReportTargetType };
