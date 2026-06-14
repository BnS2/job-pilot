import type { CSSProperties, ReactNode } from "react";

import { toast as sonner } from "sonner";

type ToastTone = "success" | "error" | "info";

const TOAST_SHADOW = "0px 8px 24px color-mix(in srgb, var(--color-overlay) 14%, transparent)";

const BASE_STYLE: CSSProperties = {
  fontSize: "14px",
  fontWeight: 500,
  fontFamily: "var(--font-sans)",
  borderRadius: "8px",
  border: "1px solid var(--color-border)",
  padding: "12px 16px",
  boxShadow: TOAST_SHADOW,
  color: "var(--color-text-primary)",
  maxWidth: "360px",
  width: "min(360px, calc(100vw - 32px))",
};

function getToastStyle(tone: ToastTone): CSSProperties {
  const toneStyle: Record<ToastTone, CSSProperties> = {
    success: {
      background: "var(--color-success-lightest)",
      borderColor: "var(--color-success)",
      boxShadow: `inset 4px 0 0 var(--color-success), ${TOAST_SHADOW}`,
    },
    error: {
      background: "color-mix(in srgb, var(--color-error) 12%, var(--color-surface))",
      borderColor: "var(--color-error)",
      boxShadow: `inset 4px 0 0 var(--color-error), ${TOAST_SHADOW}`,
    },
    info: {
      background: "var(--color-info-lightest)",
      borderColor: "var(--color-info)",
      boxShadow: `inset 4px 0 0 var(--color-info), ${TOAST_SHADOW}`,
    },
  };

  return toneStyle[tone];
}

function emit(message: string, tone: ToastTone): void {
  sonner(<ToastContent message={message} tone={tone} />, {
    style: { ...BASE_STYLE, ...getToastStyle(tone) },
    duration: tone === "error" ? 5000 : 3500,
  });
}

/* ------------------------------------------------------------------ */
/*  Rich status-change toast — per-action icon + color + slow decay    */
/* ------------------------------------------------------------------ */

/* ---------- icons ---------- */

function CheckCircle() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="var(--color-success)" />
      <path
        d="M8 12.5l2.5 2.5 5-5"
        stroke="var(--color-surface)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function ArchiveBox() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 9h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9z"
        fill="var(--color-text-muted)"
      />
      <path
        d="M3 5h18l-1.5 3H4.5L3 5z"
        fill="var(--color-text-muted)"
      />
      <path
        d="M12 12v5m-3-3 3 3 3-3"
        stroke="var(--color-surface)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SlashCircle() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="var(--color-error)" />
      <line
        x1="5"
        x2="19"
        y1="5"
        y2="19"
        stroke="var(--color-surface)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function RefreshArrows() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="var(--color-info)" />
      <path
        d="M3 5v4h4M21 19v-4h-4"
        stroke="var(--color-surface)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M19.5 9.5A9 9 0 0 0 6.5 6.5L3 10.5m18 3-3.5 3.5A9 9 0 0 1 4.5 14.5"
        stroke="var(--color-surface)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function WarningTriangle() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M12 2L2 22h20L12 2z" fill="var(--color-warning)" />
      <path
        d="M12 10v4"
        stroke="var(--color-surface)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <circle cx="12" cy="17.5" r="1.25" fill="var(--color-surface)" />
    </svg>
  );
}

function XCircle() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="var(--color-error)" />
      <path
        d="M8.5 8.5l7 7M15.5 8.5l-7 7"
        stroke="var(--color-surface)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function InfoCircle() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="var(--color-info)" />
      <path
        d="M12 10v7"
        stroke="var(--color-surface)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <circle cx="12" cy="7" r="1.25" fill="var(--color-surface)" />
    </svg>
  );
}

const TONE_ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckCircle />,
  error: <XCircle />,
  info: <InfoCircle />,
};

type ToastContentProps = {
  message: string;
  tone: ToastTone;
};

function ToastContent({ message, tone }: ToastContentProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="shrink-0">{TONE_ICONS[tone]}</div>
      <p className="min-w-0 flex-1 break-words text-sm font-semibold leading-5 text-text-primary">
        {message}
      </p>
    </div>
  );
}

/* ---------- variant config ---------- */

type StatusChangeVariant =
  | "applied"
  | "archived"
  | "rejected"
  | "completed"
  | "restored"
  | "restored-unavailable"
  | "error";

const VARIANT_ICONS: Record<StatusChangeVariant, ReactNode> = {
  applied: <CheckCircle />,
  archived: <ArchiveBox />,
  rejected: <SlashCircle />,
  completed: <CheckCircle />,
  restored: <RefreshArrows />,
  "restored-unavailable": <WarningTriangle />,
  error: <XCircle />,
};

const VARIANT_STYLE: Record<
  StatusChangeVariant,
  { background: string; borderColor: string; accentColor: string; duration: number }
> = {
  applied: {
    background: "var(--color-success-lightest)",
    borderColor: "var(--color-success)",
    accentColor: "var(--color-success)",
    duration: 6000,
  },
  archived: {
    background: "var(--color-surface)",
    borderColor: "var(--color-border)",
    accentColor: "var(--color-text-muted)",
    duration: 6000,
  },
  rejected: {
    background: "color-mix(in srgb, var(--color-error) 12%, var(--color-surface))",
    borderColor: "var(--color-error)",
    accentColor: "var(--color-error)",
    duration: 6000,
  },
  completed: {
    background: "var(--color-success-lightest)",
    borderColor: "var(--color-success)",
    accentColor: "var(--color-success)",
    duration: 6000,
  },
  restored: {
    background: "var(--color-info-lightest)",
    borderColor: "var(--color-info)",
    accentColor: "var(--color-info)",
    duration: 6000,
  },
  "restored-unavailable": {
    background: "color-mix(in srgb, var(--color-warning) 10%, var(--color-surface))",
    borderColor: "var(--color-warning)",
    accentColor: "var(--color-warning)",
    duration: 7000,
  },
  error: {
    background: "color-mix(in srgb, var(--color-error) 12%, var(--color-surface))",
    borderColor: "var(--color-error)",
    accentColor: "var(--color-error)",
    duration: 5000,
  },
};

/* ---------- component ---------- */

type StatusChangeOptions = {
  variant: StatusChangeVariant;
  title: string;
  subtitle?: string;
};

function StatusChangeContent({ variant, title, subtitle }: StatusChangeOptions) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="shrink-0">{VARIANT_ICONS[variant]}</div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="break-words text-sm font-semibold leading-5 text-text-primary">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs font-medium leading-4 text-text-secondary">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function statusChange(opts: StatusChangeOptions): void {
  const style = VARIANT_STYLE[opts.variant];
  sonner(<StatusChangeContent {...opts} />, {
    style: {
      ...BASE_STYLE,
      background: style.background,
      borderColor: style.borderColor,
      boxShadow: `inset 4px 0 0 ${style.accentColor}, ${TOAST_SHADOW}`,
    },
    duration: style.duration,
  });
}

/* ------------------------------------------------------------------ */

export const toast = {
  success: (message: string) => emit(message, "success"),
  error: (message: string) => emit(message, "error"),
  info: (message: string) => emit(message, "info"),
  statusChange,
};
