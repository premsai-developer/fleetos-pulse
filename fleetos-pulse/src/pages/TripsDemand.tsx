import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, Bus, Calendar, Clock, DollarSign, Filter, Info, Layers, RefreshCw, Search, ShieldAlert, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useApp } from '../context/AppState';
import { TREND_LABELS, routeOf } from '../data/trips';
import { AXIS, Badge, Btn, Card, DemandBadge, Empty, Freshness, Occupancy, chartTip, cx, fmtCurrency, fmtTime, inputCls } from '../components/ui';
import { classifyDemand, inr, occupancyOf, validateTrip } from '../utils/pricing';

export default function TripsDemand() {
  const { trips, reload } = useApp();
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [selectedDemand, setSelectedDemand] = useState('all');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(trips[0]?.id || null);

  const routes = useMemo(() => [...new Set(trips.map(routeOf))], [trips]);

  const rows = useMemo(() => {
    return trips.map(t => ({
      t,
      issues: validateTrip(t),
      demand: classifyDemand(t),
      occupancyPct: Math.round(occupancyOf(t) * 100)
    }));
  }, [trips]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const matchesSearch = `${r.t.id} ${routeOf(r.t)} ${r.t.origin} ${r.t.destination}`.toLowerCase().includes(q.toLowerCase());
      const matchesRoute = selectedRoute === 'all' || routeOf(r.t) === selectedRoute;
      const matchesDemand = selectedDemand === 'all' || r.demand.toLowerCase() === selectedDemand.toLowerCase();
      return matchesSearch && matchesRoute && matchesDemand;
    });
  }, [rows, q, selectedRoute, selectedDemand]);

  const activeTrip = useMemo(() => {
    return trips.find(t => t.id === selectedTripId) || trips[0];
  }, [trips, selectedTripId]);

  const activeIssues = useMemo(() => validateTrip(activeTrip), [activeTrip]);
  const activeDemand = useMemo(() => classifyDemand(activeTrip), [activeTrip]);

  const trendData = useMemo(() => {
    if (!activeTrip) return [];
    return TREND_LABELS.map((label, idx) => ({
      label,
      observedBookings: activeTrip.trend[idx],
      latentEstimate: Math.round(activeTrip.trend[idx] * (activeTrip.booked >= activeTrip.capacity * 0.9 ? 1.25 : 1.05))
    }));
  }, [activeTrip]);

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">Trips & Demand Manifest</h1>
          <p className="text-xs text-mute font-medium">
            Inspect observed ticket sales, seat capacity limits, and latent demand signals.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Btn variant="outline" onClick={reload}>
            <RefreshCw size={14} />
            Refresh Feed
          </Btn>
          <Btn variant="primary" onClick={() => navigate('/truedemand')}>
            <TrendingUp size={14} />
            Latent Demand Analysis
          </Btn>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Col: Trip List & Filters (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          {/* Filter Bar */}
          <div className="grid gap-2.5 sm:grid-cols-3 bg-panel p-3 rounded-card border border-subtle shadow-sm">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-3 text-mute" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search trip or route..."
                className={cx(inputCls, 'pl-9')}
              />
            </div>
            <select value={selectedRoute} onChange={e => setSelectedRoute(e.target.value)} className={inputCls}>
              <option value="all">All Intercity Routes</option>
              {routes.map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <select value={selectedDemand} onChange={e => setSelectedDemand(e.target.value)} className={inputCls}>
              <option value="all">All Demand Levels</option>
              <option value="high">High Demand</option>
              <option value="normal">Normal Demand</option>
              <option value="low">Low Demand</option>
            </select>
          </div>

          {/* Table */}
          <Card className="p-0 overflow-hidden">
            {filtered.length === 0 ? (
              <Empty title="No trips match criteria" hint="Try adjusting your search query or route filters." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold text-mute border-b border-subtle">
                    <tr>
                      <th className="px-4 py-3">Trip ID</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Departure</th>
                      <th className="px-4 py-3">Capacity</th>
                      <th className="px-4 py-3">Approved Fare</th>
                      <th className="px-4 py-3">Demand</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle bg-white">
                    {filtered.map(({ t, issues, demand }) => {
                      const isSelected = t.id === activeTrip.id;
                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTripId(t.id)}
                          className={cx(
                            'cursor-pointer transition-colors hover:bg-gray-50',
                            isSelected && 'bg-forest-light/60 font-medium'
                          )}
                        >
                          <td className="px-4 py-3 font-semibold text-forest">{t.id}</td>
                          <td className="px-4 py-3 font-medium text-dark">{routeOf(t)}</td>
                          <td className="px-4 py-3 text-xs text-mute font-medium">{fmtTime(t.departure)}</td>
                          <td className="px-4 py-3">
                            <Occupancy booked={t.booked} capacity={t.capacity} />
                          </td>
                          <td className="px-4 py-3 font-semibold text-dark">{inr(t.fare)}</td>
                          <td className="px-4 py-3">
                            <DemandBadge demand={demand} />
                          </td>
                          <td className="px-4 py-3">
                            {issues.length > 0 ? (
                              <Badge tone="red">Blocked</Badge>
                            ) : (
                              <Freshness ageMin={t.feedAgeMin} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Active Trip Detail Inspector (1 col) */}
        <div className="space-y-4">
          {activeTrip ? (
            <Card
              title={`Trip Inspector: ${activeTrip.id}`}
              action={<Badge tone={activeDemand === 'High' ? 'forest' : activeDemand === 'Low' ? 'amber' : 'slate'}>{activeDemand} Demand</Badge>}
            >
              <div className="space-y-4 text-xs">
                {/* Route Header Info */}
                <div className="rounded-lg bg-gray-50 p-3 border border-subtle space-y-1.5">
                  <div className="flex items-center justify-between text-dark font-semibold">
                    <span>{routeOf(activeTrip)}</span>
                    <span className="text-forest font-bold text-sm">{inr(activeTrip.fare)}</span>
                  </div>
                  <div className="flex items-center justify-between text-mute">
                    <span>Departure: {fmtTime(activeTrip.departure)}</span>
                    <span>({activeTrip.hoursToDeparture}h remaining)</span>
                  </div>
                </div>

                {/* Capacity & Vehicle Card */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg border border-subtle p-3 bg-white">
                    <div className="text-mute font-medium">Vehicle Assigned</div>
                    <div className="mt-1 font-semibold text-dark text-sm">{activeTrip.vehicleType || 'Volvo B11R'}</div>
                    <div className="text-[11px] text-mute">{activeTrip.capacity} total seats</div>
                  </div>

                  <div className="rounded-lg border border-subtle p-3 bg-white">
                    <div className="text-mute font-medium">Seat Occupancy</div>
                    <div className="mt-1 font-semibold text-dark text-sm">
                      {activeTrip.booked} / {activeTrip.capacity}
                    </div>
                    <div className="text-[11px] text-forest font-semibold">
                      {Math.round((activeTrip.booked / activeTrip.capacity) * 100)}% Booked
                    </div>
                  </div>
                </div>

                {/* Data Health & Validation Issues */}
                {activeIssues.length > 0 && (
                  <div className="rounded-lg border border-red-err/30 bg-red-light p-3 space-y-2 text-red-err">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <ShieldAlert size={14} />
                      FairFare Guard Block Active
                    </div>
                    {activeIssues.map(issue => (
                      <div key={issue.code} className="text-[11px]">
                        <span className="font-semibold">{issue.title}:</span> {issue.why}
                      </div>
                    ))}
                  </div>
                )}

                {/* Booking Velocity Trend Chart */}
                <div className="space-y-1.5 pt-2">
                  <div className="font-semibold text-dark flex items-center justify-between">
                    <span>Booking Velocity Curve</span>
                    <span className="text-mute font-normal text-[11px]">Observed vs Latent</span>
                  </div>
                  <div className="h-44 rounded-lg border border-subtle p-2 bg-white">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid stroke="#E2E8E3" vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="label" {...AXIS} />
                        <YAxis {...AXIS} width={30} />
                        <Tooltip {...chartTip} />
                        <Area type="monotone" dataKey="observedBookings" stroke="#245B49" fill="#245B49" fillOpacity={0.15} name="Observed Sales" />
                        <Area type="monotone" dataKey="latentEstimate" stroke="#D99A36" fill="#D99A36" fillOpacity={0.05} strokeDasharray="4 4" name="Est. True Demand" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quick Action Navigation */}
                <div className="pt-2 border-t border-subtle flex gap-2">
                  <Btn
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => navigate(`/trips/${activeTrip.id}`)}
                  >
                    Deep Trip Analysis
                  </Btn>
                  <Btn
                    variant="primary"
                    className="w-full text-xs"
                    onClick={() => navigate('/recommendations')}
                  >
                    View Recommendation
                  </Btn>
                </div>
              </div>
            </Card>
          ) : (
            <Empty title="Select a trip" hint="Click any trip on the left to inspect detailed demand signals." />
          )}
        </div>
      </div>
    </div>
  );
}
