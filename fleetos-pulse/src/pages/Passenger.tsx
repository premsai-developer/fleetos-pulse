import { useMemo, useState } from 'react';
import { ArrowRight, Bus, CheckCircle2, DollarSign, Info, Lock, ShieldCheck, Ticket, User, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppState';
import { routeOf } from '../data/trips';
import { Badge, Btn, Card, ConfirmDialog, Kpi, cx, fmtCurrency, inputCls } from '../components/ui';
import { inr } from '../utils/pricing';

export default function Passenger() {
  const { trips, passengerTickets, addPassengerTicket } = useApp();

  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || 'TRIP-101');
  const [passengerName, setPassengerName] = useState('Ananya Sharma');
  const [passengerEmail, setPassengerEmail] = useState('ananya.s@example.com');
  const [selectedSeat, setSelectedSeat] = useState<number>(18);

  const [ticketModal, setTicketModal] = useState(false);
  const [recentTicketId, setRecentTicketId] = useState<string | null>(null);

  const activeTrip = useMemo(() => {
    return trips.find(t => t.id === selectedTripId) || trips[0];
  }, [trips, selectedTripId]);

  const activeFare = activeTrip?.fare || 650;

  const handleBookTicket = async () => {
    if (!activeTrip) return;
    const tkt = await addPassengerTicket({
      tripId: activeTrip.id,
      passengerName,
      passengerEmail,
      seatNumber: selectedSeat,
      approvedFare: activeFare,
      route: routeOf(activeTrip)
    });
    setRecentTicketId(tkt.ticketId);
    setTicketModal(true);
  };


  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">Passenger Transparency Companion</h1>
          <p className="text-xs text-mute font-medium">
            Simulated passenger booking portal demonstrating transparent fare guarantees and anti-surge fairness policies.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Badge tone="forest">Transparent Price Lock Active</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Simulated Booking Engine (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          <Card title="Simulated Passenger Ticket Reservation">
            <div className="space-y-4 text-xs">
              {/* Trip Selector */}
              <div>
                <label className="font-semibold text-dark block mb-1">Select Intercity Departure</label>
                <select
                  value={selectedTripId}
                  onChange={e => setSelectedTripId(e.target.value)}
                  className={cx(inputCls, 'w-full text-forest font-semibold')}
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.id} — {routeOf(t)} ({inr(t.fare)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Passenger Info Inputs */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-dark block mb-1">Passenger Name</label>
                  <input
                    value={passengerName}
                    onChange={e => setPassengerName(e.target.value)}
                    placeholder="Enter full name..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="font-semibold text-dark block mb-1">Email Address</label>
                  <input
                    value={passengerEmail}
                    onChange={e => setPassengerEmail(e.target.value)}
                    placeholder="Enter email..."
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Seat Selection Simulation Grid */}
              <div className="space-y-2 pt-2 border-t border-subtle">
                <div className="font-semibold text-dark flex items-center justify-between">
                  <span>Select Preferred Seat (Layout)</span>
                  <span className="text-mute font-normal text-[11px]">Seat #{selectedSeat} Selected</span>
                </div>

                <div className="grid grid-cols-8 gap-2 p-3 rounded-lg border border-subtle bg-gray-50">
                  {Array.from({ length: 32 }, (_, i) => i + 1).map(seat => {
                    const isSelected = seat === selectedSeat;
                    const isBooked = seat <= 8;

                    return (
                      <button
                        key={seat}
                        disabled={isBooked}
                        onClick={() => setSelectedSeat(seat)}
                        className={cx(
                          'p-2 rounded font-mono font-bold text-center transition-all',
                          isBooked
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-forest text-white ring-2 ring-forest/30'
                            : 'bg-white border border-subtle text-dark hover:border-forest'
                        )}
                      >
                        {seat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fare Transparency Breakdown */}
              <div className="rounded-lg border border-forest/20 bg-forest-light/40 p-4 space-y-2 text-dark">
                <div className="flex items-center justify-between border-b border-subtle pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-forest">
                    <ShieldCheck size={16} />
                    FairFare Guaranteed Rate
                  </div>
                  <span className="font-mono font-bold text-base text-forest">{inr(activeFare)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-mute">
                  <div>Base Operator Fare: {inr(Math.round(activeFare * 0.82))}</div>
                  <div>Highway Toll Reserve: {inr(Math.round(activeFare * 0.1))}</div>
                  <div>Passenger Safety Levy: {inr(Math.round(activeFare * 0.08))}</div>
                  <div className="text-forest font-semibold">Surge Penalty: ₹0 (Cap Protected)</div>
                </div>
              </div>

              <Btn variant="primary" className="w-full py-2.5 text-sm" onClick={handleBookTicket}>
                <Ticket size={16} />
                Simulate Ticket Booking ({inr(activeFare)})
              </Btn>
            </div>
          </Card>
        </div>

        {/* Right Column: Issued Ticket Ledger (1 col) */}
        <div className="space-y-4">
          <Card title="Simulated Ticket Ledger">
            {passengerTickets.length === 0 ? (
              <p className="text-xs text-mute text-center py-6">No tickets issued yet.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {passengerTickets.map(tkt => (
                  <div key={tkt.ticketId} className="p-3 rounded-lg border border-subtle bg-white space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-dark">
                      <span className="text-forest font-mono">{tkt.ticketId}</span>
                      <span>Seat #{tkt.seatNumber}</span>
                    </div>
                    <div className="text-dark font-medium">{tkt.passengerName}</div>
                    <div className="text-mute text-[11px] flex items-center justify-between">
                      <span>{tkt.route}</span>
                      <span className="font-mono font-bold text-forest">{inr(tkt.approvedFare)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Ticket Success Confirmation Modal */}
      <ConfirmDialog
        open={ticketModal}
        title="Ticket Issued Successfully"
        confirmLabel="Done"
        body={
          <div className="space-y-2 text-xs text-dark">
            <p className="font-medium">
              Ticket <strong>{recentTicketId}</strong> issued for <strong>{passengerName}</strong> at transparent rate{' '}
              <strong>{inr(activeFare)}</strong>.
            </p>
            <p className="text-mute">
              This transaction has been automatically added to the immutable operator decision audit ledger.
            </p>
          </div>
        }
        onConfirm={() => setTicketModal(false)}
        onClose={() => setTicketModal(false)}
      />
    </div>
  );
}
