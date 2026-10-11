import { describe, expect, it, vi, beforeEach } from 'vitest';
import { localDecisionService, apiDecisionService } from './decisionService';

// Ensure localStorage exists in test environment
if (typeof localStorage === 'undefined' || !localStorage.getItem) {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    length: 0,
    key: () => null,
  };
}

describe('localDecisionService', () => {
  beforeEach(async () => {
    await localDecisionService.clear();
  });

  it('adds and lists decisions in localStorage', async () => {
    const initial = await localDecisionService.list();
    expect(initial).toEqual([]);

    const created = await localDecisionService.add({
      tripId: 'TRIP-101',
      action: 'Raise fare',
      previousFare: 650,
      proposedFare: 750,
      reason: 'High demand',
      assumptions: ['High demand expected'],
      source: 'recommendation',
      status: 'accepted'
    });

    expect(created.id).toBeDefined();
    expect(created.tripId).toBe('TRIP-101');
    expect(created.proposedFare).toBe(750);

    const list = await localDecisionService.list();
    expect(list.length).toBe(1);
    expect(list[0].tripId).toBe('TRIP-101');
  });

  it('clears decisions', async () => {
    await localDecisionService.add({
      tripId: 'TRIP-102',
      action: 'Apply promo',
      previousFare: 600,
      proposedFare: 550,
      reason: 'Promo discount',
      assumptions: [],
      source: 'recommendation',
      status: 'accepted'
    });
    expect((await localDecisionService.list()).length).toBe(1);

    await localDecisionService.clear();
    expect(await localDecisionService.list()).toEqual([]);
  });
});

describe('apiDecisionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches decisions list from backend API', async () => {
    const mockDecisions = [
      { id: 'DEC-1', tripId: 'TRIP-101', action: 'Raise fare', proposedFare: 720, status: 'accepted' }
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDecisions
    } as Response);

    const res = await apiDecisionService.list();
    expect(res).toEqual(mockDecisions);
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/decisions'));
  });

  it('throws error when backend list fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    } as Response);

    await expect(apiDecisionService.list()).rejects.toThrow('Backend error (500)');
  });

  it('posts decision to backend API', async () => {
    const createdObj = { id: 'DEC-100', tripId: 'TRIP-101', action: 'Raise fare', proposedFare: 720, status: 'accepted' };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createdObj
    } as Response);

    const result = await apiDecisionService.add({
      tripId: 'TRIP-101',
      action: 'Raise fare',
      previousFare: 650,
      proposedFare: 720,
      reason: 'High demand',
      assumptions: [],
      source: 'recommendation',
      status: 'accepted'
    });

    expect(result).toEqual(createdObj);
  });
});
