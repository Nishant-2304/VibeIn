import { AppError, BusinessRuleError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "../utils/errors";
import { AttendanceStatus, EventStatus } from "@prisma/client";
import { RegistrationRepository } from "../repositories/registration.repository";
import { prisma } from "@/lib/prisma";

type Actor = {
  userId?: string | null;
  isAdmin?: boolean;
};

const CANCELLATION_CUTOFF_HOURS = 2;

function activeAttendeeCount(event: { participants?: { attendance_status: string }[] }) {
  return (
    event.participants?.filter(
      (participant) => participant.attendance_status !== AttendanceStatus.CANCELLED
    ).length ?? 0
  );
}

function assertActorIsHostOrAdmin(event: { host_id: string }, actor?: Actor) {
  if (actor?.isAdmin) {
    return;
  }

  if (!actor?.userId) {
    return;
  }

  if (event.host_id !== actor.userId) {
    throw new ForbiddenError("Only the event host or an admin can view registrations.");
  }
}

export class RegistrationService {
  static async registerForEvent(userId: string | null | undefined, eventId: string) {
    if (!userId) {
      throw new UnauthorizedError("Authentication required.");
    }

    const [event, user, existingRegistration] = await Promise.all([
      RegistrationRepository.findEventById(eventId),
      RegistrationRepository.findUserById(userId),
      RegistrationRepository.findByUserAndEvent(userId, eventId),
    ]);

    if (!event) {
      throw new NotFoundError("Event not found.");
    }

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (user.banned_at) {
      throw new ForbiddenError("Account is banned.");
    }

    if (existingRegistration && existingRegistration.attendance_status !== AttendanceStatus.CANCELLED) {
      throw new AppError("ALREADY_REGISTERED", 409, "User is already registered for this event.");
    }

    if (
      event.event_status !== EventStatus.UPCOMING &&
      event.event_status !== EventStatus.ACTIVE
    ) {
      throw new BusinessRuleError("REGISTRATION_CLOSED", "Registration is closed for this event.");
    }

    if (activeAttendeeCount(event) >= event.max_attendees) {
      throw new BusinessRuleError("EVENT_FULL", "Event is already at capacity.");
    }

    if (existingRegistration?.attendance_status === AttendanceStatus.CANCELLED) {
      const updatedReg = await RegistrationRepository.setAttendanceStatus(
        existingRegistration.id,
        AttendanceStatus.REGISTERED
      );

      // 🚀 EVENT-DRIVEN ACTION: Auto-add user back into the chat room upon re-registration
      await prisma.chatMember.upsert({
        where: { roomId_userId: { roomId: eventId, userId } },
        update: {},
        create: { roomId: eventId, userId },
      }).catch(err => console.error("Failed to add user to chat room:", err));

      return updatedReg;
    }

    const newReg = await RegistrationRepository.create({
      event_id: eventId,
      user_id: userId,
    });

    // 🚀 EVENT-DRIVEN ACTION: Auto-add user to the chat room on new registration
    await prisma.chatMember.upsert({
      where: { roomId_userId: { roomId: eventId, userId } },
      update: {},
      create: { roomId: eventId, userId },
    }).catch(err => console.error("Failed to add user to chat room:", err));

    return newReg;
  }

  static async cancelRegistration(userId: string | null | undefined, eventId: string) {
    if (!userId) {
      throw new UnauthorizedError("Authentication required.");
    }

    const [event, registration] = await Promise.all([
      RegistrationRepository.findEventById(eventId),
      RegistrationRepository.findByUserAndEvent(userId, eventId),
    ]);

    if (!event) {
      throw new NotFoundError("Event not found.");
    }

    if (!registration || registration.attendance_status === AttendanceStatus.CANCELLED) {
      throw new NotFoundError("Registration not found.");
    }

    if (
      event.event_status === EventStatus.COMPLETED ||
      event.event_status === EventStatus.CANCELLED
    ) {
      throw new BusinessRuleError("REGISTRATION_CLOSED", "Registration cannot be cancelled for this event.");
    }

    const cutoffTime = new Date(event.event_time);
    cutoffTime.setHours(cutoffTime.getHours() - CANCELLATION_CUTOFF_HOURS);

    if (new Date() >= cutoffTime) {
      throw new BusinessRuleError(
        "CANCELLATION_WINDOW_CLOSED",
        "Cancellation window has closed."
      );
    }

    await RegistrationRepository.setAttendanceStatus(registration.id, AttendanceStatus.CANCELLED);

    // 🚀 EVENT-DRIVEN ACTION: Kick the user out of the chat room upon cancellation
    await prisma.chatMember.deleteMany({
      where: { roomId: eventId, userId }
    }).catch(err => console.error("Failed to remove user from chat room:", err));

    return { message: "Registration cancelled." };
  }

  static async getUserRegistration(userId: string | null | undefined, eventId: string) {
    if (!userId) {
      throw new UnauthorizedError("Authentication required.");
    }

    const registration = await RegistrationRepository.findByUserAndEvent(userId, eventId);

    if (!registration) {
      throw new NotFoundError("Registration not found.");
    }

    return registration;
  }

  static async getEventRegistrations(eventId: string, actor?: Actor) {
    const event = await RegistrationRepository.findEventById(eventId);

    if (!event) {
      throw new NotFoundError("Event not found.");
    }

    assertActorIsHostOrAdmin(event, actor);

    return RegistrationRepository.findByEventId(eventId);
  }

  static async updateRegistrationStatus(
    userId: string,
    eventId: string,
    status: unknown,
    actor?: Actor
  ) {
    const event = await RegistrationRepository.findEventById(eventId);

    if (!event) {
      throw new NotFoundError("Event not found.");
    }

    assertActorIsHostOrAdmin(event, actor);

    if (
      status !== AttendanceStatus.ATTENDED &&
      status !== AttendanceStatus.NO_SHOW
    ) {
      throw new ValidationError("attendanceStatus must be ATTENDED or NO_SHOW.");
    }

    if (
      event.event_status !== EventStatus.ACTIVE &&
      event.event_status !== EventStatus.COMPLETED
    ) {
      throw new BusinessRuleError(
        "ATTENDANCE_NOT_ALLOWED",
        "Event must be ACTIVE or COMPLETED to mark attendance."
      );
    }

    const registration = await RegistrationRepository.findByUserAndEvent(userId, eventId);

    if (!registration) {
      throw new NotFoundError("Registration not found.");
    }

    if (registration.attendance_status === AttendanceStatus.CANCELLED) {
      throw new BusinessRuleError(
        "REGISTRATION_CANCELLED",
        "Cannot mark attendance for a cancelled registration."
      );
    }

    return RegistrationRepository.setAttendanceStatus(
      registration.id,
      status as AttendanceStatus
    );
  }
}
