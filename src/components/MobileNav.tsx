import React from 'react';
import { Home, Utensils, Calendar, ShoppingBag, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { RESTAURANT_CONFIG } from '../config/restaurantConfig';

interface MobileNavProps {
  onNavigateHome: () => void;
  onOpenMenu: () => void;
  onOpenReserve: () => void;
  activeView: 'home' | 'menu' | 'reserve' | 'admin' | 'order-status';
}

export const MobileNav: React.FC<MobileNavProps> = ({
  onNavigateHome,
  onOpenMenu,
  onOpenReserve,
  activeView,
}) => {
  const { itemCount, setIsCartOpen } = useCart();

  return (
    <div
      id="sticky-mobile-nav"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#091711]/95 backdrop-blur-md border-t border-[#224d3b] px-3 py-2 shadow-2xl safe-area-bottom"
    >
      <div className="flex items-center justify-around">
        {/* Home */}
        <button
          id="mobile-tab-home"
          onClick={onNavigateHome}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
            activeView === 'home' ? 'text-[#d4af37]' : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Home</span>
        </button>

        {/* Menu */}
        <button
          id="mobile-tab-menu"
          onClick={onOpenMenu}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
            activeView === 'menu' ? 'text-[#d4af37]' : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
          }`}
        >
          <Utensils className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Menu</span>
        </button>

        {/* Floating Cart in Center */}
        <button
          id="mobile-tab-cart"
          onClick={() => setIsCartOpen(true)}
          className="relative -top-3 flex flex-col items-center justify-center"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#f1d779] text-[#091711] flex items-center justify-center shadow-lg border-2 border-[#091711] active:scale-95 transition-transform">
            <ShoppingBag className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#b91c1c] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#091711]">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold text-[#d4af37] mt-1">Cart</span>
        </button>

        {/* Table Reserve */}
        <button
          id="mobile-tab-reserve"
          onClick={onOpenReserve}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
            activeView === 'reserve' ? 'text-[#d4af37]' : 'text-[#c8c0b2] hover:text-[#f6f3ed]'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Reserve</span>
        </button>

        {/* Quick Call */}
        <a
          id="mobile-tab-call"
          href={RESTAURANT_CONFIG.telLink}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[#c8c0b2] hover:text-[#d4af37] transition-colors"
        >
          <Phone className="w-5 h-5 mb-0.5 text-[#d4af37]" />
          <span className="text-[10px] font-medium tracking-tight">Call</span>
        </a>
      </div>
    </div>
  );
};
