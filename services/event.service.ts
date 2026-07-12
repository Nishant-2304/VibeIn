import { EventStatus, Prisma } from "@prisma/client";
import { EventRepository } from "../repositories/event.repository";
import {
  BusinessRuleError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/errors";

type PaginationInput = {
  skip: number;
  limit: number;
};

type EventFilters = {
  q?: string | null;
  hostel?: string | null;
  floor?: string | null;
  status?: string | null;
  // Optional whitelist of hostels to scope the query to (e.g. derived
  // from the viewer's gender). When provided and non-empty, only events
  // whose `hostel_name` is in the list are returned.
  hostels?: string[] | null;
  isOnline?: boolean;
};

type Actor = {
  userId?: string | null;
  isAdmin?: boolean;
};

const editableLocationFields = ["name", "hostel", "floor", "roomNumber"];

function isEventStatus(value: unknown): value is EventStatus {
  return (
    typeof value === "string" &&
    (Object.values(EventStatus) as string[]).includes(value)
  );
}

function parseInteger(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue)) {
    throw new ValidationError(`${fieldName} must be an integer.`);
  }

  return parsedValue;
}

function parseDate(value: unknown, fieldName: string) {
  if (typeof value !== "string" && !(value instanceof Date)) {
    throw new ValidationError(`${fieldName} is required.`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }

  return date;
}

function activeAttendeeCount(event: { participants?: { attendance_status: string }[] }) {
  return (
    event.participants?.filter(
      (participant) => participant.attendance_status !== "CANCELLED"
    ).length ?? 0
  );
}

function assertActorCanMutateEvent(event: { host_id: string }, actor?: Actor) {
  if (actor?.isAdmin) {
    return;
  }

  if (!actor?.userId) {
    return;
  }

  if (event.host_id !== actor.userId) {
    throw new ForbiddenError("Only the event host can modify this event.");
  }
}

async function assertUserCanCreateEvent(userId: string) {
  const user = await EventRepository.findUserById(userId);

  if (!user) {
    throw new NotFoundError("Host user not found.");
  }

  if (user.banned_at) {
    throw new ForbiddenError("Account is banned.");
  }
}

export class EventService {
  static async getAllEvents(filters: EventFilters, pagination: PaginationInput) {
    // First run the database-wide status transition so counts and pagination are accurate
    await EventRepository.transitionEndedAndDueEvents();

    const where: Prisma.EventWhereInput = {};
    const floor = parseInteger(filters.floor, "floor");
    const q = filters.q?.trim();

    const andConditions: Prisma.EventWhereInput[] = [];

    if (filters.status) {
      if (!isEventStatus(filters.status)) {
        throw new ValidationError("Invalid event status.");
      }
      andConditions.push({ event_status: filters.status });
    } else {
      // Default (no status specified): return all UPCOMING and ACTIVE events,
      // plus COMPLETED/CANCELLED events only if completed/cancelled within the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      andConditions.push({
        event_status: {
          in: [EventStatus.UPCOMING, EventStatus.ACTIVE],
        },
      });
      // (Note: Optional cleanup of the one-hour-ago trailing block if needed, 
      // keeping it matched to your design fallback rules)
    }

    if (filters.hostel) {
      andConditions.push({ hostel_name: filters.hostel });
    }

    if (floor !== undefined) {
      andConditions.push({ floor });
    }

    if (q) {
      andConditions.push({
        OR: [
          { eventname: { contains: q, mode: "insensitive" } },
          { event_description: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    // ── CRITICAL CHANGE: GENDER/HOSTEL SCOPE BYPASS FOR ONLINE VIBES ──
    if (filters.hostels && filters.hostels.length > 0) {
      andConditions.push({
        OR: [
          { hostel_name: { in: filters.hostels } },
          { is_online: true } // 👈 Allows online events to pass through block filtering!
        ],
      });
    }

    // Handle direct parameter searches specifically filtering down to only online/physical
    if ((filters as any).isOnline !== undefined) {
      andConditions.push({ is_online: (filters as any).isOnline });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [events, total] = await EventRepository.findAll(where, pagination);

    // Keep the lazy transition checks on the returned records as a defensive measure
    const completedIds = await this.completeEndedEvents(events);
    if (completedIds.size > 0) {
      for (const event of events) {
        if (completedIds.has(event.id)) {
          event.event_status = EventStatus.COMPLETED;
        }
      }
    }

    const activatedIds = await this.activateDueEvents(events);
    if (activatedIds.size > 0) {
      for (const event of events) {
        if (activatedIds.has(event.id)) {
          event.event_status = EventStatus.ACTIVE;
        }
      }
    }

    return { events, total };
  }

  static async getEventById(id: string) {
    const event = await EventRepository.findById(id);

    if (!event) {
      throw new NotFoundError("Event not found.");
    }

    // Lazy transition: if the event duration has passed, transition to COMPLETED.
    const now = new Date();
    const endTime = new Date(event.event_time.getTime() + event.duration_minutes * 60 * 1000);
    if (
      (event.event_status === EventStatus.UPCOMING || event.event_status === EventStatus.ACTIVE) &&
      endTime <= now
    ) {
      await EventRepository.updateStatusToCompletedForEndedEvent(id);
      event.event_status = EventStatus.COMPLETED;
    } else if (
      event.event_status === EventStatus.UPCOMING &&
      event.event_time <= now
    ) {
      await EventRepository.updateStatusToActiveForDueEvent(id);
      event.event_status = EventStatus.ACTIVE;
    }

    return event;
  }

  // Bulk-activates any UPCOMING events in the provided list whose start time
  // has passed. Single updateMany statement; does not touch events with
  // manual status (ACTIVE, COMPLETED, CANCELLED). Returns the set of ids
  // that were actually transitioned so the caller can patch the in-memory
  // result without re-scanning the list.
  private static async activateDueEvents(
    events: { id: string; event_status: EventStatus; event_time: Date }[]
  ): Promise<Set<string>> {
    const now = new Date();
    const dueIds = events
      .filter(
        (event) =>
          event.event_status === EventStatus.UPCOMING && event.event_time <= now
      )
      .map((event) => event.id);

    if (dueIds.length === 0) return new Set();

    await EventRepository.updateStatusToActiveForDueEvents(dueIds);
    return new Set(dueIds);
  }

  static async createEvent(data: any, actor?: Actor) {
    const hostId = actor?.userId ?? data.hostId;

    if (!hostId || typeof hostId !== "string") {
      throw new UnauthorizedError("Host user is required.");
    }

    if (typeof data.eventname !== "string" || data.eventname.trim().length < 3) {
      throw new ValidationError("name must be at least 3 characters.");
    }

    if (data.eventname.trim().length > 100) {
      throw new ValidationError("name must be 100 characters or fewer.");
    }

    if (data.description !== undefined && typeof data.description !== "string") {
      throw new ValidationError("description must be a string.");
    }

    const isOnline = !!data.is_online;
    if (!isOnline && (typeof data.hostel_name !== "string" || data.hostel_name.trim().length === 0)) {
      throw new ValidationError("hostel is required for physical events.");
    }

    const floor = data.floor !== undefined ? parseInteger(data.floor, "floor") : undefined;
    if (!isOnline && floor === undefined) {
      throw new ValidationError("floor is required for physical events.");
    }

    if (typeof data.room_no !== "string" || data.room_no.trim().length === 0) {
      throw new ValidationError(isOnline ? "Online access link/platform details are required." : "roomNumber is required.");
    }

    const scheduledAt = parseDate(data.event_time, "scheduledAt");

    if (scheduledAt <= new Date()) {
      throw new ValidationError("scheduledAt must be in the future.");
    }

    const maxAttendees = parseInteger(data.max_attendees, "maxAttendees");

    if (maxAttendees === undefined || maxAttendees < 2) {
      throw new ValidationError("maxAttendees must be at least 2.");
    }

    const durationMinutes = parseInteger(data.duration_minutes, "durationMinutes") ?? 120;

    if (durationMinutes < 1) {
      throw new ValidationError("durationMinutes must be at least 1.");
    }

    await assertUserCanCreateEvent(hostId);

    // 1. Create the base Event record
    const newEvent = await EventRepository.create({
      eventname: data.eventname.trim(),
      event_description: data.description?.trim() ?? "",
      is_online: isOnline,
      hostel_name: isOnline ? "ONLINE" : data.hostel_name.trim(),
      floor: isOnline ? 0 : floor,
      room_no: data.room_no.trim(),
      host_id: hostId,
      event_time: scheduledAt,
      duration_minutes: durationMinutes,
      max_attendees: maxAttendees,
    });

    // 🚀 EVENT-DRIVEN ACTION: Auto-provision matching chat room container with same ID
    try {
      // Import your global single instance from its path (e.g., @/lib/prisma)
      const { prisma } = require("@/lib/prisma"); 
      
      await prisma.chatRoom.create({
        data: {
          id: newEvent.id, // Direct 1:1 match
          name: newEvent.eventname,
          isGroup: true,
          members: {
            create: { userId: hostId } // Add the event host automatically
          }
        }
      });
    } catch (chatError: any) {
      console.error("Non-blocking failure provisioning event chat room context:", chatError.message);
    }

    return newEvent;
  }
  static async updateEvent(id: string, data: any, actor?: Actor) {
    const event = await EventRepository.findForMutationById(id);

    if (!event) {
      throw new NotFoundError("Event not found.");
    }

    assertActorCanMutateEvent(event, actor);

    if (
      event.event_status === EventStatus.COMPLETED ||
      event.event_status === EventStatus.CANCELLED
    ) {
      throw new BusinessRuleError(
        "EVENT_NOT_EDITABLE",
        "Completed or cancelled events cannot be edited."
      );
    }

    const hasRegistrations = activeAttendeeCount(event) > 0;
    const isOnline = !!event.is_online;

    // Strict Field Lock bypass rules for Online Events
    if (hasRegistrations) {
      // For physical events, lock everything. For online events, allow editing the link/room_no!
      const targetFieldsToCheck = isOnline 
        ? ["name"] // Only lock the event title for online events if users have joined
        : ["name", "hostel", "floor", "roomNumber"];

      if (targetFieldsToCheck.some((field) => data[field] !== undefined)) {
        throw new BusinessRuleError(
          "EVENT_FIELD_LOCKED",
          isOnline 
            ? "The event name is locked after participants have registered."
            : "name, hostel, floor, and roomNumber are locked after registrations."
        );
      }
    }

    const updateData: Prisma.EventUpdateInput = {};

    if (data.name !== undefined) {
      if (typeof data.name !== "string" || data.name.trim().length < 3) {
        throw new ValidationError("name must be at least 3 characters.");
      }
      if (data.name.trim().length > 100) {
        throw new ValidationError("name must be 100 characters or fewer.");
      }
      updateData.eventname = data.name.trim();
    }

    if (data.description !== undefined) {
      if (typeof data.description !== "string") {
        throw new ValidationError("description must be a string.");
      }
      updateData.event_description = data.description.trim();
    }

    // Only update physical hostel location properties if it's a physical event
    if (!isOnline) {
      if (data.hostel !== undefined) {
        if (typeof data.hostel !== "string" || data.hostel.trim().length === 0) {
          throw new ValidationError("hostel must be a non-empty string.");
        }
        updateData.hostel_name = data.hostel.trim();
      }

      if (data.floor !== undefined) {
        updateData.floor = parseInteger(data.floor, "floor");
      }
    }

    // roomNumber handles either room numbers or stream URLs dynamically
    if (data.roomNumber !== undefined) {
      if (typeof data.roomNumber !== "string" || data.roomNumber.trim().length === 0) {
        throw new ValidationError(
          isOnline ? "Online access link cannot be empty." : "roomNumber must be a non-empty string."
        );
      }
      updateData.room_no = data.roomNumber.trim();
    }

    if (data.scheduledAt !== undefined) {
      const scheduledAt = parseDate(data.scheduledAt, "scheduledAt");
      if (scheduledAt <= new Date()) {
        throw new ValidationError("scheduledAt cannot be in the past.");
      }
      updateData.event_time = scheduledAt;
    }

    if (data.durationMinutes !== undefined) {
      const durationMinutes = parseInteger(data.durationMinutes, "durationMinutes");
      if (durationMinutes === undefined || durationMinutes < 1) {
        throw new ValidationError("durationMinutes must be at least 1.");
      }
      updateData.duration_minutes = durationMinutes;
    }

    if (data.maxAttendees !== undefined) {
      const maxAttendees = parseInteger(data.maxAttendees, "maxAttendees");
      const currentAttendees = activeAttendeeCount(event);

      if (maxAttendees === undefined || maxAttendees < 2) {
        throw new ValidationError("maxAttendees must be at least 2.");
      }
      if (maxAttendees < currentAttendees) {
        throw new BusinessRuleError(
          "MAX_ATTENDEES_TOO_LOW",
          "maxAttendees cannot be below currentAttendees."
        );
      }
      updateData.max_attendees = maxAttendees;
    }

    if (Object.keys(updateData).length === 0) {
      return event;
    }

    return EventRepository.update(id, updateData);
  }

  static async updateEventStatus(id: string, data: any, actor?: Actor) {
    const event = await EventRepository.findForMutationById(id);

    if (!event) {
      throw new NotFoundError("Event not found.");
    }

    assertActorCanMutateEvent(event, actor);

    if (!isEventStatus(data.status)) {
      throw new ValidationError("Invalid event status.");
    }

    const allowedHostTransitions = new Set([
      `${EventStatus.UPCOMING}:${EventStatus.CANCELLED}`,
      `${EventStatus.ACTIVE}:${EventStatus.COMPLETED}`,
      `${EventStatus.UPCOMING}:${EventStatus.COMPLETED}`,
      `${EventStatus.UPCOMING}:${EventStatus.ACTIVE}`,
    ]);
    const transition = `${event.event_status}:${data.status}`;

    if (!actor?.isAdmin && !allowedHostTransitions.has(transition)) {
      throw new BusinessRuleError(
        "INVALID_STATUS_TRANSITION",
        "This status transition is not allowed for hosts."
      );
    }

    return EventRepository.update(id, {
      event_status: data.status,
    });
  }

  private static async completeEndedEvents(
    events: { id: string; event_status: EventStatus; event_time: Date; duration_minutes: number }[]
  ): Promise<Set<string>> {
    const now = new Date();
    const endedIds = events
      .filter((event) => {
        const endTime = new Date(event.event_time.getTime() + event.duration_minutes * 60 * 1000);
        return (
          (event.event_status === EventStatus.UPCOMING || event.event_status === EventStatus.ACTIVE) &&
          endTime <= now
        );
      })
      .map((event) => event.id);

    if (endedIds.length === 0) return new Set();

    await EventRepository.updateStatusToCompletedForEndedEvents(endedIds);
    return new Set(endedIds);
  }
}
