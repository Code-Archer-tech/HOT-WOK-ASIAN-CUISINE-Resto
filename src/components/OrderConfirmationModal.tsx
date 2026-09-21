import React, { useState } from 'react';
import {
  CheckCircle2,
  MessageCircle,
  Clock,
  MapPin,
  Phone,
  Copy,
  Check,
  Bike,
  PackageCheck,
  Utensils,
  ExternalLink,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { Order } from '../types/restaurant';
import {
  RESTAURANT_CONFIG,
  RESTAURANT_WHATSAPP_NUMBER,
  createWhatsAppUrl,
  createWhatsAppWebUrl,
  generateWhatsAppOrderMessage,
} from '../config/restaurantConfig';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onViewMenu: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  onViewMenu,
}) => {
  const [copied, setCopied] = useState(false);
  const [whatsappCopied, setWhatsappCopied] = useState(false);
  const [showMessagePreview, setShowMessagePreview] = useState(false);

  if (!order) return null;

  const whatsappMessage = order.whatsappMessage || generateWhatsAppOrderMessage(order);
  const whatsappUrl = createWhatsAppUrl(whatsappMessage);
  const whatsappWebUrl = createWhatsAppWebUrl(whatsappMessage);

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyWhatsAppText = () => {
    if (order.whatsappMessage) {
      navigator.clipboard.writeText(order.whatsappMessage);
      setWhatsappCopied(true);
      setTimeout(() => setWhatsappCopied(false), 2000);
    }
  };

  const isDelivery = order.orderType === 'delivery';
  const isPickup = order.orderType === 'pickup' || order.orderType === 'takeaway';

  const statusSteps = [
    { key: 'NEW', label: 'Received' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PREPARING', label: 'In Wok' },
    { key: 'READY', label: isDelivery ? 'Out for Delivery' : 'Ready' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  const currentStatusIndex = statusSteps.findIndex((s) => s.key === order.status);
  const activeStep = currentStatusIndex >= 0 ? currentStatusIndex : 0;

  return (
    <div
      id="order-confirm-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-2 sm:p-4 flex items-center justify-center transition-opacity"
      onClick={onClose}
    >
      <div
        id="order-confirm-card"
        className="bg-[#091711] border border-[#224d3b] rounded-2xl max-w-xl w-full text-[#f6f3ed] shadow-2xl flex flex-col max-h-[94vh] my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with Success Confirmation */}
        <div className="bg-gradient-to-r from-[#15382a] via-[#0f271d] to-[#091711] p-4 sm:p-6 border-b border-[#224d3b] text-center space-y-1.5 shrink-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#091711] border-2 border-[#d4af37] flex items-center justify-center mx-auto text-[#d4af37] shadow-lg">
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#f6f3ed] break-words">Order Placed Successfully!</h3>
          <p className="text-[11px] sm:text-xs text-[#d4af37] tracking-wider uppercase font-semibold break-words">
            {RESTAURANT_CONFIG.name} • {RESTAURANT_CONFIG.address.short}
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* Order ID & WhatsApp Quick Dispatch */}
          <div className="bg-[#07130e] border border-[#224d3b] rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8ea098] tracking-widest block">
                  Order Reference Number
                </span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="font-mono text-base font-bold text-[#d4af37] break-all">{order.orderNumber}</span>
                  <button
                    type="button"
                    id="btn-copy-order-num"
                    onClick={handleCopyOrderNumber}
                    className="p-1 text-[#c8c0b2] hover:text-[#d4af37] transition-colors shrink-0"
                    title="Copy order number"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* WhatsApp Destination */}
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-[#8ea098] tracking-wider block">
                  WhatsApp Contact
                </span>
                <span className="text-xs font-semibold text-[#f6f3ed] break-all">+{RESTAURANT_WHATSAPP_NUMBER}</span>
              </div>
            </div>

            {/* Direct WhatsApp Order Submission Actions */}
            <div className="pt-2 border-t border-[#224d3b]/50">
              <div className="text-xs text-[#c8c0b2] mb-2 flex items-center justify-between flex-wrap gap-1">
                <span>Instant Kitchen Notification:</span>
                <button
                  type="button"
                  onClick={() => setShowMessagePreview(!showMessagePreview)}
                  className="text-[11px] text-[#d4af37] hover:underline"
                >
                  {showMessagePreview ? 'Hide Message Preview' : 'View Prefilled Message'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Primary Button: Universal wa.me link (works on mobile app and desktop) */}
                <a
                  id="btn-whatsapp-order-confirm"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                  <span>Send via WhatsApp</span>
                </a>

                {/* Secondary Button: WhatsApp Web for Desktop users */}
                <a
                  id="btn-whatsapp-web-confirm"
                  href={whatsappWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl border border-emerald-500/40 bg-[#15382a]/70 hover:bg-[#15382a] text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
                  title="Open directly in WhatsApp Web browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Open WhatsApp Web</span>
                </a>
              </div>

              {/* Message preview container */}
              {showMessagePreview && (
                <div className="mt-3 p-3 rounded-lg bg-[#050d0a] border border-[#224d3b] text-left">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#224d3b]/50 mb-2">
                    <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider">
                      Prefilled WhatsApp Message
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyWhatsAppText}
                      className="inline-flex items-center space-x-1 text-[11px] text-[#8ea098] hover:text-[#d4af37]"
                    >
                      {whatsappCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-[#c8c0b2] whitespace-pre-wrap leading-relaxed select-all break-all max-h-48 overflow-y-auto">
                    {whatsappMessage}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Live Kitchen Status Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs flex-wrap gap-1">
              <span className="font-semibold text-[#8ea098] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                Live Order Tracker:
              </span>
              <span className="px-2 py-0.5 rounded bg-[#15382a] border border-[#d4af37] text-[10px] font-bold text-[#d4af37]">
                STATUS: {order.status}
              </span>
            </div>

            <div className="relative pt-1">
              <div className="h-1.5 bg-[#15382a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#d4af37] to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${((activeStep + 1) / statusSteps.length) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-5 gap-1 text-center mt-2">
                {statusSteps.map((step, idx) => (
                  <div key={step.key} className="space-y-0.5 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full mx-auto ${
                        idx <= activeStep ? 'bg-[#d4af37]' : 'bg-[#15382a]'
                      }`}
                    />
                    <span
                      className={`text-[8px] sm:text-[9px] font-medium block truncate ${
                        idx <= activeStep ? 'text-[#d4af37]' : 'text-[#8ea098]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer & Fulfillment Details */}
          <div className="bg-[#07130e] border border-[#224d3b] rounded-xl p-3.5 sm:p-4 text-xs space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#c8c0b2] border-b border-[#224d3b]/60 pb-3">
              <div className="min-w-0">
                <span className="text-[#8ea098] block text-[10px] uppercase font-bold">Customer</span>
                <span className="font-semibold text-[#f6f3ed] break-words">{order.customerName}</span>
              </div>
              <div className="min-w-0">
                <span className="text-[#8ea098] block text-[10px] uppercase font-bold">Mobile</span>
                <span className="font-semibold text-[#f6f3ed] break-all">+91 {order.customerPhone}</span>
              </div>
              <div className="min-w-0">
                <span className="text-[#8ea098] block text-[10px] uppercase font-bold">Order Type</span>
                <span className="font-semibold text-[#d4af37] flex items-center gap-1 flex-wrap">
                  {isDelivery && <Bike className="w-3.5 h-3.5 shrink-0" />}
                  {isPickup && <PackageCheck className="w-3.5 h-3.5 shrink-0" />}
                  {order.orderType === 'dine_in' && <Utensils className="w-3.5 h-3.5 shrink-0" />}
                  <span className="capitalize break-words">
                    {isDelivery ? 'Doorstep Delivery' : isPickup ? 'Store Pickup' : 'Dine-In Table'}
                  </span>
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[#8ea098] block text-[10px] uppercase font-bold">Payment</span>
                <span className="font-semibold text-emerald-400 break-words">
                  {order.paymentStatus === 'CASH_ON_DELIVERY' ? 'Pay on Delivery' : 'Pay at Counter'}
                </span>
              </div>
            </div>

            {/* Delivery address if delivery */}
            {isDelivery && order.deliveryAddress && (
              <div className="p-2.5 rounded-lg bg-[#0e241b] border border-[#224d3b] flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-semibold text-[#f6f3ed] block mb-0.5">Delivery Destination:</span>
                  <p className="text-xs text-[#c8c0b2] break-words">{order.deliveryAddress}</p>
                </div>
              </div>
            )}

            {/* Table number if dine-in */}
            {order.orderType === 'dine_in' && order.tableNumber && (
              <div className="p-2.5 rounded-lg bg-[#0e241b] border border-[#224d3b] flex items-center space-x-2">
                <Utensils className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                <div>
                  <span className="font-semibold text-[#f6f3ed]">Table Number: #{order.tableNumber}</span>
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div className="p-2.5 rounded-lg bg-[#0e241b]/60 border border-[#224d3b]/80 text-[11px] text-[#c8c0b2]">
                <span className="font-semibold text-[#d4af37] block">Chef Note / Special Instructions:</span>
                <span className="break-words">"{order.specialInstructions}"</span>
              </div>
            )}

            {/* Items Breakdown */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[#8ea098] font-semibold block uppercase tracking-wider text-[10px]">
                Items Ordered:
              </span>
              <div className="divide-y divide-[#224d3b]/30">
                {order.items.map((i, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between items-start gap-2 text-[#c8c0b2]">
                    <div className="min-w-0 flex-1">
                      <span className="break-words">
                        <strong className="text-[#f6f3ed]">{i.quantity}×</strong> {i.name}{' '}
                        {i.portion !== 'single' && (
                          <span className="text-[10px] text-[#8ea098]">[{i.portion.toUpperCase()}]</span>
                        )}
                        {i.dietaryChoice && (
                          <span
                            className={`ml-1 text-[9px] font-bold px-1 py-0.2 rounded inline-block ${
                              i.dietaryChoice === 'veg'
                                ? 'text-emerald-400 bg-emerald-950/60'
                                : 'text-red-400 bg-red-950/60'
                            }`}
                          >
                            {i.dietaryChoice.toUpperCase()}
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-mono text-[#f6f3ed] shrink-0">₹{i.totalPrice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Charges Breakdown */}
            <div className="border-t border-[#224d3b] pt-2 space-y-1 text-xs text-[#c8c0b2]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5% Restaurant Tax):</span>
                <span>₹{order.tax}</span>
              </div>
              {order.packagingCharge > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Takeaway Packaging:</span>
                  <span>₹{order.packagingCharge}</span>
                </div>
              )}
              {isDelivery && (
                <div className="flex justify-between items-center gap-2">
                  <span className="shrink-0">Delivery Charge:</span>
                  {order.deliveryFee === 0 ? (
                    <span className="text-emerald-400 font-semibold uppercase text-[10px]">FREE</span>
                  ) : (
                    <span>₹{order.deliveryFee}</span>
                  )}
                </div>
              )}
              <div className="border-t border-[#224d3b]/80 pt-1.5 flex justify-between items-center text-sm font-bold text-[#f6f3ed]">
                <span className="font-serif">Grand Total:</span>
                <span className="font-serif text-base text-[#d4af37]">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Restaurant Location & Contact Reminder */}
          <div className="p-3 bg-[#15382a]/40 rounded-xl border border-[#224d3b] text-xs text-[#c8c0b2] space-y-1.5">
            <div className="flex items-center space-x-1.5 text-[#f6f3ed] font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              <span className="break-words">{RESTAURANT_CONFIG.address.full}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-0.5 gap-1">
              <div className="flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <a href={`tel:${RESTAURANT_CONFIG.phoneDisplay.replace(/\s/g, '')}`} className="hover:text-[#d4af37] font-semibold text-[#f6f3ed]">
                  {RESTAURANT_CONFIG.phoneDisplay}
                </a>
              </div>
              <span className="text-[10px] text-[#8ea098]">Estimated preparation: 20–30 mins</span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-1">
            <button
              type="button"
              id="btn-close-confirm-modal"
              onClick={() => {
                onClose();
                onViewMenu();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f1d779] to-[#c59b27] hover:brightness-110 text-[#091711] font-bold text-xs uppercase tracking-wider transition-all shadow active:scale-[0.98] text-center"
            >
              Order Another Item / Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
