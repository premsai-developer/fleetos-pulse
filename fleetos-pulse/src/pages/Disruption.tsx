import { useMemo, useState } from 'react';
import { AlertTriangle, Bus, CheckCircle2, Clock, DollarSign, MapPin, Navigation, RefreshCw, ShieldAlert, Sparkles, Users } from 'lucide-react';
import { useApp } from '../context/AppState';
import { routeOf } from '../data/trips';
import { Badge, Btn, Card, ConfirmDialog, Empty, Kpi, cx, fmtCurrency } from '../components/ui';

export default function Disruption() {
  const { disruptions, resolveDisruption, trips } = useApp();

  const [selectedDisruptionId, setSelectedDisruptionId] = useState<string>(disruptions[0]?.id || 'DISR-501');

  const [dispatchModal, setDispatchModal] = useState<{ open: boolean; disruptionId: string | null; vehicleId: string | null }>({
    open: false,
    disruptionId: null,
    vehicleId: null
  });

  const activeDisruption = useMemo(() => {
    return disruptions.find(d => d.id === selectedDisruptionId) || disruptions[0];
  }, [disruptions, selectedDisruptionId]);

  const activeTrip = useMemo(() => {
    if (!activeDisruption) return null;
    return trips.find(t => t.id === activeDisruption.affectedTripId);
  }, [activeDisruption, trips]);

  const handleConfirmDispatch = () => {
    if (dispatchModal.disruptionId && dispatchModal.vehicleId) {
      resolveDisruption(dispatchModal.disruptionId, dispatchModal.vehicleId);
    }
    setDispatchModal({ open: false, disruptionId: null, vehicleId: null });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">Disruption & Contingency Center</h1>
          <p className="text-xs text-mute font-medium">
            Real-time highway breakdown alerts, candidate recovery vehicle selection, and automated passenger notifications.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Badge tone={disruptions.some(d => d.status === 'Active') ? 'red' : 'green'}>
            {disruptions.filter(d => d.status === 'Active').length} Active Disruption Alerts
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Active Incidents" value={String(disruptions.filter(d => d.status === 'Active').length)} sub="Highway Emergencies" tone="red" />
        <Kpi label="Passengers Affected" value={String(activeDisruption?.passengerCount || 0)} sub="Requires Replacement" tone="amber" />
        <Kpi label="Average Recovery Time" value="22 mins" sub="SLA Goal: <35m" tone="forest" />
        <Kpi label="Available Recovery Depot" value="3 Buses" sub="Near Samalkot" tone="slate" />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Disruption Event Feed (1 col) */}
        <div className="space-y-4">
          <Card title="Incidents & Contingency Events">
            <div className="space-y-3">
              {disruptions.map(event => (
                <div
                  key={event.id}
                  onClick={() => setSelectedDisruptionId(event.id)}
                  className={cx(
                    'p-3.5 rounded-lg border cursor-pointer transition-all',
                    event.id === activeDisruption?.id ? 'border-forest bg-forest-light/40 shadow-sm' : 'border-subtle bg-white hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold font-mono text-dark text-xs">{event.id}</span>
                    <Badge tone={event.status === 'Active' ? 'red' : 'forest'}>{event.status}</Badge>
                  </div>
                  <h3 className="mt-1 font-semibold text-dark text-sm">{event.route}</h3>
                  <div className="mt-1 text-xs text-mute flex items-center justify-between">
                    <span>Trip {event.affectedTripId}</span>
                    <span className="font-medium text-dark">{event.passengerCount} Passengers</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 2 Columns: Candidate Vehicle Matching & Dispatch (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          {activeDisruption ? (
            <Card
              title={`Disruption Inspector: ${activeDisruption.id}`}
              action={<Badge tone={activeDisruption.status === 'Active' ? 'red' : 'forest'}>{activeDisruption.status}</Badge>}
            >
              <div className="space-y-4 text-xs">
                {/* Incident Detail Header */}
                <div className="p-4 rounded-lg bg-red-light/30 border border-red-err/30 text-dark space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-red-err text-sm">
                      <ShieldAlert size={16} />
                      {activeDisruption.cause}
                    </div>
                    <span className="font-mono text-xs font-semibold">{activeDisruption.route}</span>
                  </div>
                  <p className="text-mute">
                    Affected Departure: <strong>Trip {activeDisruption.affectedTripId}</strong> with <strong>{activeDisruption.passengerCount} passengers onboard</strong> awaiting breakdown recovery.
                  </p>
                </div>

                {/* Candidate Recovery Bus Table */}
                <div className="space-y-2">
                  <div className="font-bold text-dark text-sm flex items-center justify-between">
                    <span>Candidate Recovery Vehicles (Nearest Depots)</span>
                    <span className="text-mute text-xs font-normal">Ranked by ETA & Capacity Match</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {activeDisruption.candidateVehicles.map(veh => {
                      const isSelected = activeDisruption.selectedVehicleId === veh.vehicleId;
                      const hasCapacity = veh.capacity >= activeDisruption.passengerCount;

                      return (
                        <div
                          key={veh.vehicleId}
                          className={cx(
                            'p-3.5 rounded-lg border flex flex-col justify-between space-y-3 transition-all',
                            isSelected
                              ? 'border-forest bg-forest-light/60 font-medium'
                              : activeDisruption.status === 'Recovered'
                              ? 'border-subtle bg-gray-50 opacity-60'
                              : 'border-subtle bg-white hover:border-forest/40'
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-dark text-xs">{veh.vehicleId}</span>
                              <Badge tone={hasCapacity ? 'forest' : 'amber'}>{veh.capacity} Seats</Badge>
                            </div>
                            <div className="mt-2 text-mute text-xs">
                              ETA to Breakdown: <strong className="text-dark">{veh.etaMin} Mins</strong>
                            </div>
                            <div className="mt-1 text-mute text-xs">
                              Dispatch Cost: <strong className="text-dark">{fmtCurrency(veh.addedCost)}</strong>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-subtle">
                            {isSelected ? (
                              <div className="flex items-center gap-1 text-forest font-bold">
                                <CheckCircle2 size={15} />
                                Dispatched
                              </div>
                            ) : (
                              <Btn
                                variant={hasCapacity ? 'primary' : 'outline'}
                                className="w-full text-xs"
                                disabled={activeDisruption.status === 'Recovered'}
                                onClick={() =>
                                  setDispatchModal({ open: true, disruptionId: activeDisruption.id, vehicleId: veh.vehicleId })
                                }
                              >
                                Dispatch Bus
                              </Btn>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Automated Passenger Notification Notice */}
                <div className="p-3 rounded-lg border border-subtle bg-gray-50 text-mute space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-dark">
                    <Sparkles size={14} className="text-forest" />
                    Automated Passenger Communication SLA
                  </div>
                  <p>
                    Dispatching a recovery vehicle instantly broadcasts SMS & WhatsApp tracking links to all {activeDisruption.passengerCount} stranded passengers.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Empty title="No active disruptions" hint="Select an incident from the left list." />
          )}
        </div>
      </div>

      {/* Confirm Dispatch Dialog */}
      <ConfirmDialog
        open={dispatchModal.open}
        title="Confirm Recovery Vehicle Dispatch"
        confirmLabel="Confirm & Notify Passengers"
        body={
          <div className="space-y-2 text-xs text-dark">
            <p>
              Are you sure you want to dispatch <strong>{dispatchModal.vehicleId}</strong> for incident{' '}
              <strong>{dispatchModal.disruptionId}</strong>?
            </p>
            <p className="text-mute">
              This will update the passenger tracking interface and send automated delay status SMS alerts.
            </p>
          </div>
        }
        onConfirm={handleConfirmDispatch}
        onClose={() => setDispatchModal({ open: false, disruptionId: null, vehicleId: null })}
      />
    </div>
  );
}
