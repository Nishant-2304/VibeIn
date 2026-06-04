/**
 * Profile Layout
 * Layout for user profile pages
 * Includes profile navigation and settings menu
 */

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="profile-layout">
      {/* Profile navigation would go here */}
      <main>{children}</main>
    </div>
  );
}
