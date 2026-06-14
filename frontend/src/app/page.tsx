"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";

export default function HomePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [error, setError] = useState("");

  const handleGoToMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError("Please enter a table number.");
      return;
    }
    setError("");
    router.push(`/scan/${tableNumber.trim()}`);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] p-margin-mobile font-body-md md:p-margin-desktop">
      {/* Premium background gradient blobs */}
      <div className="absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-gradient-to-tr from-amber-500/10 to-orange-500/10 opacity-60 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-gradient-to-br from-orange-500/5 to-rose-500/10 opacity-40 blur-[100px]" />

      <section className="z-10 w-full max-w-xl rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-xl text-center shadow-[0_0_50px_-12px_rgba(249,115,22,0.15)] transition-all duration-300">
        <div className="mx-auto mb-md flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]">
          <MaterialIcon name="restaurant" className="text-4xl" />
        </div>
        <p className="font-label-md text-label-md uppercase tracking-wider text-amber-500/80 font-semibold">
          Smart QR Canteen Management
        </p>
        <h1 className="mt-sm font-display-lg-mobile text-display-lg-mobile font-black bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent md:font-display-lg md:text-display-lg">
          Nati Nest
        </h1>
        <p className="mx-auto mt-md max-w-md font-body-md text-body-md text-zinc-400 font-medium leading-relaxed">
          Staff can sign in to manage live operations. Customers start by scanning the QR code on
          their table.
        </p>
        <div className="mt-xl flex flex-col justify-center gap-sm sm:flex-row">
          <Link
            href="/login"
            className="inline-flex min-h-touch-min items-center justify-center gap-sm rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-lg py-sm font-label-md text-label-md text-zinc-950 font-bold shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:shadow-[0_4px_30px_rgba(249,115,22,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <MaterialIcon name="login" />
            Staff Login
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex min-h-touch-min items-center justify-center gap-sm rounded-lg border border-zinc-700/80 bg-zinc-900/40 hover:bg-zinc-800/60 px-lg py-sm font-label-md text-label-md text-zinc-200 hover:text-white transition-all hover:border-zinc-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            <MaterialIcon name="restaurant_menu" />
            Customer Menu
          </button>
        </div>
      </section>

      {/* Enter Table Number Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div 
            className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <MaterialIcon name="table_restaurant" className="text-amber-500" />
                Select Table
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setTableNumber("");
                  setError("");
                }}
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <MaterialIcon name="close" />
              </button>
            </div>

            <form onSubmit={handleGoToMenu} className="mt-4 space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Please enter the table number displayed on your table's QR standee to view the menu and place orders.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  Table Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1, 2, 3..."
                  value={tableNumber}
                  onChange={(e) => {
                    setTableNumber(e.target.value);
                    if (error) setError("");
                  }}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setTableNumber("");
                    setError("");
                  }}
                  className="flex-1 rounded-lg border border-zinc-805 py-2.5 text-xs font-bold text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-xs font-bold text-zinc-950 shadow-md hover:from-orange-600 hover:to-amber-600 transition-colors"
                >
                  Go to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
