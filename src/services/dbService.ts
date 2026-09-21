import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Category,
  MenuItem,
  Order,
  OrderStatus,
  Reservation,
  ReservationStatus,
  Review,
  ContactMessage,
  RestaurantTable,
  ReservationEvent,
  NotificationLog,
} from '../types/restaurant';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS, INITIAL_REVIEWS } from '../lib/seedData';
import { DEFAULT_TABLES, RESERVATION_SLOT_DURATION_MINUTES, cleanIndianMobile } from '../config/restaurantConfig';
import { setCachedMenuItems } from '../server/apiHandler';

const CATEGORIES_COL = 'categories';
const MENU_ITEMS_COL = 'menu_items';
const ORDERS_COL = 'orders';
const RESERVATIONS_COL = 'reservations';
const TABLES_COL = 'restaurant_tables';
const RESERVATION_EVENTS_COL = 'reservation_events';
const NOTIFICATION_LOGS_COL = 'notification_logs';
const REVIEWS_COL = 'reviews';
const CONTACT_MESSAGES_COL = 'contact_messages';

// Auto-seed Firestore database if empty or missing items
export async function ensureDatabaseSeeded(): Promise<{ categories: Category[]; menuItems: MenuItem[] }> {
  try {
    const menuRef = collection(db, MENU_ITEMS_COL);
    const snap = await getDocs(menuRef);

    // If database is empty or has only earlier placeholder items, update with the authoritative full menu
    if (snap.empty || snap.size < 35) {
      console.log('Syncing authoritative Hot Wok Asian Cuisine menu items to Firestore...');
      // Seed categories
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, CATEGORIES_COL, cat.id), cat);
      }
      // Seed menu items
      for (const item of INITIAL_MENU_ITEMS) {
        await setDoc(doc(db, MENU_ITEMS_COL, item.id), item);
      }
      // Seed reviews
      for (const rev of INITIAL_REVIEWS) {
        await setDoc(doc(db, REVIEWS_COL, rev.id), rev);
      }
      setCachedMenuItems(INITIAL_MENU_ITEMS);
      return { categories: INITIAL_CATEGORIES, menuItems: INITIAL_MENU_ITEMS };
    } else {
      const items: MenuItem[] = [];
      snap.forEach((docSnap) => items.push(docSnap.data() as MenuItem));
      setCachedMenuItems(items);

      const catSnap = await getDocs(collection(db, CATEGORIES_COL));
      const categories: Category[] = [];
      catSnap.forEach((docSnap) => categories.push(docSnap.data() as Category));

      return {
        categories: categories.length > 0 ? categories.sort((a, b) => a.sortOrder - b.sortOrder) : INITIAL_CATEGORIES,
        menuItems: items.sort((a, b) => a.sortOrder - b.sortOrder),
      };
    }
  } catch (err) {
    console.warn('Firestore initial read/seed warning (falling back to initial data):', err);
    setCachedMenuItems(INITIAL_MENU_ITEMS);
    return { categories: INITIAL_CATEGORIES, menuItems: INITIAL_MENU_ITEMS };
  }
}

export async function reseedCompleteMenu(): Promise<void> {
  try {
    for (const cat of INITIAL_CATEGORIES) {
      await setDoc(doc(db, CATEGORIES_COL, cat.id), cat);
    }
    for (const item of INITIAL_MENU_ITEMS) {
      await setDoc(doc(db, MENU_ITEMS_COL, item.id), item);
    }
    setCachedMenuItems(INITIAL_MENU_ITEMS);
  } catch (err) {
    console.error('Error reseeding complete menu:', err);
  }
}

// Menu Items
export function subscribeMenuItems(callback: (items: MenuItem[]) => void) {
  try {
    const q = query(collection(db, MENU_ITEMS_COL), orderBy('sortOrder', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: MenuItem[] = [];
          snapshot.forEach((doc) => items.push(doc.data() as MenuItem));
          setCachedMenuItems(items);
          callback(items);
        } else {
          // If empty in Firestore, seed or return initial
          callback(INITIAL_MENU_ITEMS);
        }
      },
      (err) => {
        console.warn('MenuItems snapshot listener warning:', err);
        callback(INITIAL_MENU_ITEMS);
      }
    );
  } catch (e) {
    console.error(e);
    callback(INITIAL_MENU_ITEMS);
    return () => {};
  }
}

export async function saveMenuItem(item: MenuItem): Promise<void> {
  await setDoc(doc(db, MENU_ITEMS_COL, item.id), item);
}

export async function deleteMenuItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, MENU_ITEMS_COL, itemId));
}

export async function toggleItemAvailability(itemId: string, isAvailable: boolean): Promise<void> {
  await updateDoc(doc(db, MENU_ITEMS_COL, itemId), { isAvailable });
}

export async function toggleItemFeatured(itemId: string, isFeatured: boolean): Promise<void> {
  await updateDoc(doc(db, MENU_ITEMS_COL, itemId), { isFeatured });
}

// Categories
export function subscribeCategories(callback: (cats: Category[]) => void) {
  try {
    const q = query(collection(db, CATEGORIES_COL), orderBy('sortOrder', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const cats: Category[] = [];
          snapshot.forEach((doc) => cats.push(doc.data() as Category));
          callback(cats);
        } else {
          callback(INITIAL_CATEGORIES);
        }
      },
      (err) => {
        console.warn('Categories snapshot listener warning:', err);
        callback(INITIAL_CATEGORIES);
      }
    );
  } catch (e) {
    console.error(e);
    callback(INITIAL_CATEGORIES);
    return () => {};
  }
}

export async function saveCategory(category: Category): Promise<void> {
  await setDoc(doc(db, CATEGORIES_COL, category.id), category);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(db, CATEGORIES_COL, categoryId));
}

// Orders
export async function saveOrderToFirestore(order: Order): Promise<void> {
  await setDoc(doc(db, ORDERS_COL, order.id), order);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const docSnap = await getDoc(doc(db, ORDERS_COL, orderId));
    if (docSnap.exists()) {
      return docSnap.data() as Order;
    }
    return null;
  } catch (err) {
    console.error('Error fetching order:', err);
    return null;
  }
}

export function subscribeOrders(callback: (orders: Order[]) => void) {
  try {
    const q = query(collection(db, ORDERS_COL), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((d) => orders.push(d.data() as Order));
        callback(orders);
      },
      (err) => {
        console.warn('Orders snapshot listener warning:', err);
        callback([]);
      }
    );
  } catch (e) {
    console.error(e);
    callback([]);
    return () => {};
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(db, ORDERS_COL, orderId), {
    status,
    updatedAt: new Date().toISOString(),
  });
}

// ==========================================
// Tables Management
// ==========================================

export async function ensureTablesSeeded(): Promise<RestaurantTable[]> {
  try {
    const tableRef = collection(db, TABLES_COL);
    const snap = await getDocs(tableRef);
    if (snap.empty) {
      console.log('Seeding initial Hot Wok dining tables (T01 - T10)...');
      for (const t of DEFAULT_TABLES) {
        await setDoc(doc(db, TABLES_COL, t.tableId), t);
      }
      return DEFAULT_TABLES;
    } else {
      const tables: RestaurantTable[] = [];
      snap.forEach((d) => tables.push(d.data() as RestaurantTable));
      return tables.sort((a, b) => a.tableNumber.localeCompare(b.tableNumber));
    }
  } catch (err) {
    console.error('Error ensuring tables seeded:', err);
    return DEFAULT_TABLES;
  }
}

export function subscribeTables(callback: (tables: RestaurantTable[]) => void) {
  try {
    const q = query(collection(db, TABLES_COL));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Trigger seeding if collection has no docs
          ensureTablesSeeded().then(callback);
          return;
        }
        const tables: RestaurantTable[] = [];
        snapshot.forEach((d) => tables.push(d.data() as RestaurantTable));
        tables.sort((a, b) => a.tableNumber.localeCompare(b.tableNumber));
        callback(tables);
      },
      (err) => {
        console.warn('Tables snapshot listener warning:', err);
        callback(DEFAULT_TABLES);
      }
    );
  } catch (e) {
    console.error(e);
    callback(DEFAULT_TABLES);
    return () => {};
  }
}

export async function getTables(): Promise<RestaurantTable[]> {
  try {
    const snap = await getDocs(collection(db, TABLES_COL));
    if (snap.empty) {
      return await ensureTablesSeeded();
    }
    const tables: RestaurantTable[] = [];
    snap.forEach((d) => tables.push(d.data() as RestaurantTable));
    return tables.sort((a, b) => a.tableNumber.localeCompare(b.tableNumber));
  } catch (err) {
    console.error('Error fetching tables:', err);
    return DEFAULT_TABLES;
  }
}

export async function saveTable(table: RestaurantTable): Promise<void> {
  await setDoc(doc(db, TABLES_COL, table.tableId), {
    ...table,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateTable(tableId: string, updates: Partial<RestaurantTable>): Promise<void> {
  await updateDoc(doc(db, TABLES_COL, tableId), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTable(tableId: string): Promise<void> {
  await deleteDoc(doc(db, TABLES_COL, tableId));
}

// ==========================================
// Time & Double-Booking Protection Utilities
// ==========================================

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  // Handle formats like "19:30", "7:30 PM", "07:30"
  const clean = timeStr.trim();
  const isPM = /pm/i.test(clean);
  const isAM = /am/i.test(clean);
  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function isTimeSlotOverlapping(
  timeA: string,
  durA: number,
  timeB: string,
  durB: number
): boolean {
  const startA = parseTimeToMinutes(timeA);
  const endA = startA + durA;
  const startB = parseTimeToMinutes(timeB);
  const endB = startB + durB;
  return Math.max(startA, startB) < Math.min(endA, endB);
}

export function checkTableConflict(
  tableId: string,
  bookingDate: string,
  bookingTime: string,
  allReservations: Reservation[],
  durationMinutes: number = RESERVATION_SLOT_DURATION_MINUTES,
  excludeReservationId?: string
): { hasConflict: boolean; conflictingReservation?: Reservation } {
  const activeConfirmed = allReservations.filter((r) => {
    if (r.id === excludeReservationId) return false;
    if (r.status !== 'CONFIRMED') return false;
    const resDate = r.bookingDate || r.date;
    if (resDate !== bookingDate) return false;
    return r.assignedTableId === tableId;
  });

  for (const res of activeConfirmed) {
    const resTime = res.bookingTime || res.time;
    if (isTimeSlotOverlapping(bookingTime, durationMinutes, resTime, durationMinutes)) {
      return { hasConflict: true, conflictingReservation: res };
    }
  }

  return { hasConflict: false };
}

// ==========================================
// Reservations
// ==========================================

export async function saveReservationToFirestore(res: Reservation): Promise<void> {
  await setDoc(doc(db, RESERVATIONS_COL, res.id), res);
}

export async function getReservationById(resId: string): Promise<Reservation | null> {
  try {
    const snap = await getDoc(doc(db, RESERVATIONS_COL, resId));
    if (snap.exists()) {
      return snap.data() as Reservation;
    }
    // Try querying by reservationNumber or reservationId
    const q1 = query(collection(db, RESERVATIONS_COL), where('reservationNumber', '==', resId.toUpperCase()), limit(1));
    const s1 = await getDocs(q1);
    if (!s1.empty) {
      return s1.docs[0].data() as Reservation;
    }
    const q2 = query(collection(db, RESERVATIONS_COL), where('reservationId', '==', resId.toUpperCase()), limit(1));
    const s2 = await getDocs(q2);
    if (!s2.empty) {
      return s2.docs[0].data() as Reservation;
    }
    return null;
  } catch (err) {
    console.error('Error fetching reservation by ID:', err);
    return null;
  }
}

export async function getReservationByNumberAndPhone(
  numberOrId: string,
  phoneInput: string
): Promise<Reservation | null> {
  try {
    const cleanNum = numberOrId.trim().toUpperCase();
    const cleanPhone = cleanIndianMobile(phoneInput);

    // Try direct document ID lookup first
    const directDoc = await getDoc(doc(db, RESERVATIONS_COL, cleanNum.toLowerCase()));
    if (directDoc.exists()) {
      const data = directDoc.data() as Reservation;
      const resPhone = cleanIndianMobile(data.customerPhone || data.phone || '');
      if (resPhone === cleanPhone) {
        return data;
      }
    }

    // Query reservations by reservationNumber
    const q = query(
      collection(db, RESERVATIONS_COL),
      where('reservationNumber', '==', cleanNum),
      limit(5)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data() as Reservation;
      const resPhone = cleanIndianMobile(data.customerPhone || data.phone || '');
      if (resPhone === cleanPhone) {
        return data;
      }
    }

    // Also check reservationId alias
    const q2 = query(
      collection(db, RESERVATIONS_COL),
      where('reservationId', '==', cleanNum),
      limit(5)
    );
    const snap2 = await getDocs(q2);
    for (const d of snap2.docs) {
      const data = d.data() as Reservation;
      const resPhone = cleanIndianMobile(data.customerPhone || data.phone || '');
      if (resPhone === cleanPhone) {
        return data;
      }
    }

    return null;
  } catch (err) {
    console.error('Error looking up customer reservation:', err);
    return null;
  }
}

export function subscribeReservations(callback: (res: Reservation[]) => void) {
  try {
    const q = query(collection(db, RESERVATIONS_COL), orderBy('createdAt', 'desc'), limit(150));
    return onSnapshot(
      q,
      (snapshot) => {
        const reservations: Reservation[] = [];
        snapshot.forEach((d) => reservations.push(d.data() as Reservation));
        callback(reservations);
      },
      (err) => {
        console.warn('Reservations snapshot listener warning:', err);
        callback([]);
      }
    );
  } catch (e) {
    console.error(e);
    callback([]);
    return () => {};
  }
}

export async function updateReservation(resId: string, updates: Partial<Reservation>): Promise<void> {
  await updateDoc(doc(db, RESERVATIONS_COL, resId), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateReservationStatus(resId: string, status: ReservationStatus): Promise<void> {
  const updates: Partial<Reservation> = {
    status,
    updatedAt: new Date().toISOString(),
  };
  if (status === 'CONFIRMED') {
    updates.confirmedAt = new Date().toISOString();
  } else if (status === 'CANCELLED') {
    updates.cancelledAt = new Date().toISOString();
  }
  await updateDoc(doc(db, RESERVATIONS_COL, resId), updates);
}

// ==========================================
// Reservation Activity Timeline & Audit Logs
// ==========================================

export async function logReservationEvent(
  event: Omit<ReservationEvent, 'eventId' | 'createdAt'>
): Promise<ReservationEvent> {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullEvent: ReservationEvent = {
    ...event,
    eventId,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, RESERVATION_EVENTS_COL, eventId), fullEvent);
  } catch (err) {
    console.warn('Failed to persist reservation event:', err);
  }
  return fullEvent;
}

export function subscribeReservationEvents(
  reservationId: string,
  callback: (events: ReservationEvent[]) => void
) {
  try {
    const q = query(
      collection(db, RESERVATION_EVENTS_COL),
      where('reservationId', '==', reservationId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const events: ReservationEvent[] = [];
        snapshot.forEach((d) => events.push(d.data() as ReservationEvent));
        events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        callback(events);
      },
      (err) => {
        console.warn('Reservation events listener error:', err);
        callback([]);
      }
    );
  } catch (e) {
    console.error(e);
    callback([]);
    return () => {};
  }
}

export async function getReservationEvents(reservationId: string): Promise<ReservationEvent[]> {
  try {
    const q = query(
      collection(db, RESERVATION_EVENTS_COL),
      where('reservationId', '==', reservationId)
    );
    const snap = await getDocs(q);
    const events: ReservationEvent[] = [];
    snap.forEach((d) => events.push(d.data() as ReservationEvent));
    events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return events;
  } catch (err) {
    console.error('Error fetching reservation events:', err);
    return [];
  }
}

// ==========================================
// Customer Notification Logs
// ==========================================

export async function logNotification(
  notif: Omit<NotificationLog, 'notificationId' | 'createdAt'>
): Promise<NotificationLog> {
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullNotif: NotificationLog = {
    ...notif,
    notificationId,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, NOTIFICATION_LOGS_COL, notificationId), fullNotif);
  } catch (err) {
    console.warn('Failed to persist notification log:', err);
  }
  return fullNotif;
}

export function subscribeNotificationLogs(
  reservationId: string,
  callback: (logs: NotificationLog[]) => void
) {
  try {
    const q = query(
      collection(db, NOTIFICATION_LOGS_COL),
      where('reservationId', '==', reservationId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const logs: NotificationLog[] = [];
        snapshot.forEach((d) => logs.push(d.data() as NotificationLog));
        logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(logs);
      },
      (err) => {
        console.warn('Notification logs listener error:', err);
        callback([]);
      }
    );
  } catch (e) {
    console.error(e);
    callback([]);
    return () => {};
  }
}

// Reviews
export function subscribeReviews(callback: (reviews: Review[]) => void, all: boolean = false) {
  try {
    const coll = collection(db, REVIEWS_COL);
    const q = all
      ? query(coll, orderBy('createdAt', 'desc'))
      : query(coll, where('approved', '==', true), orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const reviews: Review[] = [];
        snapshot.forEach((d) => reviews.push(d.data() as Review));
        if (reviews.length === 0 && !all) {
          callback(INITIAL_REVIEWS);
        } else {
          callback(reviews);
        }
      },
      (err) => {
        console.warn('Reviews snapshot listener warning:', err);
        callback(INITIAL_REVIEWS);
      }
    );
  } catch (e) {
    console.error(e);
    callback(INITIAL_REVIEWS);
    return () => {};
  }
}

export async function submitReview(review: Review): Promise<void> {
  await setDoc(doc(db, REVIEWS_COL, review.id), review);
}

export async function updateReviewApproval(reviewId: string, approved: boolean): Promise<void> {
  await updateDoc(doc(db, REVIEWS_COL, reviewId), { approved });
}

export async function deleteReview(reviewId: string): Promise<void> {
  await deleteDoc(doc(db, REVIEWS_COL, reviewId));
}

// Contact messages & enquiries
export async function saveContactMessageToFirestore(message: ContactMessage): Promise<void> {
  await setDoc(doc(db, CONTACT_MESSAGES_COL, message.id), message);
}

