import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export class ReviewRepository {
  static async findEventById(eventId: string) {
    return prisma.event.findUnique({
      where: { id: eventId },
    });
  }

  static async findRegistration(userId: string, eventId: string) {
    return prisma.eventParticipant.findUnique({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: eventId,
        },
      },
    });
  }

  static async findEventReviewByUserAndEvent(userId: string, eventId: string) {
    return prisma.eventReview.findUnique({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: eventId,
        },
      },
    });
  }

  static async findHostReviewByReviewerHostAndEvent(
    reviewerId: string,
    hostId: string,
    eventId: string
  ) {
    return prisma.hostReview.findUnique({
      where: {
        reviewer_id_host_id_event_id: {
          reviewer_id: reviewerId,
          host_id: hostId,
          event_id: eventId,
        },
      },
    });
  }

  static async createEventAndHostReviews(data: {
    eventReview: Prisma.EventReviewUncheckedCreateInput;
    hostReview: Prisma.HostReviewUncheckedCreateInput;
  }) {
    return prisma.$transaction(async (tx) => {
      const eventReview = await tx.eventReview.create({
        data: data.eventReview,
      });
      const hostReview = await tx.hostReview.create({
        data: data.hostReview,
      });

      return { eventReview, hostReview };
    });
  }

  static async findEventReviews(eventId: string) {
    return prisma.eventReview.findMany({
      where: { event_id: eventId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findParticipantReview(
    hostId: string,
    participantId: string,
    eventId: string
  ) {
    return prisma.participantReview.findUnique({
      where: {
        host_id_participant_id_event_id: {
          host_id: hostId,
          participant_id: participantId,
          event_id: eventId,
        },
      },
      include: {
        participant: {
          select: {
            id: true,
            username: true,
          },
        },
        host: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  static async createParticipantReview(data: Prisma.ParticipantReviewUncheckedCreateInput) {
    return prisma.participantReview.create({
      data,
      include: {
        participant: {
          select: {
            id: true,
            username: true,
          },
        },
        host: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }
}
