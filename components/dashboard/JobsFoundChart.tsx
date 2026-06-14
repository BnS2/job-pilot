"use client";

import { useState } from "react";

import type { JobsFoundPoint } from "@/components/dashboard/chartTypes";

type JobsFoundChartProps = {
  data: JobsFoundPoint[];
};

function getChartLabels(maxValue: number): number[] {
  return [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map(
    (value) => Math.round(value),
  );
}

function buildLinePath(points: Array<{ x: number; y: number }>): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function JobsFoundChart({ data }: JobsFoundChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasData = data.some((point) => point.value > 0);
  const totalJobsFound = data.reduce((total, point) => total + point.value, 0);
  const peakPoint = data.reduce(
    (currentPeak, point) => (point.value > currentPeak.value ? point : currentPeak),
    data[0] ?? { day: "", value: 0 },
  );
  const maxValue = Math.max(...data.map((point) => point.value), 1);
  const chartLabels = getChartLabels(maxValue);
  const points = data.map((point, index) => {
    const x =
      data.length <= 1 ? 60 : 60 + (index / (data.length - 1)) * 950;
    const y = 272 - (point.value / maxValue) * 240;

    return { x, y };
  });
  const linePath = buildLinePath(points);
  const areaPath =
    points.length === 0
      ? ""
      : `${linePath} L${points[points.length - 1].x} 288 L60 288 Z`;
  const labelStep = Math.max(1, Math.ceil(data.length / 6));
  const activePoint =
    activeIndex !== null ? { ...data[activeIndex], ...points[activeIndex] } : null;
  const activePointTooltipBelow = activePoint ? activePoint.y < 70 : false;

  return (
    <section className="w-full rounded-xl border border-border bg-surface p-6 shadow-sm">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold leading-6 text-text-primary">
            Jobs Found Over Time
          </h2>
          <p className="mt-1 text-xs font-normal leading-4 text-text-muted">
            {formatCount(totalJobsFound, "job", "jobs")} discovered in the last 30 days
          </p>
        </div>
        {hasData ? (
          <div className="rounded-md bg-accent-muted px-3 py-2 text-right">
            <p className="text-xs font-semibold leading-4 text-accent">
              Peak {peakPoint.value}
            </p>
            <p className="mt-0.5 text-xs font-normal leading-4 text-text-muted">
              {peakPoint.day}
            </p>
          </div>
        ) : null}
      </header>
      {hasData ? null : (
        <div className="mt-5 flex h-[260px] items-center justify-center rounded-md border border-dashed border-border bg-surface-secondary px-6 text-center">
          <p className="text-sm font-medium leading-5 text-text-muted">
            No job discovery events yet.
          </p>
        </div>
      )}
      {hasData ? (
      <div className="relative mt-5 overflow-visible">
        <svg
          aria-label="Jobs found over time"
          className="h-[260px] w-full"
          role="img"
          viewBox="0 0 1040 320"
        >
          <defs>
            <linearGradient id="jobs-found-fill" x1="0" x2="0" y1="0" y2="1">
              <stop stopColor="var(--color-accent)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {chartLabels.map((label, index) => {
            const y = 32 + index * 64;

            return (
              <g key={label}>
                <text
                  className="fill-text-muted text-xs"
                  textAnchor="end"
                  x="48"
                  y={y + 4}
                >
                  {label}
                </text>
                <line
                  className="stroke-border"
                  strokeDasharray="4 4"
                  x1="60"
                  x2="1010"
                  y1={y}
                  y2={y}
                />
              </g>
            );
          })}
          <path
            className="stroke-accent"
            d={linePath}
            fill="none"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d={areaPath}
            fill="url(#jobs-found-fill)"
          />
          {data.map((point, index) => (
            <g
              aria-label={`${point.day}: ${point.value} jobs found`}
              key={`${point.day}-hit-${index}`}
              onBlur={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              role="img"
              tabIndex={0}
            >
              <circle
                className={index === activeIndex ? "fill-accent" : "fill-surface"}
                cx={points[index].x}
                cy={points[index].y}
                r={index === activeIndex ? "6" : "4"}
                stroke="var(--color-accent)"
                strokeWidth="3"
              />
              <circle
                cx={points[index].x}
                cy={points[index].y}
                fill="transparent"
                r="16"
              />
            </g>
          ))}
          {data.map((point, index) => {
            const shouldShowLabel = index % labelStep === 0 || index === data.length - 1;

            if (!shouldShowLabel) {
              return null;
            }

            return (
              <text
                className="fill-text-muted text-xs"
                key={`${point.day}-${index}`}
                textAnchor="middle"
                x={points[index].x}
                y="310"
              >
                {point.day}
              </text>
            );
          })}
        </svg>
        {activePoint ? (
          <div
            className="pointer-events-none absolute z-10 min-w-32 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium leading-4 text-text-primary shadow-sm"
            style={{
              left: `${(activePoint.x / 1040) * 100}%`,
              top: `${(activePoint.y / 320) * 100}%`,
              transform: activePointTooltipBelow
                ? "translate(-50%, 10px)"
                : "translate(-50%, calc(-100% - 10px))",
            }}
          >
            <p className="font-semibold text-text-primary">{activePoint.day}</p>
            <p className="mt-1 text-text-secondary">
              {activePoint.value} {activePoint.value === 1 ? "job" : "jobs"} found
            </p>
          </div>
        ) : null}
      </div>
      ) : null}
    </section>
  );
}
