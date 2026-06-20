/**
 * User Repository
 * Data access layer for user operations
 * Handles database queries for users and profiles
 */

import type { Prisma, UserRole } from "@prisma/client";
import prisma from "../lib/prisma";

type UserFilters = {
  search?: string;
  role?: UserRole | string;
  hostel?: string;
  floor?: number | string;
  banned?: boolean;
  status?: "active" | "banned";
  skip?: number;
  take?: number;
  page?: number;
  limit?: number;
  orderBy?: Prisma.UserOrderByWithRelationInput;
};

const userInclude = {
  _count: {
    select: {
      hostedEvents: true,
      eventParticipations: true,
      hostReviewsReceived: true,
      participantReviewsReceived: true,
      eventReviews: true,
      reports: true,
    },
  },
} satisfies Prisma.UserInclude;

export class UserRepository {
  /**
   * Find user by ID
   */
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: "insensitive",
        },
      },
      include: userInclude,
    });
  }

  /**
   * Find all users
   */
  static async findAll(filters: UserFilters = {}) {
    const where = this.buildWhere(filters);
    const take = filters.take ?? filters.limit;
    const skip =
      filters.skip ??
      (filters.page && filters.limit ? (filters.page - 1) * filters.limit : undefined);

    return prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: filters.orderBy ?? { createdAt: "desc" },
      include: userInclude,
    });
  }

  /**
   * Create user
   */
  static async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      include: userInclude,
    });
  }

  /**
   * Update user
   */
  static async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: userInclude,
    });
  }

  /**
   * Delete user
   */
  static async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }

  private static buildWhere(filters: UserFilters): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (filters.search?.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { hostel: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filters.role) {
      where.role = filters.role as UserRole;
    }

    if (filters.hostel) {
      where.hostel = {
        equals: filters.hostel,
        mode: "insensitive",
      };
    }

    if (filters.floor !== undefined) {
      const floor =
        typeof filters.floor === "string" ? Number(filters.floor) : filters.floor;

      if (!Number.isNaN(floor)) {
        where.floor = floor;
      }
    }

    if (filters.banned !== undefined) {
      where.banned_at = filters.banned ? { not: null } : null;
    }

    if (filters.status === "banned") {
      where.banned_at = { not: null };
    }

    if (filters.status === "active") {
      where.banned_at = null;
    }

    return where;
  }
}
