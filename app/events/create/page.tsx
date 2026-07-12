// app/events/create/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  DoorOpen,
  FileText,
  MapPinned,
  PartyPopper,
  Users,
  Globe,
} from "lucide-react";
import { apiErrorMessage, eventApi } from "../../../lib/client-api";
import { getHostelsForGender } from "../../../lib/constants";
import { createClient } from "../../../lib/supabase/client";

type FormState = {
  eventType: "PHYSICAL" | "ONLINE" | "OFFLINE";
  eventName: string;
  description: string;
  hostel: string;
  floor: string;
  room: string;
  onlineLink: string;
  offlineAudience: "YOUR_GENDER" | "CO_ED";
  offlineLocation: string;
  dateTime: string;
  duration: string;
  maxAttendees: string;
};

const steps = [
  {
    id: "eventName",
    title: "Event Name",
    subtitle: "Give your vibe a clear name.",
    icon: PartyPopper,
    placeholder: "e.g., Midnight Movie RUN",
  },
  {
    id: "description",
    title: "Description",
    subtitle: "Tell everyone what’s happening.",
    icon: FileText,
    placeholder: "Tell everyone what's happening...",
  },
  {
    id: "hostel",
    title: "Event Location",
    subtitle: "Pick where the vibe is happening: hostel room, campus common area, or online.",
    icon: MapPinned,
    placeholder: "Select Hostel",
  },
  {
    id: "floorRoom",
    title: "Location Details",
    subtitle: "Lock down exactly where people need to go.",
    icon: DoorOpen,
    placeholder: "Floor and room number",
  },
  {
    id: "dateTime",
    title: "Date & Time",
    subtitle: "Schedule the start of the event.",
    icon: CalendarDays,
    placeholder: "mm/dd/yyyy, --:-- --",
  },
  {
    id: "duration",
    title: "Duration",
    subtitle: "How long should the vibe last?",
    icon: Clock3,
    placeholder: "1h",
  },
  {
    id: "maxAttendees",
    title: "Max Attendees",
    subtitle: "Set the crowd size (excluding you).",
    icon: Users,
    placeholder: "10 people",
  },
] as const;

const durationMinutesByLabel: Record<string, number> = {
  "30m": 30,
  "1h": 60,
  "1h 30m": 90,
  "2h": 120,
  "3h": 180,
  "5h": 300,
  "All Night": 480,
};

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    eventType: "PHYSICAL",
    eventName: "",
    description: "",
    hostel: "",
    floor: "",
    room: "",
    onlineLink: "",
    offlineAudience: "YOUR_GENDER",
    offlineLocation: "",
    dateTime: "",
    duration: "1h",
    maxAttendees: "10",
  });

  const [userGender, setUserGender] = useState<"MALE" | "FEMALE" | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      try {
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!active) return;
        if (res.ok) {
          const me = await res.json();
          setUserGender(me?.gender ?? null);
        }
      } catch {
        // Fallback catch
      } finally {
        if (active) setIsUserLoaded(true);
      }
    });
    return () => { active = false; };
  }, [router]);

  const currentStep = steps[step];
  const isFirstStep = step === 0;
  const isLastStep = step === steps.length - 1;
  const allowedHostels = getHostelsForGender(userGender);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateAttendees = (delta: number) => {
    setForm((prev) => {
      const current = Number.parseInt(prev.maxAttendees, 10) || 2;
      return { ...prev, maxAttendees: String(Math.max(2, current + delta)) };
    });
  };

  const validateCurrentStep = () => {
    switch (currentStep.id) {
      case "eventName":
        return form.eventName.trim().length >= 3 ? "" : "Event name must be at least 3 characters.";
      case "hostel":
        if (form.eventType === "ONLINE" || form.eventType === "OFFLINE") return null;
        if (!form.hostel) return "Please select a hostel.";
        if (!allowedHostels.includes(form.hostel)) return "Please select a valid hostel.";
        return "";
      case "floorRoom":
        if (form.eventType === "ONLINE") {
          return form.onlineLink.trim() ? "" : "Please provide a valid online meeting link or platform name.";
        }
        if (form.eventType === "OFFLINE") {
          return form.offlineLocation.trim() ? "" : "Please provide an offline campus location for the event.";
        }
        if (!Number.isInteger(Number(form.floor)) || Number(form.floor) < 0) {
          return "Floor must be a whole number.";
        }
        return form.room.trim() ? "" : "Room number is required.";
      case "dateTime":
        if (!form.dateTime) return "Date and time are required.";
        return new Date(form.dateTime) > new Date() ? "" : "Date and time must be in the future.";
      default:
        return "";
    }
  };

  const goNext = () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!isLastStep) setStep((current) => current + 1);
  };

  const goBack = () => {
    if (!isFirstStep) setStep((current) => current - 1);
  };

  const handleCreate = async () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const isOnline = form.eventType === "ONLINE";
      const isOffline = form.eventType === "OFFLINE";
      const normalizedHostel = isOnline
        ? "ONLINE"
        : isOffline
          ? `OFFLINE-${form.offlineAudience}`
          : form.hostel;

      const event = await eventApi.create({
        name: form.eventName.trim(),
        description: form.description.trim(),
        hostel: normalizedHostel,
        floor: isOnline || isOffline ? 0 : Number(form.floor),
        roomNumber: isOnline
          ? form.onlineLink.trim()
          : isOffline
            ? form.offlineLocation.trim()
            : form.room.trim(),
        scheduledAt: new Date(form.dateTime).toISOString(),
        durationMinutes: durationMinutesByLabel[form.duration] ?? 60,
        maxAttendees: Math.max(2, Number.parseInt(form.maxAttendees, 10) || 2),
      });

      router.replace(`/events/${event.id}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepBody = () => {
    switch (currentStep.id) {
      case "eventName":
        return (
          <input
            value={form.eventName}
            onChange={(e) => updateField("eventName", e.target.value)}
            placeholder={currentStep.placeholder}
            className="w-full rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none transition placeholder:text-white/20 focus:border-[#b792ea]"
          />
        );
      case "description":
        return (
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder={currentStep.placeholder}
            rows={6}
            className="w-full resize-none rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none transition placeholder:text-white/20 focus:border-[#b792ea]"
          />
        );
      case "hostel":
        return (
          <div className="space-y-4">
            <div className="w-full bg-[#16161A] p-1 rounded-xl flex items-center gap-1 border border-white/5">
              <button
                type="button"
                onClick={() => updateField("eventType", "PHYSICAL")}
                className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  form.eventType === "PHYSICAL" ? "bg-[#b792ea] text-[#3b2466]" : "text-gray-400"
                }`}
              >
                In Hostel
              </button>
              <button
                type="button"
                onClick={() => updateField("eventType", "OFFLINE")}
                className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  form.eventType === "OFFLINE" ? "bg-[#b792ea] text-[#3b2466]" : "text-gray-400"
                }`}
              >
                Offline Event
              </button>
              <button
                type="button"
                onClick={() => updateField("eventType", "ONLINE")}
                className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  form.eventType === "ONLINE" ? "bg-[#b792ea] text-[#3b2466]" : "text-gray-400"
                }`}
              >
                Online Event
              </button>
            </div>

            {form.eventType === "PHYSICAL" ? (
              <div className="relative">
                <select
                  value={form.hostel}
                  onChange={(e) => updateField("hostel", e.target.value)}
                  disabled={!isUserLoaded || allowedHostels.length === 0}
                  className="w-full bg-[#16161A] border border-zinc-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all appearance-none text-white focus:border-[#9D7BDE] cursor-pointer disabled:opacity-50"
                >
                  <option value="" disabled hidden>{currentStep.placeholder}</option>
                  {allowedHostels.map((hostel) => (
                    <option key={hostel} value={hostel}>{hostel}</option>
                  ))}
                </select>
              </div>
            ) : form.eventType === "OFFLINE" ? (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-[#16161A] p-4">
                <p className="text-[12px] font-semibold tracking-[0.18em] text-[#b792ea] uppercase">Audience</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("offlineAudience", "YOUR_GENDER")}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      form.offlineAudience === "YOUR_GENDER"
                        ? "border-[#b792ea] bg-[#b792ea] text-[#3b2466]"
                        : "border-white/10 bg-transparent text-white"
                    }`}
                  >
                    Your Gender
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("offlineAudience", "CO_ED")}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      form.offlineAudience === "CO_ED"
                        ? "border-[#b792ea] bg-[#b792ea] text-[#3b2466]"
                        : "border-white/10 bg-transparent text-white"
                    }`}
                  >
                    Co-ed
                  </button>
                </div>
                <p className="text-[12px] leading-5 text-gray-400">
                  This tells everyone whether the offline event is only for your gender or open to mixed participation.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-white/10 bg-[#16161A] flex items-center gap-3 text-gray-400 text-xs font-medium">
                <Globe className="w-4 h-4 text-[#b792ea]" />
                <span>Bypassing block filtering. This online event will be discoverable app-wide!</span>
              </div>
            )}
          </div>
        );
      case "floorRoom":
        if (form.eventType === "ONLINE") {
          return (
            <input
              value={form.onlineLink}
              onChange={(e) => updateField("onlineLink", e.target.value)}
              placeholder="e.g. Discord Link, GMeets, or room code"
              className="w-full rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none focus:border-[#b792ea] placeholder:text-white/20"
            />
          );
        }

        if (form.eventType === "OFFLINE") {
          return (
            <textarea
              value={form.offlineLocation}
              onChange={(e) => updateField("offlineLocation", e.target.value)}
              placeholder="e.g. Open air stage, cafeteria lawn, auditorium foyer, sports ground"
              rows={4}
              className="w-full resize-none rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none focus:border-[#b792ea] placeholder:text-white/20"
            />
          );
        }

        return (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min={0}
              value={form.floor}
              onChange={(e) => updateField("floor", e.target.value)}
              placeholder="Floor (e.g. 4)"
              className="w-full rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none focus:border-[#b792ea]"
            />
            <input
              value={form.room}
              onChange={(e) => updateField("room", e.target.value)}
              placeholder="Room (e.g. 402)"
              className="w-full rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none focus:border-[#b792ea]"
            />
          </div>
        );
      case "dateTime":
        return (
          <input
            type="datetime-local"
            value={form.dateTime}
            onChange={(e) => updateField("dateTime", e.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none focus:border-[#b792ea]"
          />
        );
      case "duration":
        return (
          <div className="flex flex-wrap gap-3">
            {["30m", "1h", "1h 30m", "2h", "3h", "5h", "All Night"].map((option) => {
              const active = form.duration === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField("duration", option)}
                  className={`rounded-full border px-5 py-3 text-[15px] font-medium transition ${
                    active ? "border-[#b792ea] bg-[#b792ea] text-[#3b2466]" : "border-white/15 bg-transparent text-white"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        );
      case "maxAttendees":
        return (
          <div className="rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-5">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => updateAttendees(-1)} disabled={Number(form.maxAttendees) <= 2} className="text-4xl text-white/80">−</button>
              <div className="text-center">
                <p className="text-[30px] font-semibold text-[#b792ea]">{form.maxAttendees}</p>
                <p className="mt-1 text-[12px] font-semibold tracking-[0.2em] text-white/25">PEOPLE</p>
              </div>
              <button type="button" onClick={() => updateAttendees(1)} className="text-4xl text-white/80">+</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
  // We use max-h-fit to forcefully snap the container bounds down to match the input card elements
  <main className="create-event-page w-full min-h-[calc(100%+6rem)] -mb-24 bg-black text-white flex flex-col justify-start items-center">
    
    {/* 1. Changed flex-1 to !h-auto and !max-h-fit to prevent layout engine stretch.
      2. Set pb-32 to protect item scrolling from overlapping the floating system tab bar elements.
    */}
    <div className="w-full max-w-md flex flex-col !h-auto !max-h-fit bg-black px-5 pb-32 pt-6">
      
      {/* ================= HEADER ================= */}
      <div className="flex shrink-0 items-center justify-between">
        <Link href="/events" className="inline-flex items-center gap-2 text-[#b792ea]">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-[22px] font-extrabold text-white">Create Event</h1>
        <div className="w-6" />
      </div>

      {/* ================= PROGRESS STEPS ================= */}
      <div className="mt-5 flex shrink-0 items-center gap-2">
        {steps.map((item, index) => (
          <span
            key={item.id}
            className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#b792ea]" : "bg-white/10"}`}
          />
        ))}
      </div>

      {/* ================= STEP CONTENT CONTAINER ================= */}
      <section className="mt-6 flex flex-col h-auto max-h-fit">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#b792ea]/40 bg-[#1c1c1e] text-[#b792ea] font-bold">
            {step + 1}
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] text-white/35">
              Step {step + 1} of {steps.length}
            </p>
            <h2 className="mt-1 text-[18px] font-semibold text-white">{currentStep.title}</h2>
          </div>
        </div>

        <p className="mt-3 text-[14px] leading-6 text-[#9ca3af]">{currentStep.subtitle}</p>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-[#131313] p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-3 text-[#b792ea]">
            <currentStep.icon className="h-5 w-5" />
            <span className="text-[13px] font-semibold uppercase tracking-[0.18em]">{currentStep.title}</span>
          </div>
          {renderStepBody()}
        </div>

        {step === 0 && (
          <p className="mt-4 text-[13px] leading-6 text-[#9ca3af]">
            We’ll build the event step by step, so every detail stays focused and easy to fill.
          </p>
        )}

        {step === steps.length - 1 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#1c1c1e] p-4 text-[13px] leading-6 text-[#d1d5db]">
            <p className="font-semibold text-white">Review Configuration</p>
            <p className="mt-2 font-bold text-[#b792ea]">{form.eventName || "Event name"}</p>
            <p>
              {form.eventType === "ONLINE"
                ? `🌐 Online Event • Info: ${form.onlineLink || "---"}`
                : form.eventType === "OFFLINE"
                  ? `📍 Offline Event • ${form.offlineAudience === "CO_ED" ? "Co-ed" : "Your Gender"} • ${form.offlineLocation || "Location TBD"}`
                  : `🏢 ${form.hostel || "Hostel Block"} • Flr ${form.floor || "-"} • Rm ${form.room || "-"}`}
            </p>
            <p>{form.dateTime || "Scheduled Time"}</p>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] leading-5 text-red-200">
            {error}
          </p>
        )}
      </section>

      {/* ================= ACTIONS BUTTON ROW ================= */}
      {/* Changing from relative space-allocation positioning to a clean, fixed block-top margin offset parameter.
        This cuts out any flex layout dependencies and forces the button segment to sit tight under the active card input box.
      */}
      <div className="grid shrink-0 grid-cols-2 gap-3 pt-4 mt-8">
        <button
          type="button"
          onClick={goBack}
          disabled={isFirstStep}
          className={`rounded-2xl border py-4 text-[16px] font-medium transition ${
            isFirstStep
              ? "cursor-not-allowed border-white/10 text-white/25"
              : "border-white/30 text-white"
          }`}
        >
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="rounded-2xl bg-[#b792ea] py-4 text-[16px] font-semibold text-[#3b2466] shadow-md transition-all active:scale-[0.98]"
          >
            {isSubmitting ? "Creating..." : "Create Event"}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#b792ea] py-4 text-[16px] font-semibold text-[#3b2466]"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

    </div>
  </main>
);
}
