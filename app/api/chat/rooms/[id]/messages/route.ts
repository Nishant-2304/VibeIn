import { NextResponse } from "next/server";
import { ChatService } from "@/services/chat.service";
import { requireAuth } from "@/lib/auth";
import { ValidationError, ForbiddenError } from "@/utils/errors";
import { prisma } from "@/lib/prisma"; // 💡 Swap this path with your project's actual prisma instance path (e.g., @/lib/prisma)

async function ensureRoomAndMembership(roomId: string, userId: string) {
  // 1. First, make sure the actual ChatRoom row exists in the database
  await prisma.chatRoom.upsert({
    where: { id: roomId },
    update: {}, // Do nothing if it already exists
    create: {
      id: roomId,
      name: "Event Chat",
      isGroup: true // Defaulting to true for event channels
    }
  });

  // 2. Now safely link the authenticated user to it without foreign key crashes
  await prisma.chatMember.upsert({
    where: {
      roomId_userId: {
        roomId: roomId,
        userId: userId,
      },
    },
    update: {},
    create: {
      roomId: roomId,
      userId: userId,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const messages = await ChatService.getRoomMessages(params.id, currentUser.id, limit, skip);
    return NextResponse.json(messages, { status: 200 });
  } catch (error: any) {
    // 🔒 Catch the membership guard rejection and throw a clean 403 Forbidden status
    const status = error instanceof ForbiddenError || error.status === 403 ? 403 : 500;
    return NextResponse.json(
      { code: error.code || "FORBIDDEN", message: error.message || "Not a member of this chat room." },
      { status }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth(request);
    const body = await request.json().catch(() => null);

    if (!body || typeof body.content !== "string") {
      throw new ValidationError("Message content string is required.");
    }

    const savedMessage = await ChatService.sendMessage(params.id, currentUser.id, body.content);

    // Detached fire-and-forget real-time broadcasting logic
    (async () => {
      try {
        const roomRooms = await ChatService.getUserRooms(currentUser.id);
        const currentRoom = roomRooms.find(r => r.id === params.id);
        const targetUserIds = currentRoom?.members.map(m => m.userId) || [];

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        await fetch("http://localhost:8080/api/internal/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserIds, message: savedMessage }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (err) {
        console.error("Broadcast skipped:", err);
      }
    })();

    return NextResponse.json(savedMessage, { status: 201 });
  } catch (error: any) {
    const status = error instanceof ForbiddenError || error.status === 403 ? 403 : 400;
    return NextResponse.json(
      { code: error.code || "BAD_REQUEST", message: error.message },
      { status }
    );
  }
}