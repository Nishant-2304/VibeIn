/**
 * Events Layout
 * Layout for event-related pages
 * Includes sidebar and navigation specific to events section
 */

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="events-layout">
      {/* Events sidebar/navigation would go here */}
      <main>{children}</main>
    </div>
  );
}
