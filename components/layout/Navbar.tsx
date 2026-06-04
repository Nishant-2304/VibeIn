/**
 * Navbar Component
 * Navigation bar displayed at the top of the application
 * Shows logo, navigation links, and user menu
 */

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">VibeIn</div>
      <div className="navbar-links">
        <a href="/">Home</a>
        <a href="/events">Events</a>
        <a href="/profile">Profile</a>
      </div>
      <div className="navbar-user">
        {/* User menu or login button */}
      </div>
    </nav>
  );
}
