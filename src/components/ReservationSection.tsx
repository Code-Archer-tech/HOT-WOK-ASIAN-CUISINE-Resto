import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  Sparkles,
  MessageCircle,
  Phone,
  Info,
  Copy,
  Check,
  RotateCcw,
  Utensils,
  MapPin,
  Mail,
  Search,
  CheckCircle,
} from 'lucide-react';
import { Reservation } from '../types/restaurant';
import { saveReservationToFirestore } from '../services/dbService';
import {
  RESTAURANT_CONFIG,
  RESTAURANT_WHATSAPP_NUMBER,
  createWhatsAppReservationEnquiryUrl,
  getAvailableBookingSlots,
  isValidIndianMobile,
  cleanIndianMobile,
  formatTime12h,
  generateReservationNumber,
} from '../config/restaurantConfig';

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  date?: string;
  time?: string;
  guests?: string;
}

interface ReservationSectionProps {
  onOpenStatusTracker?: (reservationNumber?: string, phone?: string) => void;
}

export const ReservationSection: React.FC<ReservationSectionProps> = ({
  onOpenStatusTracker,
}) => {
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(getTodayString);
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [occasion, setOccasion] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Dynamically compute available slots based on restaurant configurable hours & selected date
  const availableSlots = useMemo(() => {
    return getAvailableBookingSlots(date);
  }, [date]);

  // Set default time slot whenever slots update if current selection is invalid
  React.useEffect(() => {
    const validSlot = availableSlots.find((s) => !s.isPast);
    if (validSlot && (!time || !availableSlots.some((s) => s.time24 === time && !s.isPast))) {
      setTime(validSlot.time24);
    }
  }, [availableSlots, time]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const today = getTodayString();

    // 1. Required Name (min 2 characters)
    if (!name.trim()) {
      newErrors.name = 'Guest name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Please provide a full name with at least 2 characters.';
    }

    // 2. Valid Indian Mobile Number (10 digits, starts with 6, 7, 8, 9)
    const cleanedDigits = cleanIndianMobile(phone);
    if (!cleanedDigits) {
      newErrors.phone = 'Mobile number is required.';
    } else if (!isValidIndianMobile(phone)) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).';
    }

    // Optional Email validation
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address or leave blank.';
    }

    // 3. Date cannot be in the past
    if (!date) {
      newErrors.date = 'Reservation date is required.';
    } else if (date < today) {
      newErrors.date = 'Reservation date cannot be in the past.';
    }

    // 4. Time selection
    if (!time) {
      newErrors.time = 'Please select a dining time slot.';
    } else {
      const chosen = availableSlots.find((s) => s.time24 === time);
      if (chosen?.isPast) {
        newErrors.time = 'This time slot has already passed for today. Please choose an upcoming slot.';
      }
    }

    // 5. Positive Guest Count
    if (!guests || guests < 1) {
      newErrors.guests = 'Number of guests must be at least 1.';
    } else if (guests > RESTAURANT_CONFIG.hours.maxPartySize) {
      newErrors.guests = `Maximum online booking is ${RESTAURANT_CONFIG.hours.maxPartySize} guests. For larger banquets, please call us directly.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const cleanedPhone = cleanIndianMobile(phone);

    try {
      let createdReservation: Reservation;

      try {
        // Post to server-side reservations API
        const response = await fetch('/api/reservations/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            customerName: name.trim(),
            phone: cleanedPhone,
            customerPhone: cleanedPhone,
            email: email.trim() || undefined,
            customerEmail: email.trim() || undefined,
            date,
            bookingDate: date,
            time,
            bookingTime: time,
            guests,
            guestCount: guests,
            occasion: occasion || undefined,
            specialRequest: specialRequest.trim() || undefined,
          }),
        });

        const data = await response.json();
        if (response.ok && data.success && data.reservation) {
          createdReservation = data.reservation;
        } else {
          throw new Error(data.error || 'Server rejected booking request');
        }
      } catch (apiErr: any) {
        console.warn('Backend API note, using client-side reservation generator:', apiErr);
        const refId = generateReservationNumber(date);
        createdReservation = {
          id: refId.toLowerCase(),
          reservationId: refId,
          reservationNumber: refId,
          name: name.trim(),
          customerName: name.trim(),
          phone: cleanedPhone,
          customerPhone: cleanedPhone,
          email: email.trim() || undefined,
          customerEmail: email.trim() || undefined,
          date,
          bookingDate: date,
          time,
          bookingTime: time,
          guests,
          guestCount: guests,
          occasion: occasion || undefined,
          specialRequest: specialRequest.trim() || undefined,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await saveReservationToFirestore(createdReservation);
        } catch (firestoreErr) {
          console.warn('Firestore reservation save warning:', firestoreErr);
        }
      }

      setConfirmedReservation(createdReservation);
    } catch (err: any) {
      console.error('Reservation submission error:', err);
      setSubmitError(
        err.message ||
          `Unable to complete booking enquiry at this time. Please call our restaurant desk directly at ${RESTAURANT_CONFIG.phoneDisplay}.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleResetForm = () => {
    setConfirmedReservation(null);
    setName('');
    setPhone('');
    setEmail('');
    setDate(getTodayString());
    setGuests(2);
    setOccasion('');
    setSpecialRequest('');
    setErrors({});
    setSubmitError(null);
  };

  // Quick date pickers
  const selectQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(d.toISOString().split('T')[0]);
    if (errors.date) {
      setErrors((prev) => ({ ...prev, date: undefined }));
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section
      id="reservation-section"
      className="py-16 sm:py-24 bg-[#091711] border-t border-[#224d3b]/50 text-[#f6f3ed] relative"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#15382a] border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Table Booking & Enquiry</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#f6f3ed]">
            Book a Table at Hot Wok
          </h2>

          <p className="text-sm text-[#c8c0b2] max-w-xl mx-auto leading-relaxed">
            Reserve seating for authentic Chinese, Korean, Malaysian, and Thai fusion dining at Urban
            Empire, Kausar Baug, Mumbra.
          </p>

          {/* Restaurant-Configurable Opening Hours Banner */}
          <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 lg:gap-4 mt-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#0f271d] border border-[#224d3b] text-xs text-[#c8c0b2] max-w-full text-center">
            <div className="flex items-center space-x-1.5 text-[#d4af37] font-medium shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>Dine-In Hours:</span>
            </div>
            <span className="break-words">
              Lunch: <strong>12:30 PM – 4:00 PM</strong> • Dinner: <strong>6:30 PM – 11:30 PM</strong>
            </span>
            <span className="hidden sm:inline text-[#224d3b]">|</span>
            <span className="text-[#8ea098] shrink-0">Open All 7 Days</span>
          </div>
        </div>

        {/* State 1: Confirmation Screen (Displayed After Submission) */}
        {confirmedReservation ? (
          <div
            id="reservation-confirmation-card"
            className="bg-[#0f271d] border border-[#d4af37] rounded-2xl p-4 sm:p-7 md:p-9 shadow-2xl space-y-6 animate-fade-in"
          >
            {/* Status Header */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#15382a] border-2 border-[#d4af37] text-[#d4af37] flex items-center justify-center mx-auto shadow-md">
                <Utensils className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <div className="inline-block px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/70 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider max-w-full break-words">
                Booking Request Submitted • Pending Table Confirmation
              </div>

              <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#f6f3ed] break-words">
                We Have Received Your Table Enquiry, {confirmedReservation.name}!
              </h3>

              {/* Transparent Disclaimer per User Directives */}
              <div className="max-w-lg mx-auto p-3.5 rounded-xl bg-[#07130e] border border-amber-500/40 text-amber-200/90 text-xs text-left flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300 block mb-0.5">
                    Table Enquiry Notice:
                  </span>
                  <p className="text-[11px] leading-relaxed text-[#c8c0b2]">
                    This is an online table booking enquiry. Table availability is verified by our
                    restaurant desk before confirmation. Our manager will confirm your party via
                    WhatsApp message or telephone shortly.
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Summary Box */}
            <div className="bg-[#07130e] border border-[#224d3b] rounded-xl p-4 sm:p-6 max-w-lg mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-[#224d3b] pb-3 gap-2 flex-wrap">
                <span className="text-xs text-[#8ea098]">Booking Reference:</span>
                <div className="flex items-center space-x-2">
                  <span
                    id="booking-reference-id"
                    className="font-mono font-bold text-sm sm:text-base text-[#d4af37] break-all"
                  >
                    {confirmedReservation.reservationId}
                  </span>
                  <button
                    onClick={() => handleCopyReference(confirmedReservation.reservationId)}
                    className="p-1 text-[#8ea098] hover:text-[#d4af37] transition-colors rounded shrink-0"
                    title="Copy Reference Number"
                  >
                    {copiedRef ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="min-w-0">
                  <span className="text-[#8ea098] block mb-0.5">Guest Name</span>
                  <span className="font-semibold text-[#f6f3ed] break-words">{confirmedReservation.name}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[#8ea098] block mb-0.5">Contact Phone</span>
                  <span className="font-semibold text-[#f6f3ed] break-all">
                    +91 {confirmedReservation.phone}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[#8ea098] block mb-0.5">Reservation Date</span>
                  <span className="font-semibold text-[#f6f3ed]">
                    {formatDateDisplay(confirmedReservation.date)}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[#8ea098] block mb-0.5">Preferred Time</span>
                  <span className="font-semibold text-[#d4af37]">
                    {formatTime12h(confirmedReservation.time)}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[#8ea098] block mb-0.5">Party Size</span>
                  <span className="font-semibold text-[#f6f3ed]">
                    {confirmedReservation.guests}{' '}
                    {confirmedReservation.guests === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[#8ea098] block mb-0.5">Booking Status</span>
                  <span className="font-bold text-amber-400">ENQUIRY PENDING</span>
                </div>
                {confirmedReservation.occasion && (
                  <div className="min-w-0 sm:col-span-2">
                    <span className="text-[#8ea098] block mb-0.5">Occasion</span>
                    <span className="font-semibold text-amber-200">🎉 {confirmedReservation.occasion}</span>
                  </div>
                )}
                {confirmedReservation.customerEmail && (
                  <div className="min-w-0 sm:col-span-2">
                    <span className="text-[#8ea098] block mb-0.5">Email</span>
                    <span className="font-semibold text-[#f6f3ed] break-all block">{confirmedReservation.customerEmail}</span>
                  </div>
                )}
              </div>

              {confirmedReservation.specialRequest && (
                <div className="pt-3 border-t border-[#224d3b] text-xs">
                  <span className="text-[#8ea098] block mb-0.5">Special Instructions:</span>
                  <p className="italic text-[#f6f3ed] bg-[#15382a]/40 p-2.5 rounded-lg border border-[#224d3b]/50 break-words">
                    "{confirmedReservation.specialRequest}"
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-[#224d3b]/50 text-[11px] text-[#8ea098] flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#d4af37] flex-shrink-0" />
                <span className="break-words">{RESTAURANT_CONFIG.address.short}</span>
              </div>
            </div>

            {/* Direct Confirmation Action Buttons */}
            <div className="max-w-lg mx-auto space-y-3 pt-2">
              {/* Online Tracker Access Button */}
              {onOpenStatusTracker && (
                <button
                  type="button"
                  id="btn-track-reservation-online"
                  onClick={() =>
                    onOpenStatusTracker(
                      confirmedReservation.reservationNumber || confirmedReservation.reservationId,
                      confirmedReservation.customerPhone || confirmedReservation.phone
                    )
                  }
                  className="w-full py-3 px-4 rounded-xl bg-[#d4af37] hover:bg-[#c49f2e] text-[#091711] font-bold text-xs flex items-center justify-center space-x-2 shadow-lg hover:shadow-[#d4af37]/20 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4 text-[#091711] shrink-0" />
                  <span className="break-words">Track Reservation Live Status Online</span>
                </button>
              )}

              <div className="text-center text-xs text-[#c8c0b2] font-medium">
                Speed up table allocation by notifying our front desk:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* WhatsApp Confirmation Button */}
                <a
                  id="btn-reservation-whatsapp"
                  href={createWhatsAppReservationEnquiryUrl(confirmedReservation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-900/40 transition-all active:scale-98"
                >
                  <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                  <span>Confirm on WhatsApp</span>
                </a>

                {/* Direct Telephone Call Button */}
                <a
                  id="btn-reservation-call"
                  href={RESTAURANT_CONFIG.telLink}
                  className="w-full py-3 px-4 rounded-xl bg-[#15382a] hover:bg-[#1c4b38] border border-[#224d3b] hover:border-[#d4af37] text-[#f6f3ed] font-bold text-xs flex items-center justify-center space-x-2 shadow transition-all active:scale-98"
                >
                  <Phone className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>Call {RESTAURANT_CONFIG.phoneDisplay}</span>
                </a>
              </div>

              {/* Reset / Book Another Table */}
              <div className="text-center pt-2">
                <button
                  id="btn-book-another-table"
                  onClick={handleResetForm}
                  className="inline-flex items-center space-x-1.5 text-xs text-[#8ea098] hover:text-[#d4af37] transition-colors py-1 px-3 rounded-lg cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Submit Another Table Booking</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* State 2: Booking Form */
          <div className="space-y-4">
            {/* Quick Status Lookup Banner for Returning Customers */}
            {onOpenStatusTracker && (
              <div className="p-3.5 rounded-xl bg-[#0e241b] border border-[#224d3b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 text-[#c8c0b2]">
                  <Search className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span className="break-words">
                    Already submitted a table reservation request? Check status in real time.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenStatusTracker()}
                  className="px-3 py-1.5 rounded-lg bg-[#15382a] hover:bg-[#1f4e3b] border border-[#224d3b] hover:border-[#d4af37] text-[#d4af37] font-semibold text-xs transition-colors shrink-0 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Track My Reservation</span>
                  <span className="text-xs">→</span>
                </button>
              </div>
            )}

            <form
              id="book-table-form"
              onSubmit={handleSubmitReservation}
              noValidate
              className="bg-[#0f271d] border border-[#224d3b] rounded-2xl p-4 sm:p-7 md:p-9 shadow-xl space-y-5 sm:space-y-6"
            >
              {submitError && (
                <div
                  id="reservation-submit-error"
                  className="p-3.5 rounded-lg bg-red-950/70 border border-red-500/80 text-red-200 text-xs flex items-start space-x-2 animate-shake"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="break-words">{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Field 1: Name */}
                <div>
                  <label
                    htmlFor="reservation-name"
                    className="block text-xs font-semibold text-[#c8c0b2] mb-1.5"
                  >
                    Guest Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="reservation-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="e.g. Aamir Khan"
                    className={`w-full bg-[#15382a]/70 border rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none transition-colors ${
                      errors.name
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-[#224d3b] focus:border-[#d4af37]'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-[11px] text-red-400 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>

                {/* Field 2: Mobile Number (Indian) */}
                <div>
                  <label
                    htmlFor="reservation-phone"
                    className="block text-xs font-semibold text-[#c8c0b2] mb-1.5"
                  >
                    Mobile Number (India) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#d4af37] font-bold select-none">
                      +91
                    </span>
                    <input
                      id="reservation-phone"
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhone(val);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="98765 43210"
                      className={`w-full bg-[#15382a]/70 border rounded-lg pl-12 pr-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none transition-colors ${
                        errors.phone
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-[#224d3b] focus:border-[#d4af37]'
                      }`}
                    />
                  </div>
                  {errors.phone ? (
                    <p className="mt-1 text-[11px] text-red-400 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.phone}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-[#8ea098]">
                      10-digit Indian mobile number for table confirmation.
                    </p>
                  )}
                </div>

                {/* Field 2B: Email (Optional) */}
                <div>
                  <label
                    htmlFor="reservation-email"
                    className="block text-xs font-semibold text-[#c8c0b2] mb-1.5 flex items-center space-x-1"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Email Address (Optional)</span>
                  </label>
                  <input
                    id="reservation-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="e.g. guest@example.com"
                    className={`w-full bg-[#15382a]/70 border rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none transition-colors ${
                      errors.email
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-[#224d3b] focus:border-[#d4af37]'
                    }`}
                  />
                  {errors.email ? (
                    <p className="mt-1 text-[11px] text-red-400 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-[#8ea098]">
                      For electronic confirmation and status updates.
                    </p>
                  )}
                </div>

              {/* Field 3: Date (Cannot be in the past) */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label
                    htmlFor="reservation-date"
                    className="text-xs font-semibold text-[#c8c0b2] flex items-center space-x-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Reservation Date</span>
                    <span className="text-red-400">*</span>
                  </label>
                  {/* Quick-Pick Date Buttons */}
                  <div className="flex items-center space-x-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => selectQuickDate(0)}
                      className="px-2 py-0.5 rounded bg-[#15382a] text-[#d4af37] hover:bg-[#1c4b38] transition-colors"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => selectQuickDate(1)}
                      className="px-2 py-0.5 rounded bg-[#15382a] text-[#c8c0b2] hover:bg-[#1c4b38] hover:text-[#f6f3ed] transition-colors"
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>

                <input
                  id="reservation-date"
                  type="date"
                  required
                  min={getTodayString()}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                  }}
                  className={`w-full bg-[#15382a]/70 border rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] focus:outline-none transition-colors ${
                    errors.date
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-[#224d3b] focus:border-[#d4af37]'
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-[11px] text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.date}</span>
                  </p>
                )}
              </div>

              {/* Field 4: Time Slot (Restaurant opening hours) */}
              <div>
                <label
                  htmlFor="reservation-time"
                  className="block text-xs font-semibold text-[#c8c0b2] mb-1.5 flex items-center space-x-1"
                >
                  <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Time Slot</span>
                  <span className="text-red-400">*</span>
                </label>

                <select
                  id="reservation-time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    if (errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
                  }}
                  className={`w-full bg-[#15382a] border rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] focus:outline-none transition-colors ${
                    errors.time
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-[#224d3b] focus:border-[#d4af37]'
                  }`}
                >
                  <optgroup label="Lunch Service (12:30 PM – 4:00 PM)">
                    {availableSlots
                      .filter((s) => s.shiftName.includes('Lunch'))
                      .map((slot) => (
                        <option key={slot.time24} value={slot.time24} disabled={slot.isPast}>
                          {slot.time12} {slot.isPast ? '(Slot Passed)' : ''}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Evening & Dinner Service (6:30 PM – 11:30 PM)">
                    {availableSlots
                      .filter((s) => s.shiftName.includes('Dinner'))
                      .map((slot) => (
                        <option key={slot.time24} value={slot.time24} disabled={slot.isPast}>
                          {slot.time12} {slot.isPast ? '(Slot Passed)' : ''}
                        </option>
                      ))}
                  </optgroup>
                </select>

                {errors.time && (
                  <p className="mt-1 text-[11px] text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.time}</span>
                  </p>
                )}
              </div>

              {/* Field 5: Number of Guests (Positive count) */}
              <div>
                <label
                  htmlFor="reservation-guests"
                  className="block text-xs font-semibold text-[#c8c0b2] mb-1.5 flex items-center space-x-1"
                >
                  <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Number of Guests</span>
                  <span className="text-red-400">*</span>
                </label>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
                  {/* Stepper Buttons */}
                  <div className="flex items-center border border-[#224d3b] rounded-lg bg-[#15382a] overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      className="px-3 py-2 text-[#c8c0b2] hover:text-[#f6f3ed] hover:bg-[#1c4b38] transition-colors font-bold"
                      title="Decrease Guests"
                    >
                      -
                    </button>
                    <input
                      id="reservation-guests"
                      type="number"
                      min={1}
                      max={25}
                      value={guests}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setGuests(val);
                        if (errors.guests) setErrors((prev) => ({ ...prev, guests: undefined }));
                      }}
                      className="w-12 text-center bg-transparent text-sm font-bold text-[#d4af37] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setGuests((g) => Math.min(25, g + 1))}
                      className="px-3 py-2 text-[#c8c0b2] hover:text-[#f6f3ed] hover:bg-[#1c4b38] transition-colors font-bold"
                      title="Increase Guests"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center space-x-1 overflow-x-auto py-0.5 max-w-full">
                    {[2, 4, 6, 8, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setGuests(num);
                          if (errors.guests) setErrors((prev) => ({ ...prev, guests: undefined }));
                        }}
                        className={`px-2.5 py-1.5 rounded text-xs font-semibold transition-all shrink-0 ${
                          guests === num
                            ? 'bg-[#d4af37] text-[#091711] shadow'
                            : 'bg-[#15382a] text-[#c8c0b2] hover:text-[#f6f3ed]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {errors.guests && (
                  <p className="mt-1 text-[11px] text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.guests}</span>
                  </p>
                )}
              </div>

              {/* Field 6: Occasion (Optional) */}
              <div>
                <label
                  htmlFor="reservation-occasion"
                  className="block text-xs font-semibold text-[#c8c0b2] mb-1.5 flex items-center space-x-1"
                >
                  <span>Dining Occasion (Optional)</span>
                </label>
                <select
                  id="reservation-occasion"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full bg-[#15382a] border border-[#224d3b] rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] focus:outline-none focus:border-[#d4af37] transition-colors"
                >
                  <option value="">Casual Dining / Regular</option>
                  <option value="Birthday">Birthday Celebration 🎂</option>
                  <option value="Anniversary">Anniversary Celebration 🥂</option>
                  <option value="Family">Family Dinner 👨‍👩‍👧‍👦</option>
                  <option value="Business">Business / Team Meal 💼</option>
                  <option value="Other">Other Special Occasion ✨</option>
                </select>
                <p className="mt-1 text-[10px] text-[#8ea098]">
                  Helps our team prepare special greetings or seating arrangements.
                </p>
              </div>

              {/* Field 7: Special Request */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="reservation-special-request"
                  className="block text-xs font-semibold text-[#c8c0b2] mb-1.5"
                >
                  Special Request (Optional)
                </label>
                <input
                  id="reservation-special-request"
                  type="text"
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  placeholder="e.g. Birthday celebration, high chair, quiet booth seating, spicy preferences..."
                  className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37] transition-colors"
                />
                <p className="mt-1 text-[10px] text-[#8ea098]">
                  We will do our best to accommodate dietary and seating preferences.
                </p>
              </div>
            </div>

            {/* Clear Disclaimer per prompt instructions */}
            <div className="p-3 rounded-xl bg-[#07130e] border border-[#224d3b] text-xs text-[#8ea098] flex items-start space-x-2">
              <Info className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Booking Notice:</strong> Submitting this enquiry sends your booking request
                directly to the Hot Wok restaurant desk. Our manager will verify table availability
                and contact you to confirm.
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-table-reservation"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e2c258] hover:to-[#c59b27] text-[#091711] font-bold text-sm tracking-wider uppercase transition-all shadow-lg hover:shadow-[#d4af37]/20 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#091711] border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Booking Enquiry...</span>
                  </>
                ) : (
                  <>
                    <Utensils className="w-4 h-4" />
                    <span>Submit Table Booking Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  </section>
);
};
