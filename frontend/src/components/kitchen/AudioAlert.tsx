"use client";

import { useEffect, useState } from "react";

interface AudioAlertProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function AudioAlert({ isEnabled, onToggle }: AudioAlertProps) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkUnlocked = () => {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === "running") {
          setUnlocked(true);
        }
        ctx.close();
      }
    };

    checkUnlocked();

    const handleInteraction = () => {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx.resume().then(() => {
          setUnlocked(true);
          ctx.close();
        });
      }
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <button
        type="button"
        onClick={() => onToggle(!isEnabled)}
        className="bg-surface-overlay hover:bg-surface-overlay/80 text-text-primary rounded-xl px-3 py-2 flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 text-sm font-semibold"
        aria-label={isEnabled ? "Disable audio alerts" : "Enable audio alerts"}
      >
        <span className="text-base select-none">
          {isEnabled ? "🔔" : "🔕"}
        </span>
        <span className="hidden sm:inline">
          {isEnabled ? "Sound On" : "Muted"}
        </span>
      </button>

      {!unlocked && isEnabled && (
        <span className="text-[10px] text-accent-400 font-medium animate-pulse">
          Tap anywhere to enable audio
        </span>
      )}
    </div>
  );
}
