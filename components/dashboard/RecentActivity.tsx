type ActivityTone = "accent" | "info" | "success";

export type DashboardActivityItem = {
  label: string;
  time: string;
  tone: ActivityTone;
};

type RecentActivityProps = {
  activities: DashboardActivityItem[];
};

const dotClassByTone: Record<ActivityTone, string> = {
  accent: "bg-accent-light before:bg-accent",
  info: "bg-info-light before:bg-info",
  success: "bg-success-light before:bg-success-alt",
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <section className="rounded-xl border border-border bg-surface shadow-sm">
      <header className="border-b border-border px-6 py-6">
        <h2 className="text-base font-semibold leading-6 text-text-primary">
          Recent Activity
        </h2>
      </header>
      <div className="px-6 py-7">
        {activities.length === 0 ? (
          <p className="text-sm font-medium leading-5 text-text-muted">
            No recent activity yet.
          </p>
        ) : (
          <ol className="space-y-8">
            {activities.map((activity, index) => {
              const isLast = index === activities.length - 1;

              return (
                <li className="relative flex gap-5" key={`${activity.label}-${activity.time}`}>
                  {isLast ? null : (
                    <span
                      aria-hidden="true"
                      className="absolute left-2 top-5 h-[calc(100%+16px)] w-px bg-border"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={`relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full before:h-2 before:w-2 before:rounded-full ${dotClassByTone[activity.tone]}`}
                  />
                  <div>
                    <p className="text-sm font-medium leading-5 text-text-primary">
                      {activity.label}
                    </p>
                    <p className="mt-2 text-xs font-normal leading-4 text-text-muted">
                      {activity.time}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
