import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem, OrderType } from '../types/restaurant';
import { RESTAURANT_CONFIG } from '../config/restaurantConfig';

interface CartContextType {
  cart: CartItem[];
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  includePackaging: boolean;
  setIncludePackaging: (include: boolean) => void;
  addItem: (item: MenuItem, portion?: 'single' | 'half' | 'full', dietaryChoice?: 'veg' | 'non-veg') => void;
  addToCart: (
    item: MenuItem,
    portion?: 'single' | 'half' | 'full',
    quantity?: number,
    dietaryChoice?: 'veg' | 'non-veg'
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  getItemQuantity: (itemId: string, portion?: 'single' | 'half' | 'full', dietaryChoice?: 'veg' | 'non-veg') => number;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  tax: number;
  packagingCharge: number;
  deliveryFee: number;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'hotwok_cart_items_v2';
const ORDER_TYPE_KEY = 'hotwok_order_type_v2';
const PACKAGING_KEY = 'hotwok_include_packaging';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Safe persistent cart loader (localStorage first, sessionStorage fallback)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orderType, setOrderType] = useState<OrderType>(() => {
    try {
      const saved = localStorage.getItem(ORDER_TYPE_KEY) || sessionStorage.getItem(ORDER_TYPE_KEY);
      return (saved as OrderType) || 'delivery';
    } catch {
      return 'delivery';
    }
  });

  const [includePackaging, setIncludePackaging] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(PACKAGING_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync to both localStorage & sessionStorage for persistence during navigation
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to persist cart:', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDER_TYPE_KEY, orderType);
      sessionStorage.setItem(ORDER_TYPE_KEY, orderType);
    } catch (e) {
      console.warn('Failed to persist order type:', e);
    }
  }, [orderType]);

  useEffect(() => {
    try {
      localStorage.setItem(PACKAGING_KEY, String(includePackaging));
    } catch (e) {
      console.warn('Failed to persist packaging choice:', e);
    }
  }, [includePackaging]);

  const addToCart = (
    item: MenuItem,
    portion: 'single' | 'half' | 'full' = 'single',
    quantity: number = 1,
    dietaryChoice?: 'veg' | 'non-veg'
  ) => {
    const isVegChoice = dietaryChoice ? dietaryChoice === 'veg' : item.isVeg;

    // Price resolution
    let price = item.price;
    if (dietaryChoice === 'veg' && typeof item.vegPrice === 'number') {
      price = item.vegPrice;
    } else if (dietaryChoice === 'non-veg' && typeof item.nonVegPrice === 'number') {
      price = item.nonVegPrice;
    } else if (portion === 'half' && typeof item.halfPrice === 'number') {
      price = item.halfPrice;
    } else if (portion === 'full' && typeof item.fullPrice === 'number') {
      price = item.fullPrice;
    }

    const dietarySuffix = dietaryChoice || (isVegChoice ? 'veg' : 'non-veg');
    const cartItemId = `${item.id}-${portion}-${dietarySuffix}`;

    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.id === cartItemId ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        return [
          ...prev,
          {
            id: cartItemId,
            itemId: item.id,
            name: item.name,
            portion,
            dietaryChoice,
            price,
            quantity,
            isVeg: isVegChoice,
            image: item.image,
            categoryName: item.categoryName,
          },
        ];
      }
    });
  };

  const addItem = (
    item: MenuItem,
    portion: 'single' | 'half' | 'full' = 'single',
    dietaryChoice?: 'veg' | 'non-veg'
  ) => {
    addToCart(item, portion, 1, dietaryChoice);
  };

  const getItemQuantity = (
    itemId: string,
    portion: 'single' | 'half' | 'full' = 'single',
    dietaryChoice?: 'veg' | 'non-veg'
  ): number => {
    if (dietaryChoice) {
      const cartItemId = `${itemId}-${portion}-${dietaryChoice}`;
      const found = cart.find((i) => i.id === cartItemId);
      return found ? found.quantity : 0;
    }
    // If no dietary choice specified, sum all variants of this item/portion
    return cart
      .filter((i) => i.itemId === itemId && (portion === 'single' || i.portion === portion))
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const removeItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * RESTAURANT_CONFIG.pricing.taxRate * 100) / 100;

  // Packaging Fee: Configurable, applied for delivery / takeaway / pickup if enabled
  const isTakeoutOrDelivery = ['delivery', 'pickup', 'takeaway'].includes(orderType);
  const packagingCharge =
    cart.length > 0 && isTakeoutOrDelivery && includePackaging
      ? RESTAURANT_CONFIG.pricing.defaultPackagingFee
      : 0;

  // Delivery Fee: Applicable only for delivery; free above threshold
  let deliveryFee = 0;
  if (cart.length > 0 && orderType === 'delivery') {
    deliveryFee =
      subtotal >= RESTAURANT_CONFIG.pricing.freeDeliveryThreshold
        ? 0
        : RESTAURANT_CONFIG.pricing.defaultDeliveryFee;
  }

  const total = Math.round((subtotal + tax + packagingCharge + deliveryFee) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        cart,
        orderType,
        setOrderType,
        includePackaging,
        setIncludePackaging,
        addItem,
        addToCart,
        removeItem,
        updateQuantity,
        getItemQuantity,
        clearCart,
        itemCount,
        subtotal,
        tax,
        packagingCharge,
        deliveryFee,
        total,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
