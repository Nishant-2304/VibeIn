import Link from "next/link";
import { ArrowLeft, Hammer, Sparkles } from "lucide-react";

type UnderConstructionPageProps = {
  title: string;
  kicker: string;
  note: string;
};

export function UnderConstructionPage({
  title,
  kicker,
  note,
}: UnderConstructionPageProps) {
  return (
    <main className="flex-1 relative bg-[#121212] min-h-screen px-5 pt-6 pb-32 flex flex-col select-none overflow-hidden font-sans">
      <div className="absolute top-0 left-0 right-0 h-[320px] bg-gradient-to-b from-[#9b72cf] to-transparent pointer-events-none" />

      <div className="relative z-10 w-full flex items-center justify-between mb-12">
        <Link
          href="/"
          className="p-2 -ml-2 text-white/90 hover:text-white active:scale-95 transition"
          aria-label="Go home"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
        </Link>

        <span
          style={{ fontFamily: "'Jaro', sans-serif" }}
          className="text-3xl font-black tracking-wide text-white"
        >
          VibeIn
        </span>

        <div className="w-10" />
      </div>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-[#1e1e1e] shadow-[0_18px_60px_rgba(155,114,207,0.25)]">
          <Hammer className="h-11 w-11 text-[#c8aaf5] stroke-[2.4]" />
        </div>

        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#f0dc89]">
          <Sparkles className="h-3.5 w-3.5" />
          {kicker}
        </p>

        <h1 className="font-display max-w-sm text-4xl font-black leading-tight tracking-wide text-white">
          {title}
        </h1>

        <p className="mt-4 max-w-xs text-sm font-medium leading-6 text-gray-300">
          This page is under construction and will be live soon. The dev team is
          locked in.
        </p>

        <p className="mt-3 max-w-xs text-xs font-medium leading-5 text-gray-500">
          {note}
        </p>

        <div className="mt-9 grid w-full max-w-xs grid-cols-2 gap-3">
          <Link
            href="/events"
            className="rounded-2xl bg-[#c8aaf5] px-4 py-3 text-center text-sm font-black text-[#2c124d] shadow-[0_4px_20px_rgba(200,170,245,0.25)] transition active:scale-[0.98]"
          >
            Events
          </Link>
          <Link
            href="/profile"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/15 active:scale-[0.98]"
          >
            Profile
          </Link>
        </div>
      </section>

      <p className="relative z-10 mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
        By EZZ
      </p>
    </main>
  );
}
