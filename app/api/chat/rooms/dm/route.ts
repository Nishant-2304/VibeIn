import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ValidationError } from "@/utils/errors";

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth(request);
    const body = await request.json().catch(() => null);

    if (!body || typeof body.targetUserId !== "string") {
      throw new ValidationError("targetUserId string is required.");
    }

    const targetUserId = body.targetUserId;

    // Prevent making a DM channel with yourself
    if (currentUser.id === targetUserId) {
      throw new ValidationError("You cannot start a direct message thread with yourself.");
    }

    // 1. Look for an existing DM channel containing BOTH users
    // We query rooms where isGroup is false, and filter by membership bounds
    const existingDMRoom = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: currentUser.id } } },
          { members: { some: { userId: targetUserId } } }
        ]
      }
    });

    if (existingDMRoom) {
      return NextResponse.json({ roomId: existingDMRoom.id }, { status: 200 });
    }

    // 2. If no room exists, create a new one inside a sequential transaction block
    const newRoom = await prisma.$transaction(async (tx) => {
      const room = await tx.chatRoom.create({
        data: {
          isGroup: false,
          name: null // Standard DM layout ignores this field to favor the opposite partner's name
        }
      });

      // Join both participants into the room container fields
      await tx.chatMember.createMany({
        data: [
          { roomId: room.id, userId: currentUser.id },
          { roomId: room.id, userId: targetUserId }
        ]
      });

      return room;
    });

    return NextResponse.json({ roomId: newRoom.id }, { status: 201 });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { code: error.code || "INTERNAL_ERROR", message: error.message },
      { status }
    );
  }
}