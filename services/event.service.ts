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
    const where: Prisma.EventWhereInput = {};
    const floor = parseInteger(filters.floor, "floor");
    const q = filters.q?.trim();

    if (filters.status) {
      if (!isEventStatus(filters.status)) {
        throw new ValidationError("Invalid event status.");
      }

      where.event_status = filters.status;
    }

    if (filters.hostel) {
      where.hostel_name = filters.hostel;
    }

    if (floor !== undefined) {
      where.floor = floor;
    }

    if (q) {
      where.OR = [
        { eventname: { contains: q, mode: "insensitive" } },
        { event_description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [events, total] = await EventRepository.findAll(where, pagination);

    // Lazily transition any UPCOMING events whose start time has passed to
    // ACTIVE. Done in a single bulk update for efficiency; manual status
    // changes (ACTIVE, COMPLETED, CANCELLED) are preserved by the filter.
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

    // Lazy transition: if the start time has passed and the host hasn't
    // manually moved it past UPCOMING, treat it as ACTIVE.
    if (
      event.event_status === EventStatus.UPCOMING &&
      event.event_time <= new Date()
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

    if (typeof data.name !== "string" || data.name.trim().length < 3) {
      throw new ValidationError("name must be at least 3 characters.");
    }

    if (data.name.trim().length > 100) {
      throw new ValidationError("name must be 100 characters or fewer.");
    }

    if (data.description !== undefined && typeof data.description !== "string") {
      throw new ValidationError("description must be a string.");
    }

    if (typeof data.hostel !== "string" || data.hostel.trim().length === 0) {
      throw new ValidationError("hostel is required.");
    }

    const floor = parseInteger(data.floor, "floor");

    if (floor === undefined) {
      throw new ValidationError("floor is required.");
    }

    if (typeof data.roomNumber !== "string" || data.roomNumber.trim().length === 0) {
      throw new ValidationError("roomNumber is required.");
    }

    const scheduledAt = parseDate(data.scheduledAt, "scheduledAt");

    if (scheduledAt <= new Date()) {
      throw new ValidationError("scheduledAt must be in the future.");
    }

    const maxAttendees = parseInteger(data.maxAttendees, "maxAttendees");

    if (maxAttendees === undefined || maxAttendees < 2) {
      throw new ValidationError("maxAttendees must be at least 2.");
    }

    const durationMinutes = parseInteger(data.durationMinutes, "durationMinutes") ?? 120;

    if (durationMinutes < 1) {
      throw new ValidationError("durationMinutes must be at least 1.");
    }

    await assertUserCanCreateEvent(hostId);

    return EventRepository.create({
      eventname: data.name.trim(),
      event_description: data.description?.trim() ?? "",
      hostel_name: data.hostel.trim(),
      floor,
      room_no: data.roomNumber.trim(),
      host_id: hostId,
      event_time: scheduledAt,
      duration_minutes: durationMinutes,
      max_attendees: maxAttendees,
    });
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

    if (
      hasRegistrations &&
      editableLocationFields.some((field) => data[field] !== undefined)
    ) {
      throw new BusinessRuleError(
        "EVENT_FIELD_LOCKED",
        "name, hostel, floor, and roomNumber are locked after registrations."
      );
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

    if (data.hostel !== undefined) {
      if (typeof data.hostel !== "string" || data.hostel.trim().length === 0) {
        throw new ValidationError("hostel must be a non-empty string.");
      }

      updateData.hostel_name = data.hostel.trim();
    }

    if (data.floor !== undefined) {
      updateData.floor = parseInteger(data.floor, "floor");
    }

    if (data.roomNumber !== undefined) {
      if (typeof data.roomNumber !== "string" || data.roomNumber.trim().length === 0) {
        throw new ValidationError("roomNumber must be a non-empty string.");
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
}
