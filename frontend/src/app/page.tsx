import Link from "next/link";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";

export default function HomePage() {
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
          <Link
            href="/customer/menu"
            className="inline-flex min-h-touch-min items-center justify-center gap-sm rounded-lg border border-zinc-700/80 bg-zinc-900/40 hover:bg-zinc-800/60 px-lg py-sm font-label-md text-label-md text-zinc-200 hover:text-white transition-all hover:border-zinc-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            <MaterialIcon name="restaurant_menu" />
            Customer Menu
          </Link>
        </div>
      </section>
    </main>
  );
}
