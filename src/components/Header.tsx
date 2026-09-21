import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, ShoppingBag, Phone, Clock, MapPin, Menu, X, Shield, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import {
  RESTAURANT_CONFIG,
  RESTAURANT_WHATSAPP_NUMBER,
  createWhatsAppUrl,
} from '../config/restaurantConfig';

interface HeaderProps {
  onOpenMenu: () => void;
  onOpenReserve: () => void;
  onOpenAdmin: () => void;
  onNavigateHome: () => void;
  onOpenTracker?: () => void;
  activeView: 'home' | 'menu' | 'reserve' | 'admin' | 'order-status';
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMenu,
  onOpenReserve,
  onOpenAdmin,
  onNavigateHome,
  onOpenTracker,
  activeView,
}) => {
  const { itemCount, setIsCartOpen } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Banner with Location and Phone */}
      <div id="top-announcement-bar" className="bg-[#07130e] border-b border-[#224d3b]/50 text-xs py-2 px-4 text-[#c8c0b2] hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-1.5 text-xs text-[#e8e4dc]">
              <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Urban Empire, Kausar Baug, Mumbra, Thane 400612</span>
            </span>
            <span className="flex items-center space-x-1.5 text-xs text-[#c8c0b2]">
              <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Open Daily: 12:00 PM – 12:00 AM Midnight</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[#d4af37] font-medium tracking-wide">Cuisines: Chinese • Korean • Malaysian • Thai</span>
            <a
              id="header-phone-link"
              href={RESTAURANT_CONFIG.telLink}
              className="inline-flex items-center space-x-1.5 text-[#e8e4dc] hover:text-[#d4af37] transition-colors font-medium ml-3"
            >
              <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{RESTAURANT_CONFIG.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header
        id="main-nav-header"
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#091711]/95 backdrop-blur-md shadow-lg border-b border-[#224d3b]/70 py-3'
            : 'bg-[#091711] border-b border-[#224d3b]/40 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Brand */}
          <button
            id="brand-logo-btn"
            onClick={onNavigateHome}
            className="flex items-center space-x-3 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#1d4b38] to-[#0d241a] border border-[#d4af37]/80 flex items-center justify-center shadow-md group-hover:border-[#d4af37] transition-colors">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4af37]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-[#f6f3ed] group-hover:text-[#d4af37] transition-colors">
                  HOT WOK
                </span>
                <span className="text-[10px] tracking-widest uppercase px-1.5 py-0.5 rounded bg-[#15382a] text-[#d4af37] border border-[#d4af37]/30 font-sans">
                  Asian
                </span>
              </div>
              <span className="block text-[10px] tracking-widest uppercase text-[#c8c0b2] font-medium">
                Cuisine & Wok Bar
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav id="desktop-nav-links" className="hidden md:flex items-center space-x-7 text-sm font-medium">
            <button
              id="nav-link-home"
              onClick={onNavigateHome}
              className={`transition-colors hover:text-[#d4af37] ${
                activeView === 'home' ? 'text-[#d4af37] font-semibold border-b border-[#d4af37] pb-1' : 'text-[#c8c0b2]'
              }`}
            >
              Home
            </button>
            <button
              id="nav-link-menu"
              onClick={onOpenMenu}
              className={`transition-colors hover:text-[#d4af37] ${
                activeView === 'menu' ? 'text-[#d4af37] font-semibold border-b border-[#d4af37] pb-1' : 'text-[#c8c0b2]'
              }`}
            >
              Full Menu
            </button>
            <button
              id="nav-link-reserve"
              onClick={onOpenReserve}
              className={`transition-colors hover:text-[#d4af37] ${
                activeView === 'reserve' ? 'text-[#d4af37] font-semibold border-b border-[#d4af37] pb-1' : 'text-[#c8c0b2]'
              }`}
            >
              Reserve Table
            </button>
            {onOpenTracker && (
              <button
                id="nav-link-tracker"
                onClick={onOpenTracker}
                className="text-[#c8c0b2] hover:text-[#d4af37] transition-colors"
              >
                Track Booking
              </button>
            )}
            <a
              id="nav-link-location"
              href="#location-section"
              className="text-[#c8c0b2] hover:text-[#d4af37] transition-colors"
            >
              Location & Contact
            </a>
            <button
              id="nav-link-admin"
              onClick={onOpenAdmin}
              className={`inline-flex items-center space-x-1.5 transition-colors hover:text-[#d4af37] ${
                activeView === 'admin' ? 'text-[#d4af37] font-semibold' : 'text-[#c8c0b2]/80 text-xs'
              }`}
              title="Admin Portal"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </nav>

          {/* Right Action Controls: WhatsApp, Call, Cart */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <a
              id="btn-header-whatsapp"
              href={createWhatsAppUrl(`Hello ${RESTAURANT_CONFIG.name}, I would like to place an order / inquire.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-xs font-bold text-white shadow transition-all active:scale-95"
              title={`Order on WhatsApp: +${RESTAURANT_WHATSAPP_NUMBER}`}
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>WhatsApp</span>
            </a>

            <a
              id="btn-call-direct"
              href={RESTAURANT_CONFIG.telLink}
              className="hidden lg:inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-[#224d3b] bg-[#15382a]/50 text-xs font-semibold text-[#f6f3ed] hover:border-[#d4af37] hover:text-[#d4af37] transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Call {RESTAURANT_CONFIG.phoneDisplay}</span>
            </a>

            {/* Cart Button */}
            <button
              id="btn-header-cart"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full bg-[#15382a] border border-[#224d3b] text-[#f6f3ed] hover:border-[#d4af37] hover:text-[#d4af37] transition-all shadow-sm flex items-center justify-center"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span
                  id="cart-badge-counter"
                  className="absolute -top-1 -right-1 bg-[#d4af37] text-[#091711] font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse"
                >
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md bg-[#15382a] border border-[#224d3b] text-[#f6f3ed] hover:text-[#d4af37]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div id="mobile-nav-dropdown" className="md:hidden bg-[#0a1b14] border-b border-[#224d3b] px-4 pt-3 pb-5 space-y-3 mt-2 shadow-2xl">
            <button
              id="mobile-nav-link-home"
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded text-sm text-[#f6f3ed] hover:bg-[#15382a] hover:text-[#d4af37]"
            >
              Home
            </button>
            <button
              id="mobile-nav-link-menu"
              onClick={() => {
                onOpenMenu();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded text-sm text-[#f6f3ed] hover:bg-[#15382a] hover:text-[#d4af37]"
            >
              Explore Menu & Order
            </button>
            <button
              id="mobile-nav-link-reserve"
              onClick={() => {
                onOpenReserve();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded text-sm text-[#f6f3ed] hover:bg-[#15382a] hover:text-[#d4af37]"
            >
              Reserve a Table
            </button>
            {onOpenTracker && (
              <button
                id="mobile-nav-link-tracker"
                onClick={() => {
                  onOpenTracker();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded text-sm text-[#d4af37] hover:bg-[#15382a]"
              >
                Track Live Reservation
              </button>
            )}
            <a
              id="mobile-nav-link-location"
              href="#location-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded text-sm text-[#f6f3ed] hover:bg-[#15382a] hover:text-[#d4af37]"
            >
              Location & Contact
            </a>

            {/* Mobile WhatsApp direct action */}
            <a
              id="mobile-nav-whatsapp"
              href={createWhatsAppUrl(`Hello ${RESTAURANT_CONFIG.name}, I would like to place an order.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Order via WhatsApp (+{RESTAURANT_WHATSAPP_NUMBER})</span>
            </a>

            <button
              id="mobile-nav-link-admin"
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded text-xs text-[#c8c0b2] hover:bg-[#15382a] hover:text-[#d4af37] flex items-center space-x-2"
            >
              <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Admin Management</span>
            </button>
            <div className="pt-2 border-t border-[#224d3b]/50 flex items-center justify-between text-xs text-[#c8c0b2]">
              <a href={RESTAURANT_CONFIG.telLink} className="flex items-center space-x-1.5 text-[#d4af37] font-semibold">
                <Phone className="w-3.5 h-3.5" />
                <span>Call {RESTAURANT_CONFIG.phoneDisplay}</span>
              </a>
              <span className="text-[11px] text-[#8ea098]">Kausar Baug, Mumbra</span>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
