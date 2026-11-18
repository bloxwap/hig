"use client";

import { singleRowLayout, toastWidth } from './toast-layout';
import type { ReactNode } from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
const cn = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(" ");

export type NotificationTone =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral";

export type NotificationAction = { label: string; icon?: ReactNode; onClick: () => void; appearance?: "solid" | "badge" };

/**
 * Toast presentation with tone-based accents and an optional icon override. The caller owns
 * toast lifetime.
 */
export function NotificationCard({
  tone = "neutral",
  title,
  description,
  icon,
  onClick,
}: {
  tone?: NotificationTone;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Makes the whole pill a button; the caller owns dismissal or retry behavior. */
  onClick?: () => void;
}) {
  const iconNode = icon !== undefined ? icon : tone === "neutral" ? <Info className="h-5 w-5" strokeWidth={2.5} /> : DEFAULT_ICON[tone];
  const baseClass = cn(
    "pointer-events-auto flex w-fit max-w-[min(92vw,28rem)] items-center gap-2.5 rounded-full border-2 bg-background/95 pl-2 pr-5",
    description ? "py-2" : singleRowLayout,
    `toast-tone toast-tone-${tone}`,
    onClick && "transition-transform active:scale-[0.98] hover:bg-background"
  );
  const body = (
    <>
      {iconNode ? (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            "toast-tone-tile"
          )}
        >
          {iconNode}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-col items-start">
        <span className="w-full truncate text-sm font-semibold leading-tight text-foreground">
          {title}
        </span>
        {description ? (
          <span className="line-clamp-2 w-full text-xs leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </div>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClass}>
        {body}
      </button>
    );
  }
  return <div className={baseClass}>{body}</div>;
}

const DEFAULT_ICON: Record<NotificationTone, ReactNode> = {
  success: <Check className="h-4 w-4" strokeWidth={3} />,
  error: <X className="h-4 w-4" strokeWidth={3} />,
  warning: <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />,
  info: <Info className="h-4 w-4" strokeWidth={2.5} />,
  neutral: null,
};

/**
 * Toast presentation with inline actions, switching to a stacked layout when both actions
 * exist.
 */
export function InfoCard({
  tone = "neutral",
  title,
  description,
  icon,
  action,
  secondaryAction,
  actionLayout = "inline",
  onClose,
  closeLabel = "Dismiss",
}: {
  tone?: NotificationTone;
  title: ReactNode;
  description?: ReactNode;
  /** Override the tone glyph; null hides the icon tile. Neutral defaults to Info. */
  icon?: ReactNode;
  /** Primary action, displayed inline unless both actions are present. */
  action?: NotificationAction;
  /** Displayed only when a primary action is also present. */
  secondaryAction?: NotificationAction;
  /** Place actions below the message for longer notices. */
  actionLayout?: "inline" | "stacked";
  /** Displays a close button; the caller owns dismissal. */
  onClose?: () => void;
  /** Accessible name for the close button. */
  closeLabel?: string;
}) {
  const iconNode =
    icon !== undefined
      ? icon
      : tone === "neutral"
        ? <Info className="h-5 w-5" strokeWidth={2.5} />
        : DEFAULT_ICON[tone];
  const stacked = action != null && (secondaryAction != null || actionLayout === "stacked");
  const iconBlock = iconNode ? (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        "toast-tone-tile",
      )}
    >
      {iconNode}
    </div>
  ) : null;
  const titleBlock = (
    <div className="min-w-0 flex-1">
      <div
        className={cn(
          "text-sm font-semibold leading-tight text-foreground",
          description || typeof title !== "string" ? "text-balance" : "truncate",
        )}
      >
        {title}
      </div>
      {description ? (
        <p className={cn("mt-0.5 text-xs font-medium leading-snug text-muted-foreground", !stacked && "line-clamp-2")}>
          {description}
        </p>
      ) : null}
    </div>
  );
  const closeBlock = onClose ? (
    <button
      type="button"
      onClick={onClose}
      aria-label={closeLabel}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <X className="h-4 w-4" />
    </button>
  ) : null;
  const renderAction = (
    a: NotificationAction,
    role: "primary" | "secondary",
  ) => (
    <button
      key={role}
      type="button"
      onClick={a.onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 transition-colors",
        "text-sm font-extrabold",
        stacked && "w-full",
        role === "primary"
          ? "toast-tone-button"
          : "toast-secondary-button",
      )}
    >
      {a.icon && <span aria-hidden="true" className="shrink-0">{a.icon}</span>}
      {a.label}
    </button>
  );
  if (stacked) {
    return (
      <div
        className={cn(
          // Outer radius = 18px control radius + 12px inset + 2px border (at the default root size).
          "pointer-events-auto flex flex-col gap-3 rounded-[calc(1.875rem+2px)] border-2 bg-background/95 p-3",
          toastWidth,
          `toast-tone toast-tone-${tone}`,
        )}
      >
        <div className="flex items-start gap-3">
          {iconBlock}
          {titleBlock}
          {closeBlock}
        </div>
        <div className={cn("grid gap-2", secondaryAction ? "grid-cols-2" : "grid-cols-1")}>
          {renderAction(action!, "primary")}
          {secondaryAction && renderAction(secondaryAction, "secondary")}
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-3 border-2 bg-background/95 pl-2 pr-2.5",
        toastWidth,
        description ? "items-start rounded-2xl py-2.5" : `${singleRowLayout} rounded-full`,
        `toast-tone toast-tone-${tone}`,
      )}
    >
      {iconBlock}
      {titleBlock}
      {action ? renderAction(action, "primary") : null}
      {closeBlock}
    </div>
  );
}

/** Concentric informational card with a single close action below the message. */
export function InfoPanel({
  tone = "info",
  title,
  description,
  icon,
  onClose,
  className,
}: {
  tone?: NotificationTone;
  title: ReactNode;
  description?: ReactNode;
  /** Override the tone glyph; null hides the icon tile. */
  icon?: ReactNode;
  /** When set, renders a full-width Close action below the message. */
  onClose?: () => void;
  /** Layout overrides (margin / max-width) from the calling view. */
  className?: string;
}) {
  const iconNode =
    icon !== undefined
      ? icon
      : tone === "neutral"
        ? <Info className="h-4 w-4" strokeWidth={2.5} />
        : DEFAULT_ICON[tone];
  return (
    <div
      className={cn(
        // Match the 18px control radius plus padding and border.
        "pointer-events-auto flex flex-col gap-3 rounded-[calc(1.875rem+2px)] border-2 bg-background/95 p-3",
        toastWidth,
        `toast-tone toast-tone-${tone}`,
        className,
      )}
    >
      <div className="flex items-start gap-3">
      {iconNode ? (
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            "toast-tone-tile",
          )}
        >
          {iconNode}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="text-sm font-semibold leading-tight text-foreground">
          {title}
        </div>
        {description ? (
          <div className="text-xs leading-snug text-muted-foreground">
            {description}
          </div>
        ) : null}
      </div>
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-full items-center justify-center rounded-full toast-tone-button px-3 text-sm font-extrabold transition-colors"
        >
          Close
        </button>
      ) : null}
    </div>
  );
}
