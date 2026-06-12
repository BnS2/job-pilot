import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  iconClassName: string;
  label: string;
  value: string;
  valueDisplay?: "truncate" | "wrap";
};

export function JobInfoCard({
  icon,
  iconClassName,
  label,
  value,
  valueDisplay = "truncate",
}: Props) {
  const valueClassName =
    valueDisplay === "wrap"
      ? "break-words text-sm font-semibold leading-5 text-text-primary"
      : "truncate text-sm font-semibold leading-5 text-text-primary";

  return (
    <div className="flex min-h-20 items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${iconClassName}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p
          aria-label={`${label}: ${value}`}
          className={valueClassName}
          title={value}
        >
          {value}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase leading-4 tracking-wide text-text-muted">
          {label}
        </p>
      </div>
    </div>
  );
}
