/**
 * Event Reviews API Route Handler
 * GET: Retrieve list of all reviews for an event
 * POST: Create new review for event
 */

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Handle GET request for event reviews
  return new Response(
    JSON.stringify({ message: `GET /api/events/${params.id}/reviews` }),
    { status: 200 }
  );
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Handle POST request to create review
  return new Response(
    JSON.stringify({ message: `POST /api/events/${params.id}/reviews` }),
    { status: 201 }
  );
}
