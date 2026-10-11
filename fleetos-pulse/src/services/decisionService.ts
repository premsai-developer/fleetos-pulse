import type { Decision } from '../types';
import { API_BASE_URL } from './config';

export interface DecisionService {
  list(): Promise<Decision[]>;
  add(d: Omit<Decision, 'id' | 'timestamp' | 'route'> & Partial<Decision>): Promise<Decision>;
  clear(): Promise<void>;
}

const KEY = 'fleetos-pulse.demo.decisions.v1';
const readLocal = (): Decision[] => { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as Decision[]) : []; };

export const localDecisionService: DecisionService = {
  async list() { return readLocal(); },
  async add(d) {
    const full: Decision = {
      ...d,
      id: d.id || `DEC-${Date.now().toString(36).toUpperCase()}`,
      timestamp: d.timestamp || new Date().toISOString(),
      route: d.route || 'Route'
    };
    localStorage.setItem(KEY, JSON.stringify([full, ...readLocal()]));
    return full;
  },
  async clear() { localStorage.removeItem(KEY); }
};

export const apiDecisionService: DecisionService = {
  async list() {
    const res = await fetch(`${API_BASE_URL}/api/decisions`);
    if (!res.ok) {
      throw new Error(`Backend error (${res.status}): Failed to fetch decisions from ${API_BASE_URL}`);
    }
    return await res.json();
  },
  async add(d) {
    const res = await fetch(`${API_BASE_URL}/api/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: d.tripId,
        action: d.action,
        proposedFare: d.proposedFare,
        reason: d.reason || '',
        assumptions: d.assumptions || [],
        source: d.source || 'recommendation',
        status: d.status
      })
    });
    if (!res.ok) {
      throw new Error(`Backend error (${res.status}): Failed to record decision`);
    }
    return await res.json();
  },
  async clear() {
    const res = await fetch(`${API_BASE_URL}/api/decisions`, { method: 'DELETE' });
    if (!res.ok) {
      // Fallback local clear
      localStorage.removeItem(KEY);
    }
  }
};

export const decisionService: DecisionService = apiDecisionService;

