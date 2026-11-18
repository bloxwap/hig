import { TrendingDown, TrendingUp } from 'lucide-react';
import { SignalStrength } from './signal-strength';
const cn = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ');

/** Shared by the Signals menu example and real Swing notification toasts. */
export function SwingSignalCard({
  coin,
  leverage,
  direction,
  confidence,
  label,
  closeInset = false,
}: {
  coin: string;
  leverage: number;
  direction: 'LONG' | 'SHORT';
  /** Normalized confidence; unknown confidence leaves all bars muted. */
  confidence: number | null;
  label: string;
  /** Leave room on the right for a close button laid over the card (the Swing toast's X). */
  closeInset?: boolean;
}) {
  const long = direction === 'LONG';
  const DirectionIcon = long ? TrendingUp : TrendingDown;
  const level = confidence != null && Number.isFinite(confidence) && confidence >= 0 && confidence <= 1
    ? Math.round(confidence * 5) as 0 | 1 | 2 | 3 | 4 | 5
    : 0;
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        'flex w-full max-w-sm items-center gap-3 rounded-full border-2 bg-background/95 py-2 pl-4 font-[family-name:var(--font-bloxwap-sans)] text-foreground',
        closeInset ? 'pr-12' : 'pr-2',
        long
          ? 'border-(--hig-up) toast-glow-up-soft'
          : 'border-(--hig-down) toast-glow-down-soft',
      )}
    >
      <SignalStrength level={level} className={long ? 'text-(--hig-up)' : 'text-(--hig-down)'} />
      <span aria-hidden="true" className="min-w-0 truncate text-base font-extrabold">{coin}</span>
      <span aria-hidden="true" className="shrink-0 text-sm font-bold text-muted-foreground">{leverage}×</span>
      <span
        aria-hidden="true"
        className={cn(
          'ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-extrabold',
          long ? 'bg-(--hig-up)/15 text-(--hig-up)' : 'bg-(--hig-down)/15 text-(--hig-down)',
        )}
      >
        <DirectionIcon className="h-4 w-4" /> {direction}
      </span>
    </div>
  );
}
