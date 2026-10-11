import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Lock, RefreshCw, Save, ShieldCheck, Sliders } from 'lucide-react';
import { Badge, Btn, Card, Kpi, cx, inputCls } from '../components/ui';

export default function SettingsPricingRules() {
  const [minFareMult, setMinFareMult] = useState(0.75);
  const [maxFareMult, setMaxFareMult] = useState(1.35);
  const [maxChangePct, setMaxChangePct] = useState(15);
  const [staleTimeoutMin, setStaleTimeoutMin] = useState(60);
  const [requireHumanSignoff, setRequireHumanSignoff] = useState(true);
  const [passengerNonDiscrimination, setPassengerNonDiscrimination] = useState(true);

  const [savedStatus, setSavedStatus] = useState(false);

  const handleSave = () => {
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  const handleReset = () => {
    setMinFareMult(0.75);
    setMaxFareMult(1.35);
    setMaxChangePct(15);
    setStaleTimeoutMin(60);
    setRequireHumanSignoff(true);
    setPassengerNonDiscrimination(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">FairFare Guard Policy Settings</h1>
          <p className="text-xs text-mute font-medium">
            Configure automated dynamic pricing boundaries, data health freeze thresholds, and operator guardrails.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Btn variant="outline" onClick={handleReset}>
            <RefreshCw size={14} />
            Reset Defaults
          </Btn>
          <Btn variant="primary" onClick={handleSave}>
            <Save size={14} />
            Save Rules Policy
          </Btn>
        </div>
      </div>

      {savedStatus && (
        <div className="flex items-center gap-2 rounded-lg border border-green-ok/30 bg-green-light p-3 text-xs font-semibold text-green-ok">
          <CheckCircle2 size={16} />
          FairFare Guard policies updated successfully and saved to active configuration runtime.
        </div>
      )}

      {/* Policy Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Minimum Price Floor" value={`${minFareMult * 100}%`} sub="Of Base Approved Fare" tone="slate" />
        <Kpi label="Maximum Ceiling Cap" value={`${maxFareMult * 100}%`} sub="Surge Limit Protection" tone="forest" />
        <Kpi label="Max Delta per Rec" value={`±${maxChangePct}%`} sub="Step Change Limit" tone="amber" />
        <Kpi label="Stale Feed Timeout" value={`${staleTimeoutMin}m`} sub="Auto Pricing Freeze" tone="red" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dynamic Pricing Limits */}
        <Card title="Dynamic Pricing Boundaries">
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-dark block mb-1">Minimum Fare Floor Multiplier ({minFareMult}x)</label>
              <input
                type="range"
                min="0.5"
                max="0.9"
                step="0.05"
                value={minFareMult}
                onChange={e => setMinFareMult(parseFloat(e.target.value))}
                className="w-full accent-forest"
              />
              <p className="text-mute text-[11px] mt-1">
                Fares will never drop below {minFareMult * 100}% of default base rate, preventing predatory undercutting.
              </p>
            </div>

            <div className="pt-3 border-t border-subtle">
              <label className="font-semibold text-dark block mb-1">Maximum Surge Ceiling Multiplier ({maxFareMult}x)</label>
              <input
                type="range"
                min="1.1"
                max="1.8"
                step="0.05"
                value={maxFareMult}
                onChange={e => setMaxFareMult(parseFloat(e.target.value))}
                className="w-full accent-forest"
              />
              <p className="text-mute text-[11px] mt-1">
                Caps surge fares at {maxFareMult * 100}% during peak demand periods to ensure passenger fairness.
              </p>
            </div>

            <div className="pt-3 border-t border-subtle">
              <label className="font-semibold text-dark block mb-1">Maximum Change per Recommendation (±{maxChangePct}%)</label>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={maxChangePct}
                onChange={e => setMaxChangePct(parseInt(e.target.value, 10))}
                className="w-full accent-forest"
              />
              <p className="text-mute text-[11px] mt-1">Prevents sudden volatile price jumps across consecutive booking updates.</p>
            </div>
          </div>
        </Card>

        {/* Data Integrity & Guardrail Policies */}
        <Card title="Data Feed & Operational Guardrails">
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-dark block mb-1">Stale Data Feed Timeout ({staleTimeoutMin} Minutes)</label>
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={staleTimeoutMin}
                onChange={e => setStaleTimeoutMin(parseInt(e.target.value, 10))}
                className="w-full accent-forest"
              />
              <p className="text-mute text-[11px] mt-1">
                If booking feed updates lag beyond {staleTimeoutMin} minutes, FairFare Guard automatically freezes pricing updates.
              </p>
            </div>

            <div className="pt-3 border-t border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-dark">Require Human Operator Sign-Off</div>
                  <div className="text-[11px] text-mute">Prevents fully autonomous price adjustments without review.</div>
                </div>
                <input
                  type="checkbox"
                  checked={requireHumanSignoff}
                  onChange={e => setRequireHumanSignoff(e.target.checked)}
                  className="h-4 w-4 rounded accent-forest cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-subtle">
                <div>
                  <div className="font-semibold text-dark">Passenger Non-Discrimination Lock</div>
                  <div className="text-[11px] text-mute">Ensures identical seat tier pricing regardless of passenger device or OS.</div>
                </div>
                <input
                  type="checkbox"
                  checked={passengerNonDiscrimination}
                  onChange={e => setPassengerNonDiscrimination(e.target.checked)}
                  className="h-4 w-4 rounded accent-forest cursor-pointer"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
