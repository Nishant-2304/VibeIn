/**
 * User Profile API Route Handler
 * GET: Retrieve specific user's profile by ID
 */

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Handle GET request for specific user profile
  return new Response(
    JSON.stringify({ message: `GET /api/users/${params.id}` }),
    { status: 200 }
  );
}
