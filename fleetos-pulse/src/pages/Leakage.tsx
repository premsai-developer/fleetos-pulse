import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, DollarSign, Filter, Info, RefreshCw, Search, ShieldAlert, Sparkles, XCircle } from 'lucide-react';
import { useApp } from '../context/AppState';
import { Badge, Btn, Card, ConfirmDialog, Empty, Kpi, cx, fmtCurrency, inputCls } from '../components/ui';

export default function Leakage() {
  const { discrepancies, resolveDiscrepancy } = useApp();

  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [resolveModal, setResolveModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [resolutionNotes, setResolutionNotes] = useState('');

  const metrics = useMemo(() => {
    const totalDiscrepancySum = discrepancies.reduce((s, d) => s + d.discrepancy, 0);
    const unresolvedCount = discrepancies.filter(d => d.status === 'Unresolved').length;
    const unresolvedSum = discrepancies.filter(d => d.status === 'Unresolved').reduce((s, d) => s + d.discrepancy, 0);
    const resolvedCount = discrepancies.filter(d => d.status === 'Resolved').length;

    return {
      totalDiscrepancySum,
      unresolvedCount,
      unresolvedSum,
      resolvedCount
    };
  }, [discrepancies]);

  const filtered = useMemo(() => {
    return discrepancies.filter(d => {
      const matchesQ = `${d.id} ${d.txRef} ${d.tripId} ${d.category} ${d.notes}`.toLowerCase().includes(q.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchesQ && matchesCategory && matchesStatus;
    });
  }, [discrepancies, q, categoryFilter, statusFilter]);

  const handleConfirmResolve = () => {
    if (resolveModal.id) {
      resolveDiscrepancy(resolveModal.id, resolutionNotes || 'Resolved after operator audit verification.');
    }
    setResolveModal({ open: false, id: null });
    setResolutionNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">Revenue Leakage & Settlement Investigator</h1>
          <p className="text-xs text-mute font-medium">
            Audit OTA commission deductions, refund double-credits, and driver expense outliers.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Badge tone={metrics.unresolvedCount > 0 ? 'red' : 'green'}>
            {metrics.unresolvedCount} Unresolved Discrepancies
          </Badge>
        </div>
      </div>

      {/* Audit KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total Discrepancies Flagged" value={fmtCurrency(metrics.totalDiscrepancySum)} sub="All Recorded Audits" tone="slate" />
        <Kpi label="Unresolved Exposure" value={fmtCurrency(metrics.unresolvedSum)} sub={`${metrics.unresolvedCount} Payout Batches`} tone="red" />
        <Kpi label="Resolved Leakage" value={fmtCurrency(metrics.totalDiscrepancySum - metrics.unresolvedSum)} sub={`${metrics.resolvedCount} Audits Closed`} tone="green" />
        <Kpi label="Audit Accuracy" value="99.4%" sub="Automated Matching" tone="forest" />
      </div>

      {/* Discrepancy Table Card */}
      <Card title="Settlement & Commission Discrepancy Register">
        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-3 text-mute" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search TXN ref, trip ID, or notes..."
              className={cx(inputCls, 'pl-9')}
            />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={cx(inputCls, 'sm:w-52')}>
            <option value="all">All Categories</option>
            <option value="OTA Commission">OTA Commission</option>
            <option value="Refund Mismatch">Refund Mismatch</option>
            <option value="Duplicate Tx">Duplicate Tx</option>
            <option value="Expense Outlier">Expense Outlier</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={cx(inputCls, 'sm:w-44')}>
            <option value="all">All Statuses</option>
            <option value="Unresolved">Unresolved</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <Empty title="No discrepancies match search" hint="Clear search parameters to list all settlement records." />
        ) : (
          <div className="overflow-x-auto rounded-md border border-subtle">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-mute border-b border-subtle">
                <tr>
                  {['Audit ID', 'Txn Reference', 'Trip ID', 'Category', 'Expected Payout', 'Settled Amount', 'Discrepancy', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-3 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle bg-white">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 font-semibold text-forest font-mono">{d.id}</td>
                    <td className="px-3 py-3 font-mono text-dark">{d.txRef}</td>
                    <td className="px-3 py-3 font-medium text-dark">{d.tripId}</td>
                    <td className="px-3 py-3 font-medium text-dark">{d.category}</td>
                    <td className="px-3 py-3 font-mono text-dark">{fmtCurrency(d.expectedAmount)}</td>
                    <td className="px-3 py-3 font-mono text-mute">{fmtCurrency(d.settledAmount)}</td>
                    <td className={cx('px-3 py-3 font-mono font-bold', d.discrepancy > 0 ? 'text-red-err' : 'text-green-ok')}>
                      {fmtCurrency(d.discrepancy)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={d.status === 'Resolved' ? 'forest' : 'red'}>{d.status}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      {d.status === 'Unresolved' ? (
                        <Btn
                          variant="outline"
                          className="text-xs py-1 px-2"
                          onClick={() => setResolveModal({ open: true, id: d.id })}
                        >
                          Resolve & Claim
                        </Btn>
                      ) : (
                        <span className="text-xs text-mute font-medium">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Resolution Dialog */}
      <ConfirmDialog
        open={resolveModal.open}
        title={`Resolve Settlement Discrepancy ${resolveModal.id}`}
        confirmLabel="Confirm Resolution"
        body={
          <div className="space-y-3 text-xs">
            <p className="text-dark">
              Enter operator resolution notes to close this discrepancy item and mark it reconciled.
            </p>
            <textarea
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              placeholder="e.g. Received OTA credit note for commission adjustment..."
              className={cx(inputCls, 'w-full h-20 resize-none')}
            />
          </div>
        }
        onConfirm={handleConfirmResolve}
        onClose={() => setResolveModal({ open: false, id: null })}
      />
    </div>
  );
}
