"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { useBottomSafeArea } from "@/hooks/useBottomSafeArea";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  defaultSnap?: number;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const bottomSafeArea = useBottomSafeArea();

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const timer = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (deltaY > 80) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "translateY(0)";
    }
    touchStartY.current = 0;
    touchCurrentY.current = 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" aria-modal="true" role="dialog">
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "relative z-10 w-full max-w-md bg-surface-raised border-t border-border-default rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl transition-transform duration-300 ease-out",
          visible ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          paddingBottom: `calc(1.5rem + ${bottomSafeArea})`,
        }}
      >
        {/* Touch / Drag Handle Area */}
        <div
          className="w-full py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-border-default rounded-full mx-auto" />
        </div>

        {/* Title */}
        {title && (
          <div className="text-lg font-semibold text-text-primary px-6 pb-4 border-b border-border-default">
            {title}
          </div>
        )}

        {/* Content */}
        <div className="px-4 mt-4 text-text-primary">
          {children}
        </div>
      </div>
    </div>
  );
}
