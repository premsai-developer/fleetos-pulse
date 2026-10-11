import { describe, expect, it } from 'vitest';
import { BASE_TRIPS } from '../data/trips';
import { applyScenario, baselineOf, recommend, simulate, validateFareInput, validateTrip } from './pricing';

const trip = BASE_TRIPS[0];
describe('simulate', () => {
  it('is deterministic', () => {
    const i = { trip, fare: 700, policy: 'baseline' as const, elasticity: -1.2 };
    expect(simulate(i)).toEqual(simulate(i));
  });
  it('baseline equals expected additional bookings', () => expect(baselineOf(trip, -1.2).newBookings).toBe(trip.expectedAdditional));
  it('never oversells', () => expect(simulate({ trip, fare: trip.minFare, policy: 'promo', elasticity: -2.5 }).occupied).toBeLessThanOrEqual(trip.capacity));
  it('clamps fare to limits', () => expect(simulate({ trip, fare: 99999, policy: 'baseline', elasticity: -1 }).fare).toBe(trip.maxFare));
});
describe('validation', () => {
  it('accepts valid data', () => expect(BASE_TRIPS.flatMap(validateTrip)).toHaveLength(0));
  it('flags stale, missing and invalid data', () => {
    expect(validateTrip(applyScenario(BASE_TRIPS, 'stale')[0])[0].code).toBe('STALE_FEED');
    expect(validateTrip(applyScenario(BASE_TRIPS, 'missing')[0])[0].code).toBe('MISSING_FARE');
    expect(validateTrip(applyScenario(BASE_TRIPS, 'invalid')[1])[0].code).toBe('INVALID_INVENTORY');
  });
  it('withholds recommendations when blocked', () => expect(recommend(applyScenario(BASE_TRIPS, 'stale')[0]).blocked).toBe(true));
  it('rejects out-of-range fare input', () => { expect(validateFareInput(trip, 'abc')).not.toBeNull(); expect(validateFareInput(trip, '10')).not.toBeNull(); expect(validateFareInput(trip, '650')).toBeNull(); });
});
