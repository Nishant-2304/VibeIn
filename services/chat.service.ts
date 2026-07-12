import { PrismaClient } from "@prisma/client";
import { ValidationError, NotFoundError, ForbiddenError } from "../utils/errors";
import { prisma } from "@/lib/prisma";

export class ChatService {
  /**
   * Finds an existing DM room between two users or creates a new one if none exists.
   */
  // Inside services/chat.service.ts -> getOrCreateDM
static async getOrCreateDM(currentUserId: string, targetUserId: string) {
  // Try to find an existing 1:1 room layout
  const existingDM = await prisma.chatRoom.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId: currentUserId } } },
        { members: { some: { userId: targetUserId } } }
      ]
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              pfp: true
            }
          }
        }
      }
    }
  });

  if (existingDM) return existingDM;

  // Otherwise, provision a clean room entry inside a transaction sequence block
  return prisma.$transaction(async (tx) => {
    const room = await tx.chatRoom.create({
      data: {
        isGroup: false,
        name: null
      }
    });

    await tx.chatMember.createMany({
      data: [
        { roomId: room.id, userId: currentUserId },
        { roomId: room.id, userId: targetUserId }
      ]
    });

    return tx.chatRoom.findUnique({
      where: { id: room.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                pfp: true
              }
            }
          }
        }
      }
    });
  });
}

  /**
   * Creates a group chat room with an initial list of members.
   */
  static async createGroup(name: string, creatorId: string, memberIds: string[]) {
    const cleanedName = name.trim();
    if (!cleanedName || cleanedName.length < 3) {
      throw new ValidationError("Group name must be at least 3 characters.");
    }

    // Make sure the creator is included in the unique list of members
    const uniqueMembers = Array.from(new Set([creatorId, ...memberIds]));

    return prisma.chatRoom.create({
      data: {
        name: cleanedName,
        isGroup: true,
        members: {
          create: uniqueMembers.map((userId) => ({ userId })),
        },
      },
      include: {
        members: true,
      },
    });
  }

  /**
   * Sends a message to a specific room after verifying the sender is a member.
   */
  static async sendMessage(roomId: string, senderId: string, content: string) {
    const text = content.trim();
    if (!text) {
      throw new ValidationError("Message content cannot be empty.");
    }

    const membership = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId, userId: senderId } },
    });

    if (!membership) {
      throw new ForbiddenError("You are not a member of this chat room.");
    }

    const [message] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: { roomId, senderId, content: text },
      }),
      prisma.chatRoom.update({
        where: { id: roomId },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Fetch sender profile details manually to match schema layout
    const userProfile = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, username: true, email: true }
    });

    return { ...message, sender: userProfile };
  }

  /**
   * Fetches message history for a room with pagination.
   */
  static async getRoomMessages(roomId: string, userId: string, limit = 50, skip = 0) {
    const membership = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!membership) {
      throw new ForbiddenError("You do not have access to this room's messages.");
    }

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });

    if (messages.length === 0) return [];

    // Extract all unique senderIds from the message pool
    const senderIds = Array.from(new Set(messages.map((m) => m.senderId)));

    // Bulk fetch user profiles matching those IDs
    const userProfiles = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, username: true, email: true },
    });

    const profileMap = new Map(userProfiles.map((u) => [u.id, u]));

    // Attach profiles onto the returned message arrays
    return messages.map((msg) => ({
      ...msg,
      sender: profileMap.get(msg.senderId) || null,
    }));
  }

  /**
   * Gets a list of all chat rooms the user is currently part of.
   */
  static async getUserRooms(userId: string) {
  return prisma.chatRoom.findMany({
    where: {
      members: {
        some: { userId }
      }
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true, // Keep this!
              pfp: true      // Keep this!
              // ❌ REMOVE THIS LINE ENTIRELY: displayName: true
            }
          }
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });
}
}