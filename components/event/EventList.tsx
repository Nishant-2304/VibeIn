/**
 * EventList Component
 * Displays list of multiple event cards
 * Supports filtering, sorting, and pagination
 */

interface EventListProps {
  events: Array<any>;
  loading?: boolean;
  onEventClick?: (id: string) => void;
}

export function EventList({ events, loading, onEventClick }: EventListProps) {
  if (loading) return <div>Loading events...</div>;

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
