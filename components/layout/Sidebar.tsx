/**
 * Sidebar Component
 * Side navigation panel for easy access to main sections
 * Shown on dashboard and profile pages
 */

export function Sidebar() {
  return (
    <aside className="sidebar">
      <ul className="sidebar-menu">
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/profile">My Profile</a></li>
        <li><a href="/profile/events">My Events</a></li>
        <li><a href="/events">Browse Events</a></li>
        <li><a href="/reports">Reports</a></li>
      </ul>
    </aside>
  );
}
