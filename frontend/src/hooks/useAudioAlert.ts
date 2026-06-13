"use client";

import { useState } from "react";

export function useAudioAlert() {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("kitchen_audio_alert_enabled");
      return stored !== null ? stored === "true" : true;
    }
    return true;
  });

  const setEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem("kitchen_audio_alert_enabled", String(enabled));
    }
  };

  const playNewOrderAlert = () => {
    if (!isEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error("Web Audio API not supported");
      }
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      try {
        const audio = new Audio("/sounds/order-alert.mp3");
        audio.volume = 0.5;
        audio.play();
      } catch (err) {
        console.error("Audio playback error:", err);
      }
    }
  };

  return { isEnabled, setEnabled, playNewOrderAlert };
}
