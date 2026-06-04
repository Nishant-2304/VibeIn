
**Version:** 0.1 | **Status:** Draft

---

## Overview

**Base URL:** `/api`

**Auth header** (Supabase JWT, passed on all authenticated requests):
```
Authorization: Bearer <supabase_jwt>
```

**Auth levels used in this doc:**
- `public` — no token required
- `auth` — valid JWT required
- `host` — valid JWT + must be `event.hostId === req.user.id`
- `admin` — valid JWT + user has admin role

**Standard error shape:**
```json
{
  "error": "HUMAN_READABLE_CODE",
  "message": "Description of what went wrong"
}
```

**Common status codes:**
| Code | Meaning |
| 400 | Validation failure (malformed input) |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (already registered, duplicate review) |
| 422 | Business rule violation (event full, wrong status) |

---

## Events

### `GET /api/events`
Discover and list events.

**Auth:** `public`

**Query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Keyword search (event name, description) |
| `hostel` | string | Filter by hostel (e.g. `A Block`) |
| `floor` | number | Filter by floor number |
| `status` | string | `UPCOMING` \| `ACTIVE` \| `COMPLETED` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 50) |

**Response `200`:**
```json
{
  "events": [
    {
      "id": "uuid",
      "name": "Poker Night",
      "description": "5-card stud, casual",
      "hostel": "A Block",
      "floor": 3,
      "scheduledAt": "2026-06-10T20:00:00Z",
      "status": "UPCOMING",
      "maxAttendees": 8,
      "currentAttendees": 3,
      "host": {
        "id": "uuid",
        "displayName": "Nish",
        "hostRating": 4.5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "hasMore": true
  }
}
```
> Room number is never returned in this list endpoint, regardless of auth.

---

### `POST /api/events`
Create a new event.

**Auth:** `auth`

**Request body:**
```json
{
  "name": "Poker Night",
  "description": "5-card stud, bring your own chips",
  "hostel": "A Block",
  "floor": 3,
  "roomNumber": "A-301",
  "scheduledAt": "2026-06-10T20:00:00Z",
  "maxAttendees": 8
}
```

**Validation rules:**
- `name`: required, 3–100 chars
- `scheduledAt`: required, must be in the future
- `maxAttendees`: required, min 2
- `hostel`, `floor`, `roomNumber`: required

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "Poker Night",
  "status": "UPCOMING",
  "hostId": "uuid",
  ...
}
```

---

### `GET /api/events/:id`
Get full event details.

**Auth:** `public` (partial) / `auth` (full)

**Response `200`:**

For guests — `roomNumber` is omitted:
```json
{
  "id": "uuid",
  "name": "Poker Night",
  "description": "...",
  "hostel": "A Block",
  "floor": 3,
  "scheduledAt": "2026-06-10T20:00:00Z",
  "status": "UPCOMING",
  "maxAttendees": 8,
  "currentAttendees": 3,
  "host": {
    "id": "uuid",
    "displayName": "Nish",
    "hostRating": 4.5,
    "eventsHosted": 12
  },
  "reviews": []
}
```

For authenticated users — `roomNumber` is included:
```json
{
  ...same as above...,
  "roomNumber": "A-301"
}
```

---

### `PATCH /api/events/:id`
Edit an existing event.

**Auth:** `host`

**Request body** (all fields optional, send only what changes):
```json
{
  "description": "Updated description",
  "scheduledAt": "2026-06-10T21:00:00Z",
  "maxAttendees": 10
}
```

**Business rules enforced:**
- `maxAttendees` cannot be set below `currentAttendees`
- `scheduledAt` cannot be set to the past
- Editing is not allowed if event status is `COMPLETED` or `CANCELLED`
- `name`, `hostel`, `floor`, `roomNumber` are not editable after the event has registrations (return `422` if attempted)

**Response `200`:** Updated event object.

---

### `PATCH /api/events/:id/status`
Transition event status.

**Auth:** `host` or `admin`

**Request body:**
```json
{
  "status": "CANCELLED"
}
```

**Allowed transitions:**

| Actor | Allowed transitions |
|-------|-------------------|
| Host | UPCOMING → CANCELLED, ACTIVE → COMPLETED, UPCOMING → COMPLETED |
| Admin | Any → Any |

**Response `200`:** Updated event object.

> When status is set to `CANCELLED`, all registered participants must be notified (email via Supabase/Resend).

---

## Registrations

### `POST /api/events/:id/registrations`
Register the authenticated user for an event.

**Auth:** `auth`

**No request body required.**

**Business rules enforced:**
- Event must be `UPCOMING` or `ACTIVE`
- Event must not be at capacity
- User must not already be registered

**Response `201`:**
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "userId": "uuid",
  "attendanceStatus": "REGISTERED",
  "registeredAt": "2026-06-05T10:00:00Z"
}
```

**Error cases:**
| Scenario | Status | Error code |
|----------|--------|-----------|
| Already registered | 409 | `ALREADY_REGISTERED` |
| Event full | 422 | `EVENT_FULL` |
| Event cancelled/completed | 422 | `REGISTRATION_CLOSED` |

---

### `DELETE /api/events/:id/registrations/me`
Cancel own registration.

**Auth:** `auth`

**Business rules enforced:**
- User must be registered for this event
- Event must not be `COMPLETED` or `CANCELLED`
- Cancellation not allowed within a defined cutoff window before `scheduledAt` (e.g. 2 hours) — return `422` with `CANCELLATION_WINDOW_CLOSED`

**Response `200`:**
```json
{
  "message": "Registration cancelled."
}
```

---

### `GET /api/events/:id/registrations`
List all registrations for an event.

**Auth:** `host` or `admin`

**Response `200`:**
```json
{
  "registrations": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "displayName": "User Name",
        "participantRating": 4.2
      },
      "attendanceStatus": "REGISTERED",
      "registeredAt": "2026-06-05T10:00:00Z"
    }
  ]
}
```

---

### `PATCH /api/events/:id/registrations/:userId`
Update a participant's attendance status.

**Auth:** `host`

**Request body:**
```json
{
  "attendanceStatus": "ATTENDED"
}
```

**Allowed values:** `ATTENDED` | `NO_SHOW`

**Business rules enforced:**
- Event must be `ACTIVE` or `COMPLETED` to mark attendance
- Cannot mark attendance if user's registration status is `CANCELLED`

**Response `200`:** Updated registration object.

---

## Reviews

### `POST /api/events/:id/reviews`
Participant submits an event review and a host review (submitted together, stored as separate records).

**Auth:** `auth`

**Business rules enforced:**
- Event must be `COMPLETED`
- Requesting user's `attendanceStatus` must be `ATTENDED`
- User cannot have already submitted a review for this event

**Request body:**
```json
{
  "eventRating": 4,
  "eventComment": "Really fun, well organized",
  "hostRating": 5,
  "hostComment": "Nish was a great host"
}
```

Both `eventRating` and `hostRating` are required (1–5 integers).
Comments are optional (max 500 chars).

**Response `201`:**
```json
{
  "eventReview": {
    "id": "uuid",
    "rating": 4,
    "comment": "Really fun, well organized"
  },
  "hostReview": {
    "id": "uuid",
    "rating": 5,
    "comment": "Nish was a great host"
  }
}
```

---

### `GET /api/events/:id/reviews`
List all participant reviews for an event.

**Auth:** `public`

**Response `200`:**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "type": "EVENT",
      "rating": 4,
      "comment": "Great event",
      "reviewer": {
        "id": "uuid",
        "displayName": "User Name"
      },
      "createdAt": "2026-06-11T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/events/:id/registrations/:userId/review`
Host submits a review of a specific participant.

**Auth:** `host`

**Business rules enforced:**
- Event must be `COMPLETED`
- Target user must have `attendanceStatus` of `ATTENDED` or `NO_SHOW`
- Host cannot have already reviewed this participant for this event

**Request body:**
```json
{
  "rating": 5,
  "comment": "Great participant, showed up on time"
}
```

`rating` is required (1–5). `comment` is optional.

**Response `201`:** Participant review object.

---

### `GET /api/events/:id/registrations/:userId/review`
Get the host's review of a specific participant for this event.

**Auth:** `auth` (visible to the participant themselves, the host, and admins)

**Response `200`:** Participant review object or `404` if none exists.

---

## Users

### `GET /api/users/me`
Get the authenticated user's own full profile.

**Auth:** `auth`

**Response `200`:**
```json
{
  "id": "uuid",
  "displayName": "Nish",
  "email": "nish@example.com",
  "hostel": "A Block",
  "floor": 3,
  "hostRating": 4.5,
  "hostRatingCount": 10,
  "participantRating": 4.8,
  "participantRatingCount": 15,
  "eventsHosted": 5,
  "eventsAttended": 20,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### `PATCH /api/users/me`
Update own profile.

**Auth:** `auth`

**Request body** (all optional):
```json
{
  "displayName": "Nish",
  "hostel": "B Block",
  "floor": 2
}
```

**Response `200`:** Updated user profile object.

---

### `GET /api/users/:id`
Get a public user profile.

**Auth:** `public`

**Response `200`:** Public fields only (no email):
```json
{
  "id": "uuid",
  "displayName": "Nish",
  "hostel": "A Block",
  "floor": 3,
  "hostRating": 4.5,
  "hostRatingCount": 10,
  "participantRating": 4.8,
  "participantRatingCount": 15,
  "eventsHosted": 5,
  "eventsAttended": 20
}
```

---

### `GET /api/users/me/events`
Get the authenticated user's event history (both hosted and attending).

**Auth:** `auth`

**Query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `role` | string | `hosting` \| `attending` (default: both) |
| `status` | string | `UPCOMING` \| `ACTIVE` \| `COMPLETED` \| `CANCELLED` |

**Response `200`:**
```json
{
  "hosting": [ ...event objects... ],
  "attending": [
    {
      ...event object...,
      "attendanceStatus": "ATTENDED"
    }
  ]
}
```

---

### `GET /api/users/:id/events`
Get a user's public event history (attended events only, completed).

**Auth:** `public`

**Response `200`:** Array of completed public event objects.

---

## Reports

### `POST /api/reports`
Submit a report against an event or user.

**Auth:** `auth`

**Request body:**
```json
{
  "targetType": "EVENT",
  "targetId": "uuid",
  "reason": "FAKE_EVENT",
  "description": "This event does not appear to be real."
}
```

**Valid `reason` values:**
- For events: `FAKE_EVENT` | `SPAM` | `MISLEADING` | `INAPPROPRIATE` | `OTHER`
- For users: `HARASSMENT` | `ABUSE` | `REPEATED_NO_SHOW` | `MALICIOUS` | `OTHER`

**Business rules:**
- A user cannot report the same target more than once (return `409`)
- A user cannot report themselves

**Response `201`:**
```json
{
  "id": "uuid",
  "status": "PENDING",
  "createdAt": "2026-06-05T10:00:00Z"
}
```

---

## Admin

All admin endpoints require `admin` auth level. Return `403` for any non-admin caller.

---

### `GET /api/admin/reports`
List all reports.

**Auth:** `admin`

**Query parameters:** `status` (`PENDING` | `RESOLVED` | `DISMISSED`), `targetType` (`EVENT` | `USER`), `page`, `limit`

**Response `200`:**
```json
{
  "reports": [
    {
      "id": "uuid",
      "targetType": "EVENT",
      "targetId": "uuid",
      "reason": "FAKE_EVENT",
      "description": "...",
      "reportedBy": { "id": "uuid", "displayName": "User" },
      "status": "PENDING",
      "createdAt": "..."
    }
  ],
  "pagination": { ... }
}
```

---

### `PATCH /api/admin/reports/:id`
Resolve or dismiss a report.

**Auth:** `admin`

**Request body:**
```json
{
  "resolution": "ACTION_TAKEN",
  "adminNote": "Removed the event and warned the user."
}
```

**Valid `resolution` values:** `ACTION_TAKEN` | `DISMISSED`

**Response `200`:** Updated report object.

---

### `PATCH /api/admin/events/:id/status`
Override an event's status to any value.

**Auth:** `admin`

**Request body:**
```json
{
  "status": "CANCELLED",
  "reason": "Violated platform guidelines"
}
```

**Response `200`:** Updated event object.

---

### `DELETE /api/admin/events/:id`
Permanently remove an event from the platform.

**Auth:** `admin`

**Response `200`:**
```json
{
  "message": "Event removed."
}
```

---

### `GET /api/admin/users`
List all platform users.

**Auth:** `admin`

**Query parameters:** `banned` (boolean), `page`, `limit`, `q` (search by name/email)

**Response `200`:** Array of full user objects including email and ban status.

---

### `PATCH /api/admin/users/:id`
Ban or unban a user.

**Auth:** `admin`

**Request body:**
```json
{
  "banned": true,
  "reason": "Repeated abusive behaviour toward hosts"
}
```

**Response `200`:** Updated user object.

> A banned user should receive a `403` with `ACCOUNT_BANNED` on all authenticated endpoints.

---

## Cron / Scheduled Jobs

These are not HTTP endpoints but must be implemented as scheduled tasks (Vercel Cron or Supabase `pg_cron`).

### `[CRON] Transition event statuses`
Runs every minute (or every 5 minutes is fine for MVP).

**Logic:**
1. Set all `UPCOMING` events where `scheduledAt <= NOW()` to `ACTIVE`.
2. Set all `ACTIVE` events where `scheduledAt + duration <= NOW()` to `COMPLETED`.

> Since events currently have no `duration` field, consider adding one (in minutes) to the event creation form, or use a fixed default (e.g., 2 hours) for MVP.

---

*End of API Contract v0.1*
