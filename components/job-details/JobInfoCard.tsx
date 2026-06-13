import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  iconClassName: string;
  label: string;
  value: string;
};

export function JobInfoCard({ icon, iconClassName, label, value }: Props) {
  return (
    <div className="flex min-w-0 gap-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${iconClassName}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-muted">
          {label}
        </p>
        <p
          aria-label={`${label}: ${value}`}
          className="mt-1 break-words text-sm font-semibold leading-5 text-text-primary"
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
