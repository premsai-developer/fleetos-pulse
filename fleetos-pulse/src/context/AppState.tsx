import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../services/config';
import { decisionService } from '../services/decisionService';
import type { DataHealthState, Decision, DecisionStatus, DisruptionEvent, LeakageDiscrepancy, PassengerTicket, Scenario, Trip } from '../types';
import { applyScenario, validateTrip } from '../utils/pricing';

type NewDecision = Pick<Decision, 'tripId' | 'action' | 'proposedFare' | 'reason' | 'assumptions' | 'source'> & { status: 'accepted' | 'rejected' | 'in_review' };

interface Ctx {
  trips: Trip[];
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  dataHealth: DataHealthState;
  setDataHealth: React.Dispatch<React.SetStateAction<DataHealthState>>;
  decisions: Decision[];
  passengerTickets: PassengerTicket[];
  discrepancies: LeakageDiscrepancy[];
  disruptions: DisruptionEvent[];
  loading: boolean;
  error: string | null;
  activeDemoStep: number;
  setDemoStep: (step: number) => void;
  triggerDemoScenario: (scenarioKey: string) => Promise<void>;
  resetDemo: () => Promise<void>;
  reload: () => void;
  record: (d: NewDecision) => Promise<Decision>;
  clearDecisions: () => Promise<void>;
  addPassengerTicket: (ticket: Omit<PassengerTicket, 'ticketId' | 'purchaseTimestamp'>) => Promise<PassengerTicket>;
  resolveDiscrepancy: (id: string, notes?: string) => Promise<void>;
  resolveDisruption: (disruptionId: string, vehicleId: string) => Promise<void>;
}

const AppCtx = createContext<Ctx | null>(null);

export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside AppProvider');
  return c;
};

const INITIAL_DATA_HEALTH: DataHealthState = {
  staleData: false,
  gpsAvailable: true,
  incompleteRecords: false,
  invalidCapacity: false,
  insufficientHistory: false
};

const FALLBACK_CANDIDATE_VEHICLES = [
  { vehicleId: 'BUS-VOLVO-B11R-88', capacity: 45, etaMin: 35, addedCost: 4500 },
  { vehicleId: 'BUS-BENZ-SHD-12', capacity: 36, etaMin: 15, addedCost: 6000 },
  { vehicleId: 'BUS-MINI-FORCE-20', capacity: 20, etaMin: 10, addedCost: 3000 }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<Scenario>('valid');
  const [dataHealth, setDataHealth] = useState<DataHealthState>(INITIAL_DATA_HEALTH);
  const [backendTrips, setBackendTrips] = useState<Trip[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [passengerTickets, setPassengerTickets] = useState<PassengerTicket[]>([]);
  const [discrepancies, setDiscrepancies] = useState<LeakageDiscrepancy[]>([]);
  const [disruptions, setDisruptions] = useState<DisruptionEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tripsRes, decisionsData, discrepanciesRes, disruptionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/trips`),
        decisionService.list(),
        fetch(`${API_BASE_URL}/api/discrepancies`),
        fetch(`${API_BASE_URL}/api/disruptions`)
      ]);

      if (!tripsRes.ok) {
        throw new Error(`Failed to fetch trips from FastAPI backend (${tripsRes.status})`);
      }
      const rawTrips: Trip[] = await tripsRes.json();
      
      const formattedTrips: Trip[] = rawTrips.map(t => ({
        ...t,
        trend: t.trend || [Math.round(t.booked * 0.25), Math.round(t.booked * 0.55), Math.round(t.booked * 0.8), t.booked],
        vehicleType: t.vehicleType || (t.capacity > 40 ? 'Volvo Multi-Axle B11R' : 'Scania Metrolink HD'),
        driverName: t.driverName || 'Srinivas Rao',
        operatingCost: t.operatingCost || Math.round(t.capacity * 210 + (t.fare || 600) * 8),
        distanceKm: t.distanceKm || (t.id === 'TRIP-101' ? 350 : t.id === 'TRIP-102' ? 275 : 620),
        latentDemandEstimate: t.latentDemandEstimate || (t.booked >= t.capacity * 0.9 ? Math.round(t.booked * 1.35) : Math.round(t.booked * 1.1)),
        signalConfidence: t.signalConfidence !== undefined ? t.signalConfidence : (t.feedAgeMin > 60 ? 58 : 94),
        unservedDemandObserved: t.unservedDemandObserved !== undefined ? t.unservedDemandObserved : (t.booked >= t.capacity * 0.95)
      }));

      setBackendTrips(formattedTrips);
      setDecisions(decisionsData);

      if (discrepanciesRes.ok) {
        const discData = await discrepanciesRes.json();
        setDiscrepancies(discData);
      }

      if (disruptionsRes.ok) {
        const disrData = await disruptionsRes.json();
        setDisruptions(disrData.map((d: DisruptionEvent) => ({
          ...d,
          candidateVehicles: d.candidateVehicles || FALLBACK_CANDIDATE_VEHICLES
        })));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not connect to FastAPI backend.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Sync dataHealth toggles to active scenario
  useEffect(() => {
    if (dataHealth.staleData) {
      setScenario('stale');
    } else if (!dataHealth.gpsAvailable) {
      setScenario('missing');
    } else if (dataHealth.invalidCapacity) {
      setScenario('invalid');
    } else {
      setScenario('valid');
    }
  }, [dataHealth]);

  // Calculate dynamic trips with accepted decisions & data health modifications
  const trips = useMemo(() => {
    const fares = new Map<string, number>();
    [...decisions].reverse().forEach(d => {
      if (d.status === 'accepted' && d.proposedFare !== null) fares.set(d.tripId, d.proposedFare);
    });

    const extraBookings = new Map<string, number>();
    passengerTickets.forEach(t => {
      extraBookings.set(t.tripId, (extraBookings.get(t.tripId) || 0) + 1);
    });

    let currentTrips = backendTrips.map(t => {
      const updatedFare = fares.has(t.id) ? fares.get(t.id)! : t.fare;
      const dynamicBooked = t.booked + (extraBookings.get(t.id) || 0);

      return {
        ...t,
        fare: updatedFare,
        booked: Math.min(t.capacity, dynamicBooked)
      };
    });

    return applyScenario(currentTrips, scenario);
  }, [backendTrips, decisions, scenario, passengerTickets]);

  const record = useCallback(
    async (n: NewDecision) => {
      const trip = trips.find(t => t.id === n.tripId);
      if (!trip) throw new Error('Unknown trip');

      const blocked = n.status !== 'rejected' && validateTrip(trip).length > 0;
      const status: DecisionStatus = blocked ? 'blocked' : n.status;
      const d: Decision = {
        ...n,
        status,
        id: `DEC-${Date.now().toString(36).toUpperCase()}`,
        route: `${trip.origin} → ${trip.destination}`,
        previousFare: trip.fare,
        timestamp: new Date().toISOString(),
        reason: blocked ? `Blocked by FairFare Guard. ${n.reason}`.trim() : n.reason
      };

      const recorded = await decisionService.add(d);
      setDecisions(prev => [recorded, ...prev]);

      // Refetch trips from backend to ensure updated trip fare in SQLite DB is synced
      if (status === 'accepted') {
        const tripsRes = await fetch(`${API_BASE_URL}/api/trips`);
        if (tripsRes.ok) {
          const rawTrips: Trip[] = await tripsRes.json();
          setBackendTrips(rawTrips.map(t => ({
            ...t,
            trend: t.trend || [Math.round(t.booked * 0.25), Math.round(t.booked * 0.55), Math.round(t.booked * 0.8), t.booked],
            vehicleType: t.vehicleType || (t.capacity > 40 ? 'Volvo Multi-Axle B11R' : 'Scania Metrolink HD'),
            driverName: t.driverName || 'Srinivas Rao',
            operatingCost: t.operatingCost || Math.round(t.capacity * 210 + (t.fare || 600) * 8),
            distanceKm: t.distanceKm || (t.id === 'TRIP-101' ? 350 : t.id === 'TRIP-102' ? 275 : 620),
            latentDemandEstimate: t.latentDemandEstimate || (t.booked >= t.capacity * 0.9 ? Math.round(t.booked * 1.35) : Math.round(t.booked * 1.1)),
            signalConfidence: t.signalConfidence !== undefined ? t.signalConfidence : (t.feedAgeMin > 60 ? 58 : 94),
            unservedDemandObserved: t.unservedDemandObserved !== undefined ? t.unservedDemandObserved : (t.booked >= t.capacity * 0.95)
          })));
        }
      }

      return recorded;
    },
    [trips]
  );

  const clearDecisions = useCallback(async () => {
    await decisionService.clear();
    setDecisions([]);
  }, []);

  const addPassengerTicket = useCallback(async (ticket: Omit<PassengerTicket, 'ticketId' | 'purchaseTimestamp'>) => {
    const res = await fetch(`${API_BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
    
    let newTicket: PassengerTicket;
    if (res.ok) {
      newTicket = await res.json();
    } else {
      newTicket = {
        ...ticket,
        ticketId: `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
        purchaseTimestamp: new Date().toISOString()
      };
    }

    setPassengerTickets(prev => [newTicket, ...prev]);

    // Record ticket purchase in audit log backend
    const auditDecision: Decision = {
      id: `DEC-PAX-${Date.now().toString(36).toUpperCase()}`,
      tripId: ticket.tripId,
      route: ticket.route,
      status: 'accepted',
      action: 'Simulated Ticket Booking',
      previousFare: ticket.approvedFare,
      proposedFare: ticket.approvedFare,
      reason: `Passenger ${ticket.passengerName} booked seat #${ticket.seatNumber} at approved fare ₹${ticket.approvedFare}.`,
      timestamp: new Date().toISOString(),
      assumptions: ['Passenger accepted transparent fare', 'Seat capacity verified'],
      source: 'operator-override'
    };
    await decisionService.add(auditDecision);
    setDecisions(prev => [auditDecision, ...prev]);

    return newTicket;
  }, []);

  const [activeDemoStep, setDemoStep] = useState(1);

  const triggerDemoScenario = useCallback(async (scenarioKey: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/demo/scenario/${scenarioKey}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to trigger scenario');
      if (scenarioKey === 'stale_data') {
        setDataHealth(prev => ({ ...prev, staleData: true }));
      } else {
        setDataHealth(INITIAL_DATA_HEALTH);
      }
      await reload();
    } catch (e) {
      console.error('Failed to trigger scenario via API, applying local fallback:', e);
      if (scenarioKey === 'stale_data') setDataHealth(prev => ({ ...prev, staleData: true }));
    }
  }, [reload]);

  const resetDemo = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/demo/reset`, { method: 'POST' });
      await decisionService.clear();
      setPassengerTickets([]);
      setDataHealth(INITIAL_DATA_HEALTH);
      setScenario('valid');
      setDemoStep(1);
      await reload();
    } catch (e) {
      console.error('Failed to reset demo via API:', e);
      await reload();
    }
  }, [reload]);

  const resolveDiscrepancy = useCallback(async (id: string, notes?: string) => {
    await fetch(`${API_BASE_URL}/api/discrepancies/${id}/resolve`, { method: 'POST' });
    setDiscrepancies(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'Resolved', notes: notes || d.notes } : d))
    );
  }, []);

  const resolveDisruption = useCallback(async (disruptionId: string, vehicleId: string) => {
    await fetch(`${API_BASE_URL}/api/disruptions/${disruptionId}/dispatch?vehicle_id=${vehicleId}`, { method: 'POST' });
    setDisruptions(prev =>
      prev.map(d => (d.id === disruptionId ? { ...d, status: 'Recovered', selectedVehicleId: vehicleId } : d))
    );
  }, []);

  return (
    <AppCtx.Provider
      value={{
        trips,
        scenario,
        setScenario,
        dataHealth,
        setDataHealth,
        decisions,
        passengerTickets,
        discrepancies,
        disruptions,
        loading,
        error,
        activeDemoStep,
        setDemoStep,
        triggerDemoScenario,
        resetDemo,
        reload,
        record,
        clearDecisions,
        addPassengerTicket,
        resolveDiscrepancy,
        resolveDisruption
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}


