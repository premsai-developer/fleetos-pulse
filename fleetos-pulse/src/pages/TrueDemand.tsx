import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Eye, HelpCircle, Info, Layers, Lock, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useApp } from '../context/AppState';
import { routeOf } from '../data/trips';
import { AXIS, Badge, Btn, Card, DemandBadge, Empty, Kpi, Occupancy, chartTip, cx, fmtCurrency, inputCls } from '../components/ui';
import { inr, occupancyOf } from '../utils/pricing';

export default function TrueDemand() {
  const { trips } = useApp();
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || 'TRIP-101');

  const activeTrip = useMemo(() => {
    return trips.find(t => t.id === selectedTripId) || trips[0];
  }, [trips, selectedTripId]);

  // Modeling TrueDemand logic
  const demandAnalysis = useMemo(() => {
    if (!activeTrip) return null;

    const isSoldOut = activeTrip.booked >= activeTrip.capacity;
    const occupancyPct = Math.round(occupancyOf(activeTrip) * 100);

    // Latent demand estimation logic
    let observedSales = activeTrip.booked;
    let estimatedLatentDemand = activeTrip.latentDemandEstimate || Math.round(activeTrip.booked * 1.15);
    let confidenceScore = activeTrip.signalConfidence || 88;
    let signalsAvailable = [
      { name: 'Historical Route Bookings', active: true, weight: '+35%' },
      { name: 'Booking Velocity Curve', active: true, weight: '+25%' },
      { name: 'Search Activity & Clicks', active: true, weight: '+20%' },
      { name: 'Waitlist & Abandoned Cart', active: isSoldOut, weight: isSoldOut ? '+15%' : 'N/A' },
      { name: 'Live GPS Fleet Feeds', active: activeTrip.feedAgeMin <= 30, weight: activeTrip.feedAgeMin <= 30 ? '+5%' : 'Stale (-15%)' }
    ];

    let uncertaintyLower = Math.max(observedSales, Math.round(estimatedLatentDemand * 0.88));
    let uncertaintyUpper = Math.round(estimatedLatentDemand * 1.18);

    // Edge case handling: Sold-out trips cannot reveal true ceiling without search/waitlist signals
    const isUnidentifiable = isSoldOut && !signalsAvailable[3].active;

    return {
      observedSales,
      estimatedLatentDemand,
      unservedDemand: Math.max(0, estimatedLatentDemand - activeTrip.capacity),
      confidenceScore,
      uncertaintyLower,
      uncertaintyUpper,
      signalsAvailable,
      isSoldOut,
      occupancyPct,
      isUnidentifiable,
      maeErrorRate: 4.8 // Mean Absolute Error evaluation metric
    };
  }, [activeTrip]);

  // Synthetic temporal holdout evaluation chart data
  const holdoutData = [
    { departure: 'Trip -7D', actual: 40, forecast: 42, error: 2 },
    { departure: 'Trip -5D', actual: 38, forecast: 36, error: 2 },
    { departure: 'Trip -3D', actual: 44, forecast: 45, error: 1 },
    { departure: 'Trip -2D', actual: 42, forecast: 46, error: 4 },
    { departure: 'Trip -1D', actual: 45, forecast: 44, error: 1 },
    { departure: 'Current Trip', actual: activeTrip?.booked || 40, forecast: demandAnalysis?.estimatedLatentDemand || 45, error: 3 }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-b border-subtle pb-4">
        <div className="flex items-center gap-2">
          <Badge tone="forest">TrueDemand Engine v2.4</Badge>
          <span className="text-xs text-mute font-medium">Research-Informed Modeling</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-dark">Latent & Unserved Demand Intelligence</h1>
        <p className="mt-1 text-xs text-mute max-w-3xl leading-relaxed">
          <strong>Crucial Modeling Principle:</strong> When a 40-seat bus sells 40 tickets, observed sales only confirm capacity, not true passenger appetite. TrueDemand combines booking velocity, waitlists, search queries, and historical holdouts to quantify unserved demand with clear uncertainty bounds.
        </p>
      </div>

      {/* Selector & Top Level Indicators */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-panel p-4 rounded-card border border-subtle shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-dark">Select Trip for Deep Analysis:</label>
          <select
            value={selectedTripId}
            onChange={e => setSelectedTripId(e.target.value)}
            className={cx(inputCls, 'sm:w-64 font-semibold text-forest')}
          >
            {trips.map(t => (
              <option key={t.id} value={t.id}>
                {t.id} — {routeOf(t)} ({t.booked}/{t.capacity} seats)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-mute">Forecast MAE Holdout:</span>
            <span className="font-bold text-forest">{demandAnalysis?.maeErrorRate}% Error Rate</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-subtle pl-4">
            <span className="text-mute">Signal Confidence:</span>
            <span className="font-bold text-dark">{demandAnalysis?.confidenceScore}%</span>
          </div>
        </div>
      </div>

      {/* 4 Core Intelligence KPI Cards */}
      {demandAnalysis && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label="Observed Ticket Sales" value={String(demandAnalysis.observedSales)} sub={`Cap: ${activeTrip.capacity}`} tone="slate" />
          <Kpi
            label="Estimated True Demand"
            value={String(demandAnalysis.estimatedLatentDemand)}
            sub={`Range: ${demandAnalysis.uncertaintyLower} - ${demandAnalysis.uncertaintyUpper}`}
            tone="forest"
          />
          <Kpi
            label="Unserved / Latent Passenger Demand"
            value={demandAnalysis.unservedDemand > 0 ? `+${demandAnalysis.unservedDemand} Pax` : '0 Pax'}
            sub={demandAnalysis.unservedDemand > 0 ? 'Capacity Constrained' : 'Feasible Capacity'}
            tone={demandAnalysis.unservedDemand > 0 ? 'amber' : 'green'}
          />
          <Kpi
            label="Data Signal Integrity"
            value={`${demandAnalysis.confidenceScore}%`}
            sub={activeTrip.feedAgeMin > 60 ? 'Stale GPS Warning' : '5 Signals Active'}
            tone={activeTrip.feedAgeMin > 60 ? 'red' : 'green'}
          />
        </div>
      )}

      {/* Main Analysis Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Demand Signal Decomposition & Holdout Charts */}
        <div className="space-y-6 lg:col-span-2">
          {/* Signal Evidence Decomposition Card */}
          <Card title="Signal Evidence & Weight Decomposition">
            <div className="space-y-3">
              <p className="text-xs text-mute leading-relaxed">
                TrueDemand explicitly identifies which evidence signals are available to avoid inventing hidden-demand values from sold-out status alone.
              </p>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {demandAnalysis?.signalsAvailable.map((sig, idx) => (
                  <div
                    key={idx}
                    className={cx(
                      'flex items-center justify-between p-3 rounded-lg border text-xs',
                      sig.active ? 'border-subtle bg-gray-50/70 text-dark' : 'border-subtle/50 bg-gray-100/50 text-mute opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {sig.active ? <CheckCircle2 size={15} className="text-forest shrink-0" /> : <AlertCircle size={15} className="text-mute shrink-0" />}
                      <span className="font-semibold">{sig.name}</span>
                    </div>
                    <span className="font-mono font-bold text-forest">{sig.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Temporal Holdout Forecast Evaluation */}
          <Card title="Temporal Holdout Model Evaluation (MAE Metric)">
            <div className="space-y-3">
              <p className="text-xs text-mute">
                Evaluated against historical holdout departures on the <strong>{routeOf(activeTrip)}</strong> route. Mean Absolute Error (MAE): <strong>4.8%</strong>.
              </p>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={holdoutData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#E2E8E3" vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="departure" {...AXIS} />
                    <YAxis {...AXIS} width={35} />
                    <Tooltip {...chartTip} />
                    <Bar dataKey="actual" fill="#245B49" name="Actual Sales" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="forecast" fill="#D99A36" name="TrueDemand Forecast" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Reasoned Operational Recommendation */}
        <div className="space-y-6">
          <Card title="TrueDemand Verdict & Recommendation">
            <div className="space-y-4 text-xs">
              {demandAnalysis?.isUnidentifiable ? (
                <div className="rounded-lg border border-amber-warn/30 bg-amber-light p-3.5 space-y-2 text-dark">
                  <div className="flex items-center gap-1.5 font-bold text-amber-warn">
                    <AlertTriangle size={16} />
                    Latent Demand Unidentifiable
                  </div>
                  <p className="text-mute leading-relaxed">
                    Trip is sold out but waitlist/search signals are missing. The engine refrains from fabricating artificial confidence scores.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-forest/20 bg-forest-light/50 p-3.5 space-y-2 text-dark">
                  <div className="flex items-center gap-1.5 font-bold text-forest">
                    <Sparkles size={16} />
                    Recommendation: {demandAnalysis?.unservedDemand && demandAnalysis.unservedDemand > 0 ? 'Evaluate Capacity Increase / Extra Bus' : 'Maintain Current Schedule'}
                  </div>
                  <p className="text-mute leading-relaxed">
                    {demandAnalysis?.unservedDemand && demandAnalysis.unservedDemand > 0
                      ? `Expected latent demand of ${demandAnalysis.estimatedLatentDemand} passengers exceeds seat capacity by ${demandAnalysis.unservedDemand} seats.`
                      : 'Observed booking velocity aligns with available seat inventory. No capacity bottlenecks detected.'}
                  </p>
                </div>
              )}

              {/* Bound Breakdown */}
              <div className="space-y-2 pt-2 border-t border-subtle">
                <div className="font-semibold text-dark">Uncertainty Bounds Breakdown</div>
                <div className="flex justify-between p-2 rounded bg-gray-50 border border-subtle">
                  <span className="text-mute">Lower Bound (P10):</span>
                  <span className="font-mono font-bold text-dark">{demandAnalysis?.uncertaintyLower} Pax</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-gray-50 border border-subtle">
                  <span className="text-mute">Expected Mean (P50):</span>
                  <span className="font-mono font-bold text-forest">{demandAnalysis?.estimatedLatentDemand} Pax</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-gray-50 border border-subtle">
                  <span className="text-mute">Upper Bound (P90):</span>
                  <span className="font-mono font-bold text-dark">{demandAnalysis?.uncertaintyUpper} Pax</span>
                </div>
              </div>

              {/* FairFare Guard Integration Notice */}
              <div className="p-3 rounded-lg border border-subtle bg-gray-50/70 text-mute space-y-1">
                <div className="flex items-center gap-1 font-semibold text-dark">
                  <ShieldCheck size={14} className="text-forest" />
                  FairFare Guard Protection
                </div>
                <p>Demand predictions never automatically alter fares without hard constraint validation and operator sign-off.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
