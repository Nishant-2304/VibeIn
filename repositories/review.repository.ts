/**
 * Review Repository
 * Data access layer for review operations
 * Handles database queries for reviews and ratings
 */

import type { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

type ReviewType = "EVENT" | "HOST" | "PARTICIPANT";

type ReviewCreateData =
  | ({ type: "EVENT" } & Prisma.EventReviewUncheckedCreateInput)
  | ({ type: "HOST" } & Prisma.HostReviewUncheckedCreateInput)
  | ({ type: "PARTICIPANT" } & Prisma.ParticipantReviewUncheckedCreateInput);

type ReviewUpdateData =
  | ({ type: "EVENT" } & Prisma.EventReviewUpdateInput)
  | ({ type: "HOST" } & Prisma.HostReviewUpdateInput)
  | ({ type: "PARTICIPANT" } & Prisma.ParticipantReviewUpdateInput);

export class ReviewRepository {
  /**
   * Find review by ID
   */
  static async findById(id: string, type?: ReviewType) {
    if (type === "EVENT") {
      return this.withType(
        "EVENT",
        await prisma.eventReview.findUnique({
          where: { id },
          include: eventReviewInclude,
        })
      );
    }

    if (type === "HOST") {
      return this.withType(
        "HOST",
        await prisma.hostReview.findUnique({
          where: { id },
          include: hostReviewInclude,
        })
      );
    }

    if (type === "PARTICIPANT") {
      return this.withType(
        "PARTICIPANT",
        await prisma.participantReview.findUnique({
          where: { id },
          include: participantReviewInclude,
        })
      );
    }

    const [eventReview, hostReview, participantReview] = await Promise.all([
      prisma.eventReview.findUnique({ where: { id }, include: eventReviewInclude }),
      prisma.hostReview.findUnique({ where: { id }, include: hostReviewInclude }),
      prisma.participantReview.findUnique({
        where: { id },
        include: participantReviewInclude,
      }),
    ]);

    return (
      this.withType("EVENT", eventReview) ??
      this.withType("HOST", hostReview) ??
      this.withType("PARTICIPANT", participantReview)
    );
  }

  /**
   * Find reviews by event ID
   */
  static async findByEventId(eventId: string) {
    const [eventReviews, hostReviews, participantReviews] = await Promise.all([
      prisma.eventReview.findMany({
        where: { event_id: eventId },
        orderBy: { createdAt: "desc" },
        include: eventReviewInclude,
      }),
      prisma.hostReview.findMany({
        where: { event_id: eventId },
        orderBy: { createdAt: "desc" },
        include: hostReviewInclude,
      }),
      prisma.participantReview.findMany({
        where: { event_id: eventId },
        orderBy: { createdAt: "desc" },
        include: participantReviewInclude,
      }),
    ]);

    return {
      eventReviews: eventReviews.map((review) => ({ ...review, type: "EVENT" as const })),
      hostReviews: hostReviews.map((review) => ({ ...review, type: "HOST" as const })),
      participantReviews: participantReviews.map((review) => ({
        ...review,
        type: "PARTICIPANT" as const,
      })),
    };
  }

  /**
   * Find review by user and event
   */
  static async findByUserAndEvent(userId: string, eventId: string) {
    const [eventReview, hostReview, participantReview] = await Promise.all([
      prisma.eventReview.findUnique({
        where: { user_id_event_id: { user_id: userId, event_id: eventId } },
        include: eventReviewInclude,
      }),
      prisma.hostReview.findFirst({
        where: { reviewer_id: userId, event_id: eventId },
        include: hostReviewInclude,
      }),
      prisma.participantReview.findFirst({
        where: { participant_id: userId, event_id: eventId },
        include: participantReviewInclude,
      }),
    ]);

    return {
      eventReview: this.withType("EVENT", eventReview),
      hostReview: this.withType("HOST", hostReview),
      participantReview: this.withType("PARTICIPANT", participantReview),
    };
  }

  /**
   * Create review
   */
  static async create(data: ReviewCreateData) {
    if (data.type === "EVENT") {
      const { type, ...reviewData } = data;

      return this.withType(
        "EVENT",
        await prisma.eventReview.create({
          data: reviewData,
          include: eventReviewInclude,
        })
      );
    }

    if (data.type === "HOST") {
      const { type, ...reviewData } = data;

      return this.withType(
        "HOST",
        await prisma.hostReview.create({
          data: reviewData,
          include: hostReviewInclude,
        })
      );
    }

    const { type, ...reviewData } = data;

    return this.withType(
      "PARTICIPANT",
      await prisma.participantReview.create({
        data: reviewData,
        include: participantReviewInclude,
      })
    );
  }

  /**
   * Create an event review and host review together
   */
  static async createEventAndHostReview(data: {
    eventReview: Prisma.EventReviewUncheckedCreateInput;
    hostReview: Prisma.HostReviewUncheckedCreateInput;
  }) {
    return prisma.$transaction(async (tx) => {
      const eventReview = await tx.eventReview.create({
        data: data.eventReview,
        include: eventReviewInclude,
      });
      const hostReview = await tx.hostReview.create({
        data: data.hostReview,
        include: hostReviewInclude,
      });

      return {
        eventReview: { ...eventReview, type: "EVENT" as const },
        hostReview: { ...hostReview, type: "HOST" as const },
      };
    });
  }

  /**
   * Update review
   */
  static async update(id: string, data: ReviewUpdateData) {
    const { type, ...reviewData } = data;

    if (type === "EVENT") {
      return this.withType(
        "EVENT",
        await prisma.eventReview.update({
          where: { id },
          data: reviewData,
          include: eventReviewInclude,
        })
      );
    }

    if (type === "HOST") {
      return this.withType(
        "HOST",
        await prisma.hostReview.update({
          where: { id },
          data: reviewData,
          include: hostReviewInclude,
        })
      );
    }

    return this.withType(
      "PARTICIPANT",
      await prisma.participantReview.update({
        where: { id },
        data: reviewData,
        include: participantReviewInclude,
      })
    );
  }

  /**
   * Delete review
   */
  static async delete(id: string, type?: ReviewType) {
    const existing = await this.findById(id, type);

    if (!existing) {
      return null;
    }

    if (existing.type === "EVENT") {
      return this.withType(
        "EVENT",
        await prisma.eventReview.delete({ where: { id } })
      );
    }

    if (existing.type === "HOST") {
      return this.withType("HOST", await prisma.hostReview.delete({ where: { id } }));
    }

    return this.withType(
      "PARTICIPANT",
      await prisma.participantReview.delete({ where: { id } })
    );
  }

  static async findParticipantReview(
    hostId: string,
    participantId: string,
    eventId: string
  ) {
    return this.withType(
      "PARTICIPANT",
      await prisma.participantReview.findUnique({
        where: {
          host_id_participant_id_event_id: {
            host_id: hostId,
            participant_id: participantId,
            event_id: eventId,
          },
        },
        include: participantReviewInclude,
      })
    );
  }

  static async calculateEventRating(eventId: string) {
    return prisma.eventReview.aggregate({
      where: { event_id: eventId },
      _avg: { rating: true },
      _sum: { rating: true },
      _count: { rating: true },
    });
  }

  private static withType<T>(type: ReviewType, review: T | null) {
    return review ? { ...review, type } : null;
  }
}

const eventReviewInclude = {
  user: true,
  event: true,
} satisfies Prisma.EventReviewInclude;

const hostReviewInclude = {
  host: true,
  reviewer: true,
  event: true,
} satisfies Prisma.HostReviewInclude;

const participantReviewInclude = {
  participant: true,
  host: true,
  event: true,
} satisfies Prisma.ParticipantReviewInclude;
