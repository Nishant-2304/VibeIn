/**
 * Event Registrations API Route Handler
 * GET: Retrieve list of all registrations for an event
 * POST: Register a new participant for event
 */

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Handle GET request for event registrations
  return new Response(
    JSON.stringify({
      message: `GET /api/events/${params.id}/registrations`,
    }),
    { status: 200 }
  );
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Handle POST request to register for event
  return new Response(
    JSON.stringify({
      message: `POST /api/events/${params.id}/registrations`,
    }),
    { status: 201 }
  );
}
