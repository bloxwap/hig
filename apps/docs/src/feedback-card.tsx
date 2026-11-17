import {Button} from '@bloxwap/hig/react/button';

export function FeedbackCard({prompt, title, optional, label, onAnswer}: {
  prompt: {reasons: string[]};
  title: string;
  optional: string;
  label: (reason: string) => string;
  onAnswer: (reason: string) => void;
}) {
  return <section aria-label={title} className="flex w-full flex-col gap-4">
    <header>
      <h3 className="text-base font-semibold leading-tight text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{optional}</p>
    </header>
    <div className="flex flex-col gap-2">
      {prompt.reasons.map(reason=><Button key={reason} intent="secondary" fullWidth onClick={()=>onAnswer(reason)}>{label(reason)}</Button>)}
    </div>
  </section>;
}
