import { ButtonHTMLAttributes, ReactNode, useState } from 'react';
import { X } from 'lucide-react';
import type { Demand } from '../types';
import { STALE_AFTER_MIN } from '../utils/pricing';

export const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ');
export const chartTip = {
  contentStyle: { background: '#FFFFFF', border: '1px solid #E2E8E3', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  labelStyle: { color: '#69756D', fontWeight: 600 }
};
export const AXIS = { stroke: '#69756D', fontSize: 11, tickLine: false, axisLine: false } as const;

export const fmtCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;
export const fmtTime = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function Card({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-card border border-subtle bg-panel shadow-sm', className)}>
      {title && <header className="flex items-center justify-between gap-2 border-b border-subtle px-5 py-3.5"><h2 className="text-sm font-semibold text-dark">{title}</h2>{action}</header>}
      <div className="p-5">{children}</div>
    </section>
  );
}

type Tone = 'forest' | 'amber' | 'red' | 'slate' | 'green';
const TONES: Record<Tone, string> = {
  forest: 'bg-forest-light text-forest border-forest/20',
  amber: 'bg-amber-light text-amber-warn border-amber-warn/20',
  red: 'bg-red-light text-red-err border-red-err/20',
  slate: 'bg-gray-100 text-mute border-subtle',
  green: 'bg-green-light text-green-ok border-green-ok/20'
};

export const Badge = ({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) => (
  <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium', TONES[tone])}>
    {children}
  </span>
);

export const DemandBadge = ({ demand }: { demand: Demand }) => (
  <Badge tone={demand === 'High' ? 'forest' : demand === 'Low' ? 'amber' : 'slate'}>{demand} demand</Badge>
);

export const SimTag = ({ text = 'Simulated demo data' }: { text?: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-mute">
    <span className="h-1.5 w-1.5 rounded-full bg-forest" />
    {text}
  </span>
);

export function Btn({ variant = 'primary', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'outline' }) {
  const v = {
    primary: 'bg-forest text-white hover:bg-forest-hover shadow-sm',
    ghost: 'text-mute hover:bg-gray-100 hover:text-dark',
    outline: 'border border-subtle bg-white text-dark hover:bg-gray-50 shadow-sm',
    danger: 'border border-red-err/30 bg-red-light text-red-err hover:bg-red-err hover:text-white'
  }[variant];
  return (
    <button
      {...p}
      className={cx('inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40', v, className)}
    />
  );
}

export const inputCls = 'w-full rounded-md border border-subtle bg-white px-3 py-2 text-sm text-dark placeholder:text-mute focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest shadow-sm';

export function Kpi({ label, value, sub, tone = 'slate' }: { label: string; value: string; sub?: string; tone?: Tone }) {
  return (
    <div className="rounded-card border border-subtle bg-panel p-4 shadow-sm">
      <div className="text-xs font-medium text-mute">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-dark">{value}</span>
        {sub && <Badge tone={tone}>{sub}</Badge>}
      </div>
    </div>
  );
}

export function Occupancy({ booked, capacity }: { booked: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;
  return (
    <div className="flex items-center gap-2.5" title={`${booked}/${capacity} seats`}>
      <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
        <div className={cx('h-full transition-all', pct >= 80 ? 'bg-forest' : pct < 45 ? 'bg-amber-warn' : 'bg-gray-500')} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-xs font-medium text-mute">{pct}%</span>
    </div>
  );
}

export function Freshness({ ageMin }: { ageMin: number }) {
  const stale = ageMin > STALE_AFTER_MIN;
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-xs font-medium', stale ? 'text-red-err' : 'text-green-ok')}>
      <span className={cx('h-2 w-2 rounded-full', stale ? 'bg-red-err' : 'bg-green-ok')} />
      {stale ? 'Stale' : 'Fresh'} · {ageMin}m ago
    </span>
  );
}

export const Empty = ({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) => (
  <div className="py-12 text-center">
    <p className="font-semibold text-dark">{title}</p>
    <p className="mx-auto mt-1 max-w-sm text-sm text-mute">{hint}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorBanner = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-card border border-red-err/30 bg-red-light px-4 py-3 text-sm text-red-err">
    <span>{message}</span>
    {onRetry && <Btn variant="danger" onClick={onRetry}>Retry</Btn>}
  </div>
);

/** Modal / drawer shell. */
export function Overlay({ open, title, onClose, children, drawer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; drawer?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div onClick={e => e.stopPropagation()} className={cx('border border-subtle bg-panel shadow-xl', drawer ? 'ml-auto h-full w-full max-w-lg overflow-y-auto' : 'm-auto w-[92%] max-w-lg rounded-card')}>
        <header className="flex items-center justify-between border-b border-subtle px-5 py-4">
          <h2 className="font-semibold text-dark">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="rounded-md p-1 text-mute hover:bg-gray-100 hover:text-dark">
            <X size={18} />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/** Confirmation dialog with an optional operator reason. */
export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onClose }: { open: boolean; title: string; body: ReactNode; confirmLabel: string; onConfirm: (reason: string) => Promise<void> | void; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Overlay open={open} title={title} onClose={onClose}>
      <div className="space-y-4 text-sm text-dark">
        <div>{body}</div>
        <div>
          <label className="block text-xs font-medium text-mute">Operator Reason / Notes (optional)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={300} placeholder="E.g., High demand expected due to festival event" className={cx(inputCls, 'mt-1')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={go} disabled={busy}>{busy ? 'Processing…' : confirmLabel}</Btn>
        </div>
      </div>
    </Overlay>
  );
}

