/**
 * User Events API Route Handler
 * GET: Retrieve all events (hosted and attended) for specific user
 */

import { EventStatus } from "@prisma/client";
import { UserService } from "../../../../../services/user.service";
import { handleRouteError, json } from "../../route-utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const events = await UserService.getUserEvents(params.id, "attended");
    const attended = events.attended.filter(
      (event) => event.event_status === EventStatus.COMPLETED
    );

    return json(attended);
  } catch (error) {
    return handleRouteError(error);
  }
}
