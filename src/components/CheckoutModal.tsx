import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Utensils,
  Bike,
  PackageCheck,
  MapPin,
  FileText,
  ShieldCheck,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Order, OrderType } from '../types/restaurant';
import { saveOrderToFirestore } from '../services/dbService';
import {
  RESTAURANT_CONFIG,
  RESTAURANT_WHATSAPP_NUMBER,
  createWhatsAppUrl,
  generateWhatsAppOrderMessage,
} from '../config/restaurantConfig';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const {
    cart,
    orderType,
    setOrderType,
    includePackaging,
    setIncludePackaging,
    subtotal,
    tax,
    packagingCharge,
    deliveryFee,
    total,
    clearCart,
  } = useCart();

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isTakeoutOrDelivery = ['delivery', 'pickup', 'takeaway'].includes(orderType);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validate Customer Name
    const trimmedName = customerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    // 2. Validate Mobile Number (10 digits)
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    // 3. Validate Delivery Address when Delivery is selected
    if (orderType === 'delivery') {
      const trimmedAddress = deliveryAddress.trim();
      if (!trimmedAddress || trimmedAddress.length < 8) {
        setErrorMessage('Please enter your complete delivery address (building, flat/house number, area, and landmark).');
        return;
      }
    }

    // 4. Cart Check
    if (cart.length === 0) {
      setErrorMessage('Your cart is currently empty. Please add items to checkout.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call server-side API to authoritatively calculate and validate order
      const payload = {
        customerName: trimmedName,
        customerPhone: cleanPhone,
        orderType,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
        tableNumber: orderType === 'dine_in' ? tableNumber.trim() || undefined : undefined,
        specialInstructions: specialInstructions.trim() || undefined,
        includePackaging,
        items: cart.map((i) => ({
          itemId: i.itemId,
          portion: i.portion,
          quantity: i.quantity,
          dietaryChoice: i.dietaryChoice,
        })),
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server validation failed while processing order.');
      }

      const createdOrder: Order = data.order;
      const orderWhatsappMsg = createdOrder.whatsappMessage || generateWhatsAppOrderMessage(createdOrder);
      const targetWhatsappUrl = data.whatsappUrl || createWhatsAppUrl(orderWhatsappMsg);

      // Save order into Firestore for persistent tracking and admin management
      try {
        await saveOrderToFirestore({
          ...createdOrder,
          whatsappMessage: orderWhatsappMsg,
        });
      } catch (dbErr) {
        console.warn('Firestore direct write sync warning:', dbErr);
      }

      // Open WhatsApp with this prefilled message (desktop opens tab, mobile launches app)
      try {
        window.open(targetWhatsappUrl, '_blank', 'noopener,noreferrer');
      } catch (popupErr) {
        console.warn('Browser prevented direct window.open popup:', popupErr);
      }

      clearCart();
      onOrderSuccess({
        ...createdOrder,
        whatsappMessage: orderWhatsappMsg,
      });
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || 'Could not place order. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="checkout-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center transition-opacity"
      onClick={onClose}
    >
      <div
        id="checkout-modal-card"
        className="bg-[#091711] border border-[#224d3b] rounded-2xl max-w-2xl w-full text-[#f6f3ed] shadow-2xl flex flex-col max-h-[94vh] my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#224d3b] bg-[#0f271d] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 mr-2">
            <button
              type="button"
              id="btn-back-from-checkout"
              onClick={onClose}
              className="p-1.5 rounded-md text-[#c8c0b2] hover:text-[#f6f3ed] hover:bg-[#15382a] shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#f6f3ed] truncate">Customer Checkout</h3>
              <p className="text-[11px] sm:text-xs text-[#d4af37] truncate">
                {RESTAURANT_CONFIG.name} • {RESTAURANT_CONFIG.address.short}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-checkout-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#15382a] text-[#c8c0b2] hover:text-[#f6f3ed] shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-red-950/70 border border-red-500/80 text-red-200 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="break-words">{errorMessage}</span>
            </div>
          )}

          {/* 1. Customer Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#d4af37]">
              1. Customer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#c8c0b2] mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="checkout-input-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g., Farhan Shaikh"
                  className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-xl px-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c8c0b2] mb-1">
                  Mobile Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#d4af37] font-bold select-none">
                    +91
                  </span>
                  <input
                    id="checkout-input-phone"
                    type="tel"
                    required
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-xl pl-12 pr-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Delivery / Pickup Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#d4af37]">
              2. Delivery or Pickup
            </h4>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                id="checkout-type-delivery"
                onClick={() => setOrderType('delivery')}
                className={`py-2.5 px-2 sm:py-3 sm:px-3 rounded-xl border text-[11px] sm:text-xs font-semibold flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
                  orderType === 'delivery'
                    ? 'bg-[#15382a] border-[#d4af37] text-[#d4af37] ring-1 ring-[#d4af37] shadow'
                    : 'bg-[#07130e] border-[#224d3b] text-[#c8c0b2] hover:border-[#d4af37]/40'
                }`}
              >
                <Bike className="w-4 h-4 shrink-0" />
                <span>Delivery</span>
              </button>

              <button
                type="button"
                id="checkout-type-pickup"
                onClick={() => setOrderType('pickup')}
                className={`py-2.5 px-2 sm:py-3 sm:px-3 rounded-xl border text-[11px] sm:text-xs font-semibold flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
                  orderType === 'pickup' || orderType === 'takeaway'
                    ? 'bg-[#15382a] border-[#d4af37] text-[#d4af37] ring-1 ring-[#d4af37] shadow'
                    : 'bg-[#07130e] border-[#224d3b] text-[#c8c0b2] hover:border-[#d4af37]/40'
                }`}
              >
                <PackageCheck className="w-4 h-4 shrink-0" />
                <span>Pickup</span>
              </button>

              <button
                type="button"
                id="checkout-type-dinein"
                onClick={() => setOrderType('dine_in')}
                className={`py-2.5 px-2 sm:py-3 sm:px-3 rounded-xl border text-[11px] sm:text-xs font-semibold flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
                  orderType === 'dine_in'
                    ? 'bg-[#15382a] border-[#d4af37] text-[#d4af37] ring-1 ring-[#d4af37] shadow'
                    : 'bg-[#07130e] border-[#224d3b] text-[#c8c0b2] hover:border-[#d4af37]/40'
                }`}
              >
                <Utensils className="w-4 h-4 shrink-0" />
                <span>Dine-In</span>
              </button>
            </div>

            {/* Address field: ONLY required when Delivery is selected */}
            {orderType === 'delivery' && (
              <div className="space-y-1.5 pt-1 animate-fade-in">
                <label className="block text-xs font-medium text-[#c8c0b2]">
                  Delivery Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#d4af37] absolute left-3 top-3 pointer-events-none" />
                  <textarea
                    id="checkout-input-address"
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Flat/House No., Building Name, Street, Landmark, Area (e.g., Flat 302, Al-Madina Heights, Kausa, Mumbra)"
                    className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-xl pl-9 pr-3.5 py-2 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#8ea098] gap-1">
                  <span className="break-words">Serving Mumbra, Kausa, Shilphata, and surrounding areas.</span>
                  {subtotal >= RESTAURANT_CONFIG.pricing.freeDeliveryThreshold ? (
                    <span className="text-emerald-400 font-semibold shrink-0">Free Delivery Qualified!</span>
                  ) : (
                    <span className="shrink-0">Free delivery over ₹{RESTAURANT_CONFIG.pricing.freeDeliveryThreshold}</span>
                  )}
                </div>
              </div>
            )}

            {/* Pickup Location Info: Shown when Pickup is selected */}
            {(orderType === 'pickup' || orderType === 'takeaway') && (
              <div className="p-3 bg-[#0e241b] border border-[#224d3b] rounded-xl text-xs text-[#c8c0b2] flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#f6f3ed] font-semibold block">Pickup Counter:</span>
                  <span>{RESTAURANT_CONFIG.name}, {RESTAURANT_CONFIG.address.short}. Ready in ~20–25 minutes.</span>
                </div>
              </div>
            )}

            {/* Table number if dine-in */}
            {orderType === 'dine_in' && (
              <div>
                <label className="block text-xs font-medium text-[#c8c0b2] mb-1">
                  Table Number (Optional if ordering from table)
                </label>
                <input
                  id="checkout-input-table"
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g., Table 4 or Counter"
                  className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-xl px-3.5 py-2 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            )}

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-medium text-[#c8c0b2] mb-1">
                Special Instructions / Customizations (Optional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-[#8ea098] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="checkout-input-instructions"
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., Extra spicy schezwan chutney, crispy noodles, less oil..."
                  className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-xl pl-9 pr-3.5 py-2 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Packaging Fee Toggle for Takeout/Delivery */}
            {isTakeoutOrDelivery && (
              <button
                type="button"
                id="checkout-toggle-packaging"
                onClick={() => setIncludePackaging(!includePackaging)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0e241b] border border-[#224d3b] text-left hover:border-[#d4af37]/40 transition"
              >
                <div className="flex items-center space-x-2">
                  {includePackaging ? (
                    <CheckSquare className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-[#8ea098] flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-medium text-[#f6f3ed] block">
                      Include Food Packaging Charge
                    </span>
                    <span className="text-[10px] text-[#8ea098]">
                      Spill-proof takeaway boxes & carry bag
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#d4af37]">
                  +₹{RESTAURANT_CONFIG.pricing.defaultPackagingFee}
                </span>
              </button>
            )}
          </div>

          {/* 3. Itemized Order Summary */}
          <div className="space-y-2.5 bg-[#07130e] border border-[#224d3b] rounded-xl p-4">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#d4af37]">
              3. Order Summary ({cart.length} item{cart.length === 1 ? '' : 's'})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 divide-y divide-[#224d3b]/40 text-xs">
              {cart.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-start gap-2">
                  <div className="flex items-start space-x-2 min-w-0 flex-1">
                    <span className="font-bold text-[#f6f3ed] shrink-0 mt-0.5">
                      {item.quantity}×
                    </span>
                    <div className="min-w-0">
                      <span className="text-[#c8c0b2] break-words font-medium">
                        {item.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {item.portion !== 'single' && (
                          <span className="text-[#8ea098] text-[10px]">[{item.portion.toUpperCase()}]</span>
                        )}
                        {item.dietaryChoice && (
                          <span
                            className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                              item.dietaryChoice === 'veg'
                                ? 'text-emerald-400 bg-emerald-950/60'
                                : 'text-red-400 bg-red-950/60'
                            }`}
                          >
                            {item.dietaryChoice.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-serif font-bold text-[#d4af37] shrink-0 ml-1">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#224d3b] space-y-1 text-xs text-[#c8c0b2]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5% Restaurant Tax):</span>
                <span>₹{tax}</span>
              </div>
              {packagingCharge > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Takeaway Packaging:</span>
                  <span>₹{packagingCharge}</span>
                </div>
              )}
              {orderType === 'delivery' && (
                <div className="flex justify-between items-center gap-2">
                  <span className="shrink-0">Delivery Charge:</span>
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-400 font-semibold uppercase text-[10px] text-right">
                      FREE (Over ₹{RESTAURANT_CONFIG.pricing.freeDeliveryThreshold})
                    </span>
                  ) : (
                    <span>₹{deliveryFee}</span>
                  )}
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#f6f3ed] pt-2 border-t border-[#224d3b]/80">
                <span className="font-serif">Grand Total:</span>
                <span className="font-serif text-[#d4af37]">₹{total}</span>
              </div>
            </div>

            {/* Demo Payment Notice */}
            <div className="p-2.5 bg-[#15382a]/50 rounded-lg border border-[#d4af37]/30 text-xs text-[#f6f3ed] flex items-start justify-between gap-2.5">
              <div className="min-w-0">
                <span className="font-bold text-[#d4af37] block mb-0.5">Payment Notice:</span>
                <p className="text-[#c8c0b2] text-[11px] leading-relaxed break-words">
                  {orderType === 'delivery'
                    ? 'Cash on Delivery / UPI at doorstep (No online card charged)'
                    : 'Pay at Counter / Table upon arrival (Cash / UPI / Card)'}
                </p>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              id="btn-cancel-checkout"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#224d3b] text-xs font-semibold text-[#c8c0b2] hover:text-[#f6f3ed] hover:bg-[#15382a] text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-order"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f1d779] to-[#c59b27] hover:brightness-110 text-[#091711] font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#091711] border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Confirm Order (₹{total})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
