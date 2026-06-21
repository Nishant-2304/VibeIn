// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

  const handleGoogleLogin = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  return (
    <main className="flex-1 relative bg-[#121212] w-full flex flex-col overflow-hidden select-none">
      
      {/* ================= VIEW A: FIGMA SPLASH SCREEN ================= */}
      <div
        className={`absolute inset-0 flex items-center justify-center bg-[#121212] z-30 transition-opacity duration-700 ease-in-out ${
          isSplash ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Spelled with a 'V'. Brute-forced to 'Jaro'. Top-to-bottom metallic gradient */}
        <h1 className="font-['Jaro'] text-7xl font-black tracking-normal bg-gradient-to-b from-[#7e52b5] via-[#a87cdb] to-[#e2cbf5] bg-clip-text text-transparent pb-2">
          VibeIn
        </h1>
      </div>


      {/* ================= VIEW B: WELCOME / G-AUTH ================= */}
      <div
        className={`flex-1 flex flex-col justify-between px-6 pt-20 pb-10 z-20 transition-opacity duration-700 ease-in-out ${
          !isSplash ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div /> {/* Top spacer */}

        <div className="flex flex-col items-center text-center max-w-[280px] mx-auto my-auto">
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
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.2 8.8 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                  <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.2-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z"/>
                </svg>
                <span className="font-medium text-base">Continue with Google</span>
              </>
            )}
          </button>
        </div>

        <div /> {/* Bottom spacer to ensure the content remains centered */}
      </div>
    </main>
  );
}