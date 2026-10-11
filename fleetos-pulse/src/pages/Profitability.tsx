import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, DollarSign, Filter, Info, Layers, PieChart, TrendingUp, Users, Zap } from 'lucide-react';
import { useApp } from '../context/AppState';
import { routeOf } from '../data/trips';
import { AXIS, Badge, Btn, Card, Kpi, Occupancy, chartTip, cx, fmtCurrency, inputCls } from '../components/ui';
import { inr, occupancyOf } from '../utils/pricing';

export default function Profitability() {
  const { trips } = useApp();

  const [selectedRoute, setSelectedRoute] = useState('all');

  const routes = useMemo(() => [...new Set(trips.map(routeOf))], [trips]);

  const financialMetrics = useMemo(() => {
    let totalGrossRevenue = 0;
    let totalOperatingCosts = 0;
    let totalSeatsBooked = 0;
    let totalCapacity = 0;

    const tripMetrics = trips.map(t => {
      const grossRev = t.booked * (t.fare || 600);
      const estCost = t.operatingCost || Math.round(t.capacity * 210 + (t.fare || 600) * 8);
      const netProfit = grossRev - estCost;
      const marginPct = grossRev > 0 ? Math.round((netProfit / grossRev) * 100) : 0;
      const yieldPerSeatKm = t.distanceKm ? ((grossRev / (t.booked || 1)) / t.distanceKm).toFixed(2) : '1.85';

      totalGrossRevenue += grossRev;
      totalOperatingCosts += estCost;
      totalSeatsBooked += t.booked;
      totalCapacity += t.capacity;

      return {
        ...t,
        grossRev,
        estCost,
        netProfit,
        marginPct,
        yieldPerSeatKm
      };
    });

    const netContributionMargin = totalGrossRevenue - totalOperatingCosts;
    const overallMarginPct = totalGrossRevenue > 0 ? Math.round((netContributionMargin / totalGrossRevenue) * 100) : 0;

    return {
      tripMetrics,
      totalGrossRevenue,
      totalOperatingCosts,
      netContributionMargin,
      overallMarginPct
    };
  }, [trips]);

  const routeMarginData = useMemo(() => {
    return routes.map(r => {
      const routeTrips = financialMetrics.tripMetrics.filter(t => routeOf(t) === r);
      const rev = routeTrips.reduce((s, t) => s + t.grossRev, 0);
      const cost = routeTrips.reduce((s, t) => s + t.estCost, 0);
      const net = rev - cost;
      return {
        route: r.replace('Visakhapatnam', 'VSKP').replace('Vijayawada', 'VJA').replace('Hyderabad', 'HYD').replace(' → ', '→'),
        revenue: rev,
        cost: cost,
        profit: net
      };
    });
  }, [routes, financialMetrics]);

  const filteredTrips = useMemo(() => {
    if (selectedRoute === 'all') return financialMetrics.tripMetrics;
    return financialMetrics.tripMetrics.filter(t => routeOf(t) === selectedRoute);
  }, [financialMetrics, selectedRoute]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">Profitability & Yield Analytics</h1>
          <p className="text-xs text-mute font-medium">
            Granular route profitability, operating cost breakdowns, and net contribution margins.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Badge tone="forest">Net Contribution Focus</Badge>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Gross Ticket Revenue" value={fmtCurrency(financialMetrics.totalGrossRevenue)} sub="All Active Departures" tone="forest" />
        <Kpi label="Total Operating Costs" value={fmtCurrency(financialMetrics.totalOperatingCosts)} sub="Fuel, Tolls, Driver Allowance" tone="slate" />
        <Kpi
          label="Net Contribution Margin"
          value={fmtCurrency(financialMetrics.netContributionMargin)}
          sub={`${financialMetrics.overallMarginPct}% Margin`}
          tone={financialMetrics.netContributionMargin >= 0 ? 'green' : 'red'}
        />
        <Kpi label="Average Yield per Pax" value={`₹${Math.round(financialMetrics.totalGrossRevenue / (trips.reduce((s, t) => s + t.booked, 0) || 1))}`} sub="Across Fleet" tone="amber" />
      </div>

      {/* Visualizations Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Route Profitability Breakdown (Gross Revenue vs Operating Cost)">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeMarginData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8E3" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="route" {...AXIS} />
                <YAxis {...AXIS} width={45} />
                <Tooltip {...chartTip} />
                <Bar dataKey="revenue" fill="#245B49" name="Gross Revenue" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="cost" fill="#69756D" name="Operating Cost" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Operating Cost Structure Breakdown">
          <div className="space-y-3 text-xs">
            <p className="text-mute">Average cost composition per intercity departure:</p>

            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-dark">Fuel & Energy Costs (55%)</span>
                  <span className="font-mono text-mute">~₹14,500 / trip</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-forest w-[55%]" />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between font-medium">
                  <span className="text-dark">Highway Tolls & Permits (22%)</span>
                  <span className="font-mono text-mute">~₹5,800 / trip</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-forest-hover w-[22%]" />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between font-medium">
                  <span className="text-dark">Driver Allowance & Crew (15%)</span>
                  <span className="font-mono text-mute">~₹3,900 / trip</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-amber-warn w-[15%]" />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between font-medium">
                  <span className="text-dark">Depreciation & Maintenance Reserve (8%)</span>
                  <span className="font-mono text-mute">~₹2,100 / trip</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-gray-400 w-[8%]" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Trip Profit Table */}
      <Card
        title="Trip-Level Profitability Ledger"
        action={
          <select value={selectedRoute} onChange={e => setSelectedRoute(e.target.value)} className={cx(inputCls, 'sm:w-56')}>
            <option value="all">All Intercity Routes</option>
            {routes.map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
        }
      >
        <div className="overflow-x-auto rounded-md border border-subtle">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-mute border-b border-subtle">
              <tr>
                {['Trip ID', 'Route', 'Booked / Cap', 'Gross Rev', 'Operating Cost', 'Net Contribution', 'Margin %', 'Yield/Pax-Km'].map(h => (
                  <th key={h} className="px-3 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle bg-white">
              {filteredTrips.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 font-semibold text-forest">{t.id}</td>
                  <td className="px-3 py-3 font-medium text-dark">{routeOf(t)}</td>
                  <td className="px-3 py-3 font-medium text-dark">
                    {t.booked} / {t.capacity}
                  </td>
                  <td className="px-3 py-3 font-mono font-medium text-dark">{fmtCurrency(t.grossRev)}</td>
                  <td className="px-3 py-3 font-mono text-mute">{fmtCurrency(t.estCost)}</td>
                  <td className={cx('px-3 py-3 font-mono font-bold', t.netProfit >= 0 ? 'text-green-ok' : 'text-red-err')}>
                    {fmtCurrency(t.netProfit)}
                  </td>
                  <td className="px-3 py-3 font-semibold">
                    <Badge tone={t.marginPct >= 30 ? 'forest' : t.marginPct >= 10 ? 'amber' : 'red'}>{t.marginPct}%</Badge>
                  </td>
                  <td className="px-3 py-3 text-xs font-mono text-mute">₹{t.yieldPerSeatKm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
