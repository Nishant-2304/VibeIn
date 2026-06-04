/**
 * Root Layout
 * Main layout wrapper for the entire application
 * Includes global styles and shared components like Navbar and Footer
 */

export const metadata = {
  title: "VibeIn - Event Management Platform",
  description: "Connect, discover, and attend amazing events",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Global Navigation */}
        {/* <Navbar /> */}
        <main>{children}</main>
        {/* Global Footer */}
        {/* <Footer /> */}
      </body>
    </html>
  );
}
