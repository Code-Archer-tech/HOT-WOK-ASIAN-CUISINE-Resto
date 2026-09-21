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
  description: string;
  categoryId: string;
  categoryName: string;
  isVeg: boolean;
  priceType: 'single' | 'portion';
  price: number;
  halfPrice?: number;
  fullPrice?: number;
  image: string;
  isAvailable: boolean;
  isFeatured: boolean;
  cuisine: CuisineType;
  spiceLevel: 0 | 1 | 2 | 3;
  sortOrder: number;
}

export interface CartItem {
  id: string; // unique key in cart: `${itemId}-${portion}`
  itemId: string;
  name: string;
  portion: 'single' | 'half' | 'full';
  price: number;
  quantity: number;
  isVeg: boolean;
  image: string;
  categoryName: string;
}

export type OrderType = 'dine_in' | 'takeaway';

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
  tableNumber?: string;
  specialInstructions?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number; // 5% GST
  packagingCharge: number;
  total: number;
  status: OrderStatus;
  paymentStatus: 'PAY_AT_RESTAURANT' | 'PAID';
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
