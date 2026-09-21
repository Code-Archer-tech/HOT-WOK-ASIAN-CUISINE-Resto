import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Minus, ShoppingBag, Flame, Sparkles, Check, Info, ArrowRight } from 'lucide-react';
import { MenuItem } from '../types/restaurant';
import { useCart } from '../context/CartContext';

interface ItemDetailModalProps {
  item: MenuItem | null;
  allMenuItems?: MenuItem[];
  onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, allMenuItems = [], onClose }) => {
  const { addToCart, getItemQuantity, setIsCartOpen } = useCart();

  // Active item tracking (allows switching to veg/non-veg counterpart if one exists)
  const [activeItem, setActiveItem] = useState<MenuItem | null>(item);
  const [dietaryChoice, setDietaryChoice] = useState<'veg' | 'non-veg'>('veg');
  const [portion, setPortion] = useState<'single' | 'half' | 'full'>('full');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Sync when `item` prop changes
  useEffect(() => {
    if (item) {
      setActiveItem(item);
      setDietaryChoice(item.isVeg ? 'veg' : 'non-veg');
      setPortion(item.priceType === 'portion' ? 'full' : 'single');
      setQuantity(1);
      setAddedNotice(false);
    }
  }, [item]);

  // Find Veg/Non-Veg counterpart if available in menu items
  const counterpartItem = useMemo(() => {
    if (!activeItem || !allMenuItems.length) return null;
    const nameLower = activeItem.name.toLowerCase();

    if (activeItem.isVeg) {
      // Find Non-Veg / Chicken equivalent
      const nonVegKeywords = nameLower
        .replace(/^veg\s+/, '')
        .replace(/\s+veg$/, '')
        .replace(/^paneer\s+/, '');

      return allMenuItems.find(
        (m) =>
          !m.isVeg &&
          m.id !== activeItem.id &&
          (m.name.toLowerCase().includes(nonVegKeywords) ||
            (m.categoryId === activeItem.categoryId &&
              m.name.toLowerCase().replace(/chicken\s+/g, '').includes(nonVegKeywords)))
      );
    } else {
      // Find Veg equivalent
      const vegKeywords = nameLower
        .replace(/^chicken\s+/, '')
        .replace(/\s+chicken$/, '')
        .replace(/^egg\s+/, '');

      return allMenuItems.find(
        (m) =>
          m.isVeg &&
          m.id !== activeItem.id &&
          (m.name.toLowerCase().includes(vegKeywords) ||
            (m.categoryId === activeItem.categoryId &&
              m.name.toLowerCase().replace(/veg\s+|paneer\s+/g, '').includes(vegKeywords)))
      );
    }
  }, [activeItem, allMenuItems]);

  // Determine if Veg/Non-Veg toggle is applicable
  const hasDietaryChoice = Boolean(
    activeItem?.hasDietaryOption ||
      (activeItem?.vegPrice && activeItem?.nonVegPrice) ||
      counterpartItem ||
      ['noodles', 'rice', 'soups', 'starters', 'chopsuey', 'gravy', 'pot-rice', 'kepsa', 'ramen'].includes(
        activeItem?.categoryId || ''
      )
  );

  if (!activeItem) return null;

  // Handle switching dietary choice
  const handleDietaryToggle = (choice: 'veg' | 'non-veg') => {
    setDietaryChoice(choice);
    if (choice !== (activeItem.isVeg ? 'veg' : 'non-veg') && counterpartItem) {
      // Switch active item to counterpart
      setActiveItem(counterpartItem);
    }
  };

  // Price Calculation
  let basePrice = activeItem.price;
  if (activeItem.priceType === 'portion') {
    basePrice = portion === 'half' ? (activeItem.halfPrice || activeItem.price) : (activeItem.fullPrice || activeItem.price);
  } else if (dietaryChoice === 'veg' && typeof activeItem.vegPrice === 'number') {
    basePrice = activeItem.vegPrice;
  } else if (dietaryChoice === 'non-veg' && typeof activeItem.nonVegPrice === 'number') {
    basePrice = activeItem.nonVegPrice;
  }

  const effectivePortion = activeItem.priceType === 'portion' ? portion : 'single';
  const effectiveDietaryChoice = hasDietaryChoice ? dietaryChoice : (activeItem.isVeg ? 'veg' : 'non-veg');
  const existingInCart = getItemQuantity(activeItem.id, effectivePortion, effectiveDietaryChoice);

  const handleAddToCart = () => {
    addToCart(activeItem, effectivePortion, quantity, effectiveDietaryChoice);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
    }, 1200);
  };

  const getPortionServingHint = (p: 'half' | 'full') => {
    const nameLower = activeItem.name.toLowerCase();
    const catLower = (activeItem.categoryName || activeItem.category || '').toLowerCase();
    if (nameLower.includes('lollipop')) {
      return p === 'half' ? '3 Pieces' : '6 Pieces';
    }
    if (nameLower.includes('tandoori chicken')) {
      return p === 'half' ? '2–4 Pieces' : '4–8 Pieces';
    }
    if (catLower.includes('kepsa')) {
      return p === 'half' ? 'Serves 1–2 Guests' : 'Serves 3–4 Guests';
    }
    return p === 'half' ? 'Serves 1–2' : 'Serves 2–3';
  };

  return (
    <div
      id="item-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        id={`item-modal-${activeItem.id}`}
        className="relative w-full max-w-xl bg-gradient-to-b from-[#091b13] via-[#071610] to-[#040e0a] border-2 border-[#d4af37]/60 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden text-[#f6f3ed] max-h-[92vh] flex flex-col transform transition-transform duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Asian Geometric Gold Corner Accents */}
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
        <div className="relative h-52 sm:h-60 w-full overflow-hidden bg-[#06140e] flex-shrink-0">
          <img
            src={activeItem.image}
            alt={activeItem.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#091b13] via-[#091b13]/30 to-black/40" />

          {/* Hot Wok Badge */}
          <div className="absolute top-3.5 left-4 z-20 flex items-center gap-2">
            <span className="bg-[#b31b1b]/90 border border-[#d4af37] text-[#f6f3ed] font-serif text-[11px] font-bold px-2 py-0.5 rounded-sm tracking-widest shadow">
              熱鑊 HOT WOK
            </span>
            {activeItem.isFeatured && (
              <span className="bg-[#d4af37] text-[#091711] font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                <Sparkles className="w-3 h-3" />
                <span>Chef's Signature</span>
              </span>
            )}
          </div>

          {/* Badges on Bottom of Image */}
          <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-[#07130e]/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#224d3b] flex items-center space-x-1.5 shadow">
                {dietaryChoice === 'veg' ? (
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
                {activeItem.cuisine} Asian
              </span>
            </div>

            {/* Spice Meter */}
            {activeItem.spiceLevel > 0 && (
              <div className="flex items-center gap-1 bg-[#07130e]/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#224d3b] text-amber-400">
                <span className="text-[10px] uppercase font-bold text-[#c8c0b2] mr-0.5">Spice:</span>
                {Array.from({ length: activeItem.spiceLevel }).map((_, i) => (
                  <Flame key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#d4af37] font-semibold mb-1">
              <span>{activeItem.categoryName || activeItem.category}</span>
              {activeItem.subcategory && (
                <>
                  <span>•</span>
                  <span className="text-[#8ea098]">{activeItem.subcategory}</span>
                </>
              )}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#f6f3ed] tracking-tight leading-snug">
              {activeItem.name}
            </h2>
            <p className="text-sm text-[#c8c0b2] mt-1.5 leading-relaxed font-light">
              {activeItem.description}
            </p>
          </div>

          {/* 1. SELECT VEG / NON-VEG IF APPLICABLE */}
          {hasDietaryChoice && (
            <div className="space-y-2 bg-[#091f15] border border-[#224d3b] rounded-2xl p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase font-bold tracking-wider text-[#d4af37]">
                  1. Select Dietary Preference
                </label>
                <span className="text-[11px] text-[#8ea098]">Choose preparation</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id={`modal-diet-veg-${activeItem.id}`}
                  onClick={() => handleDietaryToggle('veg')}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between ${
                    dietaryChoice === 'veg'
                      ? 'border-emerald-500 bg-emerald-950/40 text-[#f6f3ed] ring-1 ring-emerald-500/80 shadow-md'
                      : 'border-[#224d3b] bg-[#07130e] text-[#c8c0b2] hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-4 h-4 border-2 border-emerald-500 p-0.5 rounded-sm flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-[#f6f3ed]">Pure Veg</span>
                      <span className="text-[10px] text-emerald-400">Fresh vegetables / Paneer</span>
                    </div>
                  </div>
                  {dietaryChoice === 'veg' && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                </button>

                <button
                  type="button"
                  id={`modal-diet-nonveg-${activeItem.id}`}
                  onClick={() => handleDietaryToggle('non-veg')}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between ${
                    dietaryChoice === 'non-veg'
                      ? 'border-red-500 bg-red-950/40 text-[#f6f3ed] ring-1 ring-red-500/80 shadow-md'
                      : 'border-[#224d3b] bg-[#07130e] text-[#c8c0b2] hover:border-red-500/50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-4 h-4 border-2 border-red-500 p-0.5 rounded-sm flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-red-500 rotate-45" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-[#f6f3ed]">Non-Veg</span>
                      <span className="text-[10px] text-red-400">Tender Chicken / Egg</span>
                    </div>
                  </div>
                  {dietaryChoice === 'non-veg' && <Check className="w-4 h-4 text-red-400 flex-shrink-0" />}
                </button>
              </div>
            </div>
          )}

          {/* 2. SELECT HALF / FULL IF APPLICABLE */}
          {activeItem.priceType === 'portion' && activeItem.halfPrice && activeItem.fullPrice && (
            <div className="space-y-2 bg-[#091f15] border border-[#224d3b] rounded-2xl p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase font-bold tracking-wider text-[#d4af37]">
                  2. Select Portion Size
                </label>
                <span className="text-[11px] text-[#8ea098]">Half or Full</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id={`modal-portion-half-${activeItem.id}`}
                  onClick={() => setPortion('half')}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    portion === 'half'
                      ? 'border-[#d4af37] bg-gradient-to-br from-[#1c4734] to-[#123124] text-[#f6f3ed] shadow-md ring-1 ring-[#d4af37]'
                      : 'border-[#224d3b] bg-[#07130e] text-[#c8c0b2] hover:border-[#d4af37]/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-[#f6f3ed]">Half Portion</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${portion === 'half' ? 'bg-[#d4af37]' : 'border border-[#8ea098]'}`} />
                  </div>
                  <span className="text-[11px] text-[#8ea098]">{getPortionServingHint('half')}</span>
                  <span className="font-serif text-base font-bold text-[#d4af37] mt-1.5">
                    ₹{activeItem.halfPrice}
                  </span>
                </button>

                <button
                  type="button"
                  id={`modal-portion-full-${activeItem.id}`}
                  onClick={() => setPortion('full')}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    portion === 'full'
                      ? 'border-[#d4af37] bg-gradient-to-br from-[#1c4734] to-[#123124] text-[#f6f3ed] shadow-md ring-1 ring-[#d4af37]'
                      : 'border-[#224d3b] bg-[#07130e] text-[#c8c0b2] hover:border-[#d4af37]/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-[#f6f3ed]">Full Portion</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${portion === 'full' ? 'bg-[#d4af37]' : 'border border-[#8ea098]'}`} />
                  </div>
                  <span className="text-[11px] text-[#8ea098]">{getPortionServingHint('full')}</span>
                  <span className="font-serif text-base font-bold text-[#d4af37] mt-1.5">
                    ₹{activeItem.fullPrice}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 3. QUANTITY & 4. ADD TO CART */}
          <div className="pt-2 border-t border-[#224d3b]/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Quantity Stepper */}
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-[#0d2218] border border-[#224d3b] rounded-xl p-1.5 px-3">
              <span className="text-xs text-[#8ea098] uppercase font-semibold">
                Qty:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id={`modal-qty-minus-${activeItem.id}`}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-[#07130e] hover:bg-[#15382a] text-[#f6f3ed] flex items-center justify-center transition border border-[#224d3b] active:scale-95"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center font-bold text-[#d4af37] text-base">
                  {quantity}
                </span>
                <button
                  type="button"
                  id={`modal-qty-plus-${activeItem.id}`}
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-[#07130e] hover:bg-[#15382a] text-[#f6f3ed] flex items-center justify-center transition border border-[#224d3b] active:scale-95"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Add to Cart CTA */}
            <button
              type="button"
              id={`modal-add-to-cart-${activeItem.id}`}
              disabled={!activeItem.isAvailable}
              onClick={handleAddToCart}
              className={`flex-1 py-3 px-5 rounded-xl font-bold flex items-center justify-center gap-2 text-[#091711] transition-all duration-200 shadow-xl ${
                !activeItem.isAvailable
                  ? 'bg-[#15382a] text-[#8ea098] cursor-not-allowed border border-[#224d3b]'
                  : addedNotice
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-[#d4af37] via-[#f1d779] to-[#c59b27] hover:brightness-110 active:scale-[0.98]'
              }`}
            >
              {addedNotice ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-xs uppercase tracking-wider">Item Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-bold">
                    Add to Cart • ₹{basePrice * quantity}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Quick Cart Actions */}
          <div className="flex items-center justify-between pt-1 text-xs text-[#8ea098]">
            {existingInCart > 0 ? (
              <span className="text-[#d4af37] font-medium">
                ✓ Currently {existingInCart} in your cart
              </span>
            ) : (
              <span>Freshly prepared to order</span>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsCartOpen(true);
              }}
              className="text-[#d4af37] hover:underline flex items-center space-x-1 font-semibold"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
