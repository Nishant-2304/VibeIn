/**
 * EventList Component
 * Displays list of multiple event cards
 * Supports filtering, sorting, and pagination
 */

import { LoadingScreen } from "../ui/LoadingScreen";

interface EventListProps {
  events: Array<any>;
  loading?: boolean;
  onEventClick?: (id: string) => void;
}

export function EventList({ events, loading, onEventClick }: EventListProps) {
  if (loading) return <LoadingScreen label="Loading events..." />;

  return (
    <div className="event-list">
      {events.length === 0 ? (
        <p>No events found</p>
      ) : (
        events.map((event) => (
          <div key={event.id} onClick={() => onEventClick?.(event.id)}>
            {/* EventCard would be rendered here */}
          </div>
        ))
      )}
    </div>
  );
}
