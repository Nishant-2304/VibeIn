# VibeIn

VibeIn is a hostel-centered event management platform designed to help students discover, host, and join activities in their community.

## Overview

- **Discover events** happening around your hostel.
- **Create and manage events** with simple host workflows.
- **Register and participate** in activities with a centralized experience.
- **Rate and review** hosts and events to build trust.
- **Admin tools** for moderation and platform health.

## Repo Structure

Key directories:

- `app/` - Next.js application pages, layouts, and API routes
- `components/` - Reusable UI and page components
- `services/` - Business logic layer
- `repositories/` - Data access / persistence layer
- `validators/` - Request and input validation logic
- `middleware/` - Authentication and authorization helpers
- `lib/` - Shared utilities and client helpers
- `types/` - TypeScript type definitions
- `constants/` - Shared application constants
- `utils/` - Generic helper functions
- `prisma/` - Prisma schema and migrations

## Important Files

- `PLAN.md` - Product vision, problem statement, and design plan
- `API Endpoints.md` - API route documentation
- `.env.example` - Environment variable template
- `package.json` - pnpm project metadata and scripts
- `.npmrc` - pnpm package manager configuration

## Development Setup

This project uses **pnpm** as the package manager.

### Install dependencies

```bash
pnpm install
```

### Local development

```bash
pnpm dev
```

### Build for production

```bash
pnpm build
```

### Start production server

```bash
pnpm start
```

## Database Setup

Configure your database connection in `.env.local` based on `.env.example`.

```bash
cp .env.example .env.local
```

Then run:

```bash
pnpm prisma generate
pnpm prisma migrate dev
```

## Notes

- The app currently uses a Next.js `app/` router structure.
- Many pages and route handlers are scaffolded with placeholder content.
- API and backend logic may still need to be implemented and wired to real services.

## Recommended Next Steps

1. Populate `.env.local` with your configuration.
2. Run `pnpm install`.
3. Run `pnpm dev` and verify the app starts.
4. Review `PLAN.md` for product strategy and next feature priorities.
