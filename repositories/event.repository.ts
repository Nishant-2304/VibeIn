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

  // Bulk-activates UPCOMING events whose start time has passed. The
  // `event_status: UPCOMING` clause is a safety net so manually-set
  // ACTIVE / COMPLETED / CANCELLED events are never overwritten, even if
  // the caller passes an id list that includes them.
  static async updateStatusToActiveForDueEvents(ids: string[]) {
    if (ids.length === 0) return;

    const now = new Date();
    await prisma.event.updateMany({
      where: {
        id: { in: ids },
        event_status: "UPCOMING",
        event_time: { lte: now },
      },
      data: { event_status: "ACTIVE" },
    });
  }

  // Single-event variant of the bulk transition above. Kept as a separate
  // method so the per-id query path stays explicit.
  static async updateStatusToActiveForDueEvent(id: string) {
    const now = new Date();
    await prisma.event.updateMany({
      where: {
        id,
        event_status: "UPCOMING",
        event_time: { lte: now },
      },
      data: { event_status: "ACTIVE" },
    });
  }

  static async updateStatusToCompletedForEndedEvents(ids: string[]) {
    if (ids.length === 0) return;
    await prisma.event.updateMany({
      where: {
        id: { in: ids },
        event_status: { in: ["UPCOMING", "ACTIVE"] },
      },
      data: { event_status: "COMPLETED" },
    });
  }

  static async updateStatusToCompletedForEndedEvent(id: string) {
    await prisma.event.updateMany({
      where: {
        id,
        event_status: { in: ["UPCOMING", "ACTIVE"] },
      },
      data: { event_status: "COMPLETED" },
    });
  }

  static async transitionEndedAndDueEvents() {
    const now = new Date();
    // 1. Find all UPCOMING or ACTIVE events whose scheduled start time has passed
    const potentialUpdates = await prisma.event.findMany({
      where: {
        event_status: { in: ["UPCOMING", "ACTIVE"] },
        event_time: { lte: now },
      },
      select: {
        id: true,
        event_status: true,
        event_time: true,
        duration_minutes: true,
      },
    });

    if (potentialUpdates.length === 0) return;

    // 2. Identify ended events (ACTIVE or UPCOMING events whose duration has elapsed)
    const endedIds = potentialUpdates
      .filter((event) => {
        const endTime = new Date(event.event_time.getTime() + event.duration_minutes * 60 * 1000);
        return endTime <= now;
      })
      .map((event) => event.id);

    if (endedIds.length > 0) {
      await prisma.event.updateMany({
        where: {
          id: { in: endedIds },
          event_status: { in: ["UPCOMING", "ACTIVE"] },
        },
        data: { event_status: "COMPLETED" },
      });
    }

    // 3. Identify due but not ended events (UPCOMING events whose start time has passed but duration has not elapsed)
    const dueIds = potentialUpdates
      .filter((event) => event.event_status === "UPCOMING" && !endedIds.includes(event.id))
      .map((event) => event.id);

    if (dueIds.length > 0) {
      await prisma.event.updateMany({
        where: {
          id: { in: dueIds },
          event_status: "UPCOMING",
        },
        data: { event_status: "ACTIVE" },
      });
    }
  }
}
