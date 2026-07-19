// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginGateScreen() {
  const [isSplash, setIsSplash] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);

    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="min-h-full relative bg-[#121212] w-full flex flex-col overflow-hidden select-none">

      {/* ================= VIEW A: FIGMA SPLASH SCREEN ================= */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center bg-[#121212] z-30 transition-opacity duration-700 ease-in-out ${isSplash ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Spelled with a 'V'. Brute-forced to 'Jaro'. Top-to-bottom metallic gradient */}
        <h1 className="font-['Jaro'] text-7xl font-black tracking-normal bg-gradient-to-b from-[#7e52b5] via-[#a87cdb] to-[#e2cbf5] bg-clip-text text-transparent pb-2">
          VibeIn
        </h1>
        <p className="mt-1 text-sm font-bold uppercase tracking-[0.22em] text-white/35">
          By EZZ
        </p>
      </div>


      {/* ================= VIEW B: WELCOME / G-AUTH ================= */}
      <div
        className={`flex-1 flex flex-col items-center justify-center px-6 z-20 transition-opacity duration-700 ease-in-out ${!isSplash ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        <div className="flex flex-col items-center text-center max-w-[280px] mx-auto">
          {/* Hardcoded font-family and massive scaling */}
          <h1
            style={{ fontFamily: "'Jaro', sans-serif" }}
            className="text-6xl font-black bg-gradient-to-b from-[#7e52b5] to-[#d4b3f5] bg-clip-text text-transparent tracking-wide mb-6 pb-1"
          >
            Welcome!
          </h1>

          <p className="text-gray-300 text-sm font-medium leading-relaxed mb-12">
            This is the hostel platform, where interests become friendships!
          </p>

          {/* Hardcoded button padding and sizing */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isAuthenticating}
            className="w-full bg-black hover:bg-[#181818] text-white text-lg py-5 px-8 rounded-full border border-white/10 transition-all duration-300 shadow-[0_0_25px_rgba(155,114,207,0.3)] hover:shadow-[0_0_35px_rgba(155,114,207,0.5)] active:scale-95 flex items-center justify-center gap-3 cursor-pointer group"
          >
            {isAuthenticating ? (
              <div className="w-6 h-6 border-2 border-[#9b72cf] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="font-medium text-base">Continue with Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
