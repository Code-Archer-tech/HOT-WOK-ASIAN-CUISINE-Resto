/**
 * Centralized Restaurant Configuration
 *
 * Configures restaurant identity, contact numbers, address,
 * delivery/packaging fees, and WhatsApp messaging parameters.
 * Reads environment variables with safe defaults.
 */

import { RestaurantTable } from '../types/restaurant';

// Format phone digits safely (strips spaces, dashes, parentheses)
const cleanNumber = (num: string): string => num.replace(/\D/g, '');

const rawWhatsapp =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RESTAURANT_WHATSAPP_NUMBER) ||
  (typeof process !== 'undefined' && (process.env?.VITE_RESTAURANT_WHATSAPP_NUMBER || process.env?.RESTAURANT_WHATSAPP_NUMBER)) ||
  '919987974833';

const rawPhone =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RESTAURANT_PHONE) ||
  (typeof process !== 'undefined' && process.env?.VITE_RESTAURANT_PHONE) ||
  '+91 99879 74833';

/**
 * Single source of truth for restaurant WhatsApp ordering and messaging.
 * Configured in international format without '+' symbol (e.g. '919987974833').
 * Used across client and server without duplication.
 */
export const RESTAURANT_WHATSAPP_NUMBER: string = cleanNumber(rawWhatsapp);

export const RESTAURANT_CONFIG = {
  name: 'Hot Wok Asian Cuisine',
  tagline: 'Where Flavour Meets Fusion',
  cuisines: ['Chinese', 'Korean', 'Malaysian', 'Thai'] as const,

  // Contact Numbers (Configured from Environment / Config)
  whatsappNumber: RESTAURANT_WHATSAPP_NUMBER, // e.g., '919987974833' for wa.me/ links
  phoneDisplay: rawPhone,                   // e.g., '+91 99879 74833' for UI display
  phoneCall: cleanNumber(rawPhone).slice(-10), // 10-digit number for tel: links
  telLink: `tel:${cleanNumber(rawPhone)}`,

  // Physical Location
  address: {
    full: 'Shop No. A/1, Urban Empire, Mittal Ground, Opposite Sonaji Nagar, Kausar Baug, Narayan Nagar, Mumbra, Thane - 400612',
    short: 'Shop No. A/1, Urban Empire, Kausar Baug, Mumbra, Thane',
    city: 'Mumbra, Thane',
    pincode: '400612',
    googleMapsUrl: 'https://maps.google.com/?q=Hot+Wok+Asian+Cuisine+Urban+Empire+Mumbra',
  },

  // Operational & Table Booking Hours (Restaurant-Configurable)
  hours: {
    display: '12:30 PM - 12:00 AM (Daily)',
    daysSummary: 'Monday to Sunday (Open All 7 Days)',
    openTime: '12:30',
    closeTime: '24:00',
    shifts: [
      {
        id: 'lunch',
        name: 'Afternoon / Lunch Service',
        start: '12:30',
        end: '16:00',
        startLabel: '12:30 PM',
        endLabel: '4:00 PM',
      },
      {
        id: 'dinner',
        name: 'Evening & Dinner Service',
        start: '18:30',
        end: '23:30',
        startLabel: '6:30 PM',
        endLabel: '11:30 PM',
      },
    ],
    slotIntervalMinutes: 30,
    minPartySize: 1,
    maxPartySize: 25,
  },

  // Fees & Pricing Configuration
  pricing: {
    taxRate: 0.05, // 5% GST
    defaultPackagingFee: 25, // ₹25 standard tamper-proof Asian packaging
    defaultDeliveryFee: 30, // ₹30 delivery fee
    freeDeliveryThreshold: 500, // Orders ₹500 and above get free delivery
  },

  // Estimated Times
  estimates: {
    deliveryTimeMinutes: '35–45 mins',
    pickupTimeMinutes: '15–20 mins',
    dineInPrepTimeMinutes: '12–18 mins',
  },
};

export interface WhatsAppOrderItem {
  name: string;
  portion?: string;
  dietaryChoice?: string;
  quantity: number;
  totalPrice: number;
}

export interface WhatsAppOrderPayload {
  orderNumber: string;
  items: WhatsAppOrderItem[];
  subtotal: number;
  total: number;
  orderType: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  tableNumber?: string;
  specialInstructions?: string;
}

/**
 * Generates the standardized WhatsApp order message matching the requested format:
 *
 * Hello Hot Wok Asian Cuisine,
 * I would like to place an order.
 *
 * Order ID: [ID]
 *
 * Items:
 * [Item] x [Qty] - ₹[Price]
 *
 * Subtotal: ₹[amount]
 * Total: ₹[amount]
 *
 * Order Type: [Delivery/Pickup]
 *
 * Customer:
 * [Name]
 * [Phone]
 *
 * Address:
 * [Address]
 *
 * Special Instructions:
 * [Instructions]
 */
export function generateWhatsAppOrderMessage(order: WhatsAppOrderPayload): string {
  // Format items list: [Item] x [Qty] - ₹[Price]
  const itemsText = order.items
    .map((item) => {
      const portionText =
        item.portion && item.portion !== 'single'
          ? ` (${item.portion.charAt(0).toUpperCase() + item.portion.slice(1)})`
          : '';
      return `${item.name}${portionText} x ${item.quantity} - ₹${item.totalPrice}`;
    })
    .join('\n');

  // Order Type: [Delivery/Pickup]
  let orderTypeText = 'Pickup';
  if (order.orderType === 'delivery') {
    orderTypeText = 'Delivery';
  } else if (order.orderType === 'dine_in') {
    orderTypeText = order.tableNumber ? `Dine-In (Table #${order.tableNumber})` : 'Dine-In';
  } else {
    orderTypeText = 'Pickup';
  }

  // Address
  let addressText = 'N/A';
  if (order.orderType === 'delivery') {
    addressText = order.deliveryAddress?.trim() || 'N/A';
  } else if (order.orderType === 'dine_in') {
    addressText = `Dine-In at Restaurant (${RESTAURANT_CONFIG.address.short})`;
  } else {
    addressText = `Store Pickup (${RESTAURANT_CONFIG.address.short})`;
  }

  const specialInstructionsText = order.specialInstructions?.trim() || 'None';
  const customerPhoneFormatted = order.customerPhone.startsWith('+')
    ? order.customerPhone
    : `+91 ${order.customerPhone}`;

  return `Hello Hot Wok Asian Cuisine,
I would like to place an order.

Order ID: ${order.orderNumber}

Items:
${itemsText}

Subtotal: ₹${order.subtotal}
Total: ₹${order.total}

Order Type: ${orderTypeText}

Customer:
${order.customerName}
${customerPhoneFormatted}

Address:
${addressText}

Special Instructions:
${specialInstructionsText}`;
}

/**
 * Generate a wa.me URL for the configured restaurant WhatsApp number with encoded text.
 * Universal link works across mobile (launches WhatsApp app) and desktop.
 */
export function createWhatsAppUrl(messageText: string): string {
  return `https://wa.me/${RESTAURANT_WHATSAPP_NUMBER}?text=${encodeURIComponent(messageText)}`;
}

/**
 * Generate a direct web.whatsapp.com URL for desktop users who prefer WhatsApp Web directly.
 */
export function createWhatsAppWebUrl(messageText: string): string {
  return `https://web.whatsapp.com/send?phone=${RESTAURANT_WHATSAPP_NUMBER}&text=${encodeURIComponent(messageText)}`;
}

/**
 * Validates whether a given mobile string represents a valid 10-digit Indian phone number.
 * Valid Indian numbers start with digits 6, 7, 8, or 9.
 */
export function isValidIndianMobile(phoneStr: string): boolean {
  const digits = cleanIndianMobile(phoneStr);
  return /^[6-9]\d{9}$/.test(digits);
}

/**
 * Extracts normalized 10-digit Indian mobile number from various inputs
 * (handles +91, 91, 0 prefixes and spaces/dashes).
 */
export function cleanIndianMobile(phoneStr: string): string {
  const rawDigits = phoneStr.replace(/\D/g, '');
  if (rawDigits.length === 12 && rawDigits.startsWith('91')) {
    return rawDigits.slice(2);
  }
  if (rawDigits.length === 11 && rawDigits.startsWith('0')) {
    return rawDigits.slice(1);
  }
  return rawDigits;
}

/**
 * Formats a 24-hour time string like '13:30' into 12-hour display format '1:30 PM'.
 */
export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

export interface BookingTimeSlot {
  time24: string;
  time12: string;
  shiftName: string;
  isPast?: boolean;
}

/**
 * Generates available dining reservation time slots based on the restaurant's
 * configured opening hours and shifts. If selectedDate matches today, filters
 * out time slots that have already passed (allowing a 30-min preparation buffer).
 */
export function getAvailableBookingSlots(selectedDate?: string): BookingTimeSlot[] {
  const slots: BookingTimeSlot[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;
  const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

  RESTAURANT_CONFIG.hours.shifts.forEach((shift) => {
    const [startH, startM] = shift.start.split(':').map(Number);
    const [endH, endM] = shift.end.split(':').map(Number);

    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current <= end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const time12 = formatTime12h(time24);

      // If booking for today, filter out slots that have already passed (with 30 min buffer)
      const isPast = isToday && current < currentMinutesNow + 30;

      slots.push({
        time24,
        time12,
        shiftName: shift.name,
        isPast,
      });

      current += RESTAURANT_CONFIG.hours.slotIntervalMinutes;
    }
  });

  return slots;
}

export interface ReservationPayload {
  reservationId: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  specialRequest?: string;
  status: string;
}

/**
 * Formats a clear, professional WhatsApp message for table booking enquiry requests.
 * Clearly specifies that it is a booking request pending restaurant confirmation.
 */
export function generateReservationWhatsAppMessage(res: ReservationPayload): string {
  const formattedPhone = res.phone.startsWith('+') ? res.phone : `+91 ${cleanIndianMobile(res.phone)}`;
  const timeFormatted = formatTime12h(res.time);

  return `*HOT WOK ASIAN CUISINE - TABLE BOOKING ENQUIRY*

Hello Hot Wok Team,
I have submitted a table booking request via your website.

Booking Reference: ${res.reservationId}
Guest Name: ${res.name}
Mobile: ${formattedPhone}
Date: ${res.date}
Time: ${timeFormatted} (${res.time})
Number of Guests: ${res.guests} ${res.guests === 1 ? 'Guest' : 'Guests'}
Special Request: ${res.specialRequest?.trim() || 'None'}

Status: Table Enquiry Request (Pending Confirmation)

Please check your seating availability and confirm our reservation. Thank you!`;
}

export const DEFAULT_TABLES: RestaurantTable[] = [
  { tableId: 't01', tableNumber: 'T01', capacity: 2, location: 'Indoor AC Main Hall', status: 'AVAILABLE' },
  { tableId: 't02', tableNumber: 'T02', capacity: 2, location: 'Window Bay', status: 'AVAILABLE' },
  { tableId: 't03', tableNumber: 'T03', capacity: 4, location: 'Indoor AC Main Hall', status: 'AVAILABLE' },
  { tableId: 't04', tableNumber: 'T04', capacity: 4, location: 'Window Bay', status: 'AVAILABLE' },
  { tableId: 't05', tableNumber: 'T05', capacity: 4, location: 'Family Booth', status: 'AVAILABLE' },
  { tableId: 't06', tableNumber: 'T06', capacity: 6, location: 'Family Booth', status: 'AVAILABLE' },
  { tableId: 't07', tableNumber: 'T07', capacity: 6, location: 'Asian Dining Alcove', status: 'AVAILABLE' },
  { tableId: 't08', tableNumber: 'T08', capacity: 8, location: 'Banquet Round Table', status: 'AVAILABLE' },
  { tableId: 't09', tableNumber: 'T09', capacity: 8, location: 'Family Long Table', status: 'AVAILABLE' },
  { tableId: 't10', tableNumber: 'T10', capacity: 10, location: "Imperial Chef's Table", status: 'AVAILABLE' },
];

export const RESERVATION_SLOT_DURATION_MINUTES = 90;

/**
 * Generates unique reservation numbers in the format: HW-YYYYMMDD-XXXX
 * Example: HW-20260921-0001
 */
export function generateReservationNumber(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateSegment = `${year}${month}${day}`;
  const randomSuffix = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
  return `HW-${dateSegment}-${randomSuffix}`;
}

/**
 * Customer confirmation WhatsApp message per prompt specification
 */
export function generateReservationConfirmedWhatsAppMessage(res: {
  reservationNumber: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
  guestCount: number;
  assignedTableNumber?: string;
}): string {
  const formattedDate = formatHumanDate(res.bookingDate);
  const formattedTime = formatTime12h(res.bookingTime);
  const table = res.assignedTableNumber || 'TBD';

  return `Your table reservation at Hot Wok Asian Cuisine Restaurant has been CONFIRMED.

Reservation ID: ${res.reservationNumber}
Date: ${formattedDate}
Time: ${formattedTime}
Guests: ${res.guestCount}
Table: ${table}

Please arrive a few minutes before your reservation time.

Hot Wok Asian Cuisine Restaurant
9987 974 833
Urban Empire, Mittal Ground, Mumbra - 400612`;
}

/**
 * Customer rejection WhatsApp message
 */
export function generateReservationRejectedWhatsAppMessage(res: {
  reservationNumber: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
  rejectionReason?: string;
}): string {
  const formattedDate = formatHumanDate(res.bookingDate);
  const formattedTime = formatTime12h(res.bookingTime);
  const reason = res.rejectionReason || 'Tables are fully committed for this dining slot';

  return `Hello ${res.customerName},
Regarding your table reservation request at Hot Wok Asian Cuisine Restaurant:

Reservation ID: ${res.reservationNumber}
Date: ${formattedDate}
Time: ${formattedTime}

Status: Unable to Confirm
Reason: ${reason}

We apologize for the inconvenience. Please consider reserving for another available time or contact our manager directly at 9987 974 833.

Hot Wok Asian Cuisine Restaurant`;
}

/**
 * Table change WhatsApp notification message
 */
export function generateTableChangedWhatsAppMessage(res: {
  reservationNumber: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
  previousTable: string;
  newTable: string;
}): string {
  const formattedDate = formatHumanDate(res.bookingDate);
  const formattedTime = formatTime12h(res.bookingTime);

  return `Hello ${res.customerName},
Your table assignment has been updated for your upcoming dining at Hot Wok Asian Cuisine Restaurant:

Reservation ID: ${res.reservationNumber}
Date: ${formattedDate}
Time: ${formattedTime}
Previous Table: ${res.previousTable}
New Table: ${res.newTable}

Please arrive a few minutes before your reservation time.

Hot Wok Asian Cuisine Restaurant
9987 974 833
Urban Empire, Mittal Ground, Mumbra - 400612`;
}

/**
 * Cancellation WhatsApp notification message
 */
export function generateReservationCancelledWhatsAppMessage(res: {
  reservationNumber: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
}): string {
  const formattedDate = formatHumanDate(res.bookingDate);
  const formattedTime = formatTime12h(res.bookingTime);

  return `Hello ${res.customerName},
Your table reservation (${res.reservationNumber}) for ${formattedDate} at ${formattedTime} has been CANCELLED.

If this was made in error or you wish to rebook, please visit our website or call 9987 974 833.

Hot Wok Asian Cuisine Restaurant`;
}

/**
 * Helper to format date into human-readable e.g. "25 September 2026"
 */
function formatHumanDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Creates direct WhatsApp link to customer's personal mobile number
 */
export function createCustomerWhatsAppNotificationUrl(customerPhone: string, message: string): string {
  const cleanPhone = cleanIndianMobile(customerPhone);
  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Creates WhatsApp URL to send the table booking enquiry to the restaurant desk.
 */
export function createWhatsAppReservationEnquiryUrl(res: ReservationPayload): string {
  const message = generateReservationWhatsAppMessage(res);
  return createWhatsAppUrl(message);
}

/**
 * Quick inquiry URL for general customer support or queries.
 */
export function createWhatsAppInquiryUrl(customNote?: string): string {
  const text =
    customNote ||
    "Hello Hot Wok Asian Cuisine, I would like to inquire about today's menu and table availability.";
  return createWhatsAppUrl(text);
}


