import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, DollarSign, Filter, Info, RefreshCw, Search, ShieldAlert, Sparkles, TrendingUp, XCircle } from 'lucide-react';
import { useApp } from '../context/AppState';
import { routeOf } from '../data/trips';
import { AXIS, Badge, Btn, Card, ConfirmDialog, DemandBadge, Empty, ErrorBanner, Freshness, Kpi, Occupancy, Overlay, cx, fmtCurrency, fmtTime, inputCls } from '../components/ui';

import { classifyDemand, inr, occupancyOf, validateTrip } from '../utils/pricing';
import type { Decision, DecisionStatus, Recommendation, Trip } from '../types';

const TONE: Record<DecisionStatus, 'forest' | 'slate' | 'red' | 'amber'> = {
  accepted: 'forest',
  rejected: 'slate',
  blocked: 'red',
  in_review: 'amber'
};

const LABEL: Record<DecisionStatus, string> = {
  accepted: 'Approved',
  rejected: 'Rejected',
  blocked: 'Guard Blocked',
  in_review: 'In Review'
};

export default function Decisions() {
  const { trips, decisions, loading, error, reload, record, clearDecisions } = useApp();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [clearModal, setClearModal] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; rec: Recommendation | null; action: 'accepted' | 'rejected' }>({
    open: false,
    rec: null,
    action: 'accepted'
  });

  // Calculate dynamic recommendations for active trips
  const activeRecommendations = useMemo(() => {
    return trips.map(t => {
      const demand = classifyDemand(t);
      const issues = validateTrip(t);
      const blocked = issues.length > 0;
      const baseFare = t.fare || 600;

      let action: 'Raise fare' | 'Lower fare' | 'Hold fare' = 'Hold fare';
      let proposedFare: number | null = baseFare;
      let why = 'Occupancy aligns with historical booking velocity expectations.';
      let assumptions: string[] = ['Baseline elasticity 1.2', 'Normal competitor pricing'];
      let constraints: string[] = [`Min fare ₹${t.minFare}`, `Max fare ₹${t.maxFare}`];
      let expectedRevenueDiff = 0;
      let expectedPaxDiff = 0;

      if (demand === 'High' && !blocked) {
        action = 'Raise fare';
        proposedFare = Math.min(t.maxFare, Math.round(baseFare * 1.15));
        why = `Occupancy is at ${Math.round(occupancyOf(t) * 100)}% with ${t.hoursToDeparture}h to departure. TrueDemand indicates latent unserved demand.`;
        expectedRevenueDiff = Math.round((proposedFare - baseFare) * t.booked * 0.85);
        expectedPaxDiff = -1;
        assumptions.push('Inelastic demand for peak hours');
      } else if (demand === 'Low' && !blocked) {
        action = 'Lower fare';
        proposedFare = Math.max(t.minFare, Math.round(baseFare * 0.88));
        why = `Low occupancy (${Math.round(occupancyOf(t) * 100)}%) with ${t.hoursToDeparture}h remaining. Promo fare recommended to stimulate volume.`;
        expectedRevenueDiff = Math.round((proposedFare - baseFare) * t.booked + proposedFare * 4);
        expectedPaxDiff = +4;
        assumptions.push('Elastic response to 12% price reduction');
      }

      if (blocked) {
        why = `FairFare Guard Pricing Freeze: ${issues[0].why}`;
        proposedFare = null;
        constraints.push('STALE DATA FREEZE ACTIVE');
      }

      return {
        id: `REC-${t.id}`,
        tripId: t.id,
        blocked,
        issues,
        demand,
        action,
        proposedFare,
        why,
        assumptions,
        constraints,
        expectedRevenueDiff,
        expectedPaxDiff,
        status: 'pending' as const
      };
    });
  }, [trips]);

  const handleDecisionConfirm = async (operatorReason: string) => {
    if (!confirmModal.rec) return;

    const rec = confirmModal.rec;
    await record({
      tripId: rec.tripId,
      action: rec.action,
      proposedFare: rec.proposedFare,
      reason: operatorReason || rec.why,
      assumptions: rec.assumptions,
      source: 'recommendation',
      status: confirmModal.action
    });

    setConfirmModal({ open: false, rec: null, action: 'accepted' });
  };

  const filteredDecisions = decisions.filter(
    d =>
      (status === 'all' || d.status === status) &&
      `${d.id} ${d.tripId} ${d.route} ${d.reason}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">Recommendations & FairFare Guard</h1>
          <p className="text-xs text-mute font-medium">
            Review demand-backed operational recommendations with enforced FairFare Guard pricing safety rules.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Btn variant="outline" onClick={reload}>
            <RefreshCw size={14} />
            Refresh
          </Btn>
          {decisions.length > 0 && (
            <Btn variant="danger" onClick={() => setClearModal(true)}>
              Clear Local Audit Logs
            </Btn>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={reload} />}

      {/* Active Recommendations Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-dark flex items-center gap-2">
            <Sparkles size={18} className="text-forest" />
            Active Recommendation Queue ({activeRecommendations.filter(r => !r.blocked && r.action !== 'Hold fare').length} Pending)
          </h2>
          <span className="text-xs text-mute">FairFare Guard Rules Active</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {activeRecommendations.map(rec => {
            const trip = trips.find(t => t.id === rec.tripId);
            if (!trip) return null;

            return (
              <Card
                key={rec.id}
                className={rec.blocked ? 'border-red-err/30 bg-red-light/20' : 'hover:border-forest/40'}
                title={`Trip ${rec.tripId} — ${routeOf(trip)}`}
                action={<DemandBadge demand={rec.demand} />}
              >
                <div className="space-y-4 text-xs">
                  {/* Problem & Action Banner */}
                  <div className="flex items-center justify-between border-b border-subtle pb-3">
                    <div>
                      <div className="text-mute font-medium">Recommended Action</div>
                      <div className="text-sm font-bold text-dark mt-0.5">{rec.action}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-mute font-medium">Fare Adjustment</div>
                      <div className="text-sm font-bold text-forest mt-0.5">
                        {inr(trip.fare)} → {inr(rec.proposedFare)}
                      </div>
                    </div>
                  </div>

                  {/* Supporting Evidence */}
                  <div>
                    <div className="font-semibold text-dark mb-1">Supporting Evidence</div>
                    <p className="text-mute leading-relaxed">{rec.why}</p>
                  </div>

                  {/* Financial & Pax Impact */}
                  {!rec.blocked && (
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-lg border border-subtle">
                      <div>
                        <span className="text-mute">Expected Revenue Diff:</span>
                        <div className={cx('font-bold font-mono', rec.expectedRevenueDiff >= 0 ? 'text-green-ok' : 'text-red-err')}>
                          {rec.expectedRevenueDiff >= 0 ? `+${fmtCurrency(rec.expectedRevenueDiff)}` : fmtCurrency(rec.expectedRevenueDiff)}
                        </div>
                      </div>
                      <div>
                        <span className="text-mute">Expected Seat Impact:</span>
                        <div className="font-bold text-dark font-mono">
                          {rec.expectedPaxDiff >= 0 ? `+${rec.expectedPaxDiff} Seats` : `${rec.expectedPaxDiff} Seats`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FairFare Guard Constraint Warnings */}
                  {rec.blocked && (
                    <div className="p-3 rounded-lg border border-red-err/30 bg-red-light text-red-err space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <ShieldAlert size={15} />
                        FairFare Guard Freeze Triggered
                      </div>
                      <p>{rec.issues[0]?.why || 'Pricing updates frozen due to invalid or stale feed.'}</p>
                    </div>
                  )}

                  {/* Action Controls */}
                  <div className="pt-2 border-t border-subtle flex justify-end gap-2">
                    <Btn
                      variant="outline"
                      disabled={rec.blocked}
                      onClick={() => setConfirmModal({ open: true, rec, action: 'rejected' })}
                    >
                      Reject Recommendation
                    </Btn>
                    <Btn
                      variant="primary"
                      disabled={rec.blocked}
                      onClick={() => setConfirmModal({ open: true, rec, action: 'accepted' })}
                    >
                      Approve & Update Fare
                    </Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Decision Audit History Table */}
      <Card title="Operator Decision Audit Log">
        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-3 text-mute" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by decision ID, trip, or route..."
              className={cx(inputCls, 'pl-9')}
            />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className={cx(inputCls, 'sm:w-48')}>
            <option value="all">All Decision Statuses</option>
            {Object.entries(LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {filteredDecisions.length === 0 ? (
          <Empty
            title="No decisions logged yet"
            hint="Approve or reject a recommendation above to generate persistent audit entries."
          />
        ) : (
          <div className="overflow-x-auto rounded-md border border-subtle">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-mute border-b border-subtle">
                <tr>
                  {['Timestamp', 'Decision ID', 'Trip & Route', 'Status', 'Fare Change', 'Operator Reason'].map(h => (
                    <th key={h} className="px-3 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle bg-white">
                {filteredDecisions.map(d => (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedDecision(d)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-3 text-xs text-mute font-medium">{fmtTime(d.timestamp)}</td>
                    <td className="px-3 py-3 font-semibold text-forest">{d.id}</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-dark">{d.tripId}</div>
                      <div className="text-xs text-mute">{d.route}</div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={TONE[d.status]}>{LABEL[d.status]}</Badge>
                    </td>
                    <td className="px-3 py-3 font-mono font-medium text-dark">
                      {inr(d.previousFare)} → {inr(d.proposedFare)}
                    </td>
                    <td className="px-3 py-3 text-xs text-mute max-w-[240px] truncate">{d.reason || 'No reason specified'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Decision Detail Drawer */}
      <Overlay drawer open={!!selectedDecision} title={`Decision ${selectedDecision?.id}`} onClose={() => setSelectedDecision(null)}>
        {selectedDecision && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-subtle pb-3">
              <Badge tone={TONE[selectedDecision.status]}>{LABEL[selectedDecision.status]}</Badge>
              <span className="text-mute">{fmtTime(selectedDecision.timestamp)}</span>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-mute font-medium">Trip ID</dt>
                <dd className="font-semibold text-dark text-sm">{selectedDecision.tripId}</dd>
              </div>
              <div>
                <dt className="text-mute font-medium">Source Engine</dt>
                <dd className="font-semibold text-dark">{selectedDecision.source}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-mute font-medium">Intercity Route</dt>
                <dd className="font-semibold text-dark">{selectedDecision.route}</dd>
              </div>
              <div>
                <dt className="text-mute font-medium">Previous Fare</dt>
                <dd className="font-mono text-dark">{inr(selectedDecision.previousFare)}</dd>
              </div>
              <div>
                <dt className="text-mute font-medium">Approved Fare</dt>
                <dd className="font-mono text-forest font-semibold">{inr(selectedDecision.proposedFare)}</dd>
              </div>
            </dl>

            <div>
              <div className="text-mute font-medium">Operator Reason / Notes</div>
              <p className="mt-1 p-2.5 rounded bg-gray-50 border border-subtle text-dark leading-relaxed">
                {selectedDecision.reason || 'No specific notes recorded.'}
              </p>
            </div>
          </div>
        )}
      </Overlay>

      {/* Confirmation Modal */}
      <ConfirmDialog
        open={confirmModal.open}
        title={confirmModal.action === 'accepted' ? 'Approve Recommendation & Update Fare' : 'Reject Recommendation'}
        confirmLabel={confirmModal.action === 'accepted' ? 'Confirm & Apply Fare' : 'Confirm Rejection'}
        body={
          <div className="space-y-2 text-xs">
            <p className="font-medium text-dark">
              Are you sure you want to {confirmModal.action === 'accepted' ? 'approve' : 'reject'} the recommendation for{' '}
              <strong>Trip {confirmModal.rec?.tripId}</strong>?
            </p>
            {confirmModal.action === 'accepted' && (
              <p className="text-mute">
                Approved fare will be set to <strong>{inr(confirmModal.rec?.proposedFare ?? null)}</strong> and immediately propagated to the Passenger Companion interface.
              </p>

            )}
          </div>
        }
        onConfirm={handleDecisionConfirm}
        onClose={() => setConfirmModal({ open: false, rec: null, action: 'accepted' })}
      />

      {/* Clear History Modal */}
      <ConfirmDialog
        open={clearModal}
        title="Reset Decision Audit History?"
        confirmLabel="Reset History"
        body={<p className="text-xs text-dark">This will clear all local operator decisions and revert fares to their default values.</p>}
        onConfirm={async () => {
          await clearDecisions();
          setClearModal(false);
        }}
        onClose={() => setClearModal(false)}
      />
    </div>
  );
}

