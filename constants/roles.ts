/**
 * User Roles Constants
 * Defines different user roles in the system
 */

export const USER_ROLES = {
  ADMIN: "ADMIN",
  HOST: "HOST",
  USER: "USER",
  GUEST: "GUEST",
} as const;

export const ROLE_PERMISSIONS = {
  ADMIN: ["manage_users", "manage_events", "manage_reports", "view_analytics"],
  HOST: ["create_events", "manage_participants", "view_reviews"],
  USER: ["create_events", "register_events", "review_events"],
  GUEST: ["view_events"],
} as const;
