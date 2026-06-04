**Version:** 0.1  
**Status:** Draft  
**Authors:** Nishant
**Last Updated:** June 2026

---

# 1. Vision & Problem Statement

## Vision

VibeIn aims to become the default platform for discovering, hosting, and joining student-led events inside hostels.

The platform focuses on removing the friction between:

- People who want to organize activities.
    
- People who want to participate in activities.
    
- People who don't know what is happening around them.
    

The long-term goal is to create a lightweight social layer for hostel life, where students can quickly discover events happening around them and participate without relying on scattered WhatsApp groups, Instagram stories, or word-of-mouth communication.

---

## Core Problem

In most hostels:

- Events are organized informally.
    
- Discovery is inconsistent.
    
- Students often hear about events after they are already over.
    
- Hosts struggle to gather participants.
    
- Interested students have no centralized place to find activities.
    

Examples:

- Someone wants to host Poker Night.
    
- Someone wants to organize a FIFA tournament.
    
- Someone wants to start a study session.
    
- Someone wants to gather people for a movie night.
    

Currently these activities are usually spread through:

- WhatsApp groups
    
- Instagram stories
    
- Discord servers
    
- Personal friend circles
    

This causes:

- Low visibility
    
- Low participation
    
- Fragmented communities
    
- Poor event discovery
    

---

## Proposed Solution

Create a centralized event marketplace specifically designed for hostel communities.

Users should be able to:

- Discover events nearby.
    
- Filter events based on hostel and floor.
    
- Register for events.
    
- View event information.
    
- Rate hosts.
    
- Build trust through reputation.
    

Hosts should be able to:

- Create events.
    
- Track registrations.
    
- Manage participants.
    
- Build credibility over time.
    

---

## Design Philosophy

The platform should be:

### Simple

The product should require minimal learning.

A first-time user should understand the platform within seconds.

---

### Fast

Creating and joining events should take less than a minute.

---

### Community Driven

The platform succeeds only if users actively create and attend events.

---

### Trust-Based

Users should gradually build reputation through:

- Hosting events
    
- Attending events
    
- Reviews
    
- Ratings
    

---

### Mobile Friendly

Most usage is expected to happen through phones.

Desktop support is important but not the primary focus.

---

## Success Criteria

The product is successful if:

- Students consistently discover events through the platform.
    
- Hosts can reliably find participants.
    
- Repeat usage increases over time.
    
- Reputation becomes meaningful.
    
- Event participation grows organically.
    

---

## Non Goals (For MVP)

The first version is NOT trying to become:

- A social network
    
- A messaging platform
    
- A professional networking platform
    
- An event ticketing platform
    
- A payment platform
    

The focus is strictly:

> Discover → Register → Attend → Review

Everything else is secondary.

---

# 2. Product Requirements Document (PRD)

## Target Audience

Primary users:

- Hostel residents
    
- University students
    
- Student clubs
    
- Informal event organizers
    

---

## Core User Types

### Guests

Users who have not logged in.

### Registered Users

Users who have authenticated through the platform.

### Hosts

Registered users who create events.

### Administrators

Moderators responsible for platform safety and management.

---

## Guest Experience

Guests should be able to:

- Browse events.
    
- Search events.
    
- Filter events.
    
- View event details.
    

Guests should NOT be able to:

- Register for events.
    
- Host events.
    
- View exact event locations.
    
- Rate events.
    
- Rate hosts.
    
- Rate participants.
    

---

## User Experience

After login users should be able to:

- Register for events.
    
- View exact locations.
    
- Manage their profile.
    
- View host information.
    
- Submit reviews.
    
- View their participation history.
    

---

## Host Experience

Hosts should be able to:

- Create events.
    
- Edit events.
    
- Cancel events.
    
- View registrations.
    
- Manage attendees.
    
- Track participation.
    
- Rate participants.
    
- Build host reputation.
    

---

## Administrator Experience

Administrators should be able to:

- Remove inappropriate events.
    
- Ban malicious users.
    
- Resolve reports.
    
- Moderate platform activity.
    

---

## Event Lifecycle

Every event must belong to one of the following states:

---

### UPCOMING

Event has been created but has not started.

Users can:

- Discover
    
- Register
    
- View details
    

---

### ACTIVE

Event is currently happening.

Registration may be restricted depending on future implementation.

---

### COMPLETED

Event has ended.

Reviews become available.

Ratings become available.

---

### CANCELLED

Event has been terminated by:

- Host
    
- Administrator
    

Users cannot register.

Reviews remain disabled.

---

## Event Discovery

Users should be able to browse events through:

### Hostel Filter

Examples:

- A Block
    
- B Block
    
- C Block
    

---

### Floor Filter

Examples:

- Floor 1
    
- Floor 2
    
- Floor 3
    

---

### Status Filter

Examples:

- Upcoming
    
- Active
    
- Completed
    

---

### Search

Examples:

- Poker
    
- FIFA
    
- Movie Night
    

---

## Registration Rules

Users must be authenticated.

Guests cannot register.

Users can:

- Register
    
- Cancel registration
    

A user can only register once for the same event.

Registration closes when:

- Event is full
    
- Event is cancelled
    

---

## Attendance System

Attendance status can be:

- Registered
    
- Attended
    
- No Show
    
- Cancelled
    

Attendance records are important because:

- Reviews depend on attendance.
    
- Reputation depends on attendance.
    
- Analytics depend on attendance.
    

---

## Review System

Reviews unlock only after event completion.

The review system consists of:

### Event Reviews

Participant → Event

---

### Host Reviews

Participant → Host

---

### Participant Reviews

Host → Participant

---

# 3. User Roles & Permission System

## Guest

Permissions:

✅ View event list

✅ Search events

✅ Filter events

✅ View basic event details

❌ Register for event

❌ Create event

❌ View room number

❌ Review anything

❌ Access participant information

---

## Registered User

Permissions:

✅ All guest permissions

✅ Register for events

✅ Cancel registration

✅ View exact location

✅ Review event

✅ Review host

✅ View own profile

---

## Host

Permissions:

✅ All registered user permissions

✅ Create event

✅ Edit own event

✅ Cancel own event

✅ View registrations

✅ Manage attendance

✅ Review participants

---

## Administrator

Permissions:

✅ Full platform visibility

✅ Remove events

✅ Ban users

✅ Resolve reports

✅ Override event states

✅ Moderate platform activity

---

# 4. User Flows

This section describes how users interact with the platform from start to finish.

---

## Flow 1: Event Discovery (Guest)

### Objective

Allow users to discover events without requiring login.

---
### Steps

1. User opens platform.
    
2. User lands on homepage.
    
3. User sees list of available events.
    
4. User can:
    
    - Search events.
        
    - Filter events.
        
    - Open event details.
        
5. User can see:
    
    - Event name.
        
    - Description.
        
    - Hostel.
        
    - Floor.
        
    - Host information.
        
    - Available spots.
        
6. User cannot see:
    
    - Exact room number.
        
    - Participant list.
        
    - Registration options.
        

---
### Expected Outcome

Users can evaluate whether an event interests them before creating an account.

---

## Flow 2: User Registration

### Objective

Allow users to create an account.

---
### Steps

1. User clicks Login.
    
2. User authenticates using:
    
    - Google OAuth
        
    - Email authentication
        
3. Platform creates user profile.
    
4. User is redirected back.
    
---
### Expected Outcome

User becomes eligible to:

- Register for events.
    
- Host events.
    
- Leave reviews.
    

---

## Flow 3: Registering For Event

### Objective

Allow registered users to join an event.

---
### Steps

1. User opens event page.
    
2. User clicks Register.
    
3. Backend verifies:
    
    - User authenticated.
        
    - Event exists.
        
    - Event not cancelled.
        
    - Event not full.
        
    - User not already registered.
        
4. Registration record created.
    
5. Event attendee count updated.
    

---

### Expected Outcome

User becomes participant of the event.

---

## Flow 4: Hosting An Event

### Objective

Allow users to create events.

---
### Steps

1. User clicks Create Event.
    
2. User enters:
    
    - Event name
        
    - Description
        
    - Hostel
        
    - Floor
        
    - Room number
        
    - Time
        
    - Maximum attendees
        
3. Event created.
    
4. Event appears in discovery feed.
    

---

### Expected Outcome

Users can discover and join hosted event.

---

## Flow 5: Event Completion

### Objective

Transition event into review phase.

---

### Steps

1. Event reaches completion (either by time or via host).
    
2. Status changes to COMPLETED.
    
3. Reviews become available.
    
4. Ratings become available.
    

---

### Expected Outcome

Trust and reputation systems activate.

---

## Flow 6: Reviewing Event

### Objective

Allow participants to provide feedback.

---

### Steps

1. User attends event.
    
2. Event completes.
    
3. User (participant) submits:
    
    - Event rating
        
    - Host rating 
4. Reviews saved.
    
5. Aggregate ratings updated.
    

---

## Flow 7: Reviewing Participant

### Objective

Allow hosts to evaluate participants.

---
### Steps

1. Host views attendees.
    
2. Host selects participant.
    
3. Host leaves rating.
    
4. Participant reputation updated.
    

---

## Flow 8: Reporting Abuse

### Objective

Allow community moderation.

---

### Reportable Targets

#### Events

Examples:

- Fake event
    
- Spam event
    
- Misleading event
    

---

#### Users

Examples:

- Harassment
    
- Abuse
    
- Repeated no-shows
    
- Malicious behavior
    

---

# 5. Feature Specifications

---

## Event Discovery System

### Purpose

Help users find relevant events quickly.

---

### Features

#### Event Feed

Shows:

- Upcoming events
    
- Active events
    

---

#### Search

Search by:

- Event title
    
- Keywords
    

---

#### Filters

Filter by:

- Hostel
    
- Floor
    
- Event status
    

---

#### Sorting (Future)

Sort by:

- Latest
    
- Most popular
    
- Highest rated
    

---

## Event Hosting System

### Purpose

Allow users to organize activities.

---

### Features

####  Event Creation

Host can define:

- Name
    
- Description
    
- Time
    
- Capacity
    
- Location
    

---

####  Event Editing

Host can modify:

- Description
    
- Time
    
- Capacity
    

Restrictions may apply after registrations begin.

---

####  Event Cancellation

Host may cancel event.

Participants should be informed.

---

## Registration System

### Purpose

Track participation.

---

### Features

####  Join Event

User becomes participant.

---

####  Leave Event

User removes registration.

---

####  Attendance Tracking

Possible states:

- Registered
    
- Attended
    
- No Show
    
- Cancelled
    

---

## Review System

### Event Review

Participant → Event

---

### Host Review

Participant → Host

---

### Participant Review

Host → Participant

---

### Rating Scale

Current design:

1–5 stars

Later: adding a text/subjective review

---

## User Profile System

Each profile displays:

- Name
    
- Hostel
    
- Floor
    
- Host rating
    
- Participant rating
    
- Events attended
    
- Events hosted
    

---

## Reporting System

Users can report:

- Events
    
- Users
    

Reports should contain:

- Reason
    
- Description
    
- Timestamp
    

---

# 6. Business Rules

This section defines rules that must always remain true.

---

## Event Rules

### Event Capacity

Current attendees cannot exceed maximum attendees.

---

###  Event Ownership

Every event must have exactly one host.

---

###  Event Status Rules

Only one status at a time.

Valid statuses:

- UPCOMING
    
- ACTIVE
    
- COMPLETED
    
- CANCELLED
    

---

## Registration Rules

Users must be authenticated.

Guests cannot register.

---

Users may only register once per event.

---

Cancelled events cannot accept registrations.

---

Full events cannot accept registrations.

---

## Review Rules

Reviews unlock only after event completion.

---

Only participants may review:

- Event
    
- Host
    

---

Only hosts may review:

- Participants
    

---

Users may review an event only once.

---

Users may review a host only once per event.

---

Hosts may review participants only once per event.

---

## Location Privacy Rules

Guests cannot view room number.

---

Authenticated users can view room number.

---

## Reputation Rules

Host Rating is independent of Participant Rating.

A user may be:

- Excellent host
    
- Poor participant
    

or vice versa.

---

## Moderation Rules

Administrators may:

- Remove events
    
- Ban users
    
- Resolve reports
    

---

# 7. Technical Architecture Overview

This section describes the planned technical stack.

---

## Frontend

### Framework

Next.js

---

### Styling

TailwindCSS

---

### Responsibilities

Frontend handles:

- Rendering UI
    
- User interaction
    
- Authentication state
    
- API communication
    

---

## Backend

### Framework

Next.js Backend Routes

---

### Responsibilities

Backend handles:

- Business logic
    
- Authorization
    
- Validation
    
- Database interaction
    
- Review calculations
    

---

## Database

### ER Diagram
https://app.eraser.io/workspace/JeaDmbwuGf3UoJgeNiq9?origin=share

### Engine

PostgreSQL

---

### Provider

Supabase

---

### Responsibilities

Stores:

- Users
    
- Events
    
- Participation
    
- Reviews
    
- Reports
    

---

## Authentication

### Provider

Supabase Auth

---

### Supported Methods

- Google OAuth
    
- Email Authentication
    

---

### Responsibilities

Authentication provider handles:

- Login
    
- Signup
    
- Sessions
    
- JWT generation
    

---

Application backend handles:

- Permissions
    
- Authorization
    
- User ownership checks
    

---

## Realtime Layer

### Technology

Supabase Realtime

---

### Planned Uses

Potential future features:

- Event chat
    
- Live attendee count
    
- Notifications
    

---

## Deployment (Current Assumption)

Frontend:

- Vercel
    

Backend:

- Vercel
    

Database:

- Supabase
    

---

## Future Roadmap

### Phase 1 — MVP

- Authentication
    
- Event discovery
    
- Event hosting
    
- Registration
    
- Reviews
    
- Reporting
    

---

### Phase 2

- Realtime chat
    
- Notifications
    
- Better search
    

---

### Phase 3

- Analytics
    
- Event recommendations
    
- Reputation improvements
    

---

### Phase 4

- Cross-hostel events
    
- Club integrations
    
- Verification systems
    

---