export type Demand = 'High' | 'Normal' | 'Low';
export type Scenario = 'valid' | 'stale' | 'missing' | 'invalid';
export type Policy = 'baseline' | 'promo';

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  departure: string;
  hoursToDeparture: number;
  capacity: number;
  booked: number;
  fare: number | null; // null = missing field
  minFare: number;
  maxFare: number; // configured fare limits
  trend: number[]; // cumulative bookings at TREND_LABELS checkpoints
  expectedAdditional: number; // documented assumption: further bookings at current fare
  feedAgeMin: number; // minutes since last booking-feed update
  vehicleType?: string;
  driverName?: string;
  operatingCost?: number;
  distanceKm?: number;
  latentDemandEstimate?: number;
  signalConfidence?: number;
  unservedDemandObserved?: boolean;
}

export interface Issue {
  code: string;
  tripId: string;
  severity: 'critical' | 'warning';
  title: string;
  why: string;
  fix: string;
}

export interface Recommendation {
  id: string;
  tripId: string;
  blocked: boolean;
  issues: Issue[];
  demand: Demand;
  action: 'Raise fare' | 'Lower fare' | 'Hold fare' | 'Add Vehicle' | 'Reroute Bus';
  proposedFare: number | null;
  proposedCapacity?: number;
  why: string;
  assumptions: string[];
  constraints: string[];
  expectedRevenueDiff: number;
  expectedPaxDiff: number;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
}

export interface SimInput {
  trip: Trip;
  fare: number;
  policy: Policy;
  elasticity: number;
}

export interface SimResult {
  fare: number;
  newBookings: number;
  occupied: number;
  occupancy: number;
  revenue: number;
  unsold: number;
  operatingCost?: number;
  netContribution?: number;
}

export type DecisionStatus = 'accepted' | 'rejected' | 'blocked' | 'in_review';

export interface Decision {
  id: string;
  tripId: string;
  route: string;
  status: DecisionStatus;
  action: string;
  previousFare: number | null;
  proposedFare: number | null;
  reason: string;
  timestamp: string;
  assumptions: string[];
  source: 'recommendation' | 'trip-twin' | 'operator-override';
}

export interface DataHealthState {
  staleData: boolean;
  gpsAvailable: boolean;
  incompleteRecords: boolean;
  invalidCapacity: boolean;
  insufficientHistory: boolean;
}

export interface PassengerTicket {
  ticketId: string;
  tripId: string;
  passengerName: string;
  passengerEmail: string;
  seatNumber: number;
  approvedFare: number;
  purchaseTimestamp: string;
  route: string;
}

export interface LeakageDiscrepancy {
  id: string;
  txRef: string;
  tripId: string;
  expectedAmount: number;
  settledAmount: number;
  discrepancy: number;
  category: 'OTA Commission' | 'Refund Mismatch' | 'Duplicate Tx' | 'Expense Outlier';
  status: 'Unresolved' | 'Investigating' | 'Resolved';
  notes?: string;
}

export interface DisruptionEvent {
  id: string;
  affectedTripId: string;
  route: string;
  passengerCount: number;
  cause: string;
  status: 'Active' | 'Recovered';
  candidateVehicles: { vehicleId: string; capacity: number; etaMin: number; addedCost: number }[];
  selectedVehicleId?: string;
}

