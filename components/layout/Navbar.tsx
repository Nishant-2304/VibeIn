"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Building2, Calendar, MessageSquare, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const isReviewPage = pathname.includes("/reviews");

  if (isReviewPage) return null;

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/hostels", icon: Building2, label: "Hostels" },
    { href: "/events", icon: Calendar, label: "Events" },
    { href: "/chat", icon: MessageSquare, label: "Chat" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#121212]/95 backdrop-blur-lg border-t border-white/10 px-6 py-3.5 flex items-center justify-between z-[80] shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center transition-all duration-200 ${
              isActive 
                ? "text-[#9b72cf] scale-110 -translate-y-0.5" 
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Icon className="w-6 h-6 stroke-[2.2]" />
            {/* Tiny active indicator dot */}
            {isActive && <span className="w-1 h-1 bg-[#9b72cf] rounded-full mt-1 absolute -bottom-1.5" />}
          </Link>
        );
      })}
    </nav>
  );
}
