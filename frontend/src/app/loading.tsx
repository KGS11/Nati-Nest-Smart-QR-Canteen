import Loader from "@/components/common/Loader";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base text-text-primary">
      <Loader label="Preparing Nati Nest..." />
    </div>
  );
}
