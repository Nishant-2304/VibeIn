import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export class AdminRepository {
  static async findReports(
    where: Prisma.ReportWhereInput,
    pagination: { skip: number; limit: number }
  ) {
    return prisma.$transaction([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.report.count({ where }),
    ]);
  }

  static async findReportById(id: string) {
    return prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  static async updateReport(
    id: string,
    data: Prisma.ReportUpdateInput
  ) {
    return prisma.report.update({
      where: { id },
      data,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  static async findEventById(id: string) {
    return prisma.event.findUnique({
      where: { id },
    });
  }

  static async findEvents(
    where: Prisma.EventWhereInput,
    pagination: { skip: number; limit: number }
  ) {
    return prisma.$transaction([
      prisma.event.findMany({
        where,
        include: {
          host: {
            include: {
              hostReviewsReceived: {
                select: { rating: true },
              },
            },
          },
          participants: {
            select: {
              id: true,
              attendance_status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.event.count({ where }),
    ]);
  }

  static async findEventIdsWithMinimumReportCount(minimumReportCount: number) {
    return prisma.report.groupBy({
      by: ["target_id"],
      where: {
        target_type: "EVENT",
      },
      having: {
        target_id: {
          _count: {
            gte: minimumReportCount,
          },
        },
      },
    });
  }

  static async countEventReports(eventIds: string[]) {
    if (eventIds.length === 0) {
      return [];
    }

    return prisma.report.groupBy({
      by: ["target_id"],
      where: {
        target_type: "EVENT",
        target_id: {
          in: eventIds,
        },
      },
      _count: {
        target_id: true,
      },
    });
  }

  static async findEventDetailById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        host: {
          include: {
            hostReviewsReceived: {
              select: { rating: true },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async findReportsForEvent(eventId: string) {
    return prisma.report.findMany({
      where: {
        target_type: "EVENT",
        target_id: eventId,
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateEvent(
    id: string,
    data: Prisma.EventUpdateInput
  ) {
    return prisma.event.update({
      where: { id },
      data,
      include: {
        participants: {
          select: { id: true },
        },
      },
    });
  }

  static async deleteEvent(id: string) {
    return prisma.event.delete({
      where: { id },
    });
  }

  static async findUsers(
    where: Prisma.UserWhereInput,
    pagination: { skip: number; limit: number }
  ) {
    return prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.user.count({ where }),
    ]);
  }

  static async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  static async updateUser(
    id: string,
    data: Prisma.UserUpdateInput
  ) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}
