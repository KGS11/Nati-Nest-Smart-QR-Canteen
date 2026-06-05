import Link from "next/link";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-lg text-center">
        <p className="text-sm font-medium text-amber-400">Nati Nest</p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-50">Frontend foundation ready</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Core clients, stores, guards, layouts, loading, and error foundations are in place.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-all duration-200 hover:bg-amber-400"
          >
            Staff login shell
          </Link>
        </div>
      </Card>
    </main>
  );
}
