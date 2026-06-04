/**
 * EventCard Component
 * Card component displaying event summary
 * Shows title, date, location, host, and preview image
 */

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  host: string;
  image?: string;
  attendees?: number;
}

export function EventCard({
  id,
  title,
  date,
  location,
  host,
  image,
  attendees,
}: EventCardProps) {
  return (
    <div className="event-card">
      {image && <img src={image} alt={title} className="event-image" />}
      <h3>{title}</h3>
      <p className="event-date">{date}</p>
      <p className="event-location">{location}</p>
      <p className="event-host">by {host}</p>
      {attendees && <p className="event-attendees">{attendees} attending</p>}
      <a href={`/events/${id}`} className="event-link">View Details</a>
    </div>
  );
}
