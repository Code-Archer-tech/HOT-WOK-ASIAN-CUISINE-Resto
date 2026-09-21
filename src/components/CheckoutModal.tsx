import React, { useState } from 'react';
import { X, ArrowLeft, CheckCircle2, AlertCircle, ShoppingBag, Utensils, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Order, OrderType } from '../types/restaurant';
import { saveOrderToFirestore } from '../services/dbService';

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
  const { cart, orderType, setOrderType, subtotal, tax, packagingCharge, total, clearCart } = useCart();

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client preliminary checks
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage('Please enter a valid customer name (at least 2 characters).');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (orderType === 'dine_in' && !tableNumber.trim()) {
      // Table number is optional or can default to counter
    }

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before placing an order.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call server-side API to authoritative calculate and validate order
      const payload = {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        orderType,
        tableNumber: tableNumber.trim() || undefined,
        specialInstructions: specialInstructions.trim() || undefined,
        items: cart.map((i) => ({
          itemId: i.itemId,
          portion: i.portion,
          quantity: i.quantity,
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

      // Save order into Firestore for persistent tracking and admin management
      try {
        await saveOrderToFirestore(createdOrder);
      } catch (dbErr) {
        console.warn('Firestore direct write sync warning:', dbErr);
      }

      clearCart();
      onOrderSuccess(createdOrder);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || 'Could not place order. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="checkout-modal-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center">
      <div className="bg-[#091711] border border-[#224d3b] rounded-2xl max-w-2xl w-full text-[#f6f3ed] shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#224d3b] bg-[#0f271d] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#c8c0b2] hover:text-[#f6f3ed] hover:bg-[#15382a] mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#f6f3ed]">Confirm Your Order</h3>
              <p className="text-xs text-[#d4af37]">Hot Wok Asian Cuisine • Mumbra</p>
            </div>
          </div>
          <button
            id="btn-close-checkout-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#15382a] text-[#c8c0b2] hover:text-[#f6f3ed]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="p-5 sm:p-7 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-500/80 text-red-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#d4af37]">
              1. Customer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="e.g. Farhan Shaikh"
                  className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c8c0b2] mb-1">
                  Mobile Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#d4af37] font-bold">
                    +91
                  </span>
                  <input
                    id="checkout-input-phone"
                    type="tel"
                    required
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="99879 74833"
                    className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-lg pl-12 pr-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dining Mode & Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#d4af37]">
              2. Dining Type & Preferences
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="checkout-type-dinein"
                onClick={() => setOrderType('dine_in')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  orderType === 'dine_in'
                    ? 'bg-[#15382a] border-[#d4af37] text-[#d4af37] shadow'
                    : 'bg-[#07130e] border-[#224d3b] text-[#c8c0b2]'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>Dine-in at Restaurant</span>
              </button>

              <button
                type="button"
                id="checkout-type-takeaway"
                onClick={() => setOrderType('takeaway')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  orderType === 'takeaway'
                    ? 'bg-[#15382a] border-[#d4af37] text-[#d4af37] shadow'
                    : 'bg-[#07130e] border-[#224d3b] text-[#c8c0b2]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Takeaway Parcel (+₹25)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="e.g. Table 4 or Counter"
                    className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              )}

              <div className={orderType === 'dine_in' ? '' : 'sm:col-span-2'}>
                <label className="block text-xs font-medium text-[#c8c0b2] mb-1">
                  Special Instructions / Preparation Preferences
                </label>
                <input
                  id="checkout-input-instructions"
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., Extra Schezwan chutney, mild spice, no onions..."
                  className="w-full bg-[#15382a]/70 border border-[#224d3b] rounded-lg px-3.5 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          </div>

          {/* Itemized Order Summary */}
          <div className="space-y-3 bg-[#07130e] border border-[#224d3b] rounded-xl p-4">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#d4af37]">
              3. Order Summary ({cart.length} item{cart.length === 1 ? '' : 's'})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 divide-y divide-[#224d3b]/40 text-xs">
              {cart.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[#f6f3ed]">
                      {item.quantity}x
                    </span>
                    <span className="text-[#c8c0b2]">
                      {item.name} {item.portion !== 'single' && `(${item.portion.toUpperCase()})`}
                    </span>
                  </div>
                  <span className="font-serif font-bold text-[#d4af37]">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#224d3b] space-y-1 text-xs text-[#c8c0b2]">
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
              <div className="flex justify-between text-base font-bold text-[#f6f3ed] pt-2 border-t border-[#224d3b]/80">
                <span className="font-serif">Final Total:</span>
                <span className="font-serif text-[#d4af37]">₹{total}</span>
              </div>
            </div>

            {/* Clear Payment Notification */}
            <div className="p-3 bg-[#15382a]/50 rounded-lg border border-[#d4af37]/30 text-xs text-[#f6f3ed] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#d4af37] block">Payment Method:</span>
                <span className="text-[#c8c0b2]">Pay at Restaurant (Cash, UPI & Card accepted at counter)</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#091711] border border-[#d4af37] text-[10px] font-bold text-[#d4af37]">
                PAY AT RESTAURANT
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-[#224d3b] text-xs font-semibold text-[#c8c0b2] hover:text-[#f6f3ed] hover:bg-[#15382a]"
            >
              Back to Menu
            </button>
            <button
              type="submit"
              id="btn-submit-order"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e2c258] hover:to-[#c59b27] text-[#091711] font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#091711] border-t-transparent rounded-full animate-spin" />
                  <span>Creating Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Place Order (₹{total})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
