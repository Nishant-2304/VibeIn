import "./globals.css";
import { BottomNav } from "../components/layout/Navbar";

export const metadata = {
  title: "UibeIn",
  description: "Discover what's happening in your block.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black min-h-screen text-white antialiased selection:bg-[#9b72cf] selection:text-black">
        <div className="mx-auto max-w-md min-h-screen bg-[#121212] border-x border-white/10 relative pb-24 shadow-2xl flex flex-col">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}