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
import { RESTAURANT_CONFIG } from '../config/restaurantConfig';

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

// Table reservation endpoint (Enquiry / Booking Request)
apiRouter.post('/reservations/create', (req: Request, res: Response) => {
  try {
    const { name, phone, date, time, guests, specialRequest } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide a valid guest name (at least 2 characters).' });
    }

    // Validate Indian mobile number (10 digits starting with 6, 7, 8, 9)
    const rawDigits = (phone || '').replace(/\D/g, '');
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

    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ error: 'Please select a valid reservation date.' });
    }

    // Check date is not in the past (in local/UTC day comparison)
    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return res.status(400).json({ error: 'Reservation date cannot be in the past.' });
    }

    if (!time || typeof time !== 'string' || !time.trim()) {
      return res.status(400).json({ error: 'Please select a reservation time slot.' });
    }

    const numGuests = Number(guests);
    if (isNaN(numGuests) || !Number.isInteger(numGuests) || numGuests < 1) {
      return res.status(400).json({ error: 'Number of guests must be a positive number (at least 1 guest).' });
    }
    if (numGuests > 25) {
      return res.status(400).json({
        error: 'For group bookings exceeding 25 guests, please contact our restaurant manager directly by phone.',
      });
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
      createdAt: new Date().toISOString(),
    };

    return res.status(201).json({
      success: true,
      reservation,
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
