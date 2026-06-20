import { AttendanceStatus, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export class RegistrationRepository {
  static async findEventById(eventId: string) {
    return prisma.event.findUnique({
      where: { id: eventId },
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

  static async findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        banned_at: true,
      },
    });
  }

  static async findByUserAndEvent(userId: string, eventId: string) {
    return prisma.eventParticipant.findUnique({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: eventId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            participantReviewsReceived: {
              select: { rating: true },
            },
          },
        },
      },
    });
  }

  static async findByEventId(eventId: string) {
    return prisma.eventParticipant.findMany({
      where: { event_id: eventId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            participantReviewsReceived: {
              select: { rating: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async create(data: Prisma.EventParticipantUncheckedCreateInput) {
    return prisma.eventParticipant.create({
      data,
    });
  }

  static async update(id: string, data: Prisma.EventParticipantUpdateInput) {
    return prisma.eventParticipant.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            participantReviewsReceived: {
              select: { rating: true },
            },
          },
        },
      },
    });
  }

  static async setAttendanceStatus(id: string, attendanceStatus: AttendanceStatus) {
    return this.update(id, {
      attendance_status: attendanceStatus,
    });
  }
}
