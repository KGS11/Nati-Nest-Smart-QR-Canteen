"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { StatePanel } from "@/components/stitch/StatePanel";
import { Button } from "@/components/ui/Button";
import { customerService, FeedbackStatus } from "@/services/customerService";
import { useSessionStore } from "@/stores/sessionStore";
import { ClientApiError } from "@/types/api";

// New components
import { EmojiRating } from "@/components/customer/feedback/EmojiRating";
import { FeedbackSuccess } from "@/components/customer/feedback/FeedbackSuccess";
import { CateringEnquiryForm } from "@/components/customer/CateringEnquiryForm";

export default function CustomerFeedbackPage() {
  const router = useRouter();
  const tableNumber = useSessionStore((state) => state.tableNumber);
  const clearSession = useSessionStore((state) => state.clearSession);
  const [status, setStatus] = useState<FeedbackStatus | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [isCateringOpen, setIsCateringOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      setError(null);
      try {
        const feedbackStatus = await customerService.getFeedbackStatus();
        setStatus(feedbackStatus);
        if (feedbackStatus.submitted && feedbackStatus.feedback) {
          setRating(feedbackStatus.feedback.rating);
        }
      } catch (err) {
        const clientError = err as ClientApiError;
        setError(clientError.message || "Unable to load feedback status.");
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await customerService.submitFeedback(rating, comment || undefined);
      setStatus({
        submitted: true,
        feedback: response.data.feedback,
      });
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    clearSession();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader label="Loading feedback..." />
      </div>
    );
  }

  if (status?.submitted && rating !== null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center max-w-md mx-auto">
        <FeedbackSuccess rating={rating} onContinue={handleSkip} onInquire={() => setIsCateringOpen(true)} />
        <CateringEnquiryForm isOpen={isCateringOpen} onClose={() => setIsCateringOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 max-w-md mx-auto flex flex-col justify-between">
      <div>
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 font-bold text-zinc-950">
              {tableNumber ?? "--"}
            </div>
            <div>
              <p className="font-semibold text-xs text-zinc-400">Table {tableNumber ?? "--"}</p>
              <h1 className="text-xl font-bold text-zinc-100">Feedback</h1>
            </div>
          </div>
          <Link
            href="/customer/menu"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-amber-400 hover:text-amber-300"
          >
            <MaterialIcon name="restaurant_menu" />
          </Link>
        </header>

        {error ? (
          <div className="mb-4">
            <StatePanel tone="error" title="Feedback issue" message={error} />
          </div>
        ) : null}

        {/* Content */}
        <div className="text-center mt-4 mb-6">
          <h2 className="text-2xl font-bold text-zinc-100">How was your experience?</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Rate your meal and service for Table {tableNumber ?? "--"}.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col">
          {/* Emoji Rating Selection */}
          <EmojiRating value={rating} onChange={setRating} />

          {/* Comment input */}
          <div className="mt-4">
            <textarea
              id="comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-zinc-150 placeholder-zinc-600 outline-none transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm leading-relaxed"
              placeholder="Tell us more (optional)..."
            />
            <p className="text-right text-[10px] text-zinc-500 mt-1">
              {comment.length}/500
            </p>
          </div>

          {/* Buttons */}
          <Button
            type="submit"
            disabled={submitting || rating === null}
            className="mt-6 h-14 w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold text-base rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <Loader label="" /> : "Submit Feedback"}
          </Button>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-zinc-500 hover:text-zinc-300 font-medium py-3 text-center transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded mt-3"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
