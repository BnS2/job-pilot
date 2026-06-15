import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";

export type DashboardStats = {
  activeJobsFound: number;
  averageMatchRate: number | null;
  companiesResearched: number;
  jobsThisWeek: number;
};

type StatsBarProps = {
  stats: DashboardStats;
};

export function StatsBar({ stats }: StatsBarProps) {
  const statCards = [
    {
      title: "Active Jobs Found",
      value: String(stats.activeJobsFound),
      helper:
        stats.activeJobsFound === 1 ? "Active opportunity" : "Active opportunities",
    },
    {
      title: "Avg. Match Rate",
      value:
        stats.averageMatchRate === null ? "0%" : `${stats.averageMatchRate}%`,
      helper:
        stats.averageMatchRate === null
          ? "No active matches yet"
          : "Across active jobs",
    },
    {
      title: "Companies Researched",
      value: String(stats.companiesResearched),
      helper: "Total researched",
    },
    {
      title: "Jobs This Week",
      value: String(stats.jobsThisWeek),
      helper: "Found or refreshed this week",
    },
  ];

  return (
    <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => (
        <DashboardStatCard
          helper={stat.helper}
          key={stat.title}
          title={stat.title}
          value={stat.value}
        />
      ))}
    </section>
  );
}
