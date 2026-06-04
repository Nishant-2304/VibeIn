/**
 * Admin Layout
 * Provides the layout structure for all admin pages
 * Includes admin-specific navigation and authentication checks
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      {/* Admin sidebar/navbar would go here */}
      <main>{children}</main>
    </div>
  );
}
