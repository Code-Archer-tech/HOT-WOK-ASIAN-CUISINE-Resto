import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingBag, Flame, Sparkles, Check, Info } from 'lucide-react';
import { MenuItem } from '../types/restaurant';
import { useCart } from '../context/CartContext';

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose }) => {
  const { addToCart, getItemQuantity, updateQuantity } = useCart();
  const [portion, setPortion] = useState<'single' | 'half' | 'full'>('full');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!item) return null;

  const currentPrice =
    item.priceType === 'portion'
      ? portion === 'half'
        ? item.halfPrice || item.price
        : item.fullPrice || item.price
      : item.price;

  const effectivePortion = item.priceType === 'portion' ? portion : 'single';
  const cartItemId = `${item.id}-${effectivePortion}`;
  const existingInCart = getItemQuantity(item.id, effectivePortion);

  const handleAddToCart = () => {
    addToCart(item, effectivePortion, quantity);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 800);
  };

  const getPortionServingHint = (p: 'half' | 'full') => {
    const nameLower = item.name.toLowerCase();
    const catLower = (item.categoryName || item.category || '').toLowerCase();
    if (nameLower.includes('lollipop')) {
      return p === 'half' ? '3 Pieces' : '6 Pieces';
    }
    if (nameLower.includes('tandoori chicken')) {
      return p === 'half' ? '2-4 Pieces' : '4-8 Pieces';
    }
    if (catLower.includes('kepsa')) {
      return p === 'half' ? 'Serves 1–2 Guests' : 'Serves 3–4 Guests';
    }
    return p === 'half' ? 'Serves 1–2' : 'Serves 2–3';
  };

  return (
    <AnimatePresence>
      <div
        id="item-detail-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          id={`item-modal-${item.id}`}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-gradient-to-b from-[#091b13] via-[#071610] to-[#040e0a] border-2 border-[#d4af37]/60 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden text-[#f6f3ed] max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Asian Geometric Gold Accent Corner */}
          <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none border-t-2 border-l-2 border-[#d4af37] z-20 m-2 rounded-tl-sm opacity-80" />
          <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none border-t-2 border-r-2 border-[#d4af37] z-20 m-2 rounded-tr-sm opacity-80" />
          <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none border-b-2 border-l-2 border-[#d4af37] z-20 m-2 rounded-bl-sm opacity-80" />
          <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none border-b-2 border-r-2 border-[#d4af37] z-20 m-2 rounded-br-sm opacity-80" />

          {/* Close Button */}
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-black/70 hover:bg-black/95 text-[#f6f3ed] hover:text-[#d4af37] flex items-center justify-center transition border border-[#d4af37]/40 shadow-lg active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Dish Image Banner */}
          <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-[#06140e] flex-shrink-0">
            <img
              src={item.image}
              alt={item.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#091b13] via-[#091b13]/30 to-black/40" />

            {/* Traditional Hot Wok Stamp */}
            <div className="absolute top-3.5 left-4 z-20 flex items-center gap-2">
              <span className="bg-[#b31b1b]/90 border border-[#d4af37] text-[#f6f3ed] font-serif text-[11px] font-bold px-2 py-0.5 rounded-sm tracking-widest shadow">
                熱鑊 HOT WOK
              </span>
              {item.isFeatured && (
                <span className="bg-[#d4af37] text-[#091711] font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                  <Sparkles className="w-3 h-3" />
                  <span>Chef's Signature</span>
                </span>
              )}
            </div>

            {/* Badges on Bottom of Image */}
            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Standard Veg / Non-Veg emblem */}
                <div className="bg-[#07130e]/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#224d3b] flex items-center space-x-1.5 shadow">
                  {item.isVeg ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-emerald-500 p-0.5 rounded-sm flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400">PURE VEG</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-red-500 p-0.5 rounded-sm flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-red-500 rotate-45" />
                      </div>
                      <span className="text-[11px] font-bold text-red-400">NON-VEG</span>
                    </>
                  )}
                </div>

                <span className="bg-[#15382a]/90 backdrop-blur-md border border-[#d4af37]/40 text-[#d4af37] text-[11px] font-semibold px-2.5 py-1 rounded-md">
                  {item.cuisine} Asian
                </span>
              </div>

              {/* Spice Meter */}
              {item.spiceLevel > 0 && (
                <div className="flex items-center gap-1 bg-[#07130e]/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#224d3b] text-amber-400">
                  <span className="text-[10px] uppercase font-bold text-[#c8c0b2] mr-0.5">Spice:</span>
                  {Array.from({ length: item.spiceLevel }).map((_, i) => (
                    <Flame key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Content - Scrollable if necessary */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#d4af37] font-semibold mb-1">
                <span>{item.categoryName || item.category}</span>
                {item.subcategory && (
                  <>
                    <span>•</span>
                    <span className="text-[#8ea098]">{item.subcategory}</span>
                  </>
                )}
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#f6f3ed] tracking-tight leading-snug">
                {item.name}
              </h2>
              <p className="text-sm text-[#c8c0b2] mt-2 leading-relaxed font-light">
                {item.description}
              </p>
            </div>

            {/* Serving / Culinary Note */}
            <div className="flex items-start gap-2.5 bg-[#0f271d]/60 border border-[#224d3b] p-3 rounded-xl text-xs text-[#c8c0b2]">
              <Info className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[#f6f3ed] font-semibold">Fresh Wok Preparation: </span>
                Made freshly upon order in high-heat woks with authentic aromatics, ginger, garlic, and specialty sauces.
              </div>
            </div>

            {/* Portion Selection if Portion pricing */}
            {item.priceType === 'portion' && item.halfPrice && item.fullPrice && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-bold tracking-wider text-[#d4af37]">
                    Select Serving Portion
                  </label>
                  <span className="text-[11px] text-[#8ea098]">Tap to toggle</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    id={`modal-portion-half-${item.id}`}
                    onClick={() => setPortion('half')}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                      portion === 'half'
                        ? 'border-[#d4af37] bg-gradient-to-br from-[#1c4734] to-[#123124] text-[#f6f3ed] shadow-md ring-1 ring-[#d4af37]'
                        : 'border-[#224d3b] bg-[#091711] text-[#c8c0b2] hover:border-[#d4af37]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-sm font-bold text-[#f6f3ed]">Half Portion</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${portion === 'half' ? 'bg-[#d4af37]' : 'border border-[#8ea098]'}`} />
                    </div>
                    <span className="text-xs text-[#8ea098]">{getPortionServingHint('half')}</span>
                    <span className="font-serif text-lg font-bold text-[#d4af37] mt-2">
                      ₹{item.halfPrice}
                    </span>
                  </button>

                  <button
                    type="button"
                    id={`modal-portion-full-${item.id}`}
                    onClick={() => setPortion('full')}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                      portion === 'full'
                        ? 'border-[#d4af37] bg-gradient-to-br from-[#1c4734] to-[#123124] text-[#f6f3ed] shadow-md ring-1 ring-[#d4af37]'
                        : 'border-[#224d3b] bg-[#091711] text-[#c8c0b2] hover:border-[#d4af37]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-sm font-bold text-[#f6f3ed]">Full Portion</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${portion === 'full' ? 'bg-[#d4af37]' : 'border border-[#8ea098]'}`} />
                    </div>
                    <span className="text-xs text-[#8ea098]">{getPortionServingHint('full')}</span>
                    <span className="font-serif text-lg font-bold text-[#d4af37] mt-2">
                      ₹{item.fullPrice}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Controls: Quantity + Add to Cart */}
            <div className="pt-3 border-t border-[#224d3b]/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
              {/* Quantity Stepper */}
              <div className="flex items-center justify-between sm:justify-start gap-3 bg-[#0d2218] border border-[#224d3b] rounded-xl p-1.5 px-2">
                <span className="text-xs text-[#8ea098] uppercase font-semibold pl-1 sm:hidden">
                  Quantity:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id={`modal-qty-minus-${item.id}`}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg bg-[#07130e] hover:bg-[#15382a] text-[#f6f3ed] flex items-center justify-center transition border border-[#224d3b] active:scale-95"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-[#d4af37] text-base">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    id={`modal-qty-plus-${item.id}`}
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 rounded-lg bg-[#07130e] hover:bg-[#15382a] text-[#f6f3ed] flex items-center justify-center transition border border-[#224d3b] active:scale-95"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart CTA */}
              <button
                type="button"
                id={`modal-add-to-cart-${item.id}`}
                disabled={!item.isAvailable}
                onClick={handleAddToCart}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 text-[#091711] transition-all duration-200 shadow-xl ${
                  !item.isAvailable
                    ? 'bg-[#15382a] text-[#8ea098] cursor-not-allowed border border-[#224d3b]'
                    : addedNotice
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gradient-to-r from-[#d4af37] via-[#f1d779] to-[#c59b27] hover:brightness-110 active:scale-[0.98]'
                }`}
              >
                {addedNotice ? (
                  <>
                    <Check className="w-5 h-5 text-white" />
                    <span className="text-white font-bold">Added to Your Order!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      Add to Order • ₹{currentPrice * quantity}
                    </span>
                  </>
                )}
              </button>
            </div>

            {existingInCart > 0 && (
              <div className="text-center text-xs text-[#d4af37]">
                ✓ Currently {existingInCart} of this item in your cart
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
