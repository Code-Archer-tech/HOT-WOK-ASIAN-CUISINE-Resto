import React from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Utensils,
  PackageCheck,
  Bike,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { RESTAURANT_CONFIG } from '../config/restaurantConfig';

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
    includePackaging,
    setIncludePackaging,
    subtotal,
    tax,
    packagingCharge,
    deliveryFee,
    total,
  } = useCart();

  if (!isCartOpen) return null;

  const isTakeoutOrDelivery = ['delivery', 'pickup', 'takeaway'].includes(orderType);

  return (
    <div
      id="cart-drawer-overlay"
      className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm transition-opacity duration-200"
      onClick={() => setIsCartOpen(false)}
    >
      <div
        className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          id="cart-drawer-container"
          className="w-screen max-w-md bg-[#091711] border-l border-[#224d3b] text-[#f6f3ed] shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#224d3b] flex items-center justify-between bg-[#0f271d]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#f6f3ed]">Your Order</h3>
                <span className="text-[11px] text-[#c8c0b2]">
                  {cart.length} unique item{cart.length === 1 ? '' : 's'} in cart
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {cart.length > 0 && (
                <button
                  id="btn-clear-cart"
                  onClick={clearCart}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors p-1.5 rounded hover:bg-[#15382a] flex items-center space-x-1"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">Clear</span>
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

          {/* Order Type Selection: Delivery / Pickup / Dine-in */}
          <div className="p-3.5 border-b border-[#224d3b]/60 bg-[#07130e] space-y-2.5">
            <span className="text-[11px] text-[#8ea098] uppercase tracking-wider font-semibold block">
              Order Type:
            </span>
            <div className="grid grid-cols-3 gap-1.5 bg-[#091711] p-1 rounded-xl border border-[#224d3b]">
              <button
                type="button"
                id="cart-mode-delivery"
                onClick={() => setOrderType('delivery')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                  orderType === 'delivery'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b89327] text-[#091711] shadow'
                    : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Delivery</span>
              </button>

              <button
                type="button"
                id="cart-mode-pickup"
                onClick={() => setOrderType('pickup')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                  orderType === 'pickup' || orderType === 'takeaway'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b89327] text-[#091711] shadow'
                    : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Pickup</span>
              </button>

              <button
                type="button"
                id="cart-mode-dinein"
                onClick={() => setOrderType('dine_in')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                  orderType === 'dine_in'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b89327] text-[#091711] shadow'
                    : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Dine-In</span>
              </button>
            </div>

            {/* Optional Packaging Fee Configuration */}
            {isTakeoutOrDelivery && (
              <button
                type="button"
                id="toggle-packaging-fee"
                onClick={() => setIncludePackaging(!includePackaging)}
                className="w-full mt-1.5 flex items-center justify-between p-2 rounded-lg bg-[#0e241b] border border-[#224d3b] text-left hover:border-[#d4af37]/40 transition"
              >
                <div className="flex items-center space-x-2">
                  {includePackaging ? (
                    <CheckSquare className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-[#8ea098] flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-medium text-[#f6f3ed] block">
                      Spill-Proof Asian Takeaway Containers
                    </span>
                    <span className="text-[10px] text-[#8ea098]">
                      Eco-friendly heat-retaining food packaging
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#d4af37] ml-2">
                  +₹{RESTAURANT_CONFIG.pricing.defaultPackagingFee}
                </span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-[#224d3b]/40">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#15382a] border border-[#224d3b] flex items-center justify-center text-[#8ea098]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-lg font-bold text-[#f6f3ed]">Your cart is empty</h4>
                <p className="text-xs text-[#c8c0b2] max-w-xs leading-relaxed">
                  Browse our wok-charred noodles, kepsas, soups and signature appetizers to add to your feast.
                </p>
                <button
                  id="btn-cart-empty-browse"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2.5 rounded-lg bg-[#15382a] border border-[#d4af37] text-xs font-semibold text-[#d4af37] hover:bg-[#d4af37] hover:text-[#091711] transition-colors"
                >
                  Explore Menu
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const isVeg = item.dietaryChoice === 'veg';
                return (
                  <div key={item.id} id={`cart-item-${item.id}`} className="pt-3.5 first:pt-0 flex items-center space-x-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover border border-[#224d3b] flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="truncate mr-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-[#f6f3ed] truncate">{item.name}</h4>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            {/* Veg / Non-Veg Indicator */}
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center space-x-1 ${
                                isVeg
                                  ? 'border-emerald-500/80 bg-emerald-950/50 text-emerald-400'
                                  : 'border-red-500/80 bg-red-950/50 text-red-400'
                              }`}
                            >
                              <span>{isVeg ? '● VEG' : '▲ NON-VEG'}</span>
                            </span>

                            {/* Portion Badge */}
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-[#15382a] text-[#d4af37] rounded border border-[#224d3b]">
                              {item.portion === 'single' ? 'Standard' : `${item.portion.toUpperCase()}`}
                            </span>
                          </div>
                        </div>

                        <button
                          id={`btn-remove-item-${item.id}`}
                          onClick={() => removeItem(item.id)}
                          className="text-[#8ea098] hover:text-red-400 p-1 transition-colors flex-shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center space-x-2 bg-[#15382a] border border-[#224d3b] rounded-lg px-2 py-0.5">
                          <button
                            id={`btn-qty-minus-${item.id}`}
                            onClick={() => updateQuantity(item.id, -1)}
                            className="text-[#c8c0b2] hover:text-[#d4af37] p-1"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-[#f6f3ed] w-5 text-center">{item.quantity}</span>
                          <button
                            id={`btn-qty-plus-${item.id}`}
                            onClick={() => updateQuantity(item.id, 1)}
                            className="text-[#c8c0b2] hover:text-[#d4af37] p-1"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="font-serif font-bold text-sm text-[#d4af37]">
                            ₹{item.price * item.quantity}
                          </div>
                          <div className="text-[10px] text-[#8ea098]">₹{item.price} each</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Bill Breakdown */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#224d3b] bg-[#07130e] space-y-3">
              <div className="space-y-1.5 text-xs text-[#c8c0b2]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#f6f3ed]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5% Restaurant Tax)</span>
                  <span className="font-semibold text-[#f6f3ed]">₹{tax}</span>
                </div>

                {/* Packaging Fee row if configured */}
                {packagingCharge > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Packaging Charge</span>
                    <span className="font-semibold">₹{packagingCharge}</span>
                  </div>
                )}

                {/* Delivery fee row if delivery */}
                {orderType === 'delivery' && (
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-400 font-semibold uppercase text-[11px]">
                        FREE (Order over ₹{RESTAURANT_CONFIG.pricing.freeDeliveryThreshold})
                      </span>
                    ) : (
                      <span className="font-semibold text-[#f6f3ed]">₹{deliveryFee}</span>
                    )}
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-[#f6f3ed] pt-2 border-t border-[#224d3b]">
                  <span className="font-serif text-base">Grand Total</span>
                  <span className="font-serif text-lg text-[#d4af37]">₹{total}</span>
                </div>
              </div>

              <button
                type="button"
                id="btn-cart-checkout"
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e2c258] hover:to-[#c59b27] text-[#091711] font-bold text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center space-x-2 active:scale-[0.98]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-[#8ea098]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Safe Demo Order • Instant WhatsApp Confirmation Option</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
