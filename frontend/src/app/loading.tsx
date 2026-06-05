import Loader from "@/components/common/Loader";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-amber-50">
      <Loader label="Preparing Nati Nest..." />
    </div>
  );
}
