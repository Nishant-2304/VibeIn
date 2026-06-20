import {
  EventStatus,
  Prisma,
  ReportStatus,
  ReportTargetType,
} from "@prisma/client";
import { AdminRepository } from "../repositories/admin.repository";
import { NotFoundError, ValidationError } from "../utils/errors";

type PaginationInput = {
  skip: number;
  limit: number;
};

type ReportFilters = {
  status?: string | null;
  targetType?: string | null;
};

type UserFilters = {
  banned?: string | null;
  q?: string | null;
};

type EventFilters = {
  status?: string | null;
  hostel?: string | null;
  floor?: string | null;
  reportCount?: string | null;
  q?: string | null;
};

function isValidEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown
): value is T[keyof T] {
  return typeof value === "string" && Object.values(enumObject).includes(value);
}

function parseIntegerFilter(value: string | null | undefined, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue)) {
    throw new ValidationError(`${fieldName} must be an integer.`);
  }

  return parsedValue;
}

export class AdminService {
  static async getReports(filters: ReportFilters, pagination: PaginationInput) {
    const where: Prisma.ReportWhereInput = {};

    if (filters.status) {
      if (!isValidEnumValue(ReportStatus, filters.status)) {
        throw new ValidationError("Invalid report status.");
      }

      where.status = filters.status;
    }

    if (filters.targetType) {
      if (!isValidEnumValue(ReportTargetType, filters.targetType)) {
        throw new ValidationError("Invalid report target type.");
      }

      where.target_type = filters.targetType;
    }

    const [reports, total] = await AdminRepository.findReports(where, pagination);

    return { reports, total };
  }

  static async resolveReport(
    reportId: string,
    data: { resolution?: unknown; adminNote?: unknown }
  ) {
    if (!["ACTION_TAKEN", "DISMISSED"].includes(String(data.resolution))) {
      throw new ValidationError("Invalid report resolution.");
    }

    if (data.adminNote !== undefined && typeof data.adminNote !== "string") {
      throw new ValidationError("adminNote must be a string.");
    }

    const existingReport = await AdminRepository.findReportById(reportId);

    if (!existingReport) {
      throw new NotFoundError("Report not found.");
    }

    return AdminRepository.updateReport(reportId, {
      status:
        data.resolution === "ACTION_TAKEN"
          ? ReportStatus.RESOLVED
          : ReportStatus.DISMISSED,
      admin_note: data.adminNote ?? null,
    });
  }

  static async updateEventStatus(
    eventId: string,
    data: { status?: unknown; reason?: unknown }
  ) {
    if (!isValidEnumValue(EventStatus, data.status)) {
      throw new ValidationError("Invalid event status.");
    }

    if (data.reason !== undefined && typeof data.reason !== "string") {
      throw new ValidationError("reason must be a string.");
    }

    const existingEvent = await AdminRepository.findEventById(eventId);

    if (!existingEvent) {
      throw new NotFoundError("Event not found.");
    }

    return AdminRepository.updateEvent(eventId, {
      event_status: data.status,
    });
  }

  static async getAllEvents(filters: EventFilters, pagination: PaginationInput) {
    const where: Prisma.EventWhereInput = {};
    const floor = parseIntegerFilter(filters.floor, "floor");
    const minimumReportCount = parseIntegerFilter(
      filters.reportCount,
      "reportCount"
    );
    const q = filters.q?.trim();

    if (filters.status) {
      if (!isValidEnumValue(EventStatus, filters.status)) {
        throw new ValidationError("Invalid event status.");
      }

      where.event_status = filters.status;
    }

    if (filters.hostel) {
      where.hostel_name = filters.hostel;
    }

    if (floor !== undefined) {
      where.floor = floor;
    }

    if (minimumReportCount !== undefined) {
      if (minimumReportCount < 0) {
        throw new ValidationError("reportCount must be greater than or equal to 0.");
      }

      if (minimumReportCount > 0) {
        const reportedEventGroups =
          await AdminRepository.findEventIdsWithMinimumReportCount(
            minimumReportCount
          );
        const reportedEventIds = reportedEventGroups.map((group) => group.target_id);

        where.id = {
          in: reportedEventIds,
        };
      }
    }

    if (q) {
      where.OR = [
        { eventname: { contains: q, mode: "insensitive" } },
        { event_description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [events, total] = await AdminRepository.findEvents(where, pagination);
    const reportCounts = await AdminRepository.countEventReports(
      events.map((event) => event.id)
    );

    return { events, reportCounts, total };
  }

  static async getEventDetail(eventId: string) {
    const event = await AdminRepository.findEventDetailById(eventId);

    if (!event) {
      throw new NotFoundError("Event not found.");
    }

    const reports = await AdminRepository.findReportsForEvent(eventId);

    return { event, reports };
  }

  static async deleteEvent(eventId: string) {
    const existingEvent = await AdminRepository.findEventById(eventId);

    if (!existingEvent) {
      throw new NotFoundError("Event not found.");
    }

    await AdminRepository.deleteEvent(eventId);

    return { message: "Event removed." };
  }

  static async getAllUsers(filters: UserFilters, pagination: PaginationInput) {
    if (filters.banned && !["true", "false"].includes(filters.banned)) {
      throw new ValidationError("banned must be true or false.");
    }

    const where: Prisma.UserWhereInput = {};
    const q = filters.q?.trim();

    if (filters.banned === "true") {
      where.banned_at = { not: null };
    }

    if (filters.banned === "false") {
      where.banned_at = null;
    }

    if (q) {
      where.OR = [
        { username: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [users, total] = await AdminRepository.findUsers(where, pagination);

    return { users, total };
  }

  static async updateUserBan(
    userId: string,
    data: { banned?: unknown; reason?: unknown }
  ) {
    if (typeof data.banned !== "boolean") {
      throw new ValidationError("banned must be a boolean.");
    }

    if (
      data.reason !== undefined &&
      data.reason !== null &&
      typeof data.reason !== "string"
    ) {
      throw new ValidationError("reason must be a string.");
    }

    const existingUser = await AdminRepository.findUserById(userId);

    if (!existingUser) {
      throw new NotFoundError("User not found.");
    }

    return AdminRepository.updateUser(
      userId,
      data.banned
        ? {
            banned_at: existingUser.banned_at ?? new Date(),
            ban_reason: data.reason ?? null,
          }
        : {
            banned_at: null,
            ban_reason: null,
          }
    );
  }
}
