import type { Trip } from '../types';
export const TREND_LABELS = ['-4d', '-3d', '-2d', '-1d', 'Now'];
export const DATA_LABEL = 'Simulated demo data';
const t = (id: string, o: string, d: string, dep: string, h: number, cap: number, fare: number, min: number, max: number, trend: number[], exp: number): Trip => ({
  id, origin: o, destination: d, departure: dep, hoursToDeparture: h, capacity: cap, booked: trend[trend.length - 1],
  fare, minFare: min, maxFare: max, trend, expectedAdditional: exp, feedAgeMin: 4
});
const VSKP = 'Visakhapatnam', VJA = 'Vijayawada', HYD = 'Hyderabad';
export const BASE_TRIPS: Trip[] = [
  t('TBS-VJ-101', VSKP, VJA, '2026-10-11T06:30:00+05:30', 20, 40, 620, 500, 780, [8, 15, 22, 28, 33], 5),
  t('TBS-VJ-102', VSKP, VJA, '2026-10-12T21:00:00+05:30', 59, 40, 650, 500, 780, [3, 6, 9, 12, 15], 11),
  t('TBS-VJ-103', VSKP, VJA, '2026-10-11T13:30:00+05:30', 27, 40, 640, 500, 780, [6, 11, 16, 21, 25], 8),
  t('TBS-HY-201', VSKP, HYD, '2026-10-11T18:30:00+05:30', 32, 36, 1450, 1100, 1850, [10, 17, 23, 28, 31], 4),
  t('TBS-HY-202', VSKP, HYD, '2026-10-12T20:30:00+05:30', 58, 36, 1380, 1100, 1850, [2, 5, 8, 10, 12], 14),
  t('TBS-HV-301', HYD, VJA, '2026-10-11T05:45:00+05:30', 20, 40, 780, 600, 980, [5, 10, 15, 19, 22], 8),
  t('TBS-HV-302', HYD, VJA, '2026-10-10T22:00:00+05:30', 12, 40, 820, 600, 980, [20, 28, 33, 36, 38], 2),
  t('TBS-HV-303', HYD, VJA, '2026-10-12T14:00:00+05:30', 52, 40, 750, 600, 980, [1, 3, 5, 7, 9], 12)
];
export const routeOf = (t: Trip) => `${t.origin} → ${t.destination}`;
