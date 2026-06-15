type DashboardStatCardProps = {
  title: string;
  value: string;
  trend?: string;
  helper: string;
};

export function DashboardStatCard({
  title,
  value,
  trend,
  helper,
}: DashboardStatCardProps) {
  return (
    <article className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <p className="text-sm font-medium leading-5 text-text-secondary">{title}</p>
      <p className="mt-2 text-3xl font-semibold leading-9 text-text-primary">
        {value}
      </p>
      <div className="mt-3 flex items-center gap-3">
        {trend ? (
          <span className="rounded-sm bg-success-lightest px-2 py-0.5 text-xs font-medium leading-4 text-success-darker">
            {trend}
          </span>
        ) : null}
        <span className="text-xs font-normal leading-4 text-text-muted">
          {helper}
        </span>
      </div>
    </article>
  );
}
