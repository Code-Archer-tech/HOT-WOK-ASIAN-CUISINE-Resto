import React from 'react';
import { Utensils, Calendar, ShoppingBag, Flame, Sparkles, Award, MapPin } from 'lucide-react';

interface HeroProps {
  onExploreMenu: () => void;
  onOrderNow: () => void;
  onReserveTable: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreMenu,
  onOrderNow,
  onReserveTable,
}) => {
  return (
    <div id="hero-section" className="relative overflow-hidden bg-[#091711] border-b border-[#224d3b]/50">
      {/* Background Asian Inspired Subtle Pattern & Image Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-luminosity">
        <img
          src="https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=2000&q=80"
          alt="Asian Cuisine Wok Cooking"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Radial Gradient Glow for Warm Gold & Deep Emerald */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#1d4b38]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Gold Chinese Lattice Border Accent */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Brand & Headlines */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Asian Fusion Badges */}
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#15382a] text-[#d4af37] border border-[#d4af37]/40 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Premier Asian Fusion in Mumbra</span>
              </span>
              <div className="hidden sm:flex items-center space-x-2 text-xs text-[#c8c0b2] font-medium tracking-wide">
                <span>🇨🇳 Chinese</span>
                <span>•</span>
                <span>🇰🇷 Korean</span>
                <span>•</span>
                <span>🇲🇾 Malaysian</span>
                <span>•</span>
                <span>🇹🇭 Thai</span>
              </div>
            </div>

            {/* Main Title & Slogan */}
            <div className="space-y-3">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#f6f3ed] tracking-tight leading-[1.15]">
                HOT WOK <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f1d779] via-[#d4af37] to-[#aa851d] italic">
                  ASIAN CUISINE
                </span>
              </h1>
              <p className="font-serif text-xl sm:text-2xl text-[#d4af37] font-medium tracking-wide italic">
                “Where Flavour Meets Fusion”
              </p>
            </div>

            {/* Description Paragraph */}
            <p className="text-base sm:text-lg text-[#c8c0b2] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Step into an elevated pan-Asian dining experience. From searing iron-wok noodles and Korean Gochujang glazes to rich Malaysian curries and our famed Mumbra signature Chicken Kepsa platters.
            </p>

            {/* 3 Main Required CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                id="hero-btn-order-now"
                onClick={onOrderNow}
                className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e2c258] hover:to-[#c59b27] text-[#091711] font-bold text-sm tracking-wider uppercase transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#d4af37]/20 flex items-center justify-center space-x-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Order Now</span>
              </button>

              <button
                id="hero-btn-explore-menu"
                onClick={onExploreMenu}
                className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#15382a] hover:bg-[#1d4b38] text-[#f6f3ed] border border-[#d4af37]/60 hover:border-[#d4af37] font-semibold text-sm tracking-wide transition-all flex items-center justify-center space-x-2"
              >
                <Utensils className="w-4 h-4 text-[#d4af37]" />
                <span>Explore Menu</span>
              </button>

              <button
                id="hero-btn-reserve-table"
                onClick={onReserveTable}
                className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#07130e] hover:bg-[#15382a] text-[#e8e4dc] border border-[#224d3b] hover:border-[#d4af37] font-medium text-sm transition-all flex items-center justify-center space-x-2"
              >
                <Calendar className="w-4 h-4 text-[#d4af37]" />
                <span>Reserve Table</span>
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#224d3b]/40 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <span className="block font-serif text-2xl font-bold text-[#d4af37]">4</span>
                <span className="text-xs text-[#c8c0b2]">Master Asian Cuisines</span>
              </div>
              <div>
                <span className="block font-serif text-2xl font-bold text-[#d4af37]">40+</span>
                <span className="text-xs text-[#c8c0b2]">Chef Crafted Dishes</span>
              </div>
              <div>
                <span className="block font-serif text-2xl font-bold text-[#d4af37]">100%</span>
                <span className="text-xs text-[#c8c0b2]">Authentic Wok Hei</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative gold ring */}
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-[#d4af37]/30 via-transparent to-[#224d3b] blur-sm" />

              <div className="relative rounded-2xl overflow-hidden border border-[#224d3b] bg-[#0f271d] shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1000&q=80"
                  alt="Hot Wok Special Kepsa Platter"
                  className="w-full h-80 sm:h-96 object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#091711] via-transparent to-transparent" />

                {/* Floating Badge on Dish */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#091711]/90 backdrop-blur-md border border-[#224d3b] p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="inline-block text-[10px] tracking-wider uppercase text-[#d4af37] font-semibold">
                      Mumbra Signature
                    </span>
                    <h2 className="text-sm font-bold text-[#f6f3ed]">Hot Wok Special Chicken Kepsa</h2>
                    <p className="text-xs text-[#c8c0b2]">Saffron spiced Asian rice & charcoal tikka</p>
                  </div>
                  <div className="text-right pl-3 border-l border-[#224d3b]">
                    <span className="text-xs text-[#c8c0b2] block">From</span>
                    <span className="text-base font-serif font-bold text-[#d4af37]">₹340</span>
                  </div>
                </div>
              </div>

              {/* Floating Chef Recommendation badge */}
              <div className="absolute -top-4 -right-4 bg-[#15382a] border border-[#d4af37] text-[#f6f3ed] p-3 rounded-xl shadow-xl hidden sm:flex items-center space-x-2.5">
                <Flame className="w-5 h-5 text-[#d4af37]" />
                <div className="text-left">
                  <div className="text-xs font-bold text-[#d4af37]">Authentic Wok Station</div>
                  <div className="text-[11px] text-[#c8c0b2]">High Flame Cooking</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
