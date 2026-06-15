"use client";

import { useState } from "react";

import type { MatchScoreBucket } from "@/components/dashboard/chartTypes";

type MatchScoreDistributionChartProps = {
  data: MatchScoreBucket[];
};

function getDistributionLabels(maxValue: number): number[] {
  return [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map(
    (value) => Math.round(value),
  );
}

export function MatchScoreDistributionChart({
  data,
}: MatchScoreDistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasData = data.some((bar) => bar.value > 0);
  const totalScoredJobs = data.reduce((total, bar) => total + bar.value, 0);
  const strongestBuckets = data
    .filter((bar) => bar.range === "80-90%" || bar.range === "90-100%")
    .reduce((total, bar) => total + bar.value, 0);
  const maxValue = Math.max(...data.map((bar) => bar.value), 1);
  const distributionLabels = getDistributionLabels(maxValue);
  const barGap = data.length <= 1 ? 0 : 328 / (data.length - 1);
  const activeBar =
    activeIndex !== null
      ? {
          ...data[activeIndex],
          x: data.length <= 1 ? 246 : 82 + activeIndex * barGap,
          y: 288 - (data[activeIndex].value / maxValue) * 256,
        }
      : null;
  const activeBarTooltipBelow = activeBar ? activeBar.y < 70 : false;

  return (
    <section className="w-full rounded-xl border border-border bg-surface p-6 shadow-sm">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold leading-6 text-text-primary">
            Match Score Distribution
          </h2>
          <p className="mt-1 text-xs font-normal leading-4 text-text-muted">
            {totalScoredJobs} scored {totalScoredJobs === 1 ? "job" : "jobs"}
          </p>
        </div>
        {hasData ? (
          <div className="rounded-md bg-success-lightest px-3 py-2 text-right">
            <p className="text-xs font-semibold leading-4 text-success-foreground">
              {strongestBuckets} strong
            </p>
            <p className="mt-0.5 text-xs font-normal leading-4 text-text-muted">
              80%+
            </p>
          </div>
        ) : null}
      </header>
      {hasData ? null : (
        <div className="mt-5 flex h-[260px] items-center justify-center rounded-md border border-dashed border-border bg-surface-secondary px-6 text-center">
          <p className="text-sm font-medium leading-5 text-text-muted">
            No match score events yet.
          </p>
        </div>
      )}
      {hasData ? (
      <div className="relative mt-5 overflow-visible">
        <svg
          aria-label="Match score distribution"
          className="h-[260px] w-full"
          role="img"
          viewBox="0 0 500 320"
        >
          {distributionLabels.map((label, index) => {
            const y = 32 + index * 64;

            return (
              <g key={label}>
                <text
                  className="fill-text-muted text-xs"
                  textAnchor="end"
                  x="46"
                  y={y + 4}
                >
                  {label}
                </text>
                <line
                  className="stroke-border"
                  strokeDasharray="4 4"
                  x1="58"
                  x2="476"
                  y1={y}
                  y2={y}
                />
              </g>
            );
          })}
          {data.map((bar, index) => {
            const height = (bar.value / maxValue) * 256;
            const x = data.length <= 1 ? 246 : 82 + index * barGap;
            const y = 288 - height;

            return (
              <g
                aria-label={`${bar.range}: ${bar.value} jobs`}
                key={bar.range}
                onBlur={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                role="img"
                tabIndex={0}
              >
                <rect
                  className={index === activeIndex ? "fill-accent" : "fill-success"}
                  height={height}
                  rx="5"
                  width="40"
                  x={x}
                  y={y}
                />
                <rect
                  fill="transparent"
                  height="270"
                  width="56"
                  x={x - 8}
                  y="18"
                />
                <text
                  className="fill-text-muted text-xs"
                  textAnchor="middle"
                  x={x + 20}
                  y="310"
                >
                  {bar.range}
                </text>
              </g>
            );
          })}
        </svg>
        {activeBar ? (
          <div
            className="pointer-events-none absolute z-10 min-w-32 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium leading-4 text-text-primary shadow-sm"
            style={{
              left: `${((activeBar.x + 20) / 500) * 100}%`,
              top: `${(activeBar.y / 320) * 100}%`,
              transform: activeBarTooltipBelow
                ? "translate(-50%, 10px)"
                : "translate(-50%, calc(-100% - 10px))",
            }}
          >
            <p className="font-semibold text-text-primary">{activeBar.range}</p>
            <p className="mt-1 text-text-secondary">
              {activeBar.value} {activeBar.value === 1 ? "job" : "jobs"}
            </p>
          </div>
        ) : null}
      </div>
      ) : null}
    </section>
  );
}
