// app/profile/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { DEFAULT_PFP_OPTIONS, HOSTEL_OPTIONS } from "../../../lib/constants";

interface FormData {
  pfp: string;
  name: string;
  college: string;
  gender: "Boy" | "Girl" | "";
  hostel: string;
  floor: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    pfp: "😎",
    name: "",
    college: "vit", // Default mapping for display
    gender: "",
    hostel: "",
    floor: "",
  });

  // Fetch current user data to pre-fill the form
  useEffect(() => {
    let active = true;
    
    const fetchUserData = async () => {
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
        
        if (res.ok && active) {
          const user = await res.json();
          setFormData({
            pfp: user.pfp || "😎",
            name: user.displayName || "",
            college: "vit", // Locked to VIT based on instructions
            gender: user.gender === "FEMALE" ? "Girl" : "Boy",
            hostel: user.hostel || "",
            floor: user.floor?.toString() || "",
          });
        }
      } catch (err) {
        console.error("Failed to load user info:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchUserData();

    return () => { active = false; };
  }, [router]);

  const updateField = (key: keyof FormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      // Reset hostel if gender changes to enforce validation
      if (key === "gender") {
        updated.hostel = "";
      }
      return updated;
    });
  };

  const handleFinishEdit = async () => {
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
        college: "VIT_VELLORE", // Immutable mapping
        gender: formData.gender === "Boy" ? "MALE" : "FEMALE",
        hostel: formData.hostel,
        floor: parseInt(formData.floor, 10),
        pfp: formData.pfp,
      };

      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update profile.");
      }

      // Route back to My Account on success
      router.push("/profile");
    } catch (err: any) {
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.gender !== "" &&
      formData.hostel !== "" &&
      formData.floor.trim() !== "" &&
      !isNaN(Number(formData.floor))
    );
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#121212] text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8aaf5] mb-3" />
        <p className="text-sm font-medium">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white flex flex-col items-center pb-48">
      
      {/* ================= HEADER ================= */}
      <div className="w-full max-w-md px-5 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-[#121212]/90 backdrop-blur-md z-50 border-b border-white/5">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display font-black text-2xl tracking-wide">Edit Profile</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <div className="w-full max-w-md px-5 mt-6 space-y-8">
        
        {/* ================= PFP SELECTOR ================= */}
        <section className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 bg-[#1e1e1e] rounded-full flex items-center justify-center border-2 border-[#c8aaf5] text-4xl shadow-[0_0_20px_rgba(200,170,245,0.15)]">
            {formData.pfp}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 bg-[#1e1e1e] p-2 rounded-2xl border border-white/5 w-full">
            {DEFAULT_PFP_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => updateField("pfp", emoji)}
                className={`text-2xl p-2.5 rounded-xl transition-all transform hover:scale-110 active:scale-95 ${
                  formData.pfp === emoji 
                    ? "bg-[#c8aaf5]/20 border border-[#c8aaf5] scale-105" 
                    : "border border-transparent bg-white/5 hover:bg-white/10"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>

        {/* ================= FORM FIELDS ================= */}
        <section className="space-y-5">
          
          {/* Display Name */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Display Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#c8aaf5] transition-colors placeholder-gray-600 text-white"
            />
          </div>

          {/* College (Disabled state) */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">College</label>
            <div className="w-full bg-[#1e1e1e]/50 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-gray-500 cursor-not-allowed">
              VIT Vellore
            </div>
            <p className="text-[10px] text-gray-500 font-medium">
              * College affiliation cannot be changed after initial setup.
            </p>
          </div>

          {/* Gender */}
          <div className="flex flex-col space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Hostel Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(["Boy", "Girl"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => updateField("gender", g)}
                  className={`py-3.5 rounded-xl border text-sm font-bold transition-all ${
                    formData.gender === g
                      ? "bg-[#c8aaf5]/10 border-[#c8aaf5] text-[#c8aaf5]"
                      : "bg-[#1e1e1e] border-white/10 text-gray-400 hover:bg-white/5"
                  }`}
                >
                  {g}s Hostel
                </button>
              ))}
            </div>
          </div>

          {/* Hostel Block */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Hostel Block</label>
            <select
              value={formData.hostel}
              disabled={!formData.gender}
              onChange={(e) => updateField("hostel", e.target.value)}
              className={`w-full bg-[#1e1e1e] border rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all appearance-none text-white ${
                !formData.gender 
                  ? "border-transparent opacity-50 cursor-not-allowed" 
                  : "border-white/10 focus:border-[#c8aaf5] cursor-pointer"
              }`}
            >
              <option value="" disabled hidden>
                {!formData.gender ? "Select Hostel Type first" : "Choose Block"}
              </option>
              {HOSTEL_OPTIONS.map((block) => (
                <option key={block} value={block}>{block}</option>
              ))}
            </select>
          </div>

          {/* Floor */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Floor Number</label>
            <input
              type="number"
              min="0"
              max="20"
              value={formData.floor}
              onChange={(e) => updateField("floor", e.target.value)}
              className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#c8aaf5] transition-colors placeholder-gray-600 text-white"
            />
          </div>

        </section>

      </div>

      {/* ================= BOTTOM CTA ================= */}
      {/* Changed pb-24 to pb-[76px] to drop it down snugly above the navbar */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pt-8 pb-[76px] bg-gradient-to-t from-[#121212] via-[#121212] to-transparent flex justify-center z-40">
        <div className="w-full max-w-md">
          <button
            onClick={handleFinishEdit}
            disabled={!isFormValid() || isSubmitting}
            className={`w-full py-4 rounded-2xl font-display font-black text-xl tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] ${
              isFormValid() && !isSubmitting
                ? "bg-[#c8aaf5] text-[#2c124d] hover:bg-[#b894ec] shadow-[0_4px_25px_rgba(200,170,245,0.25)]"
                : "bg-[#1e1e1e] text-gray-600 cursor-not-allowed border border-white/5"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#2c124d]" />
            ) : (
              <>
                Finish Edit
                <Check className="w-6 h-6 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </div>
      
    </main>
  );
}