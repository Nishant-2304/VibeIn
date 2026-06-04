/**
 * Report Types
 * Type definitions for report-related data structures
 */

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedEventId?: string;
  reason: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportInput {
  reportedUserId?: string;
  reportedEventId?: string;
  reason: string;
  description: string;
}

export interface ReportFilter {
  status?: string;
  reason?: string;
  dateRange?: { start: Date; end: Date };
}
