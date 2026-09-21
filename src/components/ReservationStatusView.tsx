import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Clock3,
  AlertTriangle,
  Phone,
  MessageSquare,
  MapPin,
  X,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Ban,
  UtensilsCrossed,
} from 'lucide-react';
import { Reservation, ReservationEvent } from '../types/restaurant';
import {
  RESTAURANT_CONFIG,
  cleanIndianMobile,
  formatTime12h,
  createWhatsAppInquiryUrl,
} from '../config/restaurantConfig';

interface ReservationStatusViewProps {
  initialReservationId?: string;
  initialPhone?: string;
  onClose?: () => void;
  onNavigateHome?: () => void;
  onBookNew?: () => void;
}

export const ReservationStatusView: React.FC<ReservationStatusViewProps> = ({
  initialReservationId = '',
  initialPhone = '',
  onClose,
  onNavigateHome,
  onBookNew,
}) => {
  const [resIdInput, setResIdInput] = useState(initialReservationId);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [events, setEvents] = useState<ReservationEvent[]>([]);

  // Cancellation modal/confirm
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Auto-lookup if initial values provided
  useEffect(() => {
    if (initialReservationId && initialPhone) {
      handleLookup(initialReservationId, initialPhone);
    }
  }, [initialReservationId, initialPhone]);

  const handleLookup = async (idToSearch?: string, phoneToSearch?: string) => {
    const idVal = (idToSearch || resIdInput).trim();
    const phoneVal = (phoneToSearch || phoneInput).trim();
    setError(null);
    setCancelSuccessMsg(null);

    if (!idVal) {
      setError('Please enter your Reservation ID (e.g. HW-20260921-0001).');
      return;
    }
    if (!phoneVal) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/reservations/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationNumber: idVal,
          phone: phoneVal,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'No matching reservation found for this ID and mobile number.'
        );
      }

      setReservation(data.reservation);
      setEvents(data.events || []);
    } catch (err: any) {
      console.warn('Status lookup failed:', err);
      setError(err.message || 'Failed to retrieve reservation details.');
      setReservation(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerCancel = async () => {
    if (!reservation) return;
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/reservations/${reservation.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: reservation.customerPhone || reservation.phone,
          reason: cancelReason.trim() || 'Cancelled by guest online',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel reservation.');
      }

      setReservation(data.reservation);
      setShowCancelPrompt(false);
      setCancelSuccessMsg('Your reservation has been successfully cancelled.');

      // Refresh events
      const evRes = await fetch(`/api/admin/reservation-events/${reservation.id}`);
      const evData = await evRes.json();
      if (evData.success) {
        setEvents(evData.events);
      }
    } catch (err: any) {
      setError(err.message || 'Error cancelling reservation.');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDisplayDate = (dStr: string) => {
    try {
      const [y, m, d] = dStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#091711] border border-[#224d3b] rounded-2xl w-full max-w-2xl text-[#f6f3ed] shadow-2xl overflow-hidden my-8">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-[#224d3b] flex items-center justify-between bg-[#0e241b]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#f6f3ed]">
                Reservation Tracker
              </h3>
              <p className="text-[11px] text-[#8ea098]">
                Hot Wok Asian Cuisine Restaurant • Mumbra
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-[#8ea098] hover:text-[#f6f3ed] hover:bg-[#15382a] rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Lookup Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="bg-[#07130e] border border-[#224d3b] rounded-xl p-4 space-y-3"
          >
            <div className="text-xs text-[#8ea098] font-medium flex items-center justify-between">
              <span>Enter your booking details to track status</span>
              <span className="text-[10px] text-[#d4af37]">Private & Secure</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#c8c0b2] font-semibold mb-1">
                  Reservation ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. HW-20260921-0001"
                  value={resIdInput}
                  onChange={(e) => setResIdInput(e.target.value.toUpperCase())}
                  className="w-full bg-[#091711] border border-[#224d3b] focus:border-[#d4af37] rounded-lg px-3 py-2 text-sm text-[#f6f3ed] font-mono placeholder:text-[#4d6359] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#c8c0b2] font-semibold mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#8ea098] font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="9987974833"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full bg-[#091711] border border-[#224d3b] focus:border-[#d4af37] rounded-lg pl-11 pr-3 py-2 text-sm text-[#f6f3ed] font-mono placeholder:text-[#4d6359] outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#8ea098]">
                Matched with phone number to prevent unauthorized access.
              </span>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-[#d4af37] hover:bg-[#c49f2e] text-[#091711] font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>{isLoading ? 'Searching...' : 'Check Status'}</span>
              </button>
            </div>
          </form>

          {/* Feedback & Error States */}
          {error && (
            <div className="p-3.5 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{error}</p>
                <p className="text-[11px] text-red-300/80 mt-0.5">
                  Please verify your Reservation ID and the exact 10-digit mobile number you entered during booking.
                </p>
              </div>
            </div>
          )}

          {cancelSuccessMsg && (
            <div className="p-3.5 bg-emerald-950/50 border border-emerald-700/80 rounded-xl text-xs text-emerald-200 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{cancelSuccessMsg}</span>
            </div>
          )}

          {/* Reservation Card Details */}
          {reservation && (
            <div className="space-y-4">
              {/* Primary Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start space-x-3 ${
                  reservation.status === 'CONFIRMED'
                    ? 'bg-emerald-950/40 border-emerald-600/80 text-emerald-100'
                    : reservation.status === 'PENDING'
                    ? 'bg-amber-950/40 border-amber-600/80 text-amber-100'
                    : reservation.status === 'REJECTED'
                    ? 'bg-red-950/40 border-red-800/80 text-red-100'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="mt-0.5">
                  {reservation.status === 'CONFIRMED' && (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  )}
                  {reservation.status === 'PENDING' && (
                    <Clock3 className="w-5 h-5 text-amber-400 animate-pulse" />
                  )}
                  {reservation.status === 'REJECTED' && (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  {reservation.status === 'CANCELLED' && (
                    <Ban className="w-5 h-5 text-zinc-400" />
                  )}
                </div>

                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider font-bold">
                      Status: {reservation.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#d4af37]">
                      {reservation.reservationNumber || reservation.reservationId}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold mt-1">
                    {reservation.status === 'PENDING' &&
                      'Waiting for restaurant confirmation.'}
                    {reservation.status === 'CONFIRMED' &&
                      'Your reservation is confirmed.'}
                    {reservation.status === 'REJECTED' &&
                      'Unfortunately, the requested reservation could not be confirmed.'}
                    {reservation.status === 'CANCELLED' &&
                      'Your reservation has been cancelled.'}
                    {reservation.status === 'COMPLETED' &&
                      'Dining session completed. Thank you for visiting Hot Wok!'}
                  </h4>

                  <p className="text-xs opacity-90 mt-1">
                    {reservation.status === 'PENDING' &&
                      'Our restaurant manager is currently checking seating arrangements and will confirm shortly.'}
                    {reservation.status === 'CONFIRMED' &&
                      'Table has been reserved specifically for your party. Please arrive a few minutes prior to your time.'}
                    {reservation.status === 'REJECTED' &&
                      (reservation.rejectionReason
                        ? `Reason: "${reservation.rejectionReason}"`
                        : 'Our dining floor is fully occupied for the requested time slot.')}
                    {reservation.status === 'CANCELLED' &&
                      'This booking slot has been released.'}
                  </p>
                </div>
              </div>

              {/* Reservation Specifics Grid */}
              <div className="bg-[#07130e] border border-[#224d3b] rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-[#8ea098] block">Date</span>
                  <div className="font-semibold text-[#f6f3ed] flex items-center space-x-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>{formatDisplayDate(reservation.bookingDate || reservation.date)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#8ea098] block">Dining Time</span>
                  <div className="font-semibold text-[#f6f3ed] flex items-center space-x-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>{formatTime12h(reservation.bookingTime || reservation.time)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#8ea098] block">Party Size</span>
                  <div className="font-semibold text-[#f6f3ed] flex items-center space-x-1 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>
                      {reservation.guestCount || reservation.guests}{' '}
                      {(reservation.guestCount || reservation.guests) === 1 ? 'Guest' : 'Guests'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#8ea098] block">Assigned Table</span>
                  <div className="font-semibold text-[#f6f3ed] flex items-center space-x-1 mt-0.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span
                      className={
                        reservation.assignedTableNumber
                          ? 'text-[#d4af37] font-mono font-bold'
                          : 'text-[#8ea098] italic'
                      }
                    >
                      {reservation.assignedTableNumber || 'Pending Assignment'}
                    </span>
                  </div>
                </div>

                {reservation.occasion && (
                  <div className="col-span-2 pt-2 border-t border-[#224d3b]/50">
                    <span className="text-[11px] text-[#8ea098] block">Occasion</span>
                    <span className="font-semibold text-amber-200">
                      🎉 {reservation.occasion}
                    </span>
                  </div>
                )}

                {reservation.specialRequest && (
                  <div className="col-span-2 pt-2 border-t border-[#224d3b]/50">
                    <span className="text-[11px] text-[#8ea098] block">Special Request</span>
                    <span className="italic text-[#c8c0b2]">
                      "{reservation.specialRequest}"
                    </span>
                  </div>
                )}
              </div>

              {/* Restaurant Coordinates Card */}
              <div className="bg-[#07130e] border border-[#224d3b] rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-serif font-bold text-sm text-[#f6f3ed]">
                      {RESTAURANT_CONFIG.name}
                    </h5>
                    <p className="text-[11px] text-[#8ea098] flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                      <span>{RESTAURANT_CONFIG.address.full}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-[#d4af37] font-mono font-bold">
                    📞 {RESTAURANT_CONFIG.phoneDisplay}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 border-t border-[#224d3b]/60">
                  <a
                    href={RESTAURANT_CONFIG.telLink}
                    className="flex-1 min-w-[120px] py-2 bg-[#15382a] hover:bg-[#1d4b38] text-[#f6f3ed] rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Call Restaurant</span>
                  </a>

                  <a
                    href={createWhatsAppInquiryUrl(
                      `Hello Hot Wok Asian Cuisine, regarding my reservation ${reservation.reservationNumber || reservation.reservationId}:`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px] py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Desk</span>
                  </a>

                  <a
                    href={RESTAURANT_CONFIG.address.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px] py-2 bg-[#0e241b] border border-[#224d3b] hover:border-[#d4af37] text-[#c8c0b2] hover:text-[#f6f3ed] rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>

              {/* Activity Timeline */}
              {events.length > 0 && (
                <div className="bg-[#07130e] border border-[#224d3b] rounded-xl p-4 space-y-2.5">
                  <h5 className="font-serif text-xs font-bold text-[#c8c0b2] uppercase tracking-wider">
                    Reservation Activity Timeline
                  </h5>
                  <div className="space-y-2 border-l border-[#224d3b] ml-2 pl-3">
                    {events.map((evt) => (
                      <div key={evt.eventId} className="relative text-xs">
                        <div className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-[#d4af37]" />
                        <div className="flex items-baseline justify-between">
                          <span className="font-semibold text-[#f6f3ed]">
                            {evt.message}
                          </span>
                          <span className="text-[10px] text-[#8ea098] shrink-0 ml-2">
                            {new Date(evt.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8ea098] block">
                          By {evt.actorType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Self-Cancellation Action for Customer */}
              {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
                <div className="pt-2">
                  {!showCancelPrompt ? (
                    <button
                      onClick={() => setShowCancelPrompt(true)}
                      className="text-xs text-red-400 hover:text-red-300 underline underline-offset-4 cursor-pointer"
                    >
                      Need to cancel this reservation? Click here
                    </button>
                  ) : (
                    <div className="p-3.5 bg-red-950/40 border border-red-800/80 rounded-xl space-y-3 text-xs">
                      <p className="font-bold text-red-200">
                        Are you sure you want to cancel your table booking?
                      </p>
                      <input
                        type="text"
                        placeholder="Reason for cancellation (optional)"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full bg-[#091711] border border-red-900 focus:border-red-600 rounded px-2.5 py-1.5 text-xs text-[#f6f3ed] outline-none"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleCustomerCancel}
                          disabled={isCancelling}
                          className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white font-semibold rounded text-xs disabled:opacity-50"
                        >
                          {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                        </button>
                        <button
                          onClick={() => setShowCancelPrompt(false)}
                          className="px-3 py-1.5 bg-[#15382a] text-[#c8c0b2] hover:text-white rounded text-xs"
                        >
                          Keep Reservation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer Navigation */}
          <div className="pt-3 border-t border-[#224d3b] flex items-center justify-between text-xs">
            {onBookNew ? (
              <button
                onClick={() => {
                  if (onClose) onClose();
                  onBookNew();
                }}
                className="text-[#d4af37] hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <span>Book Another Table</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : <div />}

            {onNavigateHome && (
              <button
                onClick={() => {
                  if (onClose) onClose();
                  onNavigateHome();
                }}
                className="text-[#8ea098] hover:text-[#f6f3ed]"
              >
                Return to Restaurant Menu
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
