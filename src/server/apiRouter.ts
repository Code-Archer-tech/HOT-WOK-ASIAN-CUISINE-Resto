import express, { Request, Response, Router } from 'express';
import {
  calculateOrderServer,
  generateOrderNumber,
  generateReservationId,
  generateWhatsAppMessage,
  getWhatsAppUrl,
  getCachedMenuItems,
  setCachedMenuItems
} from './apiHandler';
import { Order, Reservation } from '../types/restaurant';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS, INITIAL_REVIEWS } from '../lib/seedData';

export const apiRouter: Router = express.Router();

apiRouter.use(express.json());

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    restaurant: 'Hot Wok Asian Cuisine',
    phone: '99879 74833',
    cuisines: ['Chinese', 'Korean', 'Malaysian', 'Thai']
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
    const { items, orderType } = req.body;
    const result = calculateOrderServer({ items, orderType: orderType || 'dine_in' });
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
    const { customerName, customerPhone, orderType, tableNumber, specialInstructions, items } = req.body;

    // Validation
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter a valid customer name (at least 2 characters).' });
    }

    const cleanPhone = (customerPhone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    if (!['dine_in', 'takeaway'].includes(orderType)) {
      return res.status(400).json({ error: 'Order type must be either Dine-in or Takeaway.' });
    }

    if (orderType === 'dine_in' && tableNumber && typeof tableNumber !== 'string') {
      return res.status(400).json({ error: 'Invalid table number format.' });
    }

    // Authoritative server-side price calculation
    const calcResult = calculateOrderServer({ items, orderType });
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
      tableNumber: tableNumber ? tableNumber.trim() : undefined,
      specialInstructions: specialInstructions ? specialInstructions.trim() : undefined,
      items: calcResult.items,
      subtotal: calcResult.subtotal,
      tax: calcResult.tax,
      packagingCharge: calcResult.packagingCharge,
      total: calcResult.total,
      status: 'NEW',
      paymentStatus: 'PAY_AT_RESTAURANT',
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

// Table reservation endpoint
apiRouter.post('/reservations/create', (req: Request, res: Response) => {
  try {
    const { name, phone, date, time, guests, specialRequest } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide a valid guest name.' });
    }

    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit contact number.' });
    }

    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ error: 'Please select a valid reservation date.' });
    }

    if (!time || typeof time !== 'string') {
      return res.status(400).json({ error: 'Please select a reservation time slot.' });
    }

    const numGuests = Number(guests);
    if (isNaN(numGuests) || numGuests < 1 || numGuests > 25) {
      return res.status(400).json({ error: 'Number of guests must be between 1 and 25.' });
    }

    const reservationId = generateReservationId();
    const reservation: Reservation = {
      id: reservationId.toLowerCase(),
      reservationId,
      name: name.trim(),
      phone: cleanPhone,
      date,
      time,
      guests: numGuests,
      specialRequest: specialRequest ? specialRequest.trim() : undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      reservation
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to submit reservation.' });
  }
});

// Seed data reference endpoint
apiRouter.get('/seed-data', (_req: Request, res: Response) => {
  res.json({
    categories: INITIAL_CATEGORIES,
    menuItems: INITIAL_MENU_ITEMS,
    reviews: INITIAL_REVIEWS
  });
});
