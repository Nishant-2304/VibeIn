import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export class EventRepository {
  static async findAll(
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
        orderBy: { event_time: "asc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.event.count({ where }),
    ]);
  }

  static async findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        host: {
          include: {
            hostReviewsReceived: {
              select: { rating: true },
            },
            _count: {
              select: { hostedEvents: true },
            },
          },
        },
        participants: {
          select: {
            id: true,
            attendance_status: true,
          },
        },
        eventReviews: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async findForMutationById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        participants: {
          select: {
            id: true,
            attendance_status: true,
          },
        },
      },
    });
  }

  static async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        banned_at: true,
      },
    });
  }

  static async create(data: Prisma.EventUncheckedCreateInput) {
    return prisma.event.create({
      data,
      include: {
        participants: {
          select: {
            id: true,
            attendance_status: true,
          },
        },
      },
    });
  }

  static async update(id: string, data: Prisma.EventUpdateInput) {
    return prisma.event.update({
      where: { id },
      data,
      include: {
        participants: {
          select: {
            id: true,
            attendance_status: true,
          },
        },
      },
    });
  }

  static async delete(id: string) {
    return prisma.event.delete({
      where: { id },
    });
  }
}
