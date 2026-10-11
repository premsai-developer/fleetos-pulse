import type { Demand, Issue, Recommendation, Scenario, SimInput, SimResult, Trip } from '../types';

export const STALE_AFTER_MIN = 30;
export const PROMO_DISCOUNT = 0.05;   // promo policy: 5% off the proposed fare
export const PROMO_LIFT = 1.05;       // promo policy: +5% demand from marketing reach
export const ELASTICITY_RANGE = { min: -2.5, max: -0.5, default: -1.2 };

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round5 = (v: number) => Math.round(v / 5) * 5;
export const inr = (n: number | null) => (n === null ? '—' : `₹${Math.round(n).toLocaleString('en-IN')}`);
export const occupancyOf = (t: Trip) => (t.capacity > 0 ? t.booked / t.capacity : 0);

/** Demand class from seat occupancy. Thresholds are documented in the recommendation panel. */
export function classifyDemand(t: Trip): Demand {
  const occ = occupancyOf(t);
  return occ >= 0.75 ? 'High' : occ < 0.4 ? 'Low' : 'Normal';
}

/** Hard data-quality rules. Any issue here withholds recommendations for that trip. */
export function validateTrip(t: Trip): Issue[] {
  const out: Issue[] = [];
  const add = (code: string, severity: Issue['severity'], title: string, why: string, fix: string) => out.push({ code, tripId: t.id, severity, title, why, fix });
  if (t.feedAgeMin > STALE_AFTER_MIN)
    add('STALE_FEED', 'critical', `Booking feed is ${t.feedAgeMin} min old`, `Seats may have sold since the last update, so occupancy and demand are unreliable (limit ${STALE_AFTER_MIN} min).`, 'Re-sync the booking feed and wait for a fresh snapshot.');
  if (t.fare === null)
    add('MISSING_FARE', 'critical', 'Current fare is missing', 'A fare change cannot be priced or compared without the current fare.', 'Restore the fare field in the source record.');
  if (t.capacity <= 0 || t.booked < 0 || t.booked > t.capacity)
    add('INVALID_INVENTORY', 'critical', `Invalid seat count (${t.booked} booked of ${t.capacity})`, 'Booked seats cannot exceed bus capacity or be negative; occupancy would be meaningless.', 'Correct the booked-seat or capacity value in the inventory source.');
  if (t.fare !== null && (t.fare < t.minFare || t.fare > t.maxFare))
    add('FARE_BOUNDARY', 'critical', `Fare ${inr(t.fare)} is outside ${inr(t.minFare)}–${inr(t.maxFare)}`, 'Operating fares must stay within the configured limits.', 'Bring the fare back inside the configured range.');
  return out;
}

export function recommend(t: Trip): Recommendation {
  const issues = validateTrip(t);
  const demand = classifyDemand(t);
  const base = {
    id: `REC-${t.id}`,
    tripId: t.id,
    issues,
    demand,
    assumptions: [
      `Expected further bookings at current fare: ${t.expectedAdditional} seats (simulated)`,
      'High demand ≥ 75% occupancy; Low < 40%',
      'Fare changes are capped by the trip fare limits'
    ],
    constraints: [
      `Fare limits ${inr(t.minFare)}–${inr(t.maxFare)}`,
      `Feed must be under ${STALE_AFTER_MIN} min old`,
      'Seat counts must be consistent'
    ],
    expectedRevenueDiff: 0,
    expectedPaxDiff: 0,
    status: 'pending' as const
  };

  if (issues.length || t.fare === null) {
    return {
      ...base,
      blocked: true,
      action: 'Hold fare',
      proposedFare: null,
      why: 'Recommendation withheld: booking data failed validation. See TrustGuard.',
      status: 'blocked'
    };
  }

  const occ = Math.round(occupancyOf(t) * 100);

  if (demand === 'High') {
    const prop = clamp(round5(t.fare * 1.08), t.minFare, t.maxFare);
    return {
      ...base,
      blocked: false,
      action: 'Raise fare',
      proposedFare: prop,
      expectedRevenueDiff: Math.round((prop - t.fare) * (t.capacity - t.booked) * 0.5),
      expectedPaxDiff: -1,
      why: `${occ}% of seats are sold with ${t.hoursToDeparture}h to departure. Remaining seats are scarce, so a modest 8% rise is suggested.`
    };
  }

  if (demand === 'Low') {
    const prop = clamp(round5(t.fare * 0.9), t.minFare, t.maxFare);
    return {
      ...base,
      blocked: false,
      action: 'Lower fare',
      proposedFare: prop,
      expectedRevenueDiff: Math.round(prop * 4 - t.fare * 2),
      expectedPaxDiff: 3,
      why: `Only ${occ}% of seats are sold with ${t.hoursToDeparture}h to departure. A 10% reduction may fill seats that would otherwise go unsold.`
    };
  }

  return {
    ...base,
    blocked: false,
    action: 'Hold fare',
    proposedFare: t.fare,
    why: `${occ}% occupancy is within the normal band. No fare change is suggested.`
  };
}


/**
 * Deterministic what-if model (constant-elasticity demand):
 *   newBookings = expectedAdditional × (price / currentFare)^elasticity × policyLift,
 * capped at remaining seats. Both scenarios share the same starting inventory,
 * the same already-sold revenue and the same elasticity.
 */
export function simulate({ trip, fare, policy, elasticity }: SimInput): SimResult {
  const current = trip.fare ?? 0;
  const seatsLeft = Math.max(0, trip.capacity - trip.booked);
  const proposed = clamp(fare, trip.minFare, trip.maxFare);
  const price = policy === 'promo' ? Math.max(trip.minFare, Math.round(proposed * (1 - PROMO_DISCOUNT))) : proposed;
  const lift = policy === 'promo' ? PROMO_LIFT : 1;
  const demand = current > 0 ? trip.expectedAdditional * Math.pow(price / current, elasticity) * lift : 0;
  const newBookings = clamp(Math.round(demand), 0, seatsLeft);
  const occupied = trip.booked + newBookings;
  return { fare: price, newBookings, occupied, occupancy: trip.capacity ? occupied / trip.capacity : 0, revenue: trip.booked * current + newBookings * price, unsold: trip.capacity - occupied };
}

export const baselineOf = (trip: Trip, elasticity: number) => simulate({ trip, fare: trip.fare ?? 0, policy: 'baseline', elasticity });

/** Revenue across the allowed fare range, for the sensitivity chart. */
export function sweep(trip: Trip, policy: SimInput['policy'], elasticity: number, steps = 12) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const fare = Math.round(trip.minFare + ((trip.maxFare - trip.minFare) * i) / steps);
    const r = simulate({ trip, fare, policy, elasticity });
    return { fare, revenue: r.revenue, occupancy: Math.round(r.occupancy * 100) };
  });
}

export function validateFareInput(trip: Trip, raw: string): string | null {
  if (raw.trim() === '') return 'Enter a fare.';
  const v = Number(raw);
  if (!Number.isFinite(v)) return 'Fare must be a number.';
  if (v < trip.minFare || v > trip.maxFare) return `Fare must be between ${inr(trip.minFare)} and ${inr(trip.maxFare)}.`;
  return null;
}

/** Demo scenarios used by TrustGuard. Returns new trips; never mutates the input. */
export function applyScenario(trips: Trip[], s: Scenario): Trip[] {
  if (s === 'valid') return trips;
  return trips.map((t, i) => {
    if (s === 'stale') return { ...t, feedAgeMin: 95 };
    if (s === 'missing') return i % 3 === 0 ? { ...t, fare: null } : t;
    return i === 1 ? { ...t, booked: t.capacity + 4 } : i === 3 ? { ...t, fare: t.maxFare + 150 } : t;
  });
}
