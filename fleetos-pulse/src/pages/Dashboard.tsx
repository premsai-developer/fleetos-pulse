import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowUpRight, CheckCircle2, ChevronRight, Layers, Search, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppState';
import { TREND_LABELS, routeOf } from '../data/trips';
import { AXIS, Badge, Btn, Card, DemandBadge, Empty, ErrorBanner, Freshness, Kpi, Occupancy, chartTip, cx, fmtCurrency, fmtTime, inputCls } from '../components/ui';

import { classifyDemand, inr, occupancyOf, validateTrip } from '../utils/pricing';

export default function Dashboard() {
  const { trips, error, reload, discrepancies, record } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [route, setRoute] = useState('all');
  const [status, setStatus] = useState('all');

  const rows = useMemo(() => trips.map(t => ({ t, issues: validateTrip(t), demand: classifyDemand(t) })), [trips]);
  const attention = rows.filter(r => r.issues.length || r.demand !== 'Normal');
  const totalCapacity = trips.reduce((s, t) => s + t.capacity, 0);
  const totalBooked = trips.reduce((s, t) => s + t.booked, 0);
  const avgOcc = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
  const validCount = rows.filter(r => !r.issues.length).length;
  const reliability = Math.round((validCount / rows.length) * 100);

  const routes = [...new Set(trips.map(routeOf))];
  const trend = TREND_LABELS.map((l, i) => ({ label: l, bookings: trips.reduce((s, t) => s + t.trend[i], 0) }));

  const byRoute = routes.map(r => {
    const ts = trips.filter(t => routeOf(t) === r);
    const cap = ts.reduce((s, t) => s + t.capacity, 0);
    const bk = ts.reduce((s, t) => s + t.booked, 0);
    return {
      route: r.replace('Visakhapatnam', 'VSKP').replace('Vijayawada', 'VJA').replace('Hyderabad', 'HYD').replace(' → ', '→'),
      occ: cap > 0 ? Math.round((bk / cap) * 100) : 0
    };
  });

  const filtered = rows.filter(
    r =>
      (route === 'all' || routeOf(r.t) === route) &&
      (status === 'all' || (status === 'attention' ? r.issues.length || r.demand !== 'Normal' : r.issues.length > 0)) &&
      `${r.t.id} ${routeOf(r.t)}`.toLowerCase().includes(q.toLowerCase())
  );

  // Daily Opportunity Queue Items
  const opportunityQueue = useMemo(() => {
    const opps = [];

    // High demand trip opportunity
    const highDemandTrip = rows.find(r => r.demand === 'High' && !r.issues.length);
    if (highDemandTrip) {
      opps.push({
        id: 'OPP-101',
        title: `High Latent Demand on ${highDemandTrip.t.id}`,
        why: `Occupancy at ${Math.round(occupancyOf(highDemandTrip.t) * 100)}% with 14 seats remaining. Expected unserved demand observed.`,
        actionLabel: 'Review Dynamic Pricing',
        link: '/truedemand',
        badge: 'Yield Opportunity',
        tone: 'forest' as const
      });
    }

    // Low demand promo opportunity
    const lowDemandTrip = rows.find(r => r.demand === 'Low' && !r.issues.length);
    if (lowDemandTrip) {
      opps.push({
        id: 'OPP-102',
        title: `Low Booking Velocity on ${lowDemandTrip.t.id}`,
        why: `Only ${lowDemandTrip.t.booked}/${lowDemandTrip.t.capacity} seats booked with ${lowDemandTrip.t.hoursToDeparture}h remaining.`,
        actionLabel: 'Evaluate Promo Fare',
        link: '/recommendations',
        badge: 'Capacity Risk',
        tone: 'amber' as const
      });
    }

    // Revenue discrepancy opportunity
    const activeDisc = discrepancies.find(d => d.status === 'Unresolved');
    if (activeDisc) {
      opps.push({
        id: 'OPP-103',
        title: `Settlement Discrepancy ${activeDisc.id} (${fmtCurrency(activeDisc.discrepancy)})`,
        why: `OTA commission rate mismatch detected on transaction ${activeDisc.txRef}.`,
        actionLabel: 'Open Leakage Investigator',
        link: '/leakage',
        badge: 'Settlement Audit',
        tone: 'red' as const
      });
    }

    return opps;
  }, [rows, discrepancies]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">Command Center</h1>
          <p className="text-xs text-mute font-medium">
            Real-time fleet occupancy, latent demand alerts, and operational decision recommendations.
          </p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center gap-2">
          <Btn variant="outline" onClick={() => navigate('/truedemand')}>
            <TrendingUp size={15} />
            TrueDemand Engine
          </Btn>
          <Btn variant="primary" onClick={() => navigate('/recommendations')}>
            <Sparkles size={15} />
            View Recommendations
          </Btn>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={reload} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Active Trips Managed" value={String(trips.length)} sub="3 Routes" tone="forest" />
        <Kpi label="Total Seat Capacity" value={`${totalBooked}/${totalCapacity}`} sub={`${avgOcc}% Occupancy`} tone="forest" />
        <Kpi label="Departures Needing Action" value={String(attention.length)} sub={attention.length ? 'Pending Review' : 'All Clear'} tone={attention.length ? 'amber' : 'green'} />
        <Kpi label="Data Reliability Score" value={`${reliability}%`} sub={reliability === 100 ? 'Verified' : 'Degraded Feed'} tone={reliability === 100 ? 'green' : 'red'} />
      </div>

      {/* Daily Opportunity Queue Section */}
      <Card
        title="Daily Opportunity Queue"
        action={
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest">
            <Sparkles size={14} />
            {opportunityQueue.length} Priority Actions
          </span>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          {opportunityQueue.map(opp => (
            <div key={opp.id} className="flex flex-col justify-between rounded-lg border border-subtle bg-gray-50/50 p-4 transition-all hover:border-forest/40 hover:bg-white hover:shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={opp.tone}>{opp.badge}</Badge>
                  <span className="text-[11px] font-mono text-mute">{opp.id}</span>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-dark">{opp.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-mute">{opp.why}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between">
                <Link to={opp.link} className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-forest-hover">
                  {opp.actionLabel}
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Visualizations Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Cumulative Booking Velocity vs Departure Window">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8E3" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" {...AXIS} />
                <YAxis {...AXIS} width={40} />
                <Tooltip {...chartTip} />
                <Area type="monotone" dataKey="bookings" stroke="#245B49" strokeWidth={2.5} fill="#245B49" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Fleet Occupancy Rate by Route (%)">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRoute} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8E3" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="route" {...AXIS} />
                <YAxis {...AXIS} width={40} domain={[0, 100]} />
                <Tooltip {...chartTip} />
                <Bar dataKey="occ" fill="#245B49" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Main Trips Data Table */}
      <Card title="Active Trip Manifest" action={<span className="text-xs font-medium text-mute">{filtered.length} of {rows.length} trips</span>}>
        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-3 text-mute" />
            <input aria-label="Search trips" value={q} onChange={e => setQ(e.target.value)} placeholder="Search trip ID or route..." className={cx(inputCls, 'pl-9')} />
          </div>
          <select aria-label="Route filter" value={route} onChange={e => setRoute(e.target.value)} className={cx(inputCls, 'sm:w-60')}>
            <option value="all">All Routes</option>
            {routes.map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select aria-label="Status filter" value={status} onChange={e => setStatus(e.target.value)} className={cx(inputCls, 'sm:w-44')}>
            <option value="all">All Statuses</option>
            <option value="attention">Needs Attention</option>
            <option value="blocked">Data Blocked</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <Empty title="No matching trips found" hint="Clear your search query or filter parameters to list all trips." />
        ) : (
          <div className="overflow-x-auto rounded-md border border-subtle">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-mute border-b border-subtle">
                <tr>
                  {['Trip ID', 'Route', 'Departure', 'Seats Booked', 'Occupancy Rate', 'Approved Fare', 'Demand Signals', 'Data Integrity'].map(h => (
                    <th key={h} className="px-3 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle bg-white">
                {filtered.map(({ t, issues, demand }) => (
                  <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-3 py-3 font-semibold">
                      <Link className="text-forest hover:underline inline-flex items-center gap-1" to={`/trips/${t.id}`}>
                        {t.id}
                        <ArrowUpRight size={12} />
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-medium text-dark">{routeOf(t)}</td>
                    <td className="px-3 py-3 text-xs text-mute font-medium">{fmtTime(t.departure)}</td>
                    <td className="px-3 py-3 font-medium text-dark">{t.booked} / {t.capacity}</td>
                    <td className="px-3 py-3"><Occupancy booked={t.booked} capacity={t.capacity} /></td>
                    <td className="px-3 py-3 font-semibold text-dark">{inr(t.fare)}</td>
                    <td className="px-3 py-3"><DemandBadge demand={demand} /></td>
                    <td className="px-3 py-3">
                      {issues.length ? <Badge tone="red">Blocked</Badge> : <Freshness ageMin={t.feedAgeMin} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

