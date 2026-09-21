import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem, OrderType } from '../types/restaurant';

interface CartContextType {
  cart: CartItem[];
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  addItem: (item: MenuItem, portion?: 'single' | 'half' | 'full') => void;
  addToCart: (item: MenuItem, portion?: 'single' | 'half' | 'full', quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  getItemQuantity: (itemId: string, portion?: 'single' | 'half' | 'full') => number;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  tax: number;
  packagingCharge: number;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'hotwok_cart_items';
const ORDER_TYPE_KEY = 'hotwok_order_type';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orderType, setOrderType] = useState<OrderType>(() => {
    try {
      const saved = sessionStorage.getItem(ORDER_TYPE_KEY);
      return (saved as OrderType) || 'dine_in';
    } catch {
      return 'dine_in';
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to sessionStorage', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      sessionStorage.setItem(ORDER_TYPE_KEY, orderType);
    } catch (e) {
      console.warn('Failed to save order type to sessionStorage', e);
    }
  }, [orderType]);

  const addToCart = (
    item: MenuItem,
    portion: 'single' | 'half' | 'full' = 'single',
    quantity: number = 1
  ) => {
    let price = item.price;
    if (portion === 'half' && typeof item.halfPrice === 'number') {
      price = item.halfPrice;
    } else if (portion === 'full' && typeof item.fullPrice === 'number') {
      price = item.fullPrice;
    }

    const cartItemId = `${item.id}-${portion}`;

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
            price,
            quantity,
            isVeg: item.isVeg,
            image: item.image,
            categoryName: item.categoryName,
          },
        ];
      }
    });
  };

  const addItem = (item: MenuItem, portion: 'single' | 'half' | 'full' = 'single') => {
    addToCart(item, portion, 1);
  };

  const getItemQuantity = (itemId: string, portion: 'single' | 'half' | 'full' = 'single'): number => {
    const cartItemId = `${itemId}-${portion}`;
    const found = cart.find((i) => i.id === cartItemId);
    return found ? found.quantity : 0;
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

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const packagingCharge = orderType === 'takeaway' && cart.length > 0 ? 25 : 0;
  const total = Math.round((subtotal + tax + packagingCharge) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        cart,
        orderType,
        setOrderType,
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
