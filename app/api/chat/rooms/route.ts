import { NextResponse } from "next/server";
import { ChatService } from "@/services/chat.service";
import { requireAuth } from "@/lib/auth"; 
import { ValidationError } from "@/utils/errors"; 

export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth(request);
    const rooms = await ChatService.getUserRooms(currentUser.id);
    return NextResponse.json(rooms, { status: 200 });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { code: error.code || "INTERNAL_ERROR", message: error.message },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth(request);
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      throw new ValidationError("Body must be a valid JSON object.");
    }

    const { isGroup, targetUserId, name, memberIds } = body;

    if (isGroup) {
      if (!Array.isArray(memberIds)) {
        throw new ValidationError("memberIds must be an array.");
      }
      const newGroup = await ChatService.createGroup(name || "Unnamed Group", currentUser.id, memberIds);
      return NextResponse.json(newGroup, { status: 201 });
    } else {
      if (!targetUserId || typeof targetUserId !== "string") {
        throw new ValidationError("targetUserId is required for DMs.");
      }
      const dmRoom = await ChatService.getOrCreateDM(currentUser.id, targetUserId);
      return NextResponse.json(dmRoom, { status: 200 });
    }
  } catch (error: any) {
    const status = error.status || 400;
    return NextResponse.json(
      { code: error.code || "BAD_REQUEST", message: error.message },
      { status }
    );
  }
}