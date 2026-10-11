import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RotateCcw, Send, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppState';
import { routeOf } from '../data/trips';
import { AXIS, Badge, Btn, Card, ConfirmDialog, SimTag, chartTip, cx, fmtCurrency, fmtTime, inputCls } from '../components/ui';
import { ELASTICITY_RANGE, PROMO_DISCOUNT, PROMO_LIFT, baselineOf, inr, recommend, simulate, sweep, validateFareInput } from '../utils/pricing';
import type { Policy, SimResult } from '../types';

const delta = (a: number, b: number, fmt: (n: number) => string = String) => {
  const d = b - a;
  return (
    <span className={cx('font-bold font-mono text-xs', d > 0 ? 'text-green-ok' : d < 0 ? 'text-amber-warn' : 'text-mute')}>
      {d > 0 ? '+' : ''}
      {fmt(d)}
    </span>
  );
};

const rows = (r: SimResult): [string, string, number][] => [
  ['Estimated Bookings', String(r.newBookings), r.newBookings],
  ['Occupied Seats', String(r.occupied), r.occupied],
  ['Seat Occupancy Rate', `${Math.round(r.occupancy * 100)}%`, Math.round(r.occupancy * 100)],
  ['Ticket Sales Revenue', inr(r.revenue), r.revenue],
  ['Unsold Seats Remaining', String(r.unsold), r.unsold]
];

export default function TripTwin() {
  const { trips, record } = useApp();
  const [params, setParams] = useSearchParams();

  const trip = trips.find(t => t.id === params.get('trip')) ?? trips[0];
  const defaults = {
    fare: String(recommend(trip).proposedFare ?? trip.fare ?? trip.minFare),
    policy: 'baseline' as Policy,
    elasticity: ELASTICITY_RANGE.default
  };

  const [fare, setFare] = useState(defaults.fare);
  const [policy, setPolicy] = useState<Policy>('baseline');
  const [elasticity, setElasticity] = useState(ELASTICITY_RANGE.default);
  const [applied, setApplied] = useState({ fare: Number(defaults.fare), policy, elasticity });

  const [dialog, setDialog] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const tripKey = trip.id + trip.fare;
  useEffect(() => {
    setFare(defaults.fare);
    setPolicy('baseline');
    setElasticity(ELASTICITY_RANGE.default);
    setApplied({ fare: Number(defaults.fare), policy: 'baseline', elasticity: ELASTICITY_RANGE.default });
    setNotice(null);
  }, [tripKey]);

  const err = validateFareInput(trip, fare);
  const rec = recommend(trip);

  const base = useMemo(() => baselineOf(trip, applied.elasticity), [trip, applied.elasticity]);
  const scen = useMemo(() => simulate({ trip, ...applied }), [trip, applied]);
  const curve = useMemo(() => sweep(trip, applied.policy, applied.elasticity), [trip, applied]);

  const reset = () => {
    setFare(String(trip.fare ?? trip.minFare));
    setPolicy('baseline');
    setElasticity(ELASTICITY_RANGE.default);
    setApplied({ fare: trip.fare ?? trip.minFare, policy: 'baseline', elasticity: ELASTICITY_RANGE.default });
  };

  const assumptions = [
    `Price elasticity coefficient: ${applied.elasticity.toFixed(1)}`,
    `Expected further organic bookings at current fare: ${trip.expectedAdditional} seats`,
    applied.policy === 'promo'
      ? `Promotional policy: ${PROMO_DISCOUNT * 100}% discount with +${Math.round((PROMO_LIFT - 1) * 100)}% demand lift`
      : 'Baseline pricing policy: no promo discount active',
    'Both scenarios share seat capacity and already-sold revenue'
  ];

  const revDelta = scen.revenue - base.revenue;

  const send = async (reason: string) => {
    const d = await record({
      tripId: trip.id,
      action: `Trip Twin: set fare ${inr(scen.fare)} (${applied.policy})`,
      proposedFare: scen.fare,
      reason,
      assumptions,
      source: 'trip-twin',
      status: 'in_review'
    });
    setDialog(false);
    setNotice(`Scenario submitted for operator review as decision ${d.id}.`);
  };

  if (trip.fare === null || rec.blocked) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-dark">Trip Twin Scenario Simulator</h1>
        <select value={trip.id} onChange={e => setParams({ trip: e.target.value })} className={cx(inputCls, 'w-56 font-semibold')}>
          {trips.map(t => (
            <option key={t.id}>{t.id}</option>
          ))}
        </select>
        <Card>
          <div className="flex gap-3 text-xs">
            <ShieldAlert className="shrink-0 text-red-err" size={20} />
            <div>
              <p className="font-bold text-red-err text-sm">Simulation Unavailable for {trip.id}</p>
              <p className="mt-1 text-mute leading-relaxed">
                Booking data failed FairFare Guard validation. Scenarios are disabled to avoid unreliable decisions.{' '}
                {rec.issues[0]?.fix}
              </p>
              <Link to="/trustguard" className="mt-2 inline-block font-semibold text-forest underline">
                Open TrustGuard Inspector
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const bars = [
    { name: 'Baseline', Sold: trip.booked * trip.fare, Projected: base.newBookings * base.fare },
    { name: 'Scenario', Sold: trip.booked * trip.fare, Projected: scen.newBookings * scen.fare }
  ];

  const occ = [
    { name: 'Baseline', Occupied: base.occupied, Unsold: base.unsold },
    { name: 'Scenario', Occupied: scen.occupied, Unsold: scen.unsold }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">Trip Twin Digital Twin Simulator</h1>
          <p className="text-xs text-mute font-medium">
            Simulate price elasticity, promotional discounts, and net yield outcomes before approving fares.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <SimTag text="All Outputs Simulated" />
        </div>
      </div>

      {/* Select Trip Header Card */}
      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs">
          <div>
            <div className="font-bold text-dark text-sm">{routeOf(trip)}</div>
            <div className="text-mute mt-0.5">
              Trip {trip.id} · Departure: {fmtTime(trip.departure)} · {trip.booked}/{trip.capacity} seats booked · Current Approved Fare:{' '}
              <strong className="text-forest">{inr(trip.fare)}</strong>
            </div>
          </div>
          <select value={trip.id} onChange={e => setParams({ trip: e.target.value })} className={cx(inputCls, 'sm:w-56 font-semibold text-forest')}>
            {trips.map(t => (
              <option key={t.id} value={t.id}>
                {t.id} — {routeOf(t)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {notice && (
        <div role="status" className="rounded-lg border border-green-ok/30 bg-green-light p-3 text-xs font-semibold text-green-ok flex items-center justify-between">
          <span>{notice}</span>
          <Link className="underline font-bold" to="/decisions">
            View Decision Log
          </Link>
        </div>
      )}

      {/* 3 Column Controls Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Col 1: Baseline Metrics */}
        <Card title="Baseline Simulation (Current Fare)" action={<Badge tone="slate">Current {inr(trip.fare)}</Badge>}>
          <dl className="space-y-3 text-xs">
            {rows(base).map(([l, v]) => (
              <div key={l} className="flex justify-between border-b border-subtle pb-2 last:border-0">
                <dt className="text-mute">{l}</dt>
                <dd className="font-bold text-dark font-mono">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Col 2: Interactive Controls */}
        <Card title="Scenario Parameter Controls">
          <form
            className="space-y-3.5 text-xs"
            onSubmit={e => {
              e.preventDefault();
              if (!err) setApplied({ fare: Number(fare), policy, elasticity });
            }}
          >
            <div>
              <label className="font-semibold text-dark block mb-1">Proposed Fare (₹)</label>
              <input
                inputMode="numeric"
                value={fare}
                onChange={e => setFare(e.target.value)}
                className={cx(inputCls, err ? 'border-red-err text-red-err' : '')}

              />
              {err ? (
                <p className="mt-1 text-[11px] text-red-err font-medium">{err}</p>
              ) : (
                <p className="mt-1 text-[11px] text-mute">
                  Allowed boundary: {inr(trip.minFare)} – {inr(trip.maxFare)}
                </p>
              )}
            </div>

            <div>
              <label className="font-semibold text-dark block mb-1">Pricing Policy Mode</label>
              <select value={policy} onChange={e => setPolicy(e.target.value as Policy)} className={inputCls}>
                <option value="baseline">Baseline Dynamic Fare</option>
                <option value="promo">Promotional Rate ({PROMO_DISCOUNT * 100}% Discount)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-dark mb-1">
                <span>Price Elasticity:</span>
                <span className="font-mono text-forest">{elasticity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={ELASTICITY_RANGE.min}
                max={ELASTICITY_RANGE.max}
                step={0.1}
                value={elasticity}
                onChange={e => setElasticity(Number(e.target.value))}
                className="w-full accent-forest cursor-pointer"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Btn type="submit" disabled={!!err} variant="primary" className="w-full">
                Simulate Scenario
              </Btn>
              <Btn type="button" variant="outline" onClick={reset}>
                <RotateCcw size={14} />
              </Btn>
            </div>
          </form>
        </Card>

        {/* Col 3: Scenario Results */}
        <Card title="Scenario Simulated Outcome" action={<Badge tone="forest">Proposed {inr(scen.fare)}</Badge>}>
          <dl className="space-y-3 text-xs">
            {rows(scen).map(([l, v, n], i) => (
              <div key={l} className="flex justify-between border-b border-subtle pb-2 last:border-0">
                <dt className="text-mute">{l}</dt>
                <dd className="font-bold text-dark font-mono flex items-center gap-1.5">
                  {v}
                  {delta(rows(base)[i][2], n, l === 'Ticket Sales Revenue' ? inr : String)}
                </dd>
              </div>
            ))}
          </dl>

          <Btn variant="primary" className="mt-4 w-full" onClick={() => setDialog(true)}>
            <Send size={14} />
            Submit Scenario for Operator Review
          </Btn>
        </Card>
      </div>

      {/* Visualization Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Revenue Comparison (Baseline vs Scenario)">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8E3" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" {...AXIS} />
                <YAxis {...AXIS} width={45} />
                <Tooltip {...chartTip} formatter={(v: number) => inr(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Sold" stackId="a" fill="#69756D" name="Already Sold" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Projected" stackId="a" fill="#245B49" name="Projected Sales" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Seat Occupancy Breakdown">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occ} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8E3" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" {...AXIS} />
                <YAxis {...AXIS} width={35} />
                <Tooltip {...chartTip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Occupied" stackId="a" fill="#245B49" name="Occupied Seats" />
                <Bar dataKey="Unsold" stackId="a" fill="#D99A36" name="Unsold Capacity" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Revenue Curve Across Fare Spectrum">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8E3" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="fare" {...AXIS} />
                <YAxis {...AXIS} width={45} domain={['auto', 'auto']} />
                <Tooltip {...chartTip} formatter={(v: number) => inr(v)} />
                <ReferenceLine x={Math.round(scen.fare)} stroke="#D99A36" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="revenue" stroke="#245B49" dot={false} strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Assumptions & Rationale Card */}
      <Card title="Simulation Rationale & Trade-Offs">
        <div className="grid gap-4 text-xs md:grid-cols-2">
          <ul className="list-disc space-y-1.5 pl-4 text-mute">
            {assumptions.map(a => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="text-dark leading-relaxed">
            At <strong>{inr(scen.fare)}</strong>, simulated revenue is{' '}
            <strong>
              {revDelta >= 0 ? 'higher' : 'lower'} than baseline by {inr(Math.abs(revDelta))}
            </strong>
            , with {Math.abs(scen.occupied - base.occupied)} {scen.occupied >= base.occupied ? 'more' : 'fewer'} seats occupied.{' '}
            {scen.fare > trip.fare
              ? 'Higher fares increase yield per seat but risk unserved seats.'
              : scen.fare < trip.fare
              ? 'Lower promotional fares stimulate occupancy but compress margin per seat.'
              : 'The fare remains unchanged.'}
          </p>
        </div>
      </Card>

      {/* Confirm Submit Dialog */}
      <ConfirmDialog
        open={dialog}
        onClose={() => setDialog(false)}
        onConfirm={send}
        confirmLabel="Confirm & Submit for Review"
        title="Submit Scenario for Operator Review?"
        body={
          <p className="text-xs text-dark">
            Fare <strong>{inr(scen.fare)}</strong> ({applied.policy}) for trip <strong>{trip.id}</strong> will be logged with status{' '}
            <strong className="text-amber-warn">In Review</strong>. Working active fares remain unchanged until explicitly approved.
          </p>
        }
      />
    </div>
  );
}

