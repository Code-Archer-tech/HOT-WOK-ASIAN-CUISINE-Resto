import { INITIAL_MENU_ITEMS, INITIAL_CATEGORIES } from '../lib/seedData';
import { MenuItem, Order, OrderItem, OrderType, Reservation } from '../types/restaurant';

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
    quantity: number;
  }>;
  orderType: OrderType;
}

export interface CalculateOrderResult {
  valid: boolean;
  error?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  packagingCharge: number;
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
        total: 0,
      };
    }

    let unitPrice = menuItem.price;
    if (itemReq.portion === 'half' && typeof menuItem.halfPrice === 'number') {
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
      total: 0,
    };
  }

  // 5% Restaurant GST
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  // ₹25 packaging for takeaway, ₹0 for dine-in
  const packagingCharge = req.orderType === 'takeaway' ? 25 : 0;
  const total = Math.round((subtotal + tax + packagingCharge) * 100) / 100;

  return {
    valid: true,
    items: verifiedItems,
    subtotal,
    tax,
    packagingCharge,
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
  return `HWR-${randomNum}`;
}

export function generateWhatsAppMessage(order: Order): string {
  const lines: string[] = [
    `*HOT WOK ASIAN CUISINE*`,
    `📍 Urban Empire, Kausar Baug, Mumbra`,
    `--------------------------------`,
    `*Order Number:* ${order.orderNumber}`,
    `*Customer:* ${order.customerName}`,
    `*Mobile:* ${order.customerPhone}`,
    `*Order Type:* ${order.orderType === 'dine_in' ? 'Dine-in' : 'Takeaway'}${
      order.tableNumber ? ` (Table #${order.tableNumber})` : ''
    }`,
    `--------------------------------`,
    `*Items Ordered:*`,
  ];

  order.items.forEach((item, index) => {
    const portionLabel = item.portion === 'single' ? '' : ` (${item.portion.toUpperCase()})`;
    lines.push(`${index + 1}. ${item.name}${portionLabel} x ${item.quantity} = ₹${item.totalPrice}`);
  });

  lines.push(`--------------------------------`);
  lines.push(`Subtotal: ₹${order.subtotal}`);
  lines.push(`GST (5%): ₹${order.tax}`);
  if (order.packagingCharge > 0) {
    lines.push(`Packaging Charge: ₹${order.packagingCharge}`);
  }
  lines.push(`*Total Amount: ₹${order.total}*`);
  lines.push(`*Payment Status:* Pay at Restaurant`);

  if (order.specialInstructions && order.specialInstructions.trim()) {
    lines.push(`--------------------------------`);
    lines.push(`*Special Instructions:* ${order.specialInstructions.trim()}`);
  }

  lines.push(`--------------------------------`);
  lines.push(`Thank you for choosing Hot Wok Asian Cuisine!`);

  return lines.join('\n');
}

export function getWhatsAppUrl(order: Order): string {
  const message = generateWhatsAppMessage(order);
  return `https://wa.me/919987974833?text=${encodeURIComponent(message)}`;
}
