"use client";

import { useState } from "react";

import type { CompanyResearchPoint } from "@/components/dashboard/chartTypes";

type CompanyResearchActivityChartProps = {
  data: CompanyResearchPoint[];
};

function getYAxisLabels(maxValue: number): number[] {
  return [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map(
    (value) => Math.round(value),
  );
}

export function CompanyResearchActivityChart({
  data,
}: CompanyResearchActivityChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasData = data.some((bar) => bar.value > 0);
  const totalResearched = data.reduce((total, bar) => total + bar.value, 0);
  const activeDays = data.filter((bar) => bar.value > 0).length;
  const maxValue = Math.max(...data.map((bar) => bar.value), 1);
  const yAxisLabels = getYAxisLabels(maxValue);
  const barGap = data.length <= 1 ? 0 : 650 / (data.length - 1);
  const activeBar =
    activeIndex !== null
      ? {
          ...data[activeIndex],
          x: data.length <= 1 ? 394 : 76 + activeIndex * barGap,
          y: 262 - (data[activeIndex].value / maxValue) * 232,
        }
      : null;
  const activeBarTooltipBelow = activeBar ? activeBar.y < 70 : false;

  return (
    <section className="w-full rounded-xl border border-border bg-surface p-6 shadow-sm">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold leading-6 text-text-primary">
            Company Research Activity
          </h2>
          <p className="mt-1 text-xs font-normal leading-4 text-text-muted">
            {totalResearched} researched in the last 7 days
          </p>
        </div>
        {hasData ? (
          <div className="rounded-md bg-info-lightest px-3 py-2 text-right">
            <p className="text-xs font-semibold leading-4 text-info-foreground">
              {activeDays} active {activeDays === 1 ? "day" : "days"}
            </p>
            <p className="mt-0.5 text-xs font-normal leading-4 text-text-muted">
              7-day view
            </p>
          </div>
        ) : null}
      </header>
      {hasData ? null : (
        <div className="mt-5 flex h-[250px] items-center justify-center rounded-md border border-dashed border-border bg-surface-secondary px-6 text-center">
          <p className="text-sm font-medium leading-5 text-text-muted">
            No company research events yet.
          </p>
        </div>
      )}
      {hasData ? (
      <div className="relative mt-5 overflow-visible">
        <svg
          aria-label="Company research activity by day"
          className="h-[250px] w-full"
          role="img"
          viewBox="0 0 760 310"
        >
          {yAxisLabels.map((label, index) => {
            const y = 30 + index * 58;

            return (
              <g key={label}>
                <text
                  className="fill-text-muted text-xs"
                  textAnchor="end"
                  x="42"
                  y={y + 4}
                >
                  {label}
                </text>
                <line
                  className="stroke-border"
                  strokeDasharray="4 4"
                  x1="52"
                  x2="735"
                  y1={y}
                  y2={y}
                />
              </g>
            );
          })}
          {data.map((bar, index) => {
            const height = (bar.value / maxValue) * 232;
            const x = data.length <= 1 ? 394 : 76 + index * barGap;
            const y = 262 - height;

            return (
              <g
                aria-label={`${bar.day}: ${bar.value} companies researched`}
                key={bar.day}
                onBlur={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                role="img"
                tabIndex={0}
              >
                <rect
                  className={index === activeIndex ? "fill-accent" : "fill-info"}
                  height={height}
                  rx="5"
                  width="48"
                  x={x}
                  y={y}
                />
                <rect
                  fill="transparent"
                  height="252"
                  width="64"
                  x={x - 8}
                  y="10"
                />
                <text
                  className="fill-text-muted text-xs"
                  textAnchor="middle"
                  x={x + 24}
                  y="295"
                >
                  {bar.day}
                </text>
              </g>
            );
          })}
        </svg>
        {activeBar ? (
          <div
            className="pointer-events-none absolute z-10 min-w-36 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium leading-4 text-text-primary shadow-sm"
            style={{
              left: `${((activeBar.x + 24) / 760) * 100}%`,
              top: `${(activeBar.y / 310) * 100}%`,
              transform: activeBarTooltipBelow
                ? "translate(-50%, 10px)"
                : "translate(-50%, calc(-100% - 10px))",
            }}
          >
            <p className="font-semibold text-text-primary">{activeBar.day}</p>
            <p className="mt-1 text-text-secondary">
              {activeBar.value} {activeBar.value === 1 ? "company" : "companies"} researched
            </p>
          </div>
        ) : null}
      </div>
      ) : null}
    </section>
  );
}
