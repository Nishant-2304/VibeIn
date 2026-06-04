/**
 * EventForm Component
 * Form for creating and editing events
 * Includes fields for title, description, date, location, etc.
 */

interface EventFormProps {
  event?: any;
  onSubmit?: (formData: any) => void;
  isLoading?: boolean;
}

export function EventForm({ event, onSubmit, isLoading }: EventFormProps) {
  return (
    <form className="event-form" onSubmit={(e) => {
      e.preventDefault();
      onSubmit?.({});
    }}>
      <div className="form-group">
        <label>Event Title</label>
        <input type="text" placeholder="Event title..." required />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea placeholder="Event description..." required />
      </div>
      <div className="form-group">
        <label>Date & Time</label>
        <input type="datetime-local" required />
      </div>
      <div className="form-group">
        <label>Location</label>
        <input type="text" placeholder="Location..." required />
      </div>
      <div className="form-group">
        <label>Max Participants</label>
        <input type="number" placeholder="Max participants..." />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Event"}
      </button>
    </form>
  );
}
