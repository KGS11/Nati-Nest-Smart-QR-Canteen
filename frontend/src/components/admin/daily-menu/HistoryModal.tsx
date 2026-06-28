"use client";

import { useEffect, useState } from "react";
import { dailyMenuService } from "@/services/dailyMenuService";
import { Button } from "@/components/common/Button";

interface HistoryModalProps {
  onClose: () => void;
}

export function HistoryModal({ onClose }: HistoryModalProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (dateStr: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dailyMenuService.getHistoryMenu(dateStr);
      setHistoryItems(data.items);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(selectedDate);
  }, [selectedDate]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-surface-raised border border-border-primary rounded-2xl max-w-2xl w-full mx-auto mt-20 p-6 shadow-2xl relative flex flex-col max-h-[80vh]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-transparent border-0 cursor-pointer text-lg p-2 hover:bg-surface-overlay rounded-xl"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-2">
          <span>📅</span> Daily Menu Audit History
        </h3>
        <p className="text-xs text-text-secondary mb-6">
          View menu configurations, additions, and removals for any past date.
        </p>

        <div className="flex items-center gap-3 mb-6 bg-surface-base p-3 rounded-xl border border-border-primary">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Select Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-surface-raised border border-border-primary rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-500 text-text-primary"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-text-tertiary font-medium">
              <span className="animate-spin mr-2">⏳</span> Loading history...
            </div>
          ) : error ? (
            <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/10 p-4 rounded-xl text-center">
              {error}
            </div>
          ) : historyItems.length === 0 ? (
            <div className="text-center py-20 text-text-tertiary">
              No menu session was configured on this date.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="hidden sm:grid sm:grid-cols-4 gap-2 text-xs font-bold uppercase tracking-wider text-text-tertiary pb-2 border-b border-border-primary px-2">
                <span>Item</span>
                <span>Category</span>
                <span>Added By</span>
                <span>Status</span>
              </div>
              <div className="space-y-2">
                {historyItems.map((item) => (
                  <div
                    key={item.dailyMenuId}
                    className="grid sm:grid-cols-4 gap-2 text-sm bg-surface-base/40 border border-border-primary p-3 rounded-xl hover:border-border-secondary transition-all"
                  >
                    <div>
                      <div className="font-bold text-text-primary">{item.name}</div>
                      <div className="text-xs text-accent-500 font-semibold mt-0.5">
                        ₹{item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-xs text-text-tertiary flex items-center">
                      {item.category}
                    </div>
                    <div className="text-xs text-text-tertiary flex flex-col justify-center">
                      <span className="font-medium text-text-primary">
                        {item.addedBy}
                      </span>
                      <span className="text-[10px] text-text-tertiary">
                        {new Date(item.addedAt).toLocaleTimeString("en-IN", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-xs flex flex-col justify-center">
                      {item.removedAt ? (
                        <>
                          <span className="text-red-400 font-semibold">
                            Removed
                          </span>
                          <span className="text-[10px] text-text-tertiary">
                            By {item.removedBy} at{" "}
                            {new Date(item.removedAt).toLocaleTimeString(
                              "en-IN",
                              { hour: "numeric", minute: "2-digit" }
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="text-emerald-400 font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-border-primary pt-4 flex justify-end shrink-0">
          <Button variant="secondary" onClick={onClose} className="rounded-xl px-6">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
