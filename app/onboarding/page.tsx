"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { getHostelsForGender } from "../../lib/constants";

// Types for form state
interface FormData {
  pfp: string;
  name: string;
  college: string;
  gender: "Boy" | "Girl" | "";
  hostel: string;
  floor: string;
}

const DEFAULT_PFP_OPTIONS = ["😎", "🐱", "🚀", "🎨", "👾"];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    pfp: "😎",
    name: "", // Starts empty to load dynamically from Google Auth
    college: "",
    gender: "",
    hostel: "",
    floor: "",
  });

  const totalSteps = 4;

  // Fetch logged in user to prefill display name
  useEffect(() => {
    const fetchUserSkeleton = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      try {
        const res = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        if (res.ok) {
          const user = await res.json();
          if (user && user.displayName) {
            setFormData((prev) => ({
              ...prev,
              name: user.displayName
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load user info during onboarding init:", err);
      }
    };

    fetchUserSkeleton();
  }, [router]);

  const handleNext = async () => {
    if (step < totalSteps) {
      setDirection("next");
      setStep((prev) => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login");
          return;
        }

        const payload = {
          username: formData.name,
          college: "VIT_VELLORE", // "vit" mapped to VIT_VELLORE enum
          gender: formData.gender === "Boy" ? "MALE" : "FEMALE",
          hostel: formData.hostel,
          floor: parseInt(formData.floor, 10),
          pfp: formData.pfp,
        };

        const res = await fetch("/api/users/me", { //this line has the error
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to update profile data.");
        }

        router.push("/");
      } catch (err: any) {
        alert(err.message || "Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection("back");
      setStep((prev) => prev - 1);
    }
  };

  const updateField = (key: keyof FormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      // Reset hostel if college or gender changes to enforce validation
      if (key === "college" || key === "gender") {
        updated.hostel = "";
      }
      return updated;
    });
  };

  // Validation checks per step to enable/disable the Next button
  const isStepValid = () => {
    switch (step) {
      case 1:
        return !!formData.pfp;
      case 2:
        return formData.name.trim() !== "" && formData.college === "vit";
      case 3:
        return !!formData.gender && !!formData.hostel;
      case 4:
        return formData.floor.trim() !== "" && !isNaN(Number(formData.floor));
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C0E] text-[#E4E4E7] flex flex-col items-center justify-between p-6 font-sans antialiased selection:bg-[#9D7BDE]">
      
      {/* Top Header & Progress Section */}
      <div className="w-full max-w-md mt-4">
        <div className="flex items-center justify-between mb-3 text-xs tracking-wider text-zinc-500 uppercase font-semibold">
          <span>Step {step} of {totalSteps}</span>
          <span className="text-[#9D7BDE]">{Math.round((step / totalSteps) * 100)}% Complete</span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#9D7BDE] transition-all duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Screen Content Area */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-center my-8 overflow-hidden relative min-h-[400px]">
        
        {/* STEP 1: PFP & INTRO */}
        {step === 1 && (
          <div className="animate-fadeIn flex flex-col items-center text-center space-y-6">
            <div className="w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 text-5xl shadow-xl shadow-purple-950/10 animate-bounce-subtle">
              {formData.pfp}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2 text-white">Pick your vibe</h2>
              <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                Select an avatar that represents you across your hostel community.
              </p>
            </div>

            <div className="flex gap-3 justify-center bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/60 w-full">
              {DEFAULT_PFP_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => updateField("pfp", emoji)}
                  className={`text-3xl p-2 rounded-xl transition-all transform hover:scale-110 active:scale-95 ${
                    formData.pfp === emoji 
                      ? "bg-[#9D7BDE]/20 border-2 border-[#9D7BDE] scale-105" 
                      : "border border-transparent bg-zinc-800/50 hover:bg-zinc-800"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: NAME & COLLEGE */}
        {step === 2 && (
          <div className="animate-fadeIn space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2 text-white">Tell us about yourself</h2>
              <p className="text-zinc-400 text-sm">Let's start with your basic identity setup.</p>
            </div>

            <div className="space-y-4">
              {/* Name Input */}
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Display Name</label>
                <input
                  type="text"
                  value={formData.name}
                  placeholder="e.g. Arjun K"
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full bg-[#16161A] border border-zinc-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#9D7BDE] transition-colors placeholder-zinc-600 text-white"
                />
              </div>

              {/* College Dropdown */}
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">College</label>
                <select
                  value={formData.college}
                  onChange={(e) => updateField("college", e.target.value)}
                  className="w-full bg-[#16161A] border border-zinc-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#9D7BDE] transition-colors text-white appearance-none cursor-pointer"
                >
                  <option value="" disabled hidden>Select your campus</option>
                  <option value="vit">VIT Vellore</option>
                  <option value="soon" disabled>Coming soon...</option>
                </select>
                <p className="text-[11px] text-zinc-500 italic mt-1">
                  * Note: College choice cannot be changed later.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: GENDER & CONDITIONAL HOSTEL */}
        {step === 3 && (
          <div className="animate-fadeIn space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2 text-white">Where do you live?</h2>
              <p className="text-zinc-400 text-sm">This helps map you closer to your real-life floor neighbors.</p>
            </div>

            <div className="space-y-5">
              {/* Gender Radio Buttons */}
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Hostel Type / Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["Boy", "Girl"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updateField("gender", g)}
                      className={`py-3.5 rounded-xl border text-sm font-medium transition-all ${
                        formData.gender === g
                          ? "bg-[#9D7BDE]/10 border-[#9D7BDE] text-[#CAA6FF]"
                          : "bg-[#16161A] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {g}s Hostel
                    </button>
                  ))}
                </div>
              </div>

              {/* Hostel Dropdown (Locked until Gender + College are chosen) */}
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Hostel Block</label>
                <div className="relative">
                  <select
                    value={formData.hostel}
                    disabled={!formData.gender || formData.college !== "vit"}
                    onChange={(e) => updateField("hostel", e.target.value)}
                    className={`w-full bg-[#16161A] border rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all appearance-none text-white ${
                      !formData.gender 
                        ? "border-zinc-900 opacity-40 cursor-not-allowed text-zinc-600" 
                        : "border-zinc-800 focus:border-[#9D7BDE] cursor-pointer"
                    }`}
                  >
                    <option value="" disabled hidden>
                      {!formData.gender ? "Select Hostel Type first" : "Choose Block"}
                    </option>
                    {getHostelsForGender(
                      formData.gender === "Boy"
                        ? "MALE"
                        : formData.gender === "Girl"
                        ? "FEMALE"
                        : null
                    ).map((block) => (
                      <option key={block} value={block}>{block}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: FLOOR */}
        {step === 4 && (
          <div className="animate-fadeIn space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2 text-white">Final touch!</h2>
              <p className="text-zinc-400 text-sm">Which floor do you stay on?</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Floor Number</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.floor}
                  placeholder="e.g. 4"
                  onChange={(e) => updateField("floor", e.target.value)}
                  className="w-full bg-[#16161A] border border-zinc-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#9D7BDE] transition-colors placeholder-zinc-600 text-white"
                />
              </div>

              {/* Summary card preview */}
              <div className="bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-xl text-xs text-zinc-500 space-y-1">
                <p className="font-semibold text-zinc-400 uppercase tracking-wide mb-1">Your Profile Summary</p>
                <p>Name: <span className="text-zinc-300 font-medium">{formData.name}</span></p>
                <p>Location: <span className="text-zinc-300 font-medium">VIT • {formData.gender}s • {formData.hostel || "---"} • Floor {formData.floor || "---"}</span></p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Action Navigation */}
      <div className="w-full max-w-md space-y-3 mb-4">
        <button
          onClick={handleNext}
          disabled={!isStepValid() || isSubmitting}
          className={`w-full py-4 rounded-xl font-semibold tracking-wide text-sm flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-[0.99] ${
            isStepValid() && !isSubmitting
              ? "bg-[#9D7BDE] text-black hover:bg-[#A88AE6] shadow-lg shadow-purple-900/20"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60"
          }`}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : step === totalSteps ? (
            <>
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
            </>
          ) : (
            <>
              Next Step
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </>
          )}
        </button>

        {/* Back Button Container */}
        <div className="h-10 flex items-center justify-center">
          {step > 1 && !isSubmitting && (
            <button
              type="button"
              onClick={handleBack}
              className="text-zinc-500 hover:text-zinc-300 text-xs font-medium tracking-wide transition-colors py-2 px-4"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}