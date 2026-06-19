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
      <span className="mb-6 rounded-full border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-4xl font-bold text-amber-300">
        {marker}
      </span>

      <h2 className="text-2xl font-bold text-zinc-100 max-w-sm leading-tight">
        {title}
      </h2>

      <p className="text-sm text-zinc-400 mt-2">
        Your feedback helps us improve.
      </p>

      <Button
        type="button"
        onClick={onContinue}
        className="h-14 px-10 mt-10 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold text-base rounded-full active:scale-95 transition-all"
      >
        Finish
      </Button>

      {rating >= 4 && (
        <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl max-w-sm flex flex-col items-center animate-fade-in w-full">
          <p className="text-sm text-amber-400 font-semibold mb-2">Hosting an Event?</p>
          <p className="text-xs text-zinc-400 mb-3 text-center">
            We provide premium catering services for birthdays, corporate events, and weddings.
          </p>
          <Link
            href="/customer/catering"
            className="w-full text-center py-2.5 rounded-xl border border-amber-500/30 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            Get a Catering Quote
          </Link>
          {onInquire && (
            <button
              type="button"
              onClick={onInquire}
              className="w-full text-center py-2.5 mt-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold active:scale-[0.98] transition-colors border-0 cursor-pointer"
            >
              Fill Enquiry Form Here
            </button>
          )}
        </div>
      )}
    </div>
  );
}
