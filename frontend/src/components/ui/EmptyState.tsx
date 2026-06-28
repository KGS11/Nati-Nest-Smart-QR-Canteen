import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="text-5xl mb-4 opacity-50 select-none">{icon}</div>
      <h3 className="text-lg font-medium text-text-secondary">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button
          type="button"
          onClick={action.onClick}
          className="mt-6 font-semibold active:scale-95 bg-accent-500 text-surface-base hover:bg-accent-400"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
