/**
 * User Registration API Route Handler
 * GET: Get specific user's registration details for event
 * DELETE: Remove specific user's registration (host only)
 */

export async function GET(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  // Handle GET request for specific user's registration
  return new Response(
    JSON.stringify({
      message: `GET /api/events/${params.id}/registrations/${params.userId}`,
    }),
    { status: 200 }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  // Handle DELETE request to remove user registration
  return new Response(
    JSON.stringify({
      message: `DELETE /api/events/${params.id}/registrations/${params.userId}`,
    }),
    { status: 200 }
  );
}
