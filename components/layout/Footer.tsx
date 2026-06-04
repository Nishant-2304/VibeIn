/**
 * Footer Component
 * Footer displayed at the bottom of the application
 * Shows links, copyright, and contact information
 */

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; 2024 VibeIn. All rights reserved.</p>
        <ul className="footer-links">
          <li><a href="/about">About</a></li>
          <li><a href="/privacy">Privacy Policy</a></li>
          <li><a href="/terms">Terms of Service</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </div>
    </footer>
  );
}
