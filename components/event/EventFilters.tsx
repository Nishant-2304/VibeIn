/**
 * EventFilters Component
 * Filter component for events
 * Allows filtering by date, location, category, price range, etc.
 */

interface EventFiltersProps {
  onFiltersChange?: (filters: any) => void;
}

export function EventFilters({ onFiltersChange }: EventFiltersProps) {
  return (
    <div className="event-filters">
      <div className="filter-group">
        <label>Search</label>
        <input type="text" placeholder="Event name..." />
      </div>
      <div className="filter-group">
        <label>Date Range</label>
        <input type="date" />
      </div>
      <div className="filter-group">
        <label>Location</label>
        <input type="text" placeholder="City..." />
      </div>
      <div className="filter-group">
        <label>Category</label>
        <select>
          <option>All Categories</option>
          <option>Sports</option>
          <option>Music</option>
          <option>Art</option>
        </select>
      </div>
      <button onClick={() => onFiltersChange?.({})}>Apply Filters</button>
    </div>
  );
}
