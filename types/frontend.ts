// types/frontend.ts

export interface FrontendEvent {
  id: string;
  eventname: string;
  event_description: string;
  hostel_name: string;
  floor: number;
  room_no: string;
  host_id: string;
  event_time: string; // Stored as ISO string for Next.js Client Component hydration
  duration_minutes: number;
  max_attendees: number;
  event_status?: string;
  host_name?: string;
  theme_color?: 'purple' | 'blue' | 'orange' | 'red' | 'pink';
}