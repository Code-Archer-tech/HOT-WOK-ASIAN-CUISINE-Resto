import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sparkles,
  Flame,
  Check,
  Plus,
  Minus,
  AlertCircle,
  Eye,
  Star,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Columns2,
  X,
  Clock,
  Award,
} from 'lucide-react';
import { Category, MenuItem } from '../types/restaurant';
import { useCart } from '../context/CartContext';
import { ItemDetailModal } from './ItemDetailModal';

interface MenuSectionProps {
  categories: Category[];
  menuItems: MenuItem[];
  isLoading: boolean;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  categories,
  menuItems,
  isLoading,
}) => {
  const { addItem, updateQuantity, getItemQuantity } = useCart();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under250' | '250to350' | 'above350'>('all');
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(false);
  const [desktopLayout, setDesktopLayout] = useState<'columns' | 'grid'>('columns');

  // Portion selection map for items with half/full: itemId -> 'half' | 'full'
  const [selectedPortions, setSelectedPortions] = useState<Record<string, 'half' | 'full'>>({});
  // Item detail modal state
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  // Feedback indicator for item added: cartItemId -> boolean
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Category horizontal scroll ref
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const offset = direction === 'left' ? -240 : 240;
      categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const handlePortionSelect = (itemId: string, portion: 'half' | 'full') => {
    setSelectedPortions((prev) => ({ ...prev, [itemId]: portion }));
  };

  const handleAddToCart = (item: MenuItem) => {
    const portion = item.priceType === 'portion' ? (selectedPortions[item.id] || 'full') : 'single';
    addItem(item, portion);
    const cartItemId = `${item.id}-${portion}`;
    setRecentlyAddedId(cartItemId);
    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1200);
  };

  // Filter logic
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Live search by dish name, description, category, and subcategory
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesCategory =
          item.category?.toLowerCase().includes(q) || item.categoryName?.toLowerCase().includes(q);
        const matchesSubcategory = item.subcategory?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCategory && !matchesSubcategory) {
          return false;
        }
      }

      // Featured filter
      if (featuredOnly && !item.isFeatured) {
        return false;
      }

      // Diet filter (Veg / Non-Veg)
      if (dietFilter === 'veg' && !item.isVeg) return false;
      if (dietFilter === 'non-veg' && item.isVeg) return false;

      // Category filter
      if (selectedCategory !== 'all') {
        if (item.categoryId !== selectedCategory && item.category !== selectedCategory) {
          return false;
        }
      }

      // Cuisine filter
      if (cuisineFilter !== 'all' && item.cuisine !== cuisineFilter) {
        return false;
      }

      // Price filter
      const effectivePrice = item.price;
      if (priceFilter === 'under250' && effectivePrice > 250) return false;
      if (priceFilter === '250to350' && (effectivePrice < 250 || effectivePrice > 350)) return false;
      if (priceFilter === 'above350' && effectivePrice < 350) return false;

      return true;
    });
  }, [menuItems, searchQuery, selectedCategory, dietFilter, cuisineFilter, priceFilter, featuredOnly]);

  // Curated Chef Signatures for Top Highlight Spotlight
  const signatureItems = useMemo(() => {
    return menuItems.filter((m) => m.isFeatured).slice(0, 8);
  }, [menuItems]);

  // Group filtered items by category if "all" categories are displayed and no search query active
  const groupedCategories = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery.trim() !== '') {
      return null;
    }

    const groups: { category: Category; items: MenuItem[] }[] = [];
    categories.forEach((cat) => {
      const itemsInCat = filteredItems.filter(
        (m) => m.categoryId === cat.id || m.category === cat.name
      );
      if (itemsInCat.length > 0) {
        groups.push({ category: cat, items: itemsInCat });
      }
    });

    // Also include any items that might not have matched existing categories
    const allGroupedItemIds = new Set(groups.flatMap((g) => g.items.map((i) => i.id)));
    const remaining = filteredItems.filter((i) => !allGroupedItemIds.has(i.id));
    if (remaining.length > 0) {
      groups.push({
        category: { id: 'other', name: 'House Specialties', slug: 'specialties', sortOrder: 99 },
        items: remaining,
      });
    }

    return groups;
  }, [filteredItems, categories, selectedCategory, searchQuery]);

  const getPortionServingHint = (item: MenuItem, portion: 'half' | 'full') => {
    const nameLower = item.name.toLowerCase();
    const catLower = (item.categoryName || item.category || '').toLowerCase();
    if (nameLower.includes('lollipop')) {
      return portion === 'half' ? '3 Pcs' : '6 Pcs';
    }
    if (catLower.includes('kepsa')) {
      return portion === 'half' ? 'Serves 1–2' : 'Serves 3–4';
    }
    return portion === 'half' ? 'Half' : 'Full';
  };

  return (
    <section
      id="menu-section"
      className="relative py-12 sm:py-20 bg-gradient-to-b from-[#06150e] via-[#081a12] to-[#040e0a] text-[#f6f3ed] min-h-screen"
    >
      {/* Subtle Asian Radial Ambient Glow & Lattice Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#d4af37]/20 to-transparent blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ============================================================== */}
        {/* SECTION HEADER: High-End Asian Restaurant Presentation         */}
        {/* ============================================================== */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-10 sm:mb-14">
          {/* Traditional Seal & Overhead Tagline */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-[#0d261b] border border-[#d4af37]/50 shadow-[0_0_20px_rgba(212,175,55,0.15)] text-[#d4af37] text-xs font-semibold tracking-widest uppercase">
            <span className="font-serif text-sm">熱鑊</span>
            <span className="w-1 h-1 rounded-full bg-[#d4af37]" />
            <span>Master Wok Catalog & Fine Asian Dining</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#f6f3ed] leading-tight">
            The Hot Wok Culinary Menu
          </h2>

          {/* Asian Double Gold Line Divider Motif */}
          <div className="flex items-center justify-center space-x-3 py-1 text-[#d4af37]">
            <span className="w-12 sm:w-20 h-[1px] bg-gradient-to-r from-transparent to-[#d4af37]" />
            <span className="text-sm font-serif">❖ ◈ ❖</span>
            <span className="w-12 sm:w-20 h-[1px] bg-gradient-to-l from-transparent to-[#d4af37]" />
          </div>

          <p className="text-sm sm:text-base text-[#c8c0b2] max-w-2xl mx-auto font-light leading-relaxed">
            Crafted with blazing wok heat, authentic Asian spices, and artisanal culinary recipes.
            Browse our complete selection with live dish customization, portion selections, and instant ordering.
          </p>
        </div>

        {/* ============================================================== */}
        {/* CHEF'S SIGNATURE SHOWCASE CAROUSEL (Featured Dishes)          */}
        {/* ============================================================== */}
        {!searchQuery && selectedCategory === 'all' && signatureItems.length > 0 && (
          <div className="mb-14 bg-gradient-to-r from-[#0a1e15] via-[#0d271c] to-[#0a1e15] border-2 border-[#d4af37]/40 rounded-3xl p-5 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#d4af37] pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#d4af37] pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#d4af37] pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#d4af37] pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 border-b border-[#224d3b]/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-[#d4af37]/15 border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#f6f3ed] flex items-center gap-2">
                    <span>Chef's Signature Selections</span>
                    <span className="text-xs font-sans uppercase tracking-widest px-2 py-0.5 rounded bg-[#d4af37] text-[#07150e] font-extrabold">
                      House Specials
                    </span>
                  </h3>
                  <p className="text-xs text-[#c8c0b2]">
                    Most requested wok specialties by our guests in Mumbra
                  </p>
                </div>
              </div>

              <button
                id="btn-filter-featured-only"
                onClick={() => setFeaturedOnly(!featuredOnly)}
                className={`self-start sm:self-auto text-xs px-3.5 py-1.5 rounded-full font-semibold border transition-all flex items-center space-x-1.5 ${
                  featuredOnly
                    ? 'bg-[#d4af37] text-[#07150e] border-[#d4af37] shadow-md'
                    : 'bg-[#15382a] text-[#d4af37] border-[#d4af37]/40 hover:bg-[#1f4e3b]'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${featuredOnly ? 'fill-[#07150e]' : 'fill-[#d4af37]'}`} />
                <span>{featuredOnly ? 'Showing Signatures Only' : 'View Only Signatures'}</span>
              </button>
            </div>

            {/* Horizontal Scrolling Signature Dishes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {signatureItems.map((item) => {
                const portion = selectedPortions[item.id] || 'full';
                const currentPrice =
                  item.priceType === 'portion'
                    ? portion === 'half'
                      ? item.halfPrice || item.price
                      : item.fullPrice || item.price
                    : item.price;
                const activePortion = item.priceType === 'portion' ? portion : 'single';
                const cartItemId = `${item.id}-${activePortion}`;
                const inCartQty = getItemQuantity(item.id, activePortion);
                const isAdded = recentlyAddedId === cartItemId;

                return (
                  <div
                    key={`featured-${item.id}`}
                    id={`featured-card-${item.id}`}
                    className="bg-[#071610] border border-[#d4af37]/35 hover:border-[#d4af37] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div
                      className="relative h-36 w-full overflow-hidden bg-[#0a1e15] cursor-pointer"
                      onClick={() => setModalItem(item)}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071610] via-transparent to-black/30" />

                      {/* Veg / Non-Veg badge */}
                      <div className="absolute top-2.5 left-2.5 bg-[#071610]/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-[#224d3b] flex items-center space-x-1">
                        {item.isVeg ? (
                          <div className="w-3 h-3 border-2 border-emerald-500 p-0.5 rounded-sm flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                          </div>
                        ) : (
                          <div className="w-3 h-3 border-2 border-red-500 p-0.5 rounded-sm flex items-center justify-center">
                            <div className="w-1 h-1 bg-red-500 rotate-45" />
                          </div>
                        )}
                        <span className="text-[9px] font-bold text-[#c8c0b2]">
                          {item.isVeg ? 'VEG' : 'NON-VEG'}
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 bg-[#d4af37] text-[#07150e] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow">
                        Chef Pick
                      </div>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4
                            onClick={() => setModalItem(item)}
                            className="font-serif text-sm font-bold text-[#f6f3ed] group-hover:text-[#d4af37] transition-colors line-clamp-1 cursor-pointer"
                          >
                            {item.name}
                          </h4>
                          {item.spiceLevel > 0 && (
                            <span className="flex items-center text-amber-400 flex-shrink-0">
                              <Flame className="w-3 h-3 fill-amber-400" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8ea098] line-clamp-1 mt-0.5">
                          {item.categoryName} • {item.cuisine}
                        </p>
                      </div>

                      {/* Portion buttons if applicable */}
                      {item.priceType === 'portion' && item.halfPrice && item.fullPrice && (
                        <div className="grid grid-cols-2 gap-1 bg-[#0d261b] p-1 rounded-lg border border-[#224d3b]">
                          <button
                            type="button"
                            onClick={() => handlePortionSelect(item.id, 'half')}
                            className={`py-1 text-[10px] font-semibold rounded text-center transition ${
                              portion === 'half'
                                ? 'bg-[#d4af37] text-[#07150e]'
                                : 'text-[#c8c0b2] hover:text-white'
                            }`}
                          >
                            Half ₹{item.halfPrice}
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePortionSelect(item.id, 'full')}
                            className={`py-1 text-[10px] font-semibold rounded text-center transition ${
                              portion === 'full'
                                ? 'bg-[#d4af37] text-[#07150e]'
                                : 'text-[#c8c0b2] hover:text-white'
                            }`}
                          >
                            Full ₹{item.fullPrice}
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-[#224d3b]/50">
                        <span className="font-serif text-base font-bold text-[#d4af37]">
                          ₹{currentPrice}
                        </span>

                        {inCartQty > 0 ? (
                          <div className="flex items-center gap-1.5 bg-[#15382a] border border-[#d4af37]/60 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(cartItemId, -1)}
                              className="w-6 h-6 rounded bg-[#071610] text-white flex items-center justify-center text-xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-[#d4af37] px-1">
                              {inCartQty}
                            </span>
                            <button
                              onClick={() => updateQuantity(cartItemId, 1)}
                              className="w-6 h-6 rounded bg-[#071610] text-white flex items-center justify-center text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition shadow ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#d4af37] hover:bg-[#e2c258] text-[#07150e] active:scale-95'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STICKY CATEGORY NAVIGATION BAR & QUICK CONTROLS                */}
        {/* ============================================================== */}
        <div
          id="sticky-category-nav-wrapper"
          className="sticky top-[64px] sm:top-[72px] z-30 mb-8 -mx-4 sm:mx-0 px-4 sm:px-0"
        >
          <div className="bg-[#071610]/95 backdrop-blur-md border border-[#d4af37]/40 sm:rounded-2xl p-3 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.75)] space-y-3">
            {/* Top row: Search Bar + Diet Filter + Layout Toggle */}
            <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
              {/* Luxury Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="menu-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search over 100+ dishes (Kepsa, Hakka Noodles, Dragon Chicken, Ramen, Lollipop)..."
                  className="w-full bg-[#0d261b] border border-[#224d3b] hover:border-[#d4af37]/60 focus:border-[#d4af37] rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    id="btn-clear-search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8ea098] hover:text-[#f6f3ed]"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Diet Filters: All, Pure Veg, Non-Veg */}
              <div className="flex items-center gap-1.5 bg-[#0d261b] p-1 rounded-xl border border-[#224d3b]">
                <button
                  id="filter-diet-all"
                  onClick={() => setDietFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dietFilter === 'all'
                      ? 'bg-[#d4af37] text-[#07150e] shadow'
                      : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                  }`}
                >
                  All ({menuItems.length})
                </button>
                <button
                  id="filter-diet-veg"
                  onClick={() => setDietFilter('veg')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    dietFilter === 'veg'
                      ? 'bg-emerald-700 text-white shadow'
                      : 'text-[#c8c0b2] hover:text-emerald-400'
                  }`}
                >
                  <div className="w-3 h-3 border border-emerald-400 p-0.5 rounded-xs flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <span>Pure Veg</span>
                </button>
                <button
                  id="filter-diet-non-veg"
                  onClick={() => setDietFilter('non-veg')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    dietFilter === 'non-veg'
                      ? 'bg-red-800 text-white shadow'
                      : 'text-[#c8c0b2] hover:text-red-400'
                  }`}
                >
                  <div className="w-3 h-3 border border-red-400 p-0.5 rounded-xs flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-red-400 rotate-45" />
                  </div>
                  <span>Non-Veg</span>
                </button>
              </div>

              {/* Secondary Filters: Cuisine & Price & Layout Switcher */}
              <div className="hidden sm:flex items-center gap-2">
                <select
                  id="filter-price-select"
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value as any)}
                  className="bg-[#0d261b] border border-[#224d3b] hover:border-[#d4af37]/60 rounded-xl px-3 py-2 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="all">Price: All</option>
                  <option value="under250">Under ₹250</option>
                  <option value="250to350">₹250 – ₹350</option>
                  <option value="above350">₹350 & Above</option>
                </select>

                <select
                  id="filter-cuisine-select"
                  value={cuisineFilter}
                  onChange={(e) => setCuisineFilter(e.target.value)}
                  className="bg-[#0d261b] border border-[#224d3b] hover:border-[#d4af37]/60 rounded-xl px-3 py-2 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="all">All Cuisines</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Korean">Korean</option>
                  <option value="Malaysian">Malaysian</option>
                  <option value="Thai">Thai</option>
                </select>

                {/* Desktop Layout Switcher */}
                <div className="hidden lg:flex items-center bg-[#0d261b] p-0.5 rounded-xl border border-[#224d3b]">
                  <button
                    onClick={() => setDesktopLayout('columns')}
                    className={`p-1.5 rounded-lg text-xs transition ${
                      desktopLayout === 'columns'
                        ? 'bg-[#d4af37] text-[#07150e]'
                        : 'text-[#c8c0b2] hover:text-white'
                    }`}
                    title="Fine Dining Columns Layout"
                  >
                    <Columns2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDesktopLayout('grid')}
                    className={`p-1.5 rounded-lg text-xs transition ${
                      desktopLayout === 'grid'
                        ? 'bg-[#d4af37] text-[#07150e]'
                        : 'text-[#c8c0b2] hover:text-white'
                    }`}
                    title="Visual Photo Cards Grid"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Category Horizontal Bar with Scroll Arrows */}
            <div className="relative flex items-center pt-1 border-t border-[#224d3b]/50">
              {/* Left Scroll Button */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollCategories('left')}
                  className="hidden sm:flex absolute left-0 z-10 w-7 h-7 -ml-2 rounded-full bg-[#0d261b] border border-[#d4af37] text-[#d4af37] items-center justify-center shadow-lg hover:bg-[#d4af37] hover:text-[#07150e] transition"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Scrollable Category Tabs */}
              <div
                ref={categoryScrollRef}
                onScroll={checkScroll}
                className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth w-full px-1"
              >
                <button
                  id="cat-tab-all"
                  onClick={() => setSelectedCategory('all')}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 flex items-center space-x-1.5 border ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-[#07150e] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                      : 'bg-[#0d261b] text-[#c8c0b2] hover:text-[#f6f3ed] border-[#224d3b]'
                  }`}
                >
                  <span>All Dishes</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === 'all'
                        ? 'bg-[#07150e]/30 text-[#07150e]'
                        : 'bg-[#15382a] text-[#d4af37]'
                    }`}
                  >
                    {menuItems.length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const count = menuItems.filter(
                    (m) => m.categoryId === cat.id || m.category === cat.name
                  ).length;
                  const isActive = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      id={`cat-tab-${cat.slug || cat.id}`}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0 flex items-center space-x-1.5 border ${
                        isActive
                          ? 'bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-[#07150e] font-bold border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                          : 'bg-[#0d261b] text-[#c8c0b2] hover:text-[#f6f3ed] hover:border-[#d4af37]/40 border-[#224d3b]'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isActive
                              ? 'bg-[#07150e]/30 text-[#07150e]'
                              : 'bg-[#15382a] text-[#8ea098]'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Scroll Button */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollCategories('right')}
                  className="hidden sm:flex absolute right-0 z-10 w-7 h-7 -mr-2 rounded-full bg-[#0d261b] border border-[#d4af37] text-[#d4af37] items-center justify-center shadow-lg hover:bg-[#d4af37] hover:text-[#07150e] transition"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Summary Indicator if active */}
        {(searchQuery || dietFilter !== 'all' || cuisineFilter !== 'all' || priceFilter !== 'all' || featuredOnly) && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 bg-[#091b13] border border-[#224d3b] p-3 rounded-xl text-xs text-[#c8c0b2]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#f6f3ed] font-semibold">Active filters:</span>
              {searchQuery && (
                <span className="bg-[#15382a] text-[#d4af37] px-2.5 py-1 rounded-md border border-[#224d3b]">
                  Search: "{searchQuery}"
                </span>
              )}
              {dietFilter !== 'all' && (
                <span className="bg-[#15382a] text-[#d4af37] px-2.5 py-1 rounded-md border border-[#224d3b]">
                  Diet: {dietFilter.toUpperCase()}
                </span>
              )}
              {cuisineFilter !== 'all' && (
                <span className="bg-[#15382a] text-[#d4af37] px-2.5 py-1 rounded-md border border-[#224d3b]">
                  Cuisine: {cuisineFilter}
                </span>
              )}
              {priceFilter !== 'all' && (
                <span className="bg-[#15382a] text-[#d4af37] px-2.5 py-1 rounded-md border border-[#224d3b]">
                  Price: {priceFilter}
                </span>
              )}
              {featuredOnly && (
                <span className="bg-[#15382a] text-[#d4af37] px-2.5 py-1 rounded-md border border-[#224d3b]">
                  Chef's Specials Only
                </span>
              )}
              <span className="text-[#8ea098]">({filteredItems.length} dishes found)</span>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setDietFilter('all');
                setCuisineFilter('all');
                setPriceFilter('all');
                setFeaturedOnly(false);
                setSelectedCategory('all');
              }}
              className="text-xs text-[#d4af37] underline hover:text-[#f1d779]"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-serif text-lg text-[#d4af37]">Preparing Hot Wok authentic dishes...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="bg-[#091b13] border-2 border-[#d4af37]/40 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xl">
            <AlertCircle className="w-12 h-12 text-[#d4af37] mx-auto opacity-80" />
            <h3 className="font-serif text-xl font-bold text-[#f6f3ed]">No dishes match your preferences</h3>
            <p className="text-sm text-[#c8c0b2]">
              Try searching with another keyword or resetting the dietary filters.
            </p>
            <button
              id="btn-empty-reset-filters"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setDietFilter('all');
                setCuisineFilter('all');
                setPriceFilter('all');
                setFeaturedOnly(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#d4af37] text-[#07150e] text-xs font-bold hover:bg-[#e2c258] transition shadow-lg"
            >
              Show All Menu Items
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* MENU PRESENTATION: GROUPED BY CATEGORY OR FLAT FILTERED GRID   */}
        {/* ============================================================== */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="space-y-16">
            {groupedCategories ? (
              // BROWSE BY CATEGORY SECTIONS (Luxury Restaurant Format)
              groupedCategories.map((group) => (
                <div
                  key={group.category.id}
                  id={`cat-section-${group.category.slug || group.category.id}`}
                  className="space-y-6 pt-4"
                >
                  {/* Category Header with Asian Flourish */}
                  <div className="border-b border-[#d4af37]/40 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-[#d4af37]">
                        <span>熱鑊</span>
                        <span>•</span>
                        <span>{group.category.name}</span>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#f6f3ed] mt-0.5">
                        {group.category.name}
                      </h3>
                    </div>
                    <span className="text-xs text-[#8ea098] font-medium">
                      {group.items.length} {group.items.length === 1 ? 'Dish' : 'Dishes'} Available
                    </span>
                  </div>

                  {/* Render items in this category */}
                  <MenuGridOrColumns
                    items={group.items}
                    desktopLayout={desktopLayout}
                    selectedPortions={selectedPortions}
                    onPortionSelect={handlePortionSelect}
                    onAddToCart={handleAddToCart}
                    onOpenModal={setModalItem}
                    getItemQuantity={getItemQuantity}
                    updateQuantity={updateQuantity}
                    recentlyAddedId={recentlyAddedId}
                    getPortionServingHint={getPortionServingHint}
                  />
                </div>
              ))
            ) : (
              // FILTERED ITEMS LIST / SINGLE CATEGORY VIEW
              <div className="space-y-6">
                <MenuGridOrColumns
                  items={filteredItems}
                  desktopLayout={desktopLayout}
                  selectedPortions={selectedPortions}
                  onPortionSelect={handlePortionSelect}
                  onAddToCart={handleAddToCart}
                  onOpenModal={setModalItem}
                  getItemQuantity={getItemQuantity}
                  updateQuantity={updateQuantity}
                  recentlyAddedId={recentlyAddedId}
                  getPortionServingHint={getPortionServingHint}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {modalItem && (
        <ItemDetailModal
          item={modalItem}
          onClose={() => setModalItem(null)}
        />
      )}
    </section>
  );
};

// ============================================================================
// SUB-COMPONENT: RESPONSIVE MULTI-COLUMN OR BENTO GRID MENU DISHES
// ============================================================================
interface MenuGridOrColumnsProps {
  items: MenuItem[];
  desktopLayout: 'columns' | 'grid';
  selectedPortions: Record<string, 'half' | 'full'>;
  onPortionSelect: (itemId: string, portion: 'half' | 'full') => void;
  onAddToCart: (item: MenuItem) => void;
  onOpenModal: (item: MenuItem) => void;
  getItemQuantity: (itemId: string, portion: 'single' | 'half' | 'full') => number;
  updateQuantity: (cartItemId: string, delta: number) => void;
  recentlyAddedId: string | null;
  getPortionServingHint: (item: MenuItem, portion: 'half' | 'full') => string;
}

const MenuGridOrColumns: React.FC<MenuGridOrColumnsProps> = ({
  items,
  desktopLayout,
  selectedPortions,
  onPortionSelect,
  onAddToCart,
  onOpenModal,
  getItemQuantity,
  updateQuantity,
  recentlyAddedId,
  getPortionServingHint,
}) => {
  if (desktopLayout === 'columns') {
    // DESKTOP: PREMIUM 2-COLUMN RESTAURANT EDITORIAL MENU
    // MOBILE: LARGE TOUCH-FRIENDLY CARDS
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {items.map((item) => {
          const portionSelection = selectedPortions[item.id] || 'full';
          const currentPrice =
            item.priceType === 'portion'
              ? portionSelection === 'half'
                ? item.halfPrice || item.price
                : item.fullPrice || item.price
              : item.price;

          const activePortion = item.priceType === 'portion' ? portionSelection : 'single';
          const cartItemId = `${item.id}-${activePortion}`;
          const inCartQty = getItemQuantity(item.id, activePortion);
          const isAdded = recentlyAddedId === cartItemId;

          return (
            <motion.div
              key={item.id}
              id={`menu-card-${item.id}`}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.25 }}
              className="bg-gradient-to-br from-[#091b13] via-[#071610] to-[#05110c] border border-[#224d3b] hover:border-[#d4af37]/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Subtle gold corner accent on hover */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-[#d4af37]/10 to-transparent pointer-events-none rounded-tr-2xl" />

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Dish Photo on Left/Top (Touch-friendly & zoomable) */}
                <div
                  className="relative w-full sm:w-36 h-48 sm:h-36 rounded-xl overflow-hidden bg-[#07150e] flex-shrink-0 cursor-pointer shadow-md"
                  onClick={() => onOpenModal(item)}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:hidden" />

                  {/* Veg / Non-Veg Indicator Badge on photo */}
                  <div className="absolute top-2 left-2 bg-[#071610]/95 backdrop-blur-sm px-1.5 py-0.5 rounded border border-[#224d3b] flex items-center space-x-1 shadow">
                    {item.isVeg ? (
                      <div className="w-3 h-3 border-2 border-emerald-500 p-0.5 rounded-sm flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                    ) : (
                      <div className="w-3 h-3 border-2 border-red-500 p-0.5 rounded-sm flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-red-500 rotate-45" />
                      </div>
                    )}
                    <span className="text-[9px] font-bold text-[#f6f3ed]">
                      {item.isVeg ? 'VEG' : 'NON-VEG'}
                    </span>
                  </div>

                  {/* Quick View Button on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 text-[#d4af37] text-[10px] font-bold flex items-center gap-1 border border-[#d4af37]/40 shadow">
                      <Eye className="w-3 h-3" />
                      <span>Details</span>
                    </span>
                  </div>

                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                      <span className="bg-red-950 border border-red-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Dish Information */}
                <div className="flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    {/* Header line: Dish Name + Spice Flame + Cuisine */}
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        onClick={() => onOpenModal(item)}
                        className="font-serif text-base sm:text-lg font-bold text-[#f6f3ed] group-hover:text-[#d4af37] transition-colors leading-snug cursor-pointer"
                      >
                        {item.name}
                      </h4>
                      {item.spiceLevel > 0 && (
                        <div
                          className="flex items-center text-amber-500 flex-shrink-0 pt-0.5"
                          title={`Spice Level: ${item.spiceLevel}/3`}
                        >
                          {Array.from({ length: item.spiceLevel }).map((_, i) => (
                            <Flame key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Category & Cuisine Subtitle */}
                    <div className="flex items-center gap-2 text-[11px] text-[#d4af37] font-medium mt-0.5">
                      <span>{item.categoryName || item.category}</span>
                      {item.subcategory && (
                        <>
                          <span className="text-[#224d3b]">•</span>
                          <span className="text-[#8ea098]">{item.subcategory}</span>
                        </>
                      )}
                      <span className="text-[#224d3b]">•</span>
                      <span className="text-[#8ea098]">{item.cuisine} Asian</span>
                    </div>

                    {/* Dish Description */}
                    <p className="text-xs text-[#c8c0b2] line-clamp-2 mt-1.5 font-light leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Portion Selection where applicable (Half vs Full) */}
                  {item.priceType === 'portion' && item.halfPrice && item.fullPrice && (
                    <div className="pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-[#8ea098]">Portion:</span>
                        <div className="inline-flex rounded-lg bg-[#071610] p-0.5 border border-[#224d3b]">
                          <button
                            type="button"
                            id={`portion-half-${item.id}`}
                            onClick={() => onPortionSelect(item.id, 'half')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                              portionSelection === 'half'
                                ? 'bg-[#d4af37] text-[#07150e] shadow-sm'
                                : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                            }`}
                          >
                            Half ₹{item.halfPrice}
                            <span className="ml-1 text-[9px] font-normal opacity-80">
                              ({getPortionServingHint(item, 'half')})
                            </span>
                          </button>
                          <button
                            type="button"
                            id={`portion-full-${item.id}`}
                            onClick={() => onPortionSelect(item.id, 'full')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                              portionSelection === 'full'
                                ? 'bg-[#d4af37] text-[#07150e] shadow-sm'
                                : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                            }`}
                          >
                            Full ₹{item.fullPrice}
                            <span className="ml-1 text-[9px] font-normal opacity-80">
                              ({getPortionServingHint(item, 'full')})
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer: Bold Price Tag & Add/Quantity Controls */}
              <div className="mt-4 pt-3 border-t border-[#224d3b]/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8ea098] block font-semibold">
                    {item.priceType === 'portion' ? `${portionSelection.toUpperCase()} PORTION` : 'STANDARD PRICE'}
                  </span>
                  <div className="flex items-baseline space-x-1">
                    <span className="font-serif text-xl sm:text-2xl font-bold text-[#d4af37]">
                      ₹{currentPrice}
                    </span>
                    {item.priceType === 'portion' && (
                      <span className="text-[11px] text-[#8ea098]">
                        / {portionSelection}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add to Cart or Stepper */}
                {inCartQty > 0 ? (
                  <div className="flex items-center gap-2 bg-[#071610] border-2 border-[#d4af37] rounded-xl p-1 shadow-lg">
                    <button
                      id={`card-qty-minus-${item.id}`}
                      onClick={() => updateQuantity(cartItemId, -1)}
                      className="w-8 h-8 rounded-lg bg-[#15382a] hover:bg-[#1f4e3b] text-white flex items-center justify-center transition active:scale-95"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-[#d4af37]">
                      {inCartQty}
                    </span>
                    <button
                      id={`card-qty-plus-${item.id}`}
                      onClick={() => updateQuantity(cartItemId, 1)}
                      className="w-8 h-8 rounded-lg bg-[#15382a] hover:bg-[#1f4e3b] text-white flex items-center justify-center transition active:scale-95"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    id={`btn-add-item-${item.id}`}
                    disabled={!item.isAvailable}
                    onClick={() => onAddToCart(item)}
                    className={`min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all duration-200 flex items-center space-x-2 shadow-lg ${
                      !item.isAvailable
                        ? 'bg-[#15382a] text-[#8ea098] cursor-not-allowed border border-[#224d3b]'
                        : isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-[#d4af37] to-[#c59b27] hover:from-[#e2c258] hover:to-[#d4af37] text-[#07150e] active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add to Order</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // DESKTOP: 3-COLUMN VISUAL BENTO GRID
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const portionSelection = selectedPortions[item.id] || 'full';
        const currentPrice =
          item.priceType === 'portion'
            ? portionSelection === 'half'
              ? item.halfPrice || item.price
              : item.fullPrice || item.price
            : item.price;

        const activePortion = item.priceType === 'portion' ? portionSelection : 'single';
        const cartItemId = `${item.id}-${activePortion}`;
        const inCartQty = getItemQuantity(item.id, activePortion);
        const isAdded = recentlyAddedId === cartItemId;

        return (
          <motion.div
            key={item.id}
            id={`menu-card-${item.id}`}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.25 }}
            className="bg-gradient-to-b from-[#091b13] to-[#05110c] border border-[#224d3b] hover:border-[#d4af37] rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between group"
          >
            {/* Top Photo Section */}
            <div
              className="relative h-52 w-full overflow-hidden bg-[#07150e] cursor-pointer"
              onClick={() => onOpenModal(item)}
            >
              <img
                src={item.image}
                alt={item.name}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#091b13] via-transparent to-black/30" />

              {/* Badges on Top of Photo */}
              <div className="absolute top-3 left-3 bg-[#071610]/95 backdrop-blur-sm px-2 py-1 rounded-md border border-[#224d3b] flex items-center space-x-1.5 shadow">
                {item.isVeg ? (
                  <div className="w-3.5 h-3.5 border-2 border-emerald-500 p-0.5 rounded-sm flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 border-2 border-red-500 p-0.5 rounded-sm flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-red-500 rotate-45" />
                  </div>
                )}
                <span className="text-[10px] font-bold text-[#f6f3ed]">
                  {item.isVeg ? 'PURE VEG' : 'NON-VEG'}
                </span>
              </div>

              <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                {item.isFeatured && (
                  <span className="bg-[#d4af37] text-[#07150e] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow">
                    Chef Special
                  </span>
                )}
                <span className="bg-[#0d261b]/95 border border-[#224d3b] text-[#d4af37] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.cuisine}
                </span>
              </div>

              {/* Hover Details overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-3.5 py-1.5 rounded-full bg-black/80 text-[#d4af37] text-xs font-bold flex items-center gap-1.5 border border-[#d4af37]/40 shadow-lg">
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4
                    onClick={() => onOpenModal(item)}
                    className="font-serif text-lg font-bold text-[#f6f3ed] group-hover:text-[#d4af37] transition-colors leading-snug cursor-pointer"
                  >
                    {item.name}
                  </h4>
                  {item.spiceLevel > 0 && (
                    <div className="flex items-center text-amber-500 flex-shrink-0 pt-0.5">
                      {Array.from({ length: item.spiceLevel }).map((_, i) => (
                        <Flame key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-[#d4af37] font-medium mt-1">
                  {item.categoryName || item.category} {item.subcategory ? `• ${item.subcategory}` : ''}
                </div>

                <p className="text-xs text-[#c8c0b2] line-clamp-2 mt-2 font-light leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Portion Buttons */}
              {item.priceType === 'portion' && item.halfPrice && item.fullPrice && (
                <div className="space-y-1.5 pt-2 border-t border-[#224d3b]/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8ea098] font-bold text-[10px] uppercase">Portion:</span>
                    <div className="inline-flex rounded-lg bg-[#071610] p-0.5 border border-[#224d3b]">
                      <button
                        type="button"
                        id={`portion-grid-half-${item.id}`}
                        onClick={() => onPortionSelect(item.id, 'half')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                          portionSelection === 'half'
                            ? 'bg-[#d4af37] text-[#07150e]'
                            : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                        }`}
                      >
                        Half ₹{item.halfPrice}
                      </button>
                      <button
                        type="button"
                        id={`portion-grid-full-${item.id}`}
                        onClick={() => onPortionSelect(item.id, 'full')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                          portionSelection === 'full'
                            ? 'bg-[#d4af37] text-[#07150e]'
                            : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                        }`}
                      >
                        Full ₹{item.fullPrice}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing & Add to Cart button */}
              <div className="pt-2 border-t border-[#224d3b]/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8ea098] block font-semibold">
                    Price
                  </span>
                  <span className="font-serif text-2xl font-bold text-[#d4af37]">
                    ₹{currentPrice}
                  </span>
                </div>

                {inCartQty > 0 ? (
                  <div className="flex items-center gap-2 bg-[#071610] border-2 border-[#d4af37] rounded-xl p-1 shadow">
                    <button
                      onClick={() => updateQuantity(cartItemId, -1)}
                      className="w-8 h-8 rounded-lg bg-[#15382a] text-white flex items-center justify-center text-xs"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-[#d4af37]">
                      {inCartQty}
                    </span>
                    <button
                      onClick={() => updateQuantity(cartItemId, 1)}
                      className="w-8 h-8 rounded-lg bg-[#15382a] text-white flex items-center justify-center text-xs"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={!item.isAvailable}
                    onClick={() => onAddToCart(item)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs tracking-wide transition-all duration-200 flex items-center space-x-1.5 shadow ${
                      !item.isAvailable
                        ? 'bg-[#15382a] text-[#8ea098] cursor-not-allowed border border-[#224d3b]'
                        : isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-[#d4af37] to-[#c59b27] hover:from-[#e2c258] hover:to-[#d4af37] text-[#07150e] active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add to Order</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
