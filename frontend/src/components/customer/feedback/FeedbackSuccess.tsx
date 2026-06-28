"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface FeedbackSuccessProps {
  rating: number;
  onContinue: () => void;
  onInquire?: () => void;
}

const MARKERS: Record<number, string> = {
  1: "1/5",
  2: "2/5",
  3: "3/5",
  4: "4/5",
  5: "5/5",
};

const TITLES: Record<number, string> = {
  1: "We're sorry. We'll improve.",
  2: "We'll try to do better.",
  3: "Thanks for the feedback!",
  4: "Glad you enjoyed it!",
  5: "Thank you for the great rating!",
};

export function FeedbackSuccess({ rating, onContinue, onInquire }: FeedbackSuccessProps) {
  const marker = MARKERS[rating] || "Thank you";
  const title = TITLES[rating] || "Thank you!";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 animate-fade-in">
      <span className="mb-6 rounded-full border border-accent-500/30 bg-accent-500/10 px-6 py-4 text-4xl font-bold text-accent-300">
        {marker}
      </span>

      <h2 className="text-2xl font-bold text-text-primary max-w-sm leading-tight">
        {title}
      </h2>

      <p className="text-sm text-text-secondary mt-2">
        Your feedback helps us improve.
      </p>

      <Button
        type="button"
        onClick={onContinue}
        className="h-14 px-10 mt-10 bg-accent-500 text-surface-base hover:bg-accent-400 font-semibold text-base rounded-full active:scale-95 transition-all"
      >
        Finish
      </Button>

      {rating >= 4 && (
        <div className="mt-8 p-4 bg-accent-500/5 border border-accent-500/10 rounded-2xl max-w-sm flex flex-col items-center animate-fade-in w-full">
          <p className="text-sm text-accent-400 font-semibold mb-2">Hosting an Event?</p>
          <p className="text-xs text-text-secondary mb-3 text-center">
            We provide premium catering services for birthdays, corporate events, and weddings.
          </p>
          <Link
            href="/customer/catering"
            className="w-full text-center py-2.5 rounded-xl border border-accent-500/30 text-xs font-semibold text-accent-300 hover:bg-accent-500/10 transition-colors"
          >
            Get a Catering Quote
          </Link>
          {onInquire && (
            <button
              type="button"
              onClick={onInquire}
              className="w-full text-center py-2.5 mt-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-surface-base text-xs font-semibold active:scale-[0.98] transition-colors border-0 cursor-pointer"
            >
              Fill Enquiry Form Here
            </button>
          )}
        </div>
      )}
    </div>
  );
}
