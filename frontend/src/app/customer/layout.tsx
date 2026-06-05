import { SessionGuard } from "@/components/guards/SessionGuard";
import { BottomNav } from "@/components/layout/BottomNav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <div className="mx-auto flex min-h-screen max-w-md flex-col border-x border-zinc-800 bg-zinc-950 text-zinc-100">
        <div className="border-b border-zinc-800 px-4 py-3">
          <p className="text-sm font-medium text-amber-400">Nati Nest</p>
        </div>
        <main className="min-h-0 flex-1 p-4">{children}</main>
        <BottomNav />
      </div>
    </SessionGuard>
  );
}
