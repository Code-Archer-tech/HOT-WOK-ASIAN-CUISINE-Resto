import React, { useState, useMemo } from 'react';
import { Search, Filter, Sparkles, Flame, Check, Plus, AlertCircle } from 'lucide-react';
import { Category, MenuItem } from '../types/restaurant';
import { useCart } from '../context/CartContext';

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
  const { addItem } = useCart();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under250' | '250to350' | 'above350'>('all');
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');

  // Portion selection map for items with half/full: itemId -> 'half' | 'full'
  const [selectedPortions, setSelectedPortions] = useState<Record<string, 'half' | 'full'>>({});
  // Feedback indicator for item added
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const handlePortionSelect = (itemId: string, portion: 'half' | 'full') => {
    setSelectedPortions((prev) => ({ ...prev, [itemId]: portion }));
  };

  const handleAddToCart = (item: MenuItem) => {
    const portion = item.priceType === 'portion' ? (selectedPortions[item.id] || 'full') : 'single';
    addItem(item, portion);
    setRecentlyAddedId(`${item.id}-${portion}`);
    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1500);
  };

  // Filter logic
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Live search by dish name & description
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCategory = item.categoryName.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCategory) {
          return false;
        }
      }

      // Diet filter (Veg / Non-Veg)
      if (dietFilter === 'veg' && !item.isVeg) return false;
      if (dietFilter === 'non-veg' && item.isVeg) return false;

      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'veg') {
          if (!item.isVeg) return false;
        } else if (selectedCategory === 'non-veg') {
          if (item.isVeg) return false;
        } else if (item.categoryId !== selectedCategory) {
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
  }, [menuItems, searchQuery, selectedCategory, dietFilter, cuisineFilter, priceFilter]);

  return (
    <section id="menu-section" className="py-16 sm:py-24 bg-[#07130e] text-[#f6f3ed] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#15382a] border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Database Driven Culinary Menu</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#f6f3ed]">
            Authentic Asian Wok & Fusion
          </h2>
          <p className="text-sm sm:text-base text-[#c8c0b2]">
            Discover wok-charred specialties, Korean street glazes, traditional Malaysian curries, fragrant Thai broths, and our grand Kepsa feasts.
          </p>
        </div>

        {/* Live Search & Filter Bar Controls */}
        <div className="bg-[#091711] border border-[#224d3b] rounded-2xl p-4 sm:p-6 mb-8 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
            {/* Live Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                id="menu-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes by name (e.g., Kepsa, Hakka Noodles, Dragon Chicken)..."
                className="w-full bg-[#15382a]/60 border border-[#224d3b] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#f6f3ed] placeholder-[#8ea098] focus:outline-none focus:border-[#d4af37] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-[#c8c0b2] hover:text-[#f6f3ed]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Diet Filter: All / Veg / Non-Veg */}
            <div className="md:col-span-3 flex items-center space-x-1.5 bg-[#15382a]/40 p-1 rounded-lg border border-[#224d3b]">
              <button
                id="filter-diet-all"
                onClick={() => setDietFilter('all')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                  dietFilter === 'all' ? 'bg-[#d4af37] text-[#091711]' : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                }`}
              >
                All
              </button>
              <button
                id="filter-diet-veg"
                onClick={() => setDietFilter('veg')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors flex items-center justify-center space-x-1 ${
                  dietFilter === 'veg' ? 'bg-emerald-600 text-white' : 'text-[#c8c0b2] hover:text-emerald-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Veg</span>
              </button>
              <button
                id="filter-diet-non-veg"
                onClick={() => setDietFilter('non-veg')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors flex items-center justify-center space-x-1 ${
                  dietFilter === 'non-veg' ? 'bg-red-700 text-white' : 'text-[#c8c0b2] hover:text-red-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>Non-Veg</span>
              </button>
            </div>

            {/* Price Range Filter */}
            <div className="md:col-span-3">
              <select
                id="filter-price-select"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="w-full bg-[#15382a]/60 border border-[#224d3b] rounded-lg px-3 py-2.5 text-xs text-[#f6f3ed] focus:outline-none focus:border-[#d4af37]"
              >
                <option value="all">Price: All Ranges</option>
                <option value="under250">Under ₹250</option>
                <option value="250to350">₹250 – ₹350</option>
                <option value="above350">₹350 & Above</option>
              </select>
            </div>
          </div>

          {/* Cuisine Selector Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#224d3b]/40 text-xs">
            <span className="text-[#8ea098] font-medium flex items-center space-x-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Cuisine:</span>
            </span>
            {['all', 'Chinese', 'Korean', 'Malaysian', 'Thai', 'Fusion'].map((c) => (
              <button
                key={c}
                id={`filter-cuisine-${c.toLowerCase()}`}
                onClick={() => setCuisineFilter(c)}
                className={`px-3 py-1 rounded-full transition-colors font-medium ${
                  cuisineFilter === c
                    ? 'bg-[#d4af37] text-[#091711] font-semibold'
                    : 'bg-[#15382a] text-[#c8c0b2] hover:text-[#f6f3ed] border border-[#224d3b]'
                }`}
              >
                {c === 'all' ? 'All Cuisines' : c}
              </button>
            ))}
          </div>

          {/* Category Horizontal Scrolling Tabs */}
          <div className="pt-2">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
              <button
                id="cat-tab-all"
                onClick={() => setSelectedCategory('all')}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex-shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b89327] text-[#091711] shadow-sm'
                    : 'bg-[#15382a]/80 text-[#c8c0b2] hover:text-[#f6f3ed] border border-[#224d3b]'
                }`}
              >
                All Categories ({menuItems.length})
              </button>
              {categories.map((cat) => {
                const count = menuItems.filter((m) => m.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    id={`cat-tab-${cat.slug}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-[#d4af37] to-[#b89327] text-[#091711] font-semibold shadow-sm'
                        : 'bg-[#15382a]/80 text-[#c8c0b2] hover:text-[#f6f3ed] border border-[#224d3b]'
                    }`}
                  >
                    {cat.name} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[#c8c0b2]">Loading authentic dishes from Hot Wok database...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="bg-[#091711] border border-[#224d3b] rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <AlertCircle className="w-10 h-10 text-[#d4af37] mx-auto opacity-75" />
            <h3 className="font-serif text-lg font-bold text-[#f6f3ed]">No dishes match your criteria</h3>
            <p className="text-xs text-[#c8c0b2]">
              Try searching with a different term or resetting the filters to view all menu items.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setDietFilter('all');
                setCuisineFilter('all');
                setPriceFilter('all');
              }}
              className="px-4 py-2 rounded-lg bg-[#15382a] border border-[#d4af37] text-xs font-semibold text-[#d4af37] hover:bg-[#d4af37] hover:text-[#091711] transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Menu Items Grid */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const portionSelection = selectedPortions[item.id] || 'full';
              const currentPrice =
                item.priceType === 'portion'
                  ? portionSelection === 'half'
                    ? item.halfPrice || item.price
                    : item.fullPrice || item.price
                  : item.price;

              const isAdded = recentlyAddedId === `${item.id}-${item.priceType === 'portion' ? portionSelection : 'single'}`;

              return (
                <div
                  key={item.id}
                  id={`menu-card-${item.id}`}
                  className="bg-[#091711] border border-[#224d3b]/70 hover:border-[#d4af37]/60 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Top Image Section */}
                  <div className="relative h-48 w-full overflow-hidden bg-[#0f271d]">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#091711] via-transparent to-transparent" />

                    {/* Veg / Non-Veg Indicator Badge */}
                    <div className="absolute top-3 left-3 bg-[#091711]/90 backdrop-blur-sm px-2 py-1 rounded-md border border-[#224d3b] flex items-center space-x-1.5 shadow">
                      {item.isVeg ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-emerald-500 p-0.5 rounded-sm flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-400">VEG</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-red-500 p-0.5 rounded-sm flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-red-500 rotate-45" />
                          </div>
                          <span className="text-[10px] font-semibold text-red-400">NON-VEG</span>
                        </>
                      )}
                    </div>

                    {/* Cuisine & Spice Indicators */}
                    <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                      {item.isFeatured && (
                        <span className="bg-[#d4af37] text-[#091711] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow">
                          Chef Pick
                        </span>
                      )}
                      <span className="bg-[#15382a]/90 backdrop-blur-sm border border-[#224d3b] text-[#d4af37] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {item.cuisine}
                      </span>
                    </div>

                    {/* Sold out badge */}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-red-900/90 border border-red-500 text-white font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-md">
                          Sold Out Today
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif text-base sm:text-lg font-bold text-[#f6f3ed] group-hover:text-[#d4af37] transition-colors leading-snug">
                          {item.name}
                        </h3>
                        {item.spiceLevel > 0 && (
                          <div
                            className="flex items-center text-amber-500 flex-shrink-0"
                            title={`Spice Level: ${item.spiceLevel}/3`}
                          >
                            {Array.from({ length: item.spiceLevel }).map((_, i) => (
                              <Flame key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            ))}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-[#c8c0b2] line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Pricing & Portion Controls */}
                    <div className="space-y-3 pt-2 border-t border-[#224d3b]/50">
                      {item.priceType === 'portion' && item.halfPrice && item.fullPrice ? (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8ea098] font-medium">Portion:</span>
                          <div className="inline-flex rounded-md bg-[#15382a] p-0.5 border border-[#224d3b]">
                            <button
                              id={`portion-half-${item.id}`}
                              onClick={() => handlePortionSelect(item.id, 'half')}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                                portionSelection === 'half'
                                  ? 'bg-[#d4af37] text-[#091711]'
                                  : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                              }`}
                            >
                              Half ₹{item.halfPrice}
                            </button>
                            <button
                              id={`portion-full-${item.id}`}
                              onClick={() => handlePortionSelect(item.id, 'full')}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                                portionSelection === 'full'
                                  ? 'bg-[#d4af37] text-[#091711]'
                                  : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
                              }`}
                            >
                              Full ₹{item.fullPrice}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {/* Bottom Price & Add Action */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#8ea098] block">Price</span>
                          <span className="font-serif text-xl font-extrabold text-[#d4af37]">
                            ₹{currentPrice}
                          </span>
                        </div>

                        <button
                          id={`btn-add-item-${item.id}`}
                          disabled={!item.isAvailable}
                          onClick={() => handleAddToCart(item)}
                          className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-wide transition-all duration-200 flex items-center space-x-1.5 shadow ${
                            !item.isAvailable
                              ? 'bg-[#15382a]/50 text-[#8ea098] cursor-not-allowed border border-[#224d3b]'
                              : isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e2c258] hover:to-[#c59b27] text-[#091711] active:scale-95'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Order</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
