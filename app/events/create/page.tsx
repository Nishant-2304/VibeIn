"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  DoorOpen,
  FileText,
  Hash,
  MapPinned,
  PartyPopper,
  Users,
} from "lucide-react";
import { apiErrorMessage, eventApi } from "../../../lib/client-api";

type FormState = {
  eventName: string;
  description: string;
  hostel: string;
  floor: string;
  room: string;
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
    placeholder: "e.g., Midnight Poker Night",
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
    title: "Hostel",
    subtitle: "Choose where the event is happening.",
    icon: MapPinned,
    placeholder: "Select Hostel",
  },
  {
    id: "floorRoom",
    title: "Floor & Room",
    subtitle: "Lock the exact location.",
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
    subtitle: "Set the crowd size.",
    icon: Users,
    placeholder: "10 people",
  },
] as const;

const hostels = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "Q",
  "R",
  "S",
  "T",
];

const durationMinutesByLabel: Record<string, number> = {
  "30m": 30,
  "1h": 60,
  "2h": 120,
  "3h": 180,
  "All Night": 480,
};

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    eventName: "",
    description: "",
    hostel: "",
    floor: "",
    room: "",
    dateTime: "",
    duration: "1h",
    maxAttendees: "10",
  });

  const currentStep = steps[step];
  const isFirstStep = step === 0;
  const isLastStep = step === steps.length - 1;

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
        return hostels.includes(form.hostel) ? "" : "Please select a hostel.";
      case "floorRoom":
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

    if (!isLastStep) {
      setStep((current) => current + 1);
    }
  };

  const goBack = () => {
    if (!isFirstStep) {
      setStep((current) => current - 1);
    }
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
      const event = await eventApi.create({
        name: form.eventName.trim(),
        description: form.description.trim(),
        hostel: form.hostel,
        floor: Number(form.floor),
        roomNumber: form.room.trim(),
        scheduledAt: new Date(form.dateTime).toISOString(),
        durationMinutes: durationMinutesByLabel[form.duration] ?? 60,
        maxAttendees: Math.max(2, Number.parseInt(form.maxAttendees, 10) || 2),
      });

      router.push(`/events/${event.id}`);
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
            rows={7}
            className="w-full resize-none rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none transition placeholder:text-white/20 focus:border-[#b792ea]"
          />
        );
      case "hostel":
        return (
          <div className="relative">
            <select
              value={form.hostel}
              onChange={(e) => updateField("hostel", e.target.value)}
              className="w-full bg-[#16161A] border border-zinc-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all appearance-none text-white focus:border-[#9D7BDE] cursor-pointer"
            >
              <option value="" disabled hidden>{currentStep.placeholder}</option>
              {hostels.map((hostel) => (
                <option key={hostel} value={hostel}>
                  Hostel {hostel}
                </option>
              ))}
            </select>
          </div>
        );
      case "floorRoom":
        return (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min={0}
              step={1}
              value={form.floor}
              onChange={(e) => updateField("floor", e.target.value)}
              placeholder="e.g., 4th"
              className="w-full rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none transition placeholder:text-white/20 focus:border-[#b792ea]"
            />
            <input
              value={form.room}
              onChange={(e) => updateField("room", e.target.value)}
              placeholder="e.g., 402"
              className="w-full rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none transition placeholder:text-white/20 focus:border-[#b792ea]"
            />
          </div>
        );
      case "dateTime":
        return (
          <input
            type="datetime-local"
            value={form.dateTime}
            onChange={(e) => updateField("dateTime", e.target.value)}
            placeholder={currentStep.placeholder}
            className="w-full rounded-2xl border border-white/15 bg-[#1c1c1e] px-4 py-4 text-[16px] text-white outline-none transition placeholder:text-white/20 focus:border-[#b792ea]"
          />
        );
      case "duration":
        return (
          <div className="flex flex-wrap gap-3">
            {["30m", "1h", "2h", "3h", "All Night"].map((option) => {
              const active = form.duration === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField("duration", option)}
                  className={`rounded-full border px-5 py-3 text-[15px] font-medium transition ${
                    active
                      ? "border-[#b792ea] bg-[#b792ea] text-[#3b2466]"
                      : "border-white/15 bg-transparent text-white"
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
              <button
                type="button"
                onClick={() => updateAttendees(-1)}
                disabled={Number(form.maxAttendees) <= 2}
                className="text-4xl leading-none text-white/80"
                aria-label="Decrease attendees"
              >
                −
              </button>
              <div className="text-center">
                <p className="text-[30px] font-semibold leading-none text-[#b792ea]">{form.maxAttendees}</p>
                <p className="mt-1 text-[12px] font-semibold tracking-[0.2em] text-white/25">PEOPLE</p>
              </div>
              <button
                type="button"
                onClick={() => updateAttendees(1)}
                className="text-4xl leading-none text-white/80"
                aria-label="Increase attendees"
              >
                +
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-black px-5 py-6 pb-10">
        <div className="flex items-center justify-between">
          <Link href="/events" className="inline-flex items-center gap-2 text-[#b792ea]">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-[22px] font-extrabold text-white">Create Event</h1>
          <div className="w-6" />
        </div>

        <div className="mt-6 flex items-center gap-2">
          {steps.map((item, index) => (
            <span
              key={item.id}
              className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#b792ea]" : "bg-white/10"}`}
            />
          ))}
        </div>

        <section className="mt-8 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#b792ea]/40 bg-[#1c1c1e] text-[#b792ea]">
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

          <div className="mt-6 rounded-[28px] border border-white/10 bg-[#131313] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
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
              <p className="font-semibold text-white">Review</p>
              <p className="mt-2">{form.eventName || "Event name"}</p>
              <p>{form.hostel || "Hostel"} • Floor {form.floor || "-"} • Room {form.room || "-"}</p>
              <p>{form.dateTime || "Date and time"}</p>
            </div>
          )}
          {error && (
            <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] leading-5 text-red-200">
              {error}
            </p>
          )}
        </section>

        <div className="mt-8 grid grid-cols-2 gap-3">
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
              className="rounded-2xl bg-[#b792ea] py-4 text-[16px] font-semibold text-[#3b2466]"
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