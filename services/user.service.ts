/**
 * User Service
 * Business logic for user operations
 * Handles user profile, authentication, and user data
 */

import type { Prisma, College, Gender, UserRole } from "@prisma/client";
import prisma from "../lib/prisma";
import { UserRepository } from "../repositories/user.repository";
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "../utils/errors";
import { createClient } from "../lib/supabase/server";

type UserProfileUpdate = {
  username?: string;
  email?: string;
  hostel?: string;
  floor?: number | string;
  college?: College;
  gender?: Gender;
  pfp?: string;
};

export class UserService {
  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const rating = await this.getUserRating(userId);

    return this.toProfile(user, rating);
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, data: UserProfileUpdate) {
    await this.ensureUserExists(userId);

    const updateData = this.buildProfileUpdate(data);

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError("No valid profile fields provided");
    }

    // Check username uniqueness
    if (updateData.username) {
      const usernameStr = updateData.username as string;
      const existingUser = await prisma.user.findUnique({
        where: { username: usernameStr },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError("Username is already taken");
      }
    }

    try {
      const user = await UserRepository.update(userId, updateData);
      const rating = await this.getUserRating(userId);

      return this.toProfile(user, rating);
    } catch (error: any) {
      // Catch database unique constraint error for username (P2002)
      if (error?.code === "P2002") {
        const target = error?.meta?.target;
        if (
          (Array.isArray(target) && target.includes("username")) ||
          (typeof target === "string" && target.includes("username"))
        ) {
          throw new ConflictError("Username is already taken");
        }
      }
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(token: string) {
  if (!token) {
    throw new UnauthorizedError("Authentication token is required");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new UnauthorizedError("Invalid authentication token");
  }

  return this.getUserProfile(user.id);
}

  /**
   * Assert the supplied role is ADMIN. Throws ForbiddenError otherwise.
   * The role is read from the Prisma User record (not the JWT) so that the
   * source of truth remains the database.
   */
  static assertAdmin(user: { role: UserRole | string }) {
    if (user.role !== "ADMIN") {
      throw new ForbiddenError("Admin access required.");
    }
  }

  /**
   * Get user's events (hosted and attended)
   */
  static async getUserEvents(userId: string, type?: "hosted" | "attended") {
    await this.ensureUserExists(userId);

    const [hosted, attended] = await Promise.all([
      type === "attended" ? Promise.resolve([]) : this.getHostedEvents(userId),
      type === "hosted" ? Promise.resolve([]) : this.getAttendedEvents(userId),
    ]);

    if (type === "hosted") {
      return { hosted };
    }

    if (type === "attended") {
      return { attended };
    }

    return { hosted, attended };
  }

  /**
   * Get user rating
   */
  static async getUserRating(userId: string) {
    await this.ensureUserExists(userId);

    const [hostRating, participantRating] = await Promise.all([
      prisma.hostReview.aggregate({
        where: { host_id: userId },
        _avg: { rating: true },
        _sum: { rating: true },
        _count: { rating: true },
      }),
      prisma.participantReview.aggregate({
        where: { participant_id: userId },
        _avg: { rating: true },
        _sum: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const hostCount = hostRating._count.rating;
    const participantCount = participantRating._count.rating;
    const reviewsReceived = hostCount + participantCount;
    const totalRating =
      (hostRating._sum.rating ?? 0) + (participantRating._sum.rating ?? 0);

    return {
      totalRating,
      averageRating: reviewsReceived > 0 ? totalRating / reviewsReceived : 0,
      reviewsReceived,
      hostAverageRating: hostRating._avg.rating ?? 0,
      hostReviewsReceived: hostCount,
      participantAverageRating: participantRating._avg.rating ?? 0,
      participantReviewsReceived: participantCount,
    };
  }

  private static async ensureUserExists(userId: string) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  private static buildProfileUpdate(data: UserProfileUpdate): Prisma.UserUpdateInput {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.username !== undefined) {
      const username = data.username.trim();

      if (!username) {
        throw new ValidationError("Username cannot be empty");
      }

      updateData.username = username;
    }

    if (data.email !== undefined) {
      const email = data.email.trim().toLowerCase();

      if (!email) {
        throw new ValidationError("Email cannot be empty");
      }

      updateData.email = email;
    }

    if (data.hostel !== undefined) {
      const hostel = data.hostel.trim();

      if (!hostel) {
        throw new ValidationError("Hostel cannot be empty");
      }

      updateData.hostel = hostel;
    }

    if (data.floor !== undefined) {
      const floor = typeof data.floor === "string" ? Number(data.floor) : data.floor;

      if (!Number.isInteger(floor)) {
        throw new ValidationError("Floor must be an integer");
      }

      updateData.floor = floor;
    }

    if (data.college !== undefined) {
      updateData.college = data.college;
    }

    if (data.gender !== undefined) {
      updateData.gender = data.gender;
    }

    if (data.pfp !== undefined) {
      updateData.pfp = data.pfp;
    }

    return updateData;
  }

  private static async getHostedEvents(userId: string) {
    return prisma.event.findMany({
      where: { host_id: userId },
      orderBy: { event_time: "desc" },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });
  }

  private static async getAttendedEvents(userId: string) {
    const registrations = await prisma.eventParticipant.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          include: {
            host: true,
            _count: {
              select: { participants: true },
            },
          },
        },
      },
    });

    return registrations.map((registration) => ({
      ...registration.event,
      attendance_status: registration.attendance_status,
      registeredAt: registration.createdAt,
    }));
  }

  private static toProfile(
    user: Awaited<ReturnType<typeof UserRepository.findById>>,
    rating: Awaited<ReturnType<typeof UserService.getUserRating>>
  ) {
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      ...user,
      status: user.banned_at ? "banned" : "active",
      eventsHosted: user._count.hostedEvents,
      eventsAttended: user._count.eventParticipations,
      rating: rating.averageRating,
      reviewsCount: rating.reviewsReceived,
      ratingStats: rating,
    };
  }
}
