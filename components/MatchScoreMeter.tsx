import { MATCH_STRONG_THRESHOLD, MATCH_THRESHOLD } from "@/lib/utils";

type Props = {
  score: number;
  size?: "compact" | "full";
};

export function getMatchScoreTone(score: number): {
  badgeClass: string;
  fillClass: string;
  label: string;
  labelClass: string;
  markerClass: string;
  shortLabel: string;
} {
  if (score >= MATCH_STRONG_THRESHOLD) {
    return {
      badgeClass: "bg-success-lightest text-success-foreground",
      fillClass: "bg-success",
      label: "Strong match",
      labelClass: "text-success-foreground",
      markerClass: "bg-success",
      shortLabel: "Strong",
    };
  }

  if (score >= MATCH_THRESHOLD) {
    return {
      badgeClass: "bg-info-lightest text-info-foreground",
      fillClass: "bg-info-medium",
      label: "Good match",
      labelClass: "text-info-foreground",
      markerClass: "bg-info-medium",
      shortLabel: "Good",
    };
  }

  return {
    badgeClass: "bg-surface-secondary text-text-secondary",
    fillClass: "bg-warning",
    label: "Low match",
    labelClass: "text-text-secondary",
    markerClass: "bg-warning",
    shortLabel: "Low",
  };
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(Math.max(score, 0), 100);
}

export function MatchScoreMeter({ score, size = "compact" }: Props) {
  const safeScore = clampScore(score);
  const tone = getMatchScoreTone(safeScore);
  const isFull = size === "full";

  return (
    <div className={isFull ? "w-full" : "w-40"}>
      <div
        aria-label={`Match score ${safeScore} percent, ${tone.label}`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={safeScore}
        className={isFull ? "relative h-5" : "relative h-4"}
        role="progressbar"
        tabIndex={0}
      >
        <div
          aria-hidden="true"
          className={`absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-border-light ${
            isFull ? "h-3" : "h-2"
          }`}
        >
          <span
            className={`block h-full rounded-full ${tone.fillClass}`}
            style={{ width: `${safeScore}%` }}
          />
        </div>
        <span
          aria-hidden="true"
          className="absolute top-1/2 block h-4 w-px -translate-y-1/2 bg-surface"
          style={{ left: `${MATCH_THRESHOLD}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 block h-4 w-px -translate-y-1/2 bg-surface"
          style={{ left: `${MATCH_STRONG_THRESHOLD}%` }}
        />
        <span
          aria-hidden="true"
          className={`absolute top-1/2 block h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface shadow-sm ${tone.markerClass}`}
          style={{ left: `clamp(3px, ${safeScore}%, calc(100% - 3px))` }}
        />
      </div>

      <div
        className={`mt-1 text-xs leading-4 ${isFull ? "font-medium" : "font-normal"} ${
          tone.labelClass
        }`}
      >
        {tone.shortLabel}
      </div>
    </div>
  );
}
