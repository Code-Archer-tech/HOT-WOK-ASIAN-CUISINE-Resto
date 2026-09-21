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

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED';

export interface Reservation {
  id: string;
  reservationId: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  specialRequest?: string;
  status: ReservationStatus;
  createdAt: string;
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

