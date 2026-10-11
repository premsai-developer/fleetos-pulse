import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApp } from '../context/AppState';
import { Badge, Btn, Card, Empty, Freshness, Kpi, cx } from '../components/ui';
import { STALE_AFTER_MIN, validateTrip } from '../utils/pricing';

export default function TrustGuard() {
  const { trips, dataHealth, setDataHealth } = useApp();

  const issues = trips.flatMap(validateTrip);
  const count = (c: string) => issues.filter(i => i.code === c).length;
  const maxAge = Math.max(...trips.map(t => t.feedAgeMin));
  const isHealthy = issues.length === 0;

  const toggleHealthState = (key: keyof typeof dataHealth) => {
    setDataHealth(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetHealth = () => {
    setDataHealth({
      staleData: false,
      gpsAvailable: true,
      incompleteRecords: false,
      invalidCapacity: false,
      insufficientHistory: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">Data Health & Feed Integrity (TrustGuard)</h1>
          <p className="text-xs text-mute font-medium">
            Simulate data anomalies and verify automated FairFare Guard freeze rules.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Btn variant="outline" onClick={handleResetHealth}>
            <RefreshCw size={14} />
            Reset Data Feeds to Healthy
          </Btn>
        </div>
      </div>

      {/* Main Status Alert */}
      <div
        className={cx(
          'flex items-center gap-3 rounded-lg border p-4 text-xs font-semibold',
          isHealthy ? 'border-green-ok/30 bg-green-light text-green-ok' : 'border-red-err/30 bg-red-light text-red-err'
        )}
      >
        {isHealthy ? <CheckCircle2 size={20} className="shrink-0" /> : <ShieldAlert size={20} className="shrink-0" />}
        <div>
          <div className="text-sm font-bold">{isHealthy ? 'Data Integrity Verification Passed' : `Data Feed Block Active (${issues.length} Issues)`}</div>
          <p className="font-normal mt-0.5">
            {isHealthy
              ? 'All booking feeds, GPS signals, and inventory records are fresh and valid. Dynamic recommendations are active.'
              : 'FairFare Guard has automatically frozen pricing adjustments on affected trips to protect pricing integrity.'}
          </p>
        </div>
      </div>

      {/* 5 Explicit Data Health Control Toggles */}
      <Card title="Interactive Data Feed Anomaly Toggles">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          {/* Toggle 1: Stale Data */}
          <div
            onClick={() => toggleHealthState('staleData')}
            className={cx(
              'p-3.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all',
              dataHealth.staleData ? 'border-red-err bg-red-light/30' : 'border-subtle bg-white hover:border-forest/40'
            )}
          >
            <div>
              <div className="font-bold text-dark">Stale Booking Feed (&gt;60m)</div>
              <div className="text-mute text-[11px]">Simulate delayed booking feed updates</div>
            </div>
            <Badge tone={dataHealth.staleData ? 'red' : 'forest'}>{dataHealth.staleData ? 'STALE' : 'LIVE'}</Badge>
          </div>

          {/* Toggle 2: GPS Feed Outage */}
          <div
            onClick={() => toggleHealthState('gpsAvailable')}
            className={cx(
              'p-3.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all',
              !dataHealth.gpsAvailable ? 'border-red-err bg-red-light/30' : 'border-subtle bg-white hover:border-forest/40'
            )}
          >
            <div>
              <div className="font-bold text-dark">GPS Telematics Feed Outage</div>
              <div className="text-mute text-[11px]">Simulate vehicle signal loss</div>
            </div>
            <Badge tone={!dataHealth.gpsAvailable ? 'red' : 'forest'}>{!dataHealth.gpsAvailable ? 'OFFLINE' : 'ONLINE'}</Badge>
          </div>

          {/* Toggle 3: Incomplete Records */}
          <div
            onClick={() => toggleHealthState('incompleteRecords')}
            className={cx(
              'p-3.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all',
              dataHealth.incompleteRecords ? 'border-amber-warn bg-amber-light/30' : 'border-subtle bg-white hover:border-forest/40'
            )}
          >
            <div>
              <div className="font-bold text-dark">Incomplete Passenger Fields</div>
              <div className="text-mute text-[11px]">Simulate missing origin/dest data</div>
            </div>
            <Badge tone={dataHealth.incompleteRecords ? 'amber' : 'forest'}>{dataHealth.incompleteRecords ? 'CORRUPT' : 'VALID'}</Badge>
          </div>

          {/* Toggle 4: Invalid Capacity */}
          <div
            onClick={() => toggleHealthState('invalidCapacity')}
            className={cx(
              'p-3.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all',
              dataHealth.invalidCapacity ? 'border-red-err bg-red-light/30' : 'border-subtle bg-white hover:border-forest/40'
            )}
          >
            <div>
              <div className="font-bold text-dark">Invalid Seat Inventory</div>
              <div className="text-mute text-[11px]">Simulate booked &gt; capacity errors</div>
            </div>
            <Badge tone={dataHealth.invalidCapacity ? 'red' : 'forest'}>{dataHealth.invalidCapacity ? 'OVERBOOKED' : 'NORMAL'}</Badge>
          </div>

          {/* Toggle 5: Insufficient History */}
          <div
            onClick={() => toggleHealthState('insufficientHistory')}
            className={cx(
              'p-3.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all',
              dataHealth.insufficientHistory ? 'border-amber-warn bg-amber-light/30' : 'border-subtle bg-white hover:border-forest/40'
            )}
          >
            <div>
              <div className="font-bold text-dark">Insufficient Historical Data</div>
              <div className="text-mute text-[11px]">Simulate new unmodelled route</div>
            </div>
            <Badge tone={dataHealth.insufficientHistory ? 'amber' : 'forest'}>{dataHealth.insufficientHistory ? 'COLD START' : 'MODELED'}</Badge>
          </div>
        </div>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Oldest Feed Update" value={`${maxAge} min`} sub={maxAge > STALE_AFTER_MIN ? 'Stale' : 'Fresh'} tone={maxAge > STALE_AFTER_MIN ? 'red' : 'forest'} />
        <Kpi label="Missing Fields" value={String(count('MISSING_FARE'))} sub={count('MISSING_FARE') ? 'Fail' : 'Pass'} tone={count('MISSING_FARE') ? 'red' : 'forest'} />
        <Kpi label="Invalid Inventory" value={String(count('INVALID_INVENTORY'))} sub={count('INVALID_INVENTORY') ? 'Fail' : 'Pass'} tone={count('INVALID_INVENTORY') ? 'red' : 'forest'} />
        <Kpi label="Boundary Violations" value={String(count('FARE_BOUNDARY'))} sub={count('FARE_BOUNDARY') ? 'Fail' : 'Pass'} tone={count('FARE_BOUNDARY') ? 'red' : 'forest'} />
      </div>

      {/* Issues & Trip Status Grids */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Active Data Feed Violations">
          {isHealthy ? (
            <Empty title="No violations detected" hint="Toggle an anomaly switch above to simulate data health issues." />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {issues.map(i => (
                <div key={i.code + i.tripId} className="p-3.5 rounded-lg border border-red-err/30 bg-red-light/20 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-err">{i.title}</span>
                    <Link className="font-semibold text-forest underline" to={`/trips/${i.tripId}`}>
                      {i.tripId}
                    </Link>
                  </div>
                  <p className="text-mute">
                    <strong>Why it matters:</strong> {i.why}
                  </p>
                  <p className="text-dark font-medium">
                    <strong>FairFare Action:</strong> {i.fix}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recommendation Availability Status">
          <div className="space-y-2 text-xs">
            {trips.map(t => {
              const bad = validateTrip(t).length > 0;
              return (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg border border-subtle bg-white">
                  <Link className="font-semibold text-forest hover:underline" to={`/trips/${t.id}`}>
                    {t.id}
                  </Link>
                  <Freshness ageMin={t.feedAgeMin} />
                  {bad ? <Badge tone="red">Frozen / Blocked</Badge> : <Badge tone="forest">Available</Badge>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

