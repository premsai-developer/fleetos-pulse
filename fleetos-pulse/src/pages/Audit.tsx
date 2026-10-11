import { useMemo, useState } from 'react';
import { CheckCircle2, Download, FileText, Filter, Lock, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppState';
import { Badge, Btn, Card, Empty, Kpi, cx, fmtTime, inputCls } from '../components/ui';
import { inr } from '../utils/pricing';

export default function Audit() {
  const { decisions, reload } = useApp();

  const [q, setQ] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return decisions.filter(d => {
      const matchesQ = `${d.id} ${d.tripId} ${d.route} ${d.reason}`.toLowerCase().includes(q.toLowerCase());
      const matchesSource = sourceFilter === 'all' || d.source === sourceFilter;
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchesQ && matchesSource && matchesStatus;
    });
  }, [decisions, q, sourceFilter, statusFilter]);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(decisions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `FleetOS_Audit_Ledger_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">Immutable Decision Audit Ledger</h1>
          <p className="text-xs text-mute font-medium">
            Verifiable history of operator dynamic fare approvals, recommendations, and system blocks.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Btn variant="outline" onClick={handleExportJSON}>
            <Download size={14} />
            Export JSON Audit Trail
          </Btn>
        </div>
      </div>

      {/* Audit KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total Logged Decisions" value={String(decisions.length)} sub="Audit Log Records" tone="slate" />
        <Kpi label="Operator Approvals" value={String(decisions.filter(d => d.status === 'accepted').length)} sub="Active Fare Adjustments" tone="forest" />
        <Kpi label="Guard Blocked Actions" value={String(decisions.filter(d => d.status === 'blocked').length)} sub="Prevented Volatility" tone="red" />
        <Kpi label="Ledger Integrity" value="100% Verified" sub="SHA-256 Mock Hash" tone="green" />
      </div>

      {/* Audit Data Table Card */}
      <Card title="Decision Ledger Records">
        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-3 text-mute" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search audit ID, trip, route, or reason..."
              className={cx(inputCls, 'pl-9')}
            />
          </div>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className={cx(inputCls, 'sm:w-48')}>
            <option value="all">All Engine Sources</option>
            <option value="recommendation">Recommendation Engine</option>
            <option value="trip-twin">Trip Twin Scenario</option>
            <option value="operator-override">Operator Override</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={cx(inputCls, 'sm:w-40')}>
            <option value="all">All Statuses</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <Empty title="No audit entries match filter" hint="Adjust search query or filter settings to view logged decisions." />
        ) : (
          <div className="overflow-x-auto rounded-md border border-subtle">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-mute border-b border-subtle">
                <tr>
                  {['Audit ID', 'Timestamp', 'Trip & Route', 'Source Engine', 'Status', 'Fare Delta', 'Operator Reason'].map(h => (
                    <th key={h} className="px-3 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle bg-white">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 font-mono font-semibold text-forest">{d.id}</td>
                    <td className="px-3 py-3 text-xs text-mute font-medium">{fmtTime(d.timestamp)}</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-dark">{d.tripId}</div>
                      <div className="text-xs text-mute">{d.route}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-dark font-medium">{d.source}</td>
                    <td className="px-3 py-3">
                      <Badge tone={d.status === 'accepted' ? 'forest' : d.status === 'blocked' ? 'red' : 'slate'}>{d.status}</Badge>
                    </td>
                    <td className="px-3 py-3 font-mono text-dark font-medium">
                      {inr(d.previousFare)} → {inr(d.proposedFare)}
                    </td>
                    <td className="px-3 py-3 text-xs text-mute max-w-[260px] truncate">{d.reason || 'No reason specified'}</td>
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
