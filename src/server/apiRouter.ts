import express, { Request, Response, Router } from 'express';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  calculateOrderServer,
  generateOrderNumber,
  generateReservationId,
  generateWhatsAppMessage,
  getWhatsAppUrl,
  getCachedMenuItems,
  setCachedMenuItems
} from './apiHandler';
import {
  Order,
  Reservation,
  RestaurantTable,
  ReservationEvent,
  NotificationLog,
} from '../types/restaurant';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS, INITIAL_REVIEWS } from '../lib/seedData';
import {
  RESTAURANT_CONFIG,
  DEFAULT_TABLES,
  RESERVATION_SLOT_DURATION_MINUTES,
  cleanIndianMobile,
  generateReservationNumber,
  createWhatsAppReservationEnquiryUrl,
  generateReservationConfirmedWhatsAppMessage,
  generateReservationRejectedWhatsAppMessage,
  generateTableChangedWhatsAppMessage,
  generateReservationCancelledWhatsAppMessage,
  createCustomerWhatsAppNotificationUrl,
} from '../config/restaurantConfig';
import {
  saveReservationToFirestore,
  getReservationById,
  getReservationByNumberAndPhone,
  updateReservation,
  logReservationEvent,
  getReservationEvents,
  logNotification,
  getTables,
  saveTable,
  updateTable,
  deleteTable,
  checkTableConflict,
} from '../services/dbService';

export const apiRouter: Router = express.Router();

apiRouter.use(express.json());

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    restaurant: RESTAURANT_CONFIG.name,
    phone: RESTAURANT_CONFIG.phoneDisplay,
    whatsapp: RESTAURANT_CONFIG.whatsappNumber,
    cuisines: RESTAURANT_CONFIG.cuisines,
  });
});

// Menu retrieval
apiRouter.get('/menu', (_req: Request, res: Response) => {
  res.json({
    categories: INITIAL_CATEGORIES,
    menuItems: getCachedMenuItems()
  });
});

// Calculate order (server-side price calculation to prevent client tampering)
apiRouter.post('/orders/calculate', (req: Request, res: Response) => {
  try {
    const { items, orderType, includePackaging } = req.body;
    const result = calculateOrderServer({
      items,
      orderType: orderType || 'pickup',
      includePackaging: includePackaging !== false,
    });
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error calculating order.' });
  }
});

// Create Order (Server validated & generated)
apiRouter.post('/orders/create', (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      orderType,
      deliveryAddress,
      tableNumber,
      specialInstructions,
      items,
      includePackaging
    } = req.body;

    // Validation - Customer Name
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter a valid customer name (at least 2 characters).' });
    }

    // Validation - Mobile Number (10 digits)
    const cleanPhone = (customerPhone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    // Validation - Order Type
    const validOrderTypes = ['delivery', 'pickup', 'takeaway', 'dine_in'];
    if (!validOrderTypes.includes(orderType)) {
      return res.status(400).json({ error: 'Order type must be Delivery, Pickup, or Dine-in.' });
    }

    // Validation - Delivery Address (required when delivery selected)
    if (orderType === 'delivery') {
      if (!deliveryAddress || typeof deliveryAddress !== 'string' || deliveryAddress.trim().length < 8) {
        return res.status(400).json({
          error: 'Please enter your complete delivery address (building, flat/house, area, landmark).'
        });
      }
    }

    if (orderType === 'dine_in' && tableNumber && typeof tableNumber !== 'string') {
      return res.status(400).json({ error: 'Invalid table number format.' });
    }

    // Authoritative server-side price calculation
    const calcResult = calculateOrderServer({
      items,
      orderType,
      includePackaging: includePackaging !== false
    });
    if (!calcResult.valid) {
      return res.status(400).json({ error: calcResult.error });
    }

    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    const order: Order = {
      id: orderNumber.toLowerCase(),
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress?.trim() : undefined,
      tableNumber: orderType === 'dine_in' && tableNumber ? tableNumber.trim() : undefined,
      specialInstructions: specialInstructions ? specialInstructions.trim() : undefined,
      items: calcResult.items,
      subtotal: calcResult.subtotal,
      tax: calcResult.tax,
      packagingCharge: calcResult.packagingCharge,
      deliveryFee: calcResult.deliveryFee,
      total: calcResult.total,
      status: 'NEW',
      paymentStatus: orderType === 'delivery' ? 'CASH_ON_DELIVERY' : 'PAY_AT_RESTAURANT',
      createdAt: now,
      updatedAt: now,
    };

    const whatsappMessage = generateWhatsAppMessage(order);
    const whatsappUrl = getWhatsAppUrl(order);

    return res.status(201).json({
      success: true,
      order: {
        ...order,
        whatsappMessage,
      },
      whatsappUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create order.' });
  }
});

// Table reservation endpoints (Full Management Workflow)
const handleReservationCreate = async (req: Request, res: Response) => {
  try {
    const {
      name,
      customerName,
      phone,
      customerPhone,
      email,
      customerEmail,
      date,
      bookingDate,
      time,
      bookingTime,
      guests,
      guestCount,
      occasion,
      specialRequest,
    } = req.body;

    const guestName = (customerName || name || '').trim();
    if (!guestName || guestName.length < 2) {
      return res.status(400).json({ error: 'Please provide a valid guest name (at least 2 characters).' });
    }

    // Validate Indian mobile number (10 digits starting with 6, 7, 8, 9)
    const rawPhone = customerPhone || phone || '';
    const rawDigits = rawPhone.replace(/\D/g, '');
    let cleanPhone = rawDigits;
    if (rawDigits.length === 12 && rawDigits.startsWith('91')) {
      cleanPhone = rawDigits.slice(2);
    } else if (rawDigits.length === 11 && rawDigits.startsWith('0')) {
      cleanPhone = rawDigits.slice(1);
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        error: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).',
      });
    }

    const resDate = bookingDate || date;
    if (!resDate || isNaN(Date.parse(resDate))) {
      return res.status(400).json({ error: 'Please select a valid reservation date.' });
    }

    // Check date is not in the past
    const todayStr = new Date().toISOString().split('T')[0];
    if (resDate < todayStr) {
      return res.status(400).json({ error: 'Reservation date cannot be in the past.' });
    }

    const resTime = (bookingTime || time || '').trim();
    if (!resTime) {
      return res.status(400).json({ error: 'Please select a reservation time slot.' });
    }

    const numGuests = Number(guestCount || guests);
    if (isNaN(numGuests) || !Number.isInteger(numGuests) || numGuests < 1) {
      return res.status(400).json({ error: 'Number of guests must be a positive number (at least 1 guest).' });
    }
    if (numGuests > 25) {
      return res.status(400).json({
        error: 'For group bookings exceeding 25 guests, please contact our restaurant manager directly at 9987 974 833.',
      });
    }

    const resEmail = (customerEmail || email || '').trim();
    if (resEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address or leave blank.' });
    }

    const reservationNumber = generateReservationNumber(resDate);
    const id = reservationNumber.toLowerCase();
    const nowIso = new Date().toISOString();

    const reservation: Reservation = {
      id,
      reservationNumber,
      reservationId: reservationNumber,
      customerName: guestName,
      name: guestName,
      customerPhone: cleanPhone,
      phone: cleanPhone,
      customerEmail: resEmail || undefined,
      bookingDate: resDate,
      date: resDate,
      bookingTime: resTime,
      time: resTime,
      guestCount: numGuests,
      guests: numGuests,
      occasion: occasion || undefined,
      specialRequest: specialRequest ? specialRequest.trim() : undefined,
      status: 'PENDING',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Save to Firestore
    await saveReservationToFirestore(reservation);

    // Record Activity Event
    await logReservationEvent({
      reservationId: id,
      eventType: 'BOOKING_RECEIVED',
      actorType: 'CUSTOMER',
      actorId: cleanPhone,
      message: `New booking request submitted for ${numGuests} guests on ${resDate} at ${resTime}.`,
    });

    const whatsappEnquiryUrl = createWhatsAppReservationEnquiryUrl({
      reservationId: reservationNumber,
      name: guestName,
      phone: cleanPhone,
      date: resDate,
      time: resTime,
      guests: numGuests,
      specialRequest: specialRequest,
      status: 'PENDING',
    });

    return res.status(201).json({
      success: true,
      reservation,
      whatsappEnquiryUrl,
      message: 'Reservation request submitted successfully. Awaiting restaurant manager confirmation.',
    });
  } catch (err: any) {
    console.error('Error creating reservation:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit reservation.' });
  }
};

apiRouter.post('/reservations', handleReservationCreate);
apiRouter.post('/reservations/create', handleReservationCreate);

// Customer status lookup (by Reservation ID/Number and Phone to prevent unauthorized access)
apiRouter.post('/reservations/status', async (req: Request, res: Response) => {
  try {
    const { reservationId, reservationNumber, phone } = req.body;
    const queryNum = (reservationNumber || reservationId || '').trim();
    const queryPhone = (phone || '').trim();

    if (!queryNum) {
      return res.status(400).json({ error: 'Please enter your Reservation ID.' });
    }
    if (!queryPhone) {
      return res.status(400).json({ error: 'Please enter the mobile number used when booking.' });
    }

    const reservation = await getReservationByNumberAndPhone(queryNum, queryPhone);
    if (!reservation) {
      return res.status(404).json({
        error: 'No reservation found matching this Reservation ID and mobile number combination.',
      });
    }

    // Retrieve timeline events for this reservation
    const events = await getReservationEvents(reservation.id);

    return res.json({
      success: true,
      reservation,
      events,
    });
  } catch (err: any) {
    console.error('Error checking reservation status:', err);
    return res.status(500).json({ error: err.message || 'Failed to check reservation status.' });
  }
});

// Single reservation retrieval by ID
apiRouter.get('/reservations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reservation = await getReservationById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }
    return res.json({ success: true, reservation });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch reservation.' });
  }
});

// Customer cancellation endpoint
apiRouter.patch('/reservations/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { phone, reason } = req.body;

    const reservation = await getReservationById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    // Verify ownership via mobile number match
    if (phone) {
      const cleanPhoneInput = cleanIndianMobile(phone);
      const cleanResPhone = cleanIndianMobile(reservation.customerPhone || reservation.phone || '');
      if (cleanPhoneInput !== cleanResPhone) {
        return res.status(403).json({ error: 'Verification failed. Mobile number does not match reservation.' });
      }
    }

    if (reservation.status === 'CANCELLED') {
      return res.status(400).json({ error: 'This reservation has already been cancelled.' });
    }

    const nowIso = new Date().toISOString();
    await updateReservation(reservation.id, {
      status: 'CANCELLED',
      cancelledAt: nowIso,
      updatedAt: nowIso,
    });

    await logReservationEvent({
      reservationId: reservation.id,
      eventType: 'RESERVATION_CANCELLED',
      actorType: 'CUSTOMER',
      actorId: reservation.customerPhone || reservation.phone,
      message: `Reservation cancelled by customer.${reason ? ` Reason: ${reason}` : ''}`,
    });

    const updated = await getReservationById(reservation.id);
    return res.json({
      success: true,
      message: 'Reservation has been cancelled.',
      reservation: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to cancel reservation.' });
  }
});

// ==========================================
// Admin / Manager Reservation APIs
// ==========================================

// Get all reservations (for manager dashboard)
apiRouter.get('/admin/reservations', async (_req: Request, res: Response) => {
  try {
    const snap = await getDocs(query(collection(db, 'reservations'), orderBy('createdAt', 'desc'), limit(150)));
    const reservations: Reservation[] = [];
    snap.forEach((d) => reservations.push(d.data() as Reservation));
    return res.json({ success: true, reservations });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch reservations.' });
  }
});

// Confirm reservation with table assignment & double-booking validation
apiRouter.patch('/admin/reservations/:id/confirm', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tableId, managerNote } = req.body;

    const reservation = await getReservationById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    if (!tableId) {
      return res.status(400).json({ error: 'A table must be assigned to confirm the reservation.' });
    }

    // Retrieve table details
    const tables = await getTables();
    const selectedTable = tables.find((t) => t.tableId === tableId || t.tableNumber === tableId);
    if (!selectedTable) {
      return res.status(400).json({ error: `Table '${tableId}' does not exist.` });
    }

    if (selectedTable.status === 'MAINTENANCE') {
      return res.status(400).json({
        error: `Table ${selectedTable.tableNumber} is currently under maintenance and cannot be assigned.`,
      });
    }

    // Capacity validation
    const guests = reservation.guestCount || reservation.guests || 1;
    if (selectedTable.capacity < guests) {
      return res.status(400).json({
        error: `Table ${selectedTable.tableNumber} capacity (${selectedTable.capacity} seats) is insufficient for ${guests} guests. Please assign a larger table.`,
      });
    }

    // Strict Double-Booking Protection Validation
    const allResSnap = await getDocs(query(collection(db, 'reservations')));
    const allReservations: Reservation[] = [];
    allResSnap.forEach((d) => allReservations.push(d.data() as Reservation));

    const resDate = reservation.bookingDate || reservation.date;
    const resTime = reservation.bookingTime || reservation.time;

    const conflictCheck = checkTableConflict(
      selectedTable.tableId,
      resDate,
      resTime,
      allReservations,
      RESERVATION_SLOT_DURATION_MINUTES,
      reservation.id
    );

    if (conflictCheck.hasConflict && conflictCheck.conflictingReservation) {
      const conf = conflictCheck.conflictingReservation;
      return res.status(409).json({
        error: `DOUBLE-BOOKING CONFLICT: Table ${selectedTable.tableNumber} is already confirmed for reservation ${conf.reservationNumber || conf.reservationId} (${conf.customerName || conf.name}) on ${resDate} at ${conf.bookingTime || conf.time}. Please select another table or adjust the time slot.`,
      });
    }

    const nowIso = new Date().toISOString();
    const updates: Partial<Reservation> = {
      status: 'CONFIRMED',
      assignedTableId: selectedTable.tableId,
      assignedTableNumber: selectedTable.tableNumber,
      confirmedAt: nowIso,
      updatedAt: nowIso,
      managerNote: managerNote ? managerNote.trim() : reservation.managerNote,
    };

    await updateReservation(reservation.id, updates);

    // Audit Event
    await logReservationEvent({
      reservationId: reservation.id,
      eventType: 'RESERVATION_CONFIRMED',
      actorType: 'MANAGER',
      actorId: 'manager_desk',
      message: `Reservation confirmed by manager. Assigned table ${selectedTable.tableNumber} (${selectedTable.location}, capacity: ${selectedTable.capacity}).`,
    });

    // Notification Log & WhatsApp text preparation
    const whatsappMsg = generateReservationConfirmedWhatsAppMessage({
      reservationNumber: reservation.reservationNumber || reservation.reservationId,
      customerName: reservation.customerName || reservation.name,
      bookingDate: resDate,
      bookingTime: resTime,
      guestCount: guests,
      assignedTableNumber: selectedTable.tableNumber,
    });

    const notif = await logNotification({
      reservationId: reservation.id,
      channel: 'WHATSAPP',
      recipient: reservation.customerPhone || reservation.phone,
      messageType: 'BOOKING_CONFIRMED',
      status: 'SENT',
    });

    const customerWhatsAppUrl = createCustomerWhatsAppNotificationUrl(
      reservation.customerPhone || reservation.phone,
      whatsappMsg
    );

    const updated = await getReservationById(reservation.id);
    return res.json({
      success: true,
      message: `Reservation ${reservation.reservationNumber} successfully confirmed with Table ${selectedTable.tableNumber}.`,
      reservation: updated,
      notification: notif,
      customerWhatsAppUrl,
      whatsappMessage: whatsappMsg,
    });
  } catch (err: any) {
    console.error('Error confirming reservation:', err);
    return res.status(500).json({ error: err.message || 'Failed to confirm reservation.' });
  }
});

// Reject reservation
apiRouter.patch('/admin/reservations/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason, managerNote } = req.body;

    const reservation = await getReservationById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    const reason = rejectionReason || 'All tables are fully booked for the requested dining slot';
    const nowIso = new Date().toISOString();

    await updateReservation(reservation.id, {
      status: 'REJECTED',
      rejectionReason: reason,
      managerNote: managerNote ? managerNote.trim() : reservation.managerNote,
      updatedAt: nowIso,
    });

    await logReservationEvent({
      reservationId: reservation.id,
      eventType: 'RESERVATION_REJECTED',
      actorType: 'MANAGER',
      actorId: 'manager_desk',
      message: `Reservation rejected by manager. Reason: ${reason}`,
    });

    const whatsappMsg = generateReservationRejectedWhatsAppMessage({
      reservationNumber: reservation.reservationNumber || reservation.reservationId,
      customerName: reservation.customerName || reservation.name,
      bookingDate: reservation.bookingDate || reservation.date,
      bookingTime: reservation.bookingTime || reservation.time,
      rejectionReason: reason,
    });

    await logNotification({
      reservationId: reservation.id,
      channel: 'WHATSAPP',
      recipient: reservation.customerPhone || reservation.phone,
      messageType: 'BOOKING_REJECTED',
      status: 'SENT',
    });

    const customerWhatsAppUrl = createCustomerWhatsAppNotificationUrl(
      reservation.customerPhone || reservation.phone,
      whatsappMsg
    );

    const updated = await getReservationById(reservation.id);
    return res.json({
      success: true,
      message: 'Reservation rejected.',
      reservation: updated,
      customerWhatsAppUrl,
      whatsappMessage: whatsappMsg,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to reject reservation.' });
  }
});

// Manager cancel reservation
apiRouter.patch('/admin/reservations/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cancellationReason, managerNote } = req.body;

    const reservation = await getReservationById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    const nowIso = new Date().toISOString();
    await updateReservation(reservation.id, {
      status: 'CANCELLED',
      cancelledAt: nowIso,
      managerNote: managerNote ? managerNote.trim() : reservation.managerNote,
      updatedAt: nowIso,
    });

    await logReservationEvent({
      reservationId: reservation.id,
      eventType: 'RESERVATION_CANCELLED',
      actorType: 'MANAGER',
      actorId: 'manager_desk',
      message: `Reservation cancelled by manager.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`,
    });

    const whatsappMsg = generateReservationCancelledWhatsAppMessage({
      reservationNumber: reservation.reservationNumber || reservation.reservationId,
      customerName: reservation.customerName || reservation.name,
      bookingDate: reservation.bookingDate || reservation.date,
      bookingTime: reservation.bookingTime || reservation.time,
    });

    const customerWhatsAppUrl = createCustomerWhatsAppNotificationUrl(
      reservation.customerPhone || reservation.phone,
      whatsappMsg
    );

    const updated = await getReservationById(reservation.id);
    return res.json({
      success: true,
      message: 'Reservation cancelled by manager.',
      reservation: updated,
      customerWhatsAppUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to cancel reservation.' });
  }
});

// Change assigned table
apiRouter.patch('/admin/reservations/:id/table', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tableId } = req.body;

    const reservation = await getReservationById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    const tables = await getTables();
    const selectedTable = tables.find((t) => t.tableId === tableId || t.tableNumber === tableId);
    if (!selectedTable) {
      return res.status(400).json({ error: `Table '${tableId}' does not exist.` });
    }

    if (selectedTable.status === 'MAINTENANCE') {
      return res.status(400).json({ error: `Table ${selectedTable.tableNumber} is under maintenance.` });
    }

    // Capacity validation
    const guests = reservation.guestCount || reservation.guests || 1;
    if (selectedTable.capacity < guests) {
      return res.status(400).json({
        error: `Table ${selectedTable.tableNumber} capacity (${selectedTable.capacity}) is less than guest count (${guests}).`,
      });
    }

    // Double-booking check if reservation is CONFIRMED
    if (reservation.status === 'CONFIRMED') {
      const allResSnap = await getDocs(query(collection(db, 'reservations')));
      const allReservations: Reservation[] = [];
      allResSnap.forEach((d) => allReservations.push(d.data() as Reservation));

      const resDate = reservation.bookingDate || reservation.date;
      const resTime = reservation.bookingTime || reservation.time;

      const conflict = checkTableConflict(
        selectedTable.tableId,
        resDate,
        resTime,
        allReservations,
        RESERVATION_SLOT_DURATION_MINUTES,
        reservation.id
      );

      if (conflict.hasConflict && conflict.conflictingReservation) {
        const conf = conflict.conflictingReservation;
        return res.status(409).json({
          error: `DOUBLE-BOOKING CONFLICT: Table ${selectedTable.tableNumber} is already confirmed for reservation ${conf.reservationNumber || conf.reservationId} on ${resDate} at ${conf.bookingTime || conf.time}.`,
        });
      }
    }

    const prevTable = reservation.assignedTableNumber || 'None';
    const nowIso = new Date().toISOString();

    await updateReservation(reservation.id, {
      assignedTableId: selectedTable.tableId,
      assignedTableNumber: selectedTable.tableNumber,
      updatedAt: nowIso,
    });

    await logReservationEvent({
      reservationId: reservation.id,
      eventType: 'TABLE_CHANGED',
      actorType: 'MANAGER',
      actorId: 'manager_desk',
      message: `Assigned table changed from ${prevTable} to ${selectedTable.tableNumber}.`,
    });

    const whatsappMsg = generateTableChangedWhatsAppMessage({
      reservationNumber: reservation.reservationNumber || reservation.reservationId,
      customerName: reservation.customerName || reservation.name,
      bookingDate: reservation.bookingDate || reservation.date,
      bookingTime: reservation.bookingTime || reservation.time,
      previousTable: prevTable,
      newTable: selectedTable.tableNumber,
    });

    const customerWhatsAppUrl = createCustomerWhatsAppNotificationUrl(
      reservation.customerPhone || reservation.phone,
      whatsappMsg
    );

    const updated = await getReservationById(reservation.id);
    return res.json({
      success: true,
      message: `Table changed to ${selectedTable.tableNumber}.`,
      reservation: updated,
      customerWhatsAppUrl,
      whatsappMessage: whatsappMsg,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update table assignment.' });
  }
});

// ==========================================
// Tables Management Endpoints
// ==========================================

apiRouter.get('/admin/tables', async (_req: Request, res: Response) => {
  try {
    const tables = await getTables();
    return res.json({ success: true, tables });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch tables.' });
  }
});

apiRouter.post('/admin/tables', async (req: Request, res: Response) => {
  try {
    const { tableNumber, capacity, location, status } = req.body;
    if (!tableNumber || !capacity) {
      return res.status(400).json({ error: 'Table number and capacity are required.' });
    }
    const tableId = `tbl_${tableNumber.toLowerCase().replace(/\s+/g, '_')}`;
    const newTable: RestaurantTable = {
      tableId,
      tableNumber: tableNumber.trim().toUpperCase(),
      capacity: Number(capacity),
      location: location || 'Indoor AC Main Hall',
      status: status || 'AVAILABLE',
      createdAt: new Date().toISOString(),
    };
    await saveTable(newTable);
    return res.status(201).json({ success: true, table: newTable });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create table.' });
  }
});

apiRouter.patch('/admin/tables/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await updateTable(id, updates);
    return res.json({ success: true, message: 'Table updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update table.' });
  }
});

apiRouter.delete('/admin/tables/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteTable(id);
    return res.json({ success: true, message: 'Table deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete table.' });
  }
});

// Check available tables for a slot
apiRouter.get('/admin/tables/available', async (req: Request, res: Response) => {
  try {
    const { date, time, guests, excludeReservationId } = req.query;
    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time query parameters are required.' });
    }

    const tables = await getTables();
    const allResSnap = await getDocs(query(collection(db, 'reservations')));
    const allReservations: Reservation[] = [];
    allResSnap.forEach((d) => allReservations.push(d.data() as Reservation));

    const minGuests = guests ? Number(guests) : 1;

    const availableTables = tables.filter((table) => {
      if (table.status !== 'AVAILABLE') return false;
      if (table.capacity < minGuests) return false;

      const conflict = checkTableConflict(
        table.tableId,
        String(date),
        String(time),
        allReservations,
        RESERVATION_SLOT_DURATION_MINUTES,
        excludeReservationId ? String(excludeReservationId) : undefined
      );
      return !conflict.hasConflict;
    });

    return res.json({
      success: true,
      date,
      time,
      requestedGuests: minGuests,
      availableTables,
      totalAvailable: availableTables.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to check table availability.' });
  }
});

// Activity timeline events for a reservation
apiRouter.get('/admin/reservation-events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const events = await getReservationEvents(id);
    return res.json({ success: true, events });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch reservation events.' });
  }
});

// Seed data reference endpoint
apiRouter.get('/seed-data', (_req: Request, res: Response) => {
  res.json({
    categories: INITIAL_CATEGORIES,
    menuItems: INITIAL_MENU_ITEMS,
    reviews: INITIAL_REVIEWS,
    tables: DEFAULT_TABLES,
  });
});
