import { INITIAL_MENU_ITEMS, INITIAL_CATEGORIES } from '../lib/seedData';
import { MenuItem, Order, OrderItem, OrderType, Reservation } from '../types/restaurant';
import {
  RESTAURANT_CONFIG,
  RESTAURANT_WHATSAPP_NUMBER,
  createWhatsAppUrl,
  generateWhatsAppOrderMessage,
} from '../config/restaurantConfig';

// In-memory or database cache of menu items
let cachedMenuItems: MenuItem[] = [...INITIAL_MENU_ITEMS];

export function setCachedMenuItems(items: MenuItem[]) {
  if (items && items.length > 0) {
    cachedMenuItems = items;
  }
}

export function getCachedMenuItems(): MenuItem[] {
  return cachedMenuItems;
}

export interface CalculateOrderRequest {
  items: Array<{
    itemId: string;
    portion: 'single' | 'half' | 'full';
    dietaryChoice?: 'veg' | 'non-veg';
    quantity: number;
  }>;
  orderType: OrderType;
  includePackaging?: boolean;
}

export interface CalculateOrderResult {
  valid: boolean;
  error?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  packagingCharge: number;
  deliveryFee: number;
  total: number;
}

export function calculateOrderServer(req: CalculateOrderRequest): CalculateOrderResult {
  if (!req.items || !Array.isArray(req.items) || req.items.length === 0) {
    return {
      valid: false,
      error: 'Order must contain at least one item.',
      items: [],
      subtotal: 0,
      tax: 0,
      packagingCharge: 0,
      deliveryFee: 0,
      total: 0,
    };
  }

  const verifiedItems: OrderItem[] = [];
  let subtotal = 0;

  for (const itemReq of req.items) {
    if (!itemReq.quantity || itemReq.quantity <= 0) {
      continue;
    }

    const menuItem = cachedMenuItems.find((m) => m.id === itemReq.itemId);
    if (!menuItem) {
      return {
        valid: false,
        error: `Dish ID "${itemReq.itemId}" not found in current restaurant menu.`,
        items: [],
        subtotal: 0,
        tax: 0,
        packagingCharge: 0,
        deliveryFee: 0,
        total: 0,
      };
    }

    if (!menuItem.isAvailable) {
      return {
        valid: false,
        error: `"${menuItem.name}" is currently sold out. Please remove it to proceed.`,
        items: [],
        subtotal: 0,
        tax: 0,
        packagingCharge: 0,
        deliveryFee: 0,
        total: 0,
      };
    }

    let unitPrice = menuItem.price;
    // Check dietary choice pricing if item has specific veg/non-veg pricing
    if (itemReq.dietaryChoice === 'veg' && typeof menuItem.vegPrice === 'number') {
      unitPrice = menuItem.vegPrice;
    } else if (itemReq.dietaryChoice === 'non-veg' && typeof menuItem.nonVegPrice === 'number') {
      unitPrice = menuItem.nonVegPrice;
    } else if (itemReq.portion === 'half' && typeof menuItem.halfPrice === 'number') {
      unitPrice = menuItem.halfPrice;
    } else if (itemReq.portion === 'full' && typeof menuItem.fullPrice === 'number') {
      unitPrice = menuItem.fullPrice;
    }

    const itemTotal = unitPrice * itemReq.quantity;
    subtotal += itemTotal;

    verifiedItems.push({
      itemId: menuItem.id,
      name: menuItem.name,
      portion: itemReq.portion,
      dietaryChoice: itemReq.dietaryChoice,
      unitPrice,
      quantity: itemReq.quantity,
      totalPrice: itemTotal,
    });
  }

  if (verifiedItems.length === 0) {
    return {
      valid: false,
      error: 'No valid items found in order.',
      items: [],
      subtotal: 0,
      tax: 0,
      packagingCharge: 0,
      deliveryFee: 0,
      total: 0,
    };
  }

  // 5% Restaurant GST
  const tax = Math.round(subtotal * RESTAURANT_CONFIG.pricing.taxRate * 100) / 100;

  // Packaging charge: applicable for takeaway/pickup/delivery unless explicitly opted out
  const isTakeoutOrDelivery = ['takeaway', 'pickup', 'delivery'].includes(req.orderType);
  const packagingCharge =
    isTakeoutOrDelivery && req.includePackaging !== false
      ? RESTAURANT_CONFIG.pricing.defaultPackagingFee
      : 0;

  // Delivery fee: applicable only for delivery; free if subtotal exceeds threshold
  let deliveryFee = 0;
  if (req.orderType === 'delivery') {
    deliveryFee =
      subtotal >= RESTAURANT_CONFIG.pricing.freeDeliveryThreshold
        ? 0
        : RESTAURANT_CONFIG.pricing.defaultDeliveryFee;
  }

  const total = Math.round((subtotal + tax + packagingCharge + deliveryFee) * 100) / 100;

  return {
    valid: true,
    items: verifiedItems,
    subtotal,
    tax,
    packagingCharge,
    deliveryFee,
    total,
  };
}

export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `HW-${dateStr}-${randomSuffix}`;
}

export function generateReservationId(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `HW-RES-${randomNum}`;
}

export function generateWhatsAppMessage(order: Order): string {
  return generateWhatsAppOrderMessage({
    orderNumber: order.orderNumber,
    items: order.items.map((i) => ({
      name: i.name,
      portion: i.portion,
      dietaryChoice: i.dietaryChoice,
      quantity: i.quantity,
      totalPrice: i.totalPrice,
    })),
    subtotal: order.subtotal,
    total: order.total,
    orderType: order.orderType,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    tableNumber: order.tableNumber,
    specialInstructions: order.specialInstructions,
  });
}

export function getWhatsAppUrl(order: Order): string {
  const message = generateWhatsAppMessage(order);
  return createWhatsAppUrl(message);
}

