/**
 * Report Service
 * Business logic for user reports and complaints
 */

import {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "@prisma/client";

import { EventRepository } from "../repositories/event.repository";
import { ReportRepository } from "../repositories/report.repository";
import { UserRepository } from "../repositories/user.repository";

import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors";

type CreateReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
};

export class ReportService {
  /**
   * Create new report
   */
  static async createReport(
    reporterUserId: string,
    data: CreateReportInput
  ) {
    const {
      targetType,
      targetId,
      reason,
      description,
    } = data;

    if (!targetType || !targetId || !reason) {
      throw new ValidationError(
        "targetType, targetId and reason are required."
      );
    }

    await this.validateReason(targetType, reason);

    if (targetType === ReportTargetType.USER) {
      if (reporterUserId === targetId) {
        throw new ValidationError(
          "You cannot report yourself."
        );
      }

      const user = await UserRepository.findById(targetId);

      if (!user) {
        throw new NotFoundError("User not found.");
      }
    }

    if (targetType === ReportTargetType.EVENT) {
      const event = await EventRepository.findById(targetId);

      if (!event) {
        throw new NotFoundError("Event not found.");
      }
    }

    const duplicate =
      await ReportRepository.findDuplicate(
        reporterUserId,
        targetType,
        targetId
      );

    if (duplicate) {
      throw new ConflictError(
        "You have already reported this target."
      );
    }

    return ReportRepository.create({
      reporter: {
        connect: {
          id: reporterUserId,
        },
      },

      target_type: targetType,
      target_id: targetId,
      reason,
      description,
    });
  }

  /**
   * Get reports submitted by current user
   */
  static async getUserReports(userId: string) {
    return ReportRepository.findByUserId(userId);
  }

  /**
   * Get all reports
   */
  static async getAllReports(
    filters?: {
      status?: ReportStatus;
      targetType?: ReportTargetType;
    },
    page = 1,
    limit = 20
  ) {
    return ReportRepository.findAll({
      ...filters,
      page,
      limit,
    });
  }

  /**
   * Get report details
   */
  static async getReportDetails(reportId: string) {
    const report =
      await ReportRepository.findById(reportId);

    if (!report) {
      throw new NotFoundError("Report not found.");
    }

    return report;
  }
    /**
   * Update report status (Admin)
   */
  static async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    adminNote?: string
  ) {
    const report = await ReportRepository.findById(reportId);

    if (!report) {
      throw new NotFoundError("Report not found.");
    }

    return ReportRepository.update(reportId, {
      status,
      admin_note: adminNote,
    });
  }

  /**
   * Validate that the supplied reason is valid
   * for the supplied target type.
   */
  private static async validateReason(
    targetType: ReportTargetType,
    reason: ReportReason
  ) {
    const eventReasons: ReportReason[] = [
      ReportReason.FAKE_EVENT,
      ReportReason.SPAM,
      ReportReason.MISLEADING,
      ReportReason.INAPPROPRIATE,
      ReportReason.OTHER,
    ];

    const userReasons: ReportReason[] = [
      ReportReason.HARASSMENT,
      ReportReason.ABUSE,
      ReportReason.REPEATED_NO_SHOW,
      ReportReason.MALICIOUS,
      ReportReason.OTHER,
    ];

    if (
      targetType === ReportTargetType.EVENT &&
      !eventReasons.includes(reason)
    ) {
      throw new ValidationError(
        "Invalid report reason for an event."
      );
    }

    if (
      targetType === ReportTargetType.USER &&
      !userReasons.includes(reason)
    ) {
      throw new ValidationError(
        "Invalid report reason for a user."
      );
    }
  }
}