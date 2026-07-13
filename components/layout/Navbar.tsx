"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, Building2, Calendar, MessageSquare, User } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

export function BottomNav() {
  const pathname = usePathname();
  const isReviewPage = pathname.includes("/reviews");
  const [showGuestBanner, setShowGuestBanner] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setShowGuestBanner(!session);
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setShowGuestBanner(!session);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (
    isReviewPage ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/hostels", icon: Building2, label: "Hostels" },
    { href: "/events", icon: Calendar, label: "Events" },
    { href: "/chat", icon: MessageSquare, label: "Chat" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] mx-auto w-full max-w-md px-0 pb-0">
      {showGuestBanner && (
        <div className="mb-2 rounded-2xl border border-[#9b72cf]/35 bg-[#18131f]/95 px-3 py-2.5 shadow-[0_6px_24px_rgba(155,114,207,0.18)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-gray-200">Sign in to create/join events</p>
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center rounded-full bg-[#c8aaf5] px-3 py-1.5 text-[11px] font-black text-[#2c124d] transition active:scale-[0.98]"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      <nav className="bg-[#121212]/95 backdrop-blur-lg border border-white/10 rounded-t-2xl px-6 py-3.5 flex items-center justify-between shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center transition-all duration-200 ${
                isActive
                  ? "text-[#9b72cf] scale-110 -translate-y-0.5"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="h-6 w-6 stroke-[2.2]" />
              {isActive && <span className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-[#9b72cf]" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
