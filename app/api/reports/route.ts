/**
 * Reports API Route Handler
 * GET: Retrieve list of user's submitted reports
 * POST: Create a new report for inappropriate content/user
 */

export async function GET(request: Request) {
  // Handle GET request for reports
  return new Response(JSON.stringify({ message: "GET /api/reports" }), {
    status: 200,
  });
}

export async function POST(request: Request) {
  // Handle POST request to create new report
  return new Response(JSON.stringify({ message: "POST /api/reports" }), {
    status: 201,
  });
}
