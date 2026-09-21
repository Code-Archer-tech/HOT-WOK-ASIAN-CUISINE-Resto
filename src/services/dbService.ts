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
import { Category, MenuItem, Order, OrderStatus, Reservation, ReservationStatus, Review, ContactMessage } from '../types/restaurant';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS, INITIAL_REVIEWS } from '../lib/seedData';
import { setCachedMenuItems } from '../server/apiHandler';

const CATEGORIES_COL = 'categories';
const MENU_ITEMS_COL = 'menu_items';
const ORDERS_COL = 'orders';
const RESERVATIONS_COL = 'reservations';
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

// Reservations
export async function saveReservationToFirestore(res: Reservation): Promise<void> {
  await setDoc(doc(db, RESERVATIONS_COL, res.id), res);
}

export function subscribeReservations(callback: (res: Reservation[]) => void) {
  try {
    const q = query(collection(db, RESERVATIONS_COL), orderBy('createdAt', 'desc'), limit(100));
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

export async function updateReservationStatus(resId: string, status: ReservationStatus): Promise<void> {
  await updateDoc(doc(db, RESERVATIONS_COL, resId), { status });
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

