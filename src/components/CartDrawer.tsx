import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Utensils, PackageCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
    clearCart,
    orderType,
    setOrderType,
    subtotal,
    tax,
    packagingCharge,
    total,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div id="cart-drawer-overlay" className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#091711] border-l border-[#224d3b] text-[#f6f3ed] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-[#224d3b] flex items-center justify-between bg-[#0f271d]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#f6f3ed]">Your Order</h3>
                <span className="text-[11px] text-[#c8c0b2]">{cart.length} item{cart.length === 1 ? '' : 's'} in cart</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {cart.length > 0 && (
                <button
                  id="btn-clear-cart"
                  onClick={clearCart}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors p-1.5 rounded hover:bg-[#15382a]"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                id="btn-close-cart-drawer"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg bg-[#15382a] text-[#c8c0b2] hover:text-[#f6f3ed] hover:bg-[#1d4b38] transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Order Type Toggle */}
          <div className="p-4 border-b border-[#224d3b]/60 bg-[#07130e]">
            <span className="text-[11px] text-[#8ea098] uppercase tracking-wider font-semibold block mb-2">
              Select Dining Mode:
            </span>
            <div className="grid grid-cols-2 gap-2 bg-[#091711] p-1 rounded-xl border border-[#224d3b]">
              <button
                id="cart-mode-dinein"
                onClick={() => setOrderType('dine_in')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  orderType === 'dine_in'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b89327] text-[#091711] shadow'
                    : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Dine-in</span>
              </button>

              <button
                id="cart-mode-takeaway"
                onClick={() => setOrderType('takeaway')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  orderType === 'takeaway'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b89327] text-[#091711] shadow'
                    : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Takeaway (+₹25)</span>
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-[#224d3b]/40">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#15382a] border border-[#224d3b] flex items-center justify-center text-[#8ea098]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-lg font-bold text-[#f6f3ed]">Your cart is currently empty</h4>
                <p className="text-xs text-[#c8c0b2] max-w-xs leading-relaxed">
                  Explore our wok-charred Asian specialties and add your favorite dishes to begin your order.
                </p>
                <button
                  id="btn-cart-empty-browse"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2.5 rounded-lg bg-[#15382a] border border-[#d4af37] text-xs font-semibold text-[#d4af37] hover:bg-[#d4af37] hover:text-[#091711] transition-colors"
                >
                  Browse Full Menu
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} id={`cart-item-${item.id}`} className="pt-3.5 first:pt-0 flex items-center space-x-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover border border-[#224d3b] flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#f6f3ed] truncate">{item.name}</h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#8ea098] hover:text-red-400 p-1 transition-colors"
                        title="Remove dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-[#15382a] text-[#d4af37] rounded border border-[#224d3b]">
                        {item.portion === 'single' ? 'Standard' : `${item.portion.toUpperCase()} Portion`}
                      </span>
                      <span className="text-xs text-[#c8c0b2]">₹{item.price} each</span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center space-x-2 bg-[#15382a] border border-[#224d3b] rounded-md px-1.5 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="text-[#c8c0b2] hover:text-[#d4af37] p-1"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-[#f6f3ed] w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="text-[#c8c0b2] hover:text-[#d4af37] p-1"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-serif font-bold text-sm text-[#d4af37]">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Bill Breakdown */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-[#224d3b] bg-[#07130e] space-y-3">
              <div className="space-y-1.5 text-xs text-[#c8c0b2]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#f6f3ed]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5% Restaurant Tax)</span>
                  <span className="font-semibold text-[#f6f3ed]">₹{tax}</span>
                </div>
                {packagingCharge > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Takeaway Packaging Charge</span>
                    <span className="font-semibold">₹{packagingCharge}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-[#f6f3ed] pt-2 border-t border-[#224d3b]">
                  <span className="font-serif text-base">Grand Total</span>
                  <span className="font-serif text-lg text-[#d4af37]">₹{total}</span>
                </div>
              </div>

              <button
                id="btn-cart-checkout"
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e2c258] hover:to-[#c59b27] text-[#091711] font-bold text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-[#8ea098]">
                Payment: Cash / UPI / Card at Restaurant counter or table.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
