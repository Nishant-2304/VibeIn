/**
 * Dashboard Layout
 * Layout for dashboard pages
 * Includes sidebar and user-specific navigation
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout">
      {/* Dashboard sidebar would go here */}
      <main>{children}</main>
    </div>
  );
}
