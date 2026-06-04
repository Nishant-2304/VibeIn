/**
 * Attendance Status Constants
 * Defines different attendance states for registrations
 */

export const ATTENDANCE_STATUS = {
  REGISTERED: "REGISTERED",
  CONFIRMED: "CONFIRMED",
  ATTENDED: "ATTENDED",
  NO_SHOW: "NO_SHOW",
  CANCELLED: "CANCELLED",
} as const;

export const ATTENDANCE_STATUS_LABELS = {
  REGISTERED: "Registered",
  CONFIRMED: "Confirmed",
  ATTENDED: "Attended",
  NO_SHOW: "No Show",
  CANCELLED: "Cancelled",
} as const;
