// lib/constants.ts

export const DEFAULT_PFP_OPTIONS = ["😎", "🐱", "🚀", "🎨", "👾", "🧑‍💻", "🕵️‍♂️"];

// Boys' hostels and girls' hostels are the canonical lists used by:
//   - onboarding (hostel dropdown, gated on gender)
//   - profile edit (hostel dropdown, scoped to user's stored gender)
//   - event create (hostel dropdown, scoped to host's gender)
//   - event edit (hostel dropdown, scoped to host's gender)
//   - server-side filter on GET /api/events (scoped to viewer's gender)
//
// The Prisma schema stores `hostel_name` as a free-text string, so these
// lists are the only source of truth for which values are pickable and
// which values are surfaced by the gender-aware feed filter.

export const BOYS_HOSTELS = [
  "A",
  "B",
  "B Annex",
  "C",
  "D",
  "D Annex",
  "E",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "Q",
  "R",
  "T",
] as const;

export const GIRLS_HOSTELS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "E Annex",
  "F",
  "G",
  "H",
  "J",
  "S",
  "RGT",
] as const;

export function getHostelsForGender(
  gender: "MALE" | "FEMALE" | null | undefined
): string[] {
  if (gender === "MALE") return [...BOYS_HOSTELS];
  if (gender === "FEMALE") return [...GIRLS_HOSTELS];
  return [];
}
