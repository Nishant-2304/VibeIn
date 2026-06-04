/**
 * Report Reasons Constants
 * Defines valid reasons for submitting reports
 */

export const REPORT_REASONS = {
  INAPPROPRIATE_CONTENT: "INAPPROPRIATE_CONTENT",
  HARASSMENT: "HARASSMENT",
  FRAUD: "FRAUD",
  SPAM: "SPAM",
  VIOLATION: "VIOLATION",
  OTHER: "OTHER",
} as const;

export const REPORT_REASONS_LABELS = {
  INAPPROPRIATE_CONTENT: "Inappropriate Content",
  HARASSMENT: "Harassment",
  FRAUD: "Fraud",
  SPAM: "Spam",
  VIOLATION: "Community Violation",
  OTHER: "Other",
} as const;

export const REPORT_REASONS_DESCRIPTIONS = {
  INAPPROPRIATE_CONTENT:
    "The event or user content is inappropriate or offensive",
  HARASSMENT: "The user or event is harassing or threatening",
  FRAUD: "This appears to be a scam or fraudulent activity",
  SPAM: "This is spam or unwanted commercial content",
  VIOLATION: "This violates community guidelines",
  OTHER: "Other reason (please specify in description)",
} as const;
