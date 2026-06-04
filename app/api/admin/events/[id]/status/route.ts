/**
 * Admin Event Status API Route Handler
 * GET: Retrieve event status information
 * PATCH: Update event status (admin only)
 */

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Handle GET request for event status (admin)
  return new Response(
    JSON.stringify({
      message: `GET /api/admin/events/${params.id}/status`,
    }),
    { status: 200 }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Handle PATCH request to update event status (admin)
  return new Response(
    JSON.stringify({
      message: `PATCH /api/admin/events/${params.id}/status`,
    }),
    { status: 200 }
  );
}
