import React from 'react';
import { CheckCircle2, MessageCircle, Clock, MapPin, Phone, Copy, Check, ArrowRight, Utensils } from 'lucide-react';
import { Order } from '../types/restaurant';
import { getWhatsAppUrl } from '../server/apiHandler';

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
  const [copied, setCopied] = React.useState(false);

  if (!order) return null;

  const whatsappUrl = getWhatsAppUrl(order);

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusSteps = [
    { key: 'NEW', label: 'Received' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PREPARING', label: 'In Kitchen' },
    { key: 'READY', label: 'Ready' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  const currentStatusIndex = statusSteps.findIndex((s) => s.key === order.status);
  const activeStep = currentStatusIndex >= 0 ? currentStatusIndex : 0;

  return (
    <div id="order-confirm-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center">
      <div className="bg-[#091711] border border-[#224d3b] rounded-2xl max-w-xl w-full text-[#f6f3ed] shadow-2xl overflow-hidden animate-scale-up">
        {/* Banner with Success */}
        <div className="bg-gradient-to-r from-[#15382a] to-[#0f271d] p-6 border-b border-[#224d3b] text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-[#091711] border-2 border-[#d4af37] flex items-center justify-center mx-auto text-[#d4af37] shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#f6f3ed]">Order Placed Successfully!</h3>
          <p className="text-xs text-[#d4af37] tracking-wider uppercase font-semibold">
            Hot Wok Asian Cuisine • Urban Empire, Mumbra
          </p>
        </div>

        <div className="p-6 sm:p-7 space-y-6">
          {/* Order ID & WhatsApp Action */}
          <div className="bg-[#07130e] border border-[#224d3b] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8ea098] tracking-widest block">
                Official Order Reference
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="font-mono text-base font-bold text-[#d4af37]">{order.orderNumber}</span>
                <button
                  onClick={handleCopyOrderNumber}
                  className="p-1 text-[#c8c0b2] hover:text-[#d4af37] transition-colors"
                  title="Copy order number"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Direct WhatsApp Order Submission */}
            <a
              id="btn-whatsapp-order-confirm"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Send via WhatsApp</span>
            </a>
          </div>

          {/* Live Kitchen Status Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#8ea098] uppercase tracking-wider">Live Kitchen Tracker:</span>
              <span className="px-2 py-0.5 rounded bg-[#15382a] border border-[#d4af37] text-[10px] font-bold text-[#d4af37]">
                STATUS: {order.status}
              </span>
            </div>

            <div className="relative pt-2">
              <div className="h-1.5 bg-[#15382a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#d4af37] to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${((activeStep + 1) / statusSteps.length) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-5 gap-1 text-center mt-2">
                {statusSteps.map((step, idx) => (
                  <div key={step.key} className="space-y-0.5">
                    <div
                      className={`w-2 h-2 rounded-full mx-auto ${
                        idx <= activeStep ? 'bg-[#d4af37]' : 'bg-[#15382a]'
                      }`}
                    />
                    <span
                      className={`text-[9px] font-medium block truncate ${
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

          {/* Order Details Brief */}
          <div className="bg-[#07130e] border border-[#224d3b] rounded-xl p-4 text-xs space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-[#c8c0b2] border-b border-[#224d3b]/60 pb-2">
              <div>
                <span className="text-[#8ea098] block">Customer:</span>
                <span className="font-semibold text-[#f6f3ed]">{order.customerName}</span>
              </div>
              <div>
                <span className="text-[#8ea098] block">Contact:</span>
                <span className="font-semibold text-[#f6f3ed]">+91 {order.customerPhone}</span>
              </div>
              <div>
                <span className="text-[#8ea098] block">Dining Mode:</span>
                <span className="font-semibold text-[#d4af37] capitalize">
                  {order.orderType === 'dine_in' ? 'Dine-in' : 'Takeaway Parcel'}
                  {order.tableNumber ? ` (${order.tableNumber})` : ''}
                </span>
              </div>
              <div>
                <span className="text-[#8ea098] block">Payment:</span>
                <span className="font-semibold text-emerald-400">Pay at Restaurant</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[#8ea098] font-semibold block uppercase tracking-wider text-[10px]">
                Items Ordered:
              </span>
              {order.items.map((i, idx) => (
                <div key={idx} className="flex justify-between text-[#c8c0b2]">
                  <span>
                    {i.quantity}x {i.name} {i.portion !== 'single' && `(${i.portion.toUpperCase()})`}
                  </span>
                  <span className="font-mono text-[#f6f3ed]">₹{i.totalPrice}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-[#224d3b] pt-2 flex justify-between items-center text-sm font-bold text-[#f6f3ed]">
              <span className="font-serif">Total Payable:</span>
              <span className="font-serif text-base text-[#d4af37]">₹{order.total}</span>
            </div>
          </div>

          {/* Restaurant Location & Contact Reminder */}
          <div className="p-3 bg-[#15382a]/40 rounded-lg border border-[#224d3b] text-xs text-[#c8c0b2] space-y-1">
            <div className="flex items-center space-x-1.5 text-[#f6f3ed] font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Shop No. A/1, Urban Empire, Kausar Baug, Mumbra</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
              <a href="tel:9987974833" className="hover:text-[#d4af37] font-semibold text-[#f6f3ed]">
                99879 74833
              </a>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              id="btn-close-confirm-modal"
              onClick={() => {
                onClose();
                onViewMenu();
              }}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e2c258] hover:to-[#c59b27] text-[#091711] font-bold text-xs uppercase tracking-wider transition-all shadow"
            >
              Done & Explore More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
