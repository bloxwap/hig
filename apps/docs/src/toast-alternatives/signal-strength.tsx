import { Signal } from 'lucide-react';
const cn = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ');

const ACTIVE_LEVELS = {
  0: '',
  1: '[&>path:nth-child(-n+1)]:stroke-current',
  2: '[&>path:nth-child(-n+2)]:stroke-current',
  3: '[&>path:nth-child(-n+3)]:stroke-current',
  4: '[&>path:nth-child(-n+4)]:stroke-current',
  5: '[&>path:nth-child(-n+5)]:stroke-current',
} as const;

export function SignalStrength({ level, className }: {
  level: 0 | 1 | 2 | 3 | 4 | 5;
  className?: string;
}) {
  return (
    <Signal
      aria-hidden="true"
      size={24}
      strokeWidth={2}
      className={cn('shrink-0 [&>path]:stroke-neutral-500', ACTIVE_LEVELS[level], className)}
    />
  );
}
