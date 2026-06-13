import { SessionGuard } from "@/components/guards/SessionGuard";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <div className="mx-auto min-h-screen max-w-md bg-surface font-body-md text-on-surface">
        {children}
      </div>
    </SessionGuard>
  );
}
