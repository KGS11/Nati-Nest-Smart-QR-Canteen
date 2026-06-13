import { MaterialIcon } from "./MaterialIcon";

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  meta?: string;
  tone?: "primary" | "secondary" | "tertiary" | "surface";
}

const toneClass = {
  primary: "bg-primary-fixed text-on-primary-fixed-variant",
  secondary: "bg-secondary-fixed text-on-secondary-fixed-variant",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  surface: "bg-surface-variant text-on-surface-variant",
};

export function MetricCard({ icon, label, value, meta, tone = "primary" }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-stitch">
      <div className="flex items-start justify-between">
        <span className={`rounded-lg p-xs ${toneClass[tone]}`}>
          <MaterialIcon name={icon} />
        </span>
        {meta ? <span className="font-label-md text-label-md text-primary">{meta}</span> : null}
      </div>
      <div>
        <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
        <h3 className="font-display-lg-mobile text-display-lg-mobile font-bold text-on-surface lg:font-headline-md lg:text-headline-md">
          {value}
        </h3>
      </div>
    </div>
  );
}
