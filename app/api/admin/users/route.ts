/**
 * Admin Users API Route Handler
 * GET: Retrieve list of all users (admin only)
 */

export async function GET(request: Request) {
  // Handle GET request for all users (admin)
  return new Response(
    JSON.stringify({ message: "GET /api/admin/users" }),
    { status: 200 }
  );
}
