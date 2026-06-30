/**
 * Report Repository
 * Data access layer for report operations
 */

import type {
  Prisma,
  ReportStatus,
  ReportTargetType,
} from "@prisma/client";
import prisma from "../lib/prisma";

type ReportFilters = {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  reporterId?: string;
  skip?: number;
  take?: number;
  page?: number;
  limit?: number;
};

const reportInclude = {
  reporter: true,
} satisfies Prisma.ReportInclude;

export class ReportRepository {
  /**
   * Find report by ID
   */
  static async findById(id: string) {
    return prisma.report.findUnique({
      where: { id },
      include: reportInclude,
    });
  }

  /**
   * Find all reports
   */
  static async findAll(filters: ReportFilters = {}) {
    const where: Prisma.ReportWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.targetType) {
      where.target_type = filters.targetType;
    }

    if (filters.reporterId) {
      where.reporter_id = filters.reporterId;
    }

    const take = filters.take ?? filters.limit;

    const skip =
      filters.skip ??
      (filters.page && filters.limit
        ? (filters.page - 1) * filters.limit
        : undefined);

    return prisma.report.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: reportInclude,
    });
  }

  /**
   * Find reports submitted by a user
   */
  static async findByUserId(userId: string) {
    return prisma.report.findMany({
      where: {
        reporter_id: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: reportInclude,
    });
  }

  /**
   * Check if duplicate report exists
   */
  static async findDuplicate(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string
  ) {
    return prisma.report.findUnique({
      where: {
        reporter_id_target_type_target_id: {
          reporter_id: reporterId,
          target_type: targetType,
          target_id: targetId,
        },
      },
    });
  }

  /**
   * Create report
   */
  static async create(data: Prisma.ReportCreateInput) {
    return prisma.report.create({
      data,
      include: reportInclude,
    });
  }

  /**
   * Update report
   */
  static async update(
    id: string,
    data: Prisma.ReportUpdateInput
  ) {
    return prisma.report.update({
      where: { id },
      data,
      include: reportInclude,
    });
  }

  /**
   * Delete report
   */
  static async delete(id: string) {
    return prisma.report.delete({
      where: { id },
    });
  }
}