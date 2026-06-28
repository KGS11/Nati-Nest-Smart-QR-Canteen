"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 p-margin-mobile font-sans md:p-margin-desktop">
      {/* Premium background gradient blobs */}
      <div className="absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-gradient-to-tr from-brand-500/10 to-orange-500/10 opacity-60 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-gradient-to-br from-orange-500/5 to-rose-500/10 opacity-40 blur-[100px]" />

      <section className="z-10 w-full max-w-xl rounded-2xl bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/80 p-xl text-center shadow-[0_0_50px_-12px_rgba(234,117,15,0.15)] transition-all duration-300">
        <div className="mx-auto mb-md flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-orange-600 text-white shadow-[0_0_20px_rgba(234,117,15,0.4)]">
          <MaterialIcon name="restaurant" className="text-4xl" />
        </div>
        <p className="font-sans text-label-md uppercase tracking-wider text-brand-500/80 font-semibold">
          Smart QR Canteen Management
        </p>
        <h1 className="mt-sm font-sans text-display-xl font-black bg-gradient-to-r from-brand-400 via-orange-500 to-rose-500 bg-clip-text text-transparent md:text-display-2xl">
          Nati Nest
        </h1>
        <p className="mx-auto mt-md max-w-md font-sans text-body-lg text-neutral-400 font-medium leading-relaxed">
          Staff can sign in to manage live operations. Customers start by scanning the QR code on
          their table.
        </p>
        <div className="mt-xl flex flex-col justify-center gap-sm sm:flex-row">
          <Link
            href="/login"
            className="inline-flex min-h-touch-min items-center justify-center gap-sm rounded-lg bg-gradient-to-r from-orange-500 to-brand-500 hover:from-orange-600 hover:to-brand-600 px-lg py-sm text-label-md text-white font-bold shadow-[0_4px_20px_rgba(234,117,15,0.3)] hover:shadow-[0_4px_30px_rgba(234,117,15,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <MaterialIcon name="login" />
            Staff Login
          </Link>
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="min-h-touch-min bg-neutral-900/40 border-neutral-700/80 hover:bg-neutral-800/60 hover:text-white px-lg py-sm text-label-md text-neutral-200"
          >
            <MaterialIcon name="restaurant_menu" className="mr-2" />
            Customer Menu
          </Button>
        </div>
      </section>

      {/* Enter Table Number Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card
            className="w-full max-w-sm rounded-2xl border-neutral-800 bg-neutral-900/95 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b border-neutral-800 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-display-sm text-neutral-100 flex items-center gap-2">
                <MaterialIcon name="table_restaurant" className="text-brand-500" />
                Select Table
              </CardTitle>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setTableNumber("");
                  setError("");
                }}
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <MaterialIcon name="close" />
              </button>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleGoToMenu} className="space-y-4">
                <p className="text-body-sm text-neutral-400 leading-relaxed">
                  Please enter the table number displayed on your table's QR standee to view the menu and place orders.
                </p>

                <div>
                  <Label className="block text-label-sm uppercase text-neutral-500 mb-2">
                    Table Number
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g. 1, 2, 3..."
                    value={tableNumber}
                    onChange={(e) => {
                      setTableNumber(e.target.value);
                      if (error) setError("");
                    }}
                    className="bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-brand-500 focus-visible:border-brand-500"
                  />
                  {error && <p className="mt-1 text-body-xs text-semantic_error-500">{error}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setTableNumber("");
                      setError("");
                    }}
                    className="flex-1 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="brand"
                    className="flex-1 shadow-md bg-gradient-to-r from-orange-500 to-brand-500 hover:from-orange-600 hover:to-brand-600"
                  >
                    Go to Menu
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
