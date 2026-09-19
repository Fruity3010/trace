import { Icon } from '@/components/Icons';
import type { ReportStatus } from '@/lib/shared';

const STEPS = ['Report received', 'AI classified', 'Automated checks', 'Added to intelligence'];

const FAILED: Partial<Record<ReportStatus, string>> = {
  duplicate: 'Already reported',
  limited: 'Daily limit reached',
  needs_detail: 'Needs more detail',
  removed: 'Removed after dispute',
};

/** Every step is automatic and immediate. A filtered report stops at step 3 with the reason. */
export function Tracker({ status, compact }: { status: ReportStatus; compact?: boolean }) {
  const failedAt = FAILED[status] ? (status === 'removed' ? 3 : 2) : -1;
  const done = failedAt === -1 ? 4 : failedAt;

  if (compact) {
    return (
      <div className="flex gap-1" aria-label={failedAt === -1 ? 'All steps complete' : `Stopped: ${FAILED[status]}`}>
        {STEPS.map((s, i) => <span key={s} className={`h-1.5 flex-1 rounded-full ${i < done ? 'bg-low' : i === failedAt ? 'bg-medium' : 'bg-line'}`} />)}
      </div>
    );
  }
  return (
    <ol>
      {STEPS.map((s, i) => {
        const state = i < done ? 'done' : i === failedAt ? 'failed' : 'todo';
        return (
          <li key={s} className="relative flex items-center gap-3 pb-4 last:pb-0">
            {i < STEPS.length - 1 && <span aria-hidden className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 ${i < done - 1 ? 'bg-low' : 'bg-line'}`} />}
            <span className={`relative grid size-7 place-items-center rounded-full ${
              state === 'done' ? 'bg-low text-paper' : state === 'failed' ? 'bg-medium text-paper' : 'border-2 border-line bg-raised'}`}>
              {state === 'done' && <Icon name="check" size={15} strokeWidth={3} />}
              {state === 'failed' && <Icon name="x" size={14} strokeWidth={3} />}
            </span>
            <span className={`text-[15px] ${state === 'todo' ? 'text-ink-3' : 'font-semibold'}`}>
              {state === 'failed' ? `${s}: ${FAILED[status]}` : s}
            </span>
            <span className="sr-only">{state === 'done' ? '(complete)' : state === 'failed' ? '(stopped)' : '(not reached)'}</span>
          </li>
        );
      })}
    </ol>
  );
}
