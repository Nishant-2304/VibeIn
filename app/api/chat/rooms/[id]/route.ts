import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 1. Authenticate the incoming request
    const currentUser = await requireAuth(request);

    // 2. Fetch the specific room ensuring the requesting user is a member
    const room = await prisma.chatRoom.findFirst({
      where: {
        id,
        members: {
          some: {
            userId: currentUser.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                pfp: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Chat room not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json(room, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}