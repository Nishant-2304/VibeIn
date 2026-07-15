import "./globals.css";
import { BottomNav } from "../components/layout/Navbar";

export const metadata = {
  title: "VibeIn",
  description: "Discover what's happening in your block.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="h-dvh overflow-hidden bg-black text-white antialiased selection:bg-[#9b72cf] selection:text-black">
        <div className="app-shell mx-auto flex h-dvh max-h-dvh max-w-md flex-col overflow-hidden bg-[#121212] border-x border-white/10 relative shadow-2xl">
          <div className="app-content flex-1 min-h-0 overflow-y-auto overscroll-contain pb-36">
            {children}
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
