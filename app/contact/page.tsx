"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";

const SUPPORT_EMAIL = "support@e-zz.io";

export default function ContactPage() {
  const [subject, setSubject] = useState("VibeIn Support Request");
  const [message, setMessage] = useState("");

  const mailtoHref = useMemo(() => {
    const body = [
      "Hi VibeIn Team,",
      "",
      message.trim() || "[Write your bug report or feedback here]",
    ].join("\n");

    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject.trim() || "VibeIn Support Request")}&body=${encodeURIComponent(body)}`;
  }, [message, subject]);

  const handleSendEmail = () => {
    window.location.href = mailtoHref;
  };

  return (
    <main className="min-h-[calc(100%+6rem)] -mb-24 bg-black px-5 pt-6 pb-32 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <div className="flex items-center justify-between">
          <Link href="/profile" aria-label="Back to profile" className="inline-flex text-[#b792ea]">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-[22px] font-extrabold">Contact Us</h1>
          <div className="w-6" />
        </div>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-[#131313] p-5 shadow-lg">
          <div className="mb-5 flex items-center gap-3 text-[#b792ea]">
            <Mail className="h-5 w-5" />
            <span className="text-[13px] font-semibold uppercase tracking-[0.18em]">Support</span>
          </div>

          <p className="text-sm leading-6 text-[#9ca3af]">
            Send bugs, feedback, or account help to{" "}
            <span className="font-semibold text-white">{SUPPORT_EMAIL}</span>.
          </p>

          <label className="mt-6 block text-xs font-bold uppercase tracking-[0.16em] text-white/40">
            Subject
          </label>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none transition placeholder:text-white/20 focus:border-[#b792ea]"
            placeholder="What is this about?"
          />

          <label className="mt-5 block text-xs font-bold uppercase tracking-[0.16em] text-white/40">
            Message
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={7}
            className="mt-2 w-full resize-none rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none transition placeholder:text-white/20 focus:border-[#b792ea]"
            placeholder="Tell us what happened..."
          />

          <button
            type="button"
            onClick={handleSendEmail}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b792ea] py-4 text-[16px] font-semibold text-[#3b2466] shadow-md transition-all active:scale-[0.98]"
          >
            <Send className="h-5 w-5" />
            Send Email
          </button>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-4 block text-center text-sm font-semibold text-[#b792ea]"
          >
            {SUPPORT_EMAIL}
          </a>
        </section>
      </div>
    </main>
  );
}
