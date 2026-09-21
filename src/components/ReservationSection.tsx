import React, { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle2, AlertCircle, Sparkles, MessageCircle } from 'lucide-react';
import { Reservation } from '../types/restaurant';
import { saveReservationToFirestore } from '../services/dbService';

export const ReservationSection: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('19:30');
  const [guests, setGuests] = useState(2);
  const [specialRequest, setSpecialRequest] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  const availableTimeSlots = [
    '12:30', '13:00', '13:30', '14:00', '14:30',
    '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'
  ];

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please provide a valid full name (at least 2 characters).');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!date) {
      setErrorMessage('Please pick a booking date.');
      return;
    }

    if (!time) {
      setErrorMessage('Please select a time slot.');
      return;
    }

    if (guests < 1 || guests > 25) {
      setErrorMessage('Party size must be between 1 and 25 guests.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          date,
          time,
          guests,
          specialRequest: specialRequest.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete reservation booking.');
      }

      const res: Reservation = data.reservation;

      // Also persist to Firestore
      try {
        await saveReservationToFirestore(res);
      } catch (dbErr) {
        console.warn('Firestore reservation sync warning:', dbErr);
      }

      setConfirmedReservation(res);
    } catch (err: any) {
      console.error('Reservation error:', err);
      setErrorMessage(err.message || 'Error booking table. Please try calling directly at 99879 74833.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppReservationUrl = (res: Reservation) => {
    const text = `*HOT WOK ASIAN CUISINE - TABLE RESERVATION*\nBooking ID: ${res.reservationId}\nGuest: ${res.name}\nContact: +91 ${res.phone}\nDate: ${res.date}\nTime: ${res.time}\nParty Size: ${res.guests} Guests\n${res.specialRequest ? `Special Request: ${res.specialRequest}` : ''}\n\nPlease confirm our table!`;
    return `https://wa.me/919987974833?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="reservation-section" className="py-16 sm:py-24 bg-[#091711] border-t border-[#224d3b]/50 text-[#f6f3ed]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#15382a] border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Table Reservation</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#f6f3ed]">
            Reserve Your Asian Dining Experience
          </h2>
          <p className="text-sm text-[#c8c0b2] max-w-xl mx-auto">
            Enjoy premium seating for families, romantic dinners, and private gatherings at Urban Empire, Kausar Baug.
          </p>
        </div>

        {/* Confirmation Screen if booked */}
        {confirmedReservation ? (
          <div className="bg-[#0f271d] border border-[#d4af37] rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#15382a] border-2 border-[#d4af37] text-[#d4af37] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#d4af37]">
                Reservation Confirmed
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#f6f3ed]">
                We Look Forward to Welcoming You, {confirmedReservation.name}!
              </h3>
              <p className="text-xs text-[#c8c0b2]">
                Your booking request has been stored in our system.
              </p>
            </div>

            {/* Ticket Card */}
            <div className="bg-[#07130e] border border-[#224d3b] rounded-xl p-5 max-w-md mx-auto text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center border-b border-[#224d3b]/70 pb-2">
                <span className="text-[#8ea098]">Booking Reference:</span>
                <span className="font-mono font-bold text-sm text-[#d4af37]">
                  {confirmedReservation.reservationId}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[#c8c0b2]">
                <div>
                  <span className="text-[#8ea098] block">Date:</span>
                  <span className="font-semibold text-[#f6f3ed]">{confirmedReservation.date}</span>
                </div>
                <div>
                  <span className="text-[#8ea098] block">Time Slot:</span>
                  <span className="font-semibold text-[#f6f3ed]">{confirmedReservation.time}</span>
                </div>
                <div>
                  <span className="text-[#8ea098] block">Party Size:</span>
                  <span className="font-semibold text-[#f6f3ed]">{confirmedReservation.guests} Persons</span>
                </div>
                <div>
                  <span className="text-[#8ea098] block">Status:</span>
                  <span className="font-bold text-amber-400">PENDING CONFIRMATION</span>
                </div>
              </div>
              {confirmedReservation.specialRequest && (
                <div className="pt-2 border-t border-[#224d3b]/50">
                  <span className="text-[#8ea098] block">Special Request:</span>
                  <span className="italic text-[#f6f3ed]">{confirmedReservation.specialRequest}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={getWhatsAppReservationUrl(confirmedReservation)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Notify Restaurant on WhatsApp</span>
              </a>

              <button
                onClick={() => setConfirmedReservation(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-lg bg-[#15382a] border border-[#224d3b] text-xs font-semibold text-[#c8c0b2] hover:text-[#f6f3ed]"
              >
                Book Another Table
              </button>
            </div>
          </div>
        ) : (
          /* Reservation Form */
          <form
            onSubmit={handleSubmitReservation}
            className="bg-[#0f271d] border border-[#224d3b] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6"
          >
            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-500/80 text-red-200 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-[#c8c0b2] mb-1.5">
                  Guest Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="reserve-input-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aamir Sayed"
                  className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-[#c8c0b2] mb-1.5">
                  Contact Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#d4af37] font-bold">
                    +91
                  </span>
                  <input
                    id="reserve-input-phone"
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="99879 74833"
                    className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-lg pl-12 pr-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-[#c8c0b2] mb-1.5 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Reservation Date</span>
                </label>
                <input
                  id="reserve-input-date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Time Slot */}
              <div>
                <label className="block text-xs font-medium text-[#c8c0b2] mb-1.5 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Preferred Time</span>
                </label>
                <select
                  id="reserve-select-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                >
                  {availableTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot} ({parseInt(slot.split(':')[0]) >= 12 ? 'PM' : 'AM'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-xs font-medium text-[#c8c0b2] mb-1.5 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Number of Guests</span>
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    id="reserve-input-guests"
                    type="range"
                    min={1}
                    max={20}
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="flex-1 accent-[#d4af37]"
                  />
                  <span className="font-serif font-bold text-base text-[#d4af37] w-14 text-center bg-[#15382a] py-1 rounded border border-[#224d3b]">
                    {guests} {guests === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
              </div>

              {/* Special Request */}
              <div>
                <label className="block text-xs font-medium text-[#c8c0b2] mb-1.5">
                  Special Request (Optional)
                </label>
                <input
                  id="reserve-input-request"
                  type="text"
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  placeholder="e.g. Birthday table setup, high chair, window booth..."
                  className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-reservation"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e2c258] hover:to-[#c59b27] text-[#091711] font-bold text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#091711] border-t-transparent rounded-full animate-spin" />
                    <span>Booking Reservation...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Table Reservation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
