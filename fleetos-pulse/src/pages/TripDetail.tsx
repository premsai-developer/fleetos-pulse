import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import { useApp } from '../context/AppState';
import { TREND_LABELS, routeOf } from '../data/trips';
import { AXIS, Badge, Btn, Card, ConfirmDialog, DemandBadge, Empty, Freshness, Occupancy, SimTag, chartTip, cx, fmtTime, inputCls } from '../components/ui';
import { inr, occupancyOf, recommend } from '../utils/pricing';

export default function TripDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { trips, record } = useApp();

  const [dialog, setDialog] = useState<null | 'accepted' | 'rejected'>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const trip = trips.find(t => t.id === id);

  if (!trip) {
    return (
      <Card>
        <Empty
          title="Trip not found"
          hint={`No trip found with ID "${id}".`}
          action={
            <Link to="/">
              <Btn variant="ghost">Back to Command Center</Btn>
            </Link>
          }
        />
      </Card>
    );
  }

  const rec = recommend(trip);
  const data = TREND_LABELS.map((l, i) => ({ label: l, booked: trip.trend[i] }));

  const submit = async (reason: string) => {
    const d = await record({
      tripId: trip.id,
      action: rec.action,
      proposedFare: rec.proposedFare,
      reason,
      assumptions: rec.assumptions,
      source: 'recommendation',
      status: dialog!
    });
    setDialog(null);
    setNotice(`Decision ${d.id} recorded as ${d.status.replace('_', ' ')}.`);
  };

  const stat = (label: string, v: React.ReactNode) => (
    <div>
      <div className="text-xs font-medium text-mute">{label}</div>
      <div className="mt-1 text-sm font-bold text-dark">{v}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">{routeOf(trip)}</h1>
          <p className="text-xs text-mute font-medium">
            Trip {trip.id} · Scheduled Departure: {fmtTime(trip.departure)}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <select value={trip.id} onChange={e => nav(`/trips/${e.target.value}`)} className={cx(inputCls, 'w-48 font-semibold text-forest')}>
            {trips.map(t => (
              <option key={t.id} value={t.id}>
                {t.id} — {routeOf(t)}
              </option>
            ))}
          </select>
          <Link to={`/twin?trip=${trip.id}`}>
            <Btn variant="outline">Open in Trip Twin</Btn>
          </Link>
        </div>
      </div>

      {notice && (
        <div role="status" className="rounded-lg border border-green-ok/30 bg-green-light p-3 text-xs font-semibold text-green-ok flex items-center justify-between">
          <span>{notice}</span>
          <Link className="underline font-bold" to="/decisions">
            View History
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card title="Trip Snapshot & Operational Metrics" action={<SimTag />}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stat('Capacity', `${trip.capacity} seats`)}
              {stat('Booked Seats', trip.booked)}
              {stat('Remaining Seats', trip.capacity - trip.booked)}
              {stat('Current Base Fare', inr(trip.fare))}
              {stat('Occupancy Rate', <Occupancy booked={trip.booked} capacity={trip.capacity} />)}
              {stat('Demand Level', <DemandBadge demand={recommend(trip).demand} />)}
              {stat('Data Freshness', <Freshness ageMin={trip.feedAgeMin} />)}
              {stat('Fare Limits', `${inr(trip.minFare)}–${inr(trip.maxFare)}`)}
            </div>
          </Card>

          <Card title={`Booking Velocity Trend (Cumulative, ${Math.round(occupancyOf(trip) * 100)}% Occupancy)`}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#E2E8E3" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" {...AXIS} />
                  <YAxis {...AXIS} width={35} domain={[0, trip.capacity]} />
                  <Tooltip {...chartTip} />
                  <Area type="monotone" dataKey="booked" stroke="#245B49" fill="#245B49" fillOpacity={0.12} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card
            title="FairFare Recommendation"
            action={rec.blocked ? <Badge tone="red">Withheld</Badge> : <Badge tone="forest">Safe to Display</Badge>}
          >
            {rec.blocked ? (
              <div className="space-y-3 text-xs">
                <div className="flex gap-2 text-red-err font-medium">
                  <ShieldAlert size={18} className="shrink-0" />
                  <p>{rec.why}</p>
                </div>
                {rec.issues.map(i => (
                  <div key={i.code} className="rounded-md border border-red-err/30 bg-red-light/30 p-3">
                    <p className="font-bold text-red-err">{i.title}</p>
                    <p className="mt-1 text-mute">{i.why}</p>
                    <p className="mt-1 text-dark font-medium">Fix: {i.fix}</p>
                  </div>
                ))}
                <Link to="/trustguard" className="font-semibold text-forest underline">
                  Open TrustGuard
                </Link>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-mute font-medium">Suggested Action</div>
                  <div className="mt-1 text-base font-bold text-dark flex items-center gap-2">
                    <span>{rec.action}</span>
                    {rec.action !== 'Hold fare' && (
                      <span className="text-forest font-mono">
                        {inr(trip.fare)} → {inr(rec.proposedFare ?? null)}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-mute font-medium">Decision Rationale</div>
                  <p className="mt-1 text-dark font-medium leading-relaxed">{rec.why}</p>
                </div>

                <div>
                  <div className="text-mute font-medium">Model Assumptions</div>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-mute">
                    {rec.assumptions.map(a => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-mute font-medium">Fairness Constraints Applied</div>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-mute">
                    {rec.constraints.map(a => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <Btn
                className="flex-1"
                disabled={rec.blocked}
                onClick={() => setDialog('accepted')}
                title={rec.blocked ? 'Disabled: data failed validation' : undefined}
              >
                <CheckCircle2 size={16} />
                Accept Recommendation
              </Btn>
              <Btn variant="danger" className="flex-1" onClick={() => setDialog('rejected')}>
                <XCircle size={16} />
                Reject
              </Btn>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={submit}
        confirmLabel={dialog === 'accepted' ? 'Confirm Acceptance' : 'Confirm Rejection'}
        title={dialog === 'accepted' ? 'Accept Recommendation?' : 'Reject Recommendation?'}
        body={
          <p className="text-xs text-dark">
            {dialog === 'accepted'
              ? `The working fare for ${trip.id} will update from ${inr(trip.fare)} to ${inr(rec.proposedFare ?? null)}. This decision is recorded in the audit log.`
              : `The suggestion for ${trip.id} will be declined, keeping the current fare at ${inr(trip.fare)}.`}
          </p>
        }
      />
    </div>
  );
}
