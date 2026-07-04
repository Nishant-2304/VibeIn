"use client";

import { usePathname } from "next/navigation";

type SkeletonBlockProps = {
  className?: string;
};

function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-white/10 shadow-sm ${className}`}
      aria-hidden="true"
    />
  );
}

function HeaderSkeleton({ back = false }: { back?: boolean }) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3">
        {back && <SkeletonBlock className="h-10 w-10 rounded-full" />}
        <SkeletonBlock className="h-9 w-24 rounded-xl" />
      </div>
      <SkeletonBlock className="h-10 w-10 rounded-full bg-white/20" />
    </div>
  );
}

export function EventCardSkeleton({
  compact = false,
  showAvatars = true,
}: {
  compact?: boolean;
  showAvatars?: boolean;
}) {
  return (
    <article
      className={`w-full rounded-[24px] border border-white/5 bg-[#1e1e1e] p-5 ${
        compact ? "min-h-[148px]" : "min-h-[184px]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonBlock className="h-4 w-20 rounded-full bg-white/15" />
          <SkeletonBlock className="h-7 w-4/5 rounded-xl" />
          <SkeletonBlock className="h-4 w-2/3 rounded-xl" />
        </div>
        <SkeletonBlock className="h-12 w-16 rounded-2xl bg-white/15" />
      </div>
      {!compact && (
        <div className="mt-7 space-y-3">
          <SkeletonBlock className="h-3 w-full rounded-xl" />
          <SkeletonBlock className="h-3 w-3/4 rounded-xl" />
        </div>
      )}
      <div className="mt-6 flex items-center justify-between">
        {showAvatars ? (
          <div className="flex -space-x-2">
            <SkeletonBlock className="h-8 w-8 rounded-full bg-white/15" />
            <SkeletonBlock className="h-8 w-8 rounded-full bg-white/15" />
            <SkeletonBlock className="h-8 w-8 rounded-full bg-white/15" />
          </div>
        ) : (
          <SkeletonBlock className="h-4 w-24 rounded-xl bg-white/15" />
        )}
        <SkeletonBlock className="h-10 w-24 rounded-xl bg-white/15" />
      </div>
    </article>
  );
}

export function EventListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <main className="flex min-h-screen flex-1 flex-col bg-[#121212] px-5 pb-32 pt-6">
      <HeaderSkeleton />

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <SkeletonBlock className="h-8 w-40 rounded-xl" />
          <SkeletonBlock className="h-4 w-14 rounded-full" />
        </div>
        <div className="-mx-5 flex gap-4 overflow-hidden px-6 pb-4 pt-1">
          <div className="w-[82vw] max-w-[320px] shrink-0">
            <EventCardSkeleton showAvatars={false} />
          </div>
          <div className="w-[82vw] max-w-[320px] shrink-0 opacity-70">
            <EventCardSkeleton showAvatars={false} />
          </div>
        </div>
      </section>

      <section className="mt-3">
        <div className="mb-4 flex items-center justify-between">
          <SkeletonBlock className="h-8 w-32 rounded-xl" />
          <div className="flex gap-2 rounded-full bg-white/5 px-2.5 py-1.5">
            <SkeletonBlock className="h-2 w-4 rounded-full bg-white/20" />
            <SkeletonBlock className="h-2 w-2 rounded-full bg-white/20" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <EventCardSkeleton showAvatars={false} />
          <EventCardSkeleton showAvatars={false} />
        </div>
      </section>
    </main>
  );
}

export function EventsPageSkeleton() {
  return (
    <main className="flex min-h-screen flex-1 flex-col bg-[#121212] px-5 pb-28 pt-6">
      <SkeletonBlock className="mb-6 h-[54px] w-full rounded-full bg-white/90" />
      <div className="mb-5 space-y-2">
        <SkeletonBlock className="h-9 w-48 rounded-xl" />
        <SkeletonBlock className="h-4 w-64 max-w-full rounded-xl" />
      </div>
      <EventListSkeleton count={4} />
    </main>
  );
}

export function EventDetailSkeleton() {
  return (
    <main className="min-h-screen bg-[#121212] text-white">
      <section className="relative h-[280px] overflow-hidden bg-[#1e1e1e]">
        <SkeletonBlock className="absolute left-5 top-6 h-11 w-11 rounded-full bg-white/15" />
        <SkeletonBlock className="absolute bottom-4 right-4 h-8 w-28 rounded-full bg-white/15" />
      </section>
      <div className="px-5 pb-10 pt-5">
        <SkeletonBlock className="h-10 w-4/5 rounded-xl" />
        <div className="mt-4 space-y-3">
          <SkeletonBlock className="h-4 w-full rounded-xl" />
          <SkeletonBlock className="h-4 w-5/6 rounded-xl" />
        </div>
        <div className="mt-7 space-y-4">
          <InfoRowSkeleton />
          <InfoRowSkeleton />
        </div>
        <SkeletonBlock className="mt-8 h-36 w-full rounded-[24px] bg-white/15" />
        <SkeletonBlock className="mt-8 h-14 w-full rounded-2xl bg-[#c8aaf5]/30" />
      </div>
    </main>
  );
}

function InfoRowSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <SkeletonBlock className="h-10 w-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-2/5 rounded-xl" />
        <SkeletonBlock className="h-3 w-1/3 rounded-xl" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center overflow-hidden bg-[#121212] px-5 pb-32 pt-6">
      <div className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-[#9b72cf]/70 to-transparent" />
      <div className="z-10 w-full">
        <HeaderSkeleton />
      </div>
      <SkeletonBlock className="z-10 mt-8 h-28 w-28 rounded-full bg-white/15" />
      <SkeletonBlock className="z-10 mt-5 h-9 w-44 rounded-xl" />
      <SkeletonBlock className="z-10 mt-3 h-4 w-40 rounded-xl" />
      <div className="z-10 mt-8 grid w-full grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-[104px] rounded-2xl bg-white/10" />
        ))}
      </div>
      <SkeletonBlock className="z-10 mt-8 h-44 w-full rounded-3xl bg-white/10" />
    </main>
  );
}

export function FormPageSkeleton({ titleWidth = "w-40" }: { titleWidth?: string }) {
  return (
    <main className="min-h-screen bg-[#121212] px-5 py-6 text-white">
      <header className="flex items-center gap-4">
        <SkeletonBlock className="h-10 w-10 rounded-full" />
        <SkeletonBlock className={`h-8 ${titleWidth} rounded-xl`} />
      </header>
      <section className="mt-8 space-y-5">
        <SkeletonBlock className="mx-auto h-24 w-24 rounded-full bg-white/15" />
        <SkeletonBlock className="h-20 w-full rounded-2xl" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonBlock className="h-3 w-28 rounded-full" />
            <SkeletonBlock className="h-12 w-full rounded-xl bg-white/10" />
          </div>
        ))}
      </section>
    </main>
  );
}

export function ParticipantsSkeleton() {
  return (
    <main className="min-h-screen bg-black px-5 py-6 text-white">
      <header className="flex items-center gap-4">
        <SkeletonBlock className="h-11 w-11 rounded-full" />
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-32 rounded-xl" />
          <SkeletonBlock className="h-3 w-20 rounded-xl" />
        </div>
      </header>
      <SkeletonBlock className="mt-6 h-24 w-full rounded-2xl" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <section className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-28 w-full rounded-2xl bg-white/15" />
        ))}
      </section>
    </main>
  );
}

export function RouteSkeleton() {
  const pathname = usePathname();

  if (pathname?.startsWith("/login")) return null;
  if (pathname?.startsWith("/events/") && pathname.includes("/participants")) {
    return <ParticipantsSkeleton />;
  }
  if (pathname?.startsWith("/events/") && pathname.includes("/edit")) {
    return <FormPageSkeleton titleWidth="w-32" />;
  }
  if (pathname?.startsWith("/events/")) return <EventDetailSkeleton />;
  if (pathname?.startsWith("/events")) return <EventsPageSkeleton />;
  if (pathname?.startsWith("/profile/edit")) return <FormPageSkeleton />;
  if (pathname?.startsWith("/profile/events")) return <EventsPageSkeleton />;
  if (pathname?.startsWith("/profile")) return <ProfileSkeleton />;

  return <HomeSkeleton />;
}
