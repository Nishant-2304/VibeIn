/**
 * Reports API Route Handler
 * GET: Retrieve current user's submitted reports
 * POST: Submit a new report
 */

import { requireAuth } from "../../../lib/auth";
import { ReportService } from "../../../services/report.service";
import {
  handleRouteError,
  json,
} from "../users/route-utils";

export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth(request);

    const reports = await ReportService.getUserReports(
      currentUser.id
    );

    return json(reports);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth(request);

    const body = await request.json();

    const report = await ReportService.createReport(
      currentUser.id,
      body
    );

    return json(
      {
        id: report.id,
        status: report.status,
        createdAt: report.createdAt,
      },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}