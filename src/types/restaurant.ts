export type CuisineType = 'Chinese' | 'Korean' | 'Malaysian' | 'Thai' | 'Fusion';

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  description?: string;
  icon?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  categoryName: string;
  subcategory?: string;
  isVeg: boolean;
  priceType: 'single' | 'portion';
  price: number;
  halfPrice?: number;
  fullPrice?: number;
  vegPrice?: number;
  nonVegPrice?: number;
  hasDietaryOption?: boolean;
  description: string;
  image: string;
  isAvailable: boolean;
  isFeatured: boolean;
  cuisine: CuisineType;
  spiceLevel: 0 | 1 | 2 | 3;
  sortOrder: number;
}

export interface CartItem {
  id: string; // unique key in cart: `${itemId}-${portion}-${dietaryChoice || ''}`
  itemId: string;
  name: string;
  portion: 'single' | 'half' | 'full';
  dietaryChoice?: 'veg' | 'non-veg';
  price: number;
  quantity: number;
  isVeg: boolean;
  image: string;
  categoryName: string;
}

export type OrderType = 'delivery' | 'pickup' | 'dine_in' | 'takeaway';

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItem {
  itemId: string;
  name: string;
  portion: 'single' | 'half' | 'full';
  dietaryChoice?: 'veg' | 'non-veg';
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  deliveryAddress?: string;
  tableNumber?: string;
  specialInstructions?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number; // 5% GST
  packagingCharge: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: 'PAY_AT_RESTAURANT' | 'CASH_ON_DELIVERY' | 'PAID';
  createdAt: string;
  updatedAt: string;
  whatsappMessage?: string;
}

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SEATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'NO_SHOW';

export type ReservationOccasion = 'Birthday' | 'Anniversary' | 'Family' | 'Business' | 'Other';

export interface Reservation {
  id: string;
  reservationNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  email?: string;
  bookingDate: string;
  bookingTime: string;
  guestCount: number;
  occasion?: ReservationOccasion | string;
  specialRequest?: string;

  status: ReservationStatus;

  assignedTableId?: string;
  assignedTableNumber?: string;
  assignedTableLocation?: string;

  managerNote?: string;
  rejectionReason?: string;

  createdAt: string;
  updatedAt?: string;
  confirmedAt?: string;
  seatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;

  notificationStatus?: 'PENDING' | 'SENT' | 'FAILED';
  lastNotificationAt?: string;

  // Compatibility aliases with existing UI code
  reservationId: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
}

export type TableStatus = 'AVAILABLE' | 'MAINTENANCE' | 'RESERVED';

export interface RestaurantTable {
  tableId: string;
  tableNumber: string; // e.g. T01, T02
  capacity: number; // e.g. 2, 4, 6, 8, 10
  location: string; // e.g. 'Indoor AC Main Hall', 'Window Bay', 'Family Booth', 'Patio'
  status: TableStatus;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ReservationEventType =
  | 'BOOKING_RECEIVED'
  | 'MANAGER_VIEWED'
  | 'TABLE_ASSIGNED'
  | 'RESERVATION_CONFIRMED'
  | 'RESERVATION_REJECTED'
  | 'RESERVATION_CANCELLED'
  | 'TABLE_CHANGED'
  | 'NOTIFICATION_DISPATCHED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'SEATED'
  | 'COMPLETED'
  | 'STATUS_CHANGE';

export interface ReservationEvent {
  eventId: string;
  reservationId: string;
  eventType: ReservationEventType;
  actorType?: 'CUSTOMER' | 'MANAGER' | 'SYSTEM';
  actorId?: string;
  actor?: string;
  message?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type NotificationChannel = 'WHATSAPP' | 'SMS' | 'EMAIL';
export type NotificationMessageType =
  | 'BOOKING_RECEIVED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'TABLE_CHANGED'
  | 'CONFIRMATION'
  | 'REJECTION';

export interface NotificationLog {
  notificationId: string;
  reservationId: string;
  channel: NotificationChannel;
  recipient?: string;
  customerPhone?: string;
  messageType?: NotificationMessageType;
  templateType?: string;
  messagePayload?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: string;
  sentAt?: string;
  errorMessage?: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  dishRecommended?: string;
  approved: boolean;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  referenceId: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  createdAt: string;
}

