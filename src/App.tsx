/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { ReservationSection } from './components/ReservationSection';
import { LocationSection } from './components/LocationSection';
import { ReviewsSection } from './components/ReviewsSection';
import { Footer } from './components/Footer';
import { MobileNav } from './components/MobileNav';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { AdminPanel } from './components/AdminPanel';
import { Category, MenuItem, Order } from './types/restaurant';
import { subscribeCategories, subscribeMenuItems } from './services/dbService';

function RestaurantApp() {
  // Navigation & Modal States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Real-time Menu Data from Firestore
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // Subscribe to Categories & Menu Items in real-time
  useEffect(() => {
    const unsubCategories = subscribeCategories((cats) => {
      setCategories(cats);
    });

    const unsubMenuItems = subscribeMenuItems((items) => {
      setMenuItems(items);
      setIsLoadingMenu(false);
    });

    // Check URL hash on load (e.g. #admin)
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setIsAdminOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    return () => {
      unsubCategories();
      unsubMenuItems();
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOrderSuccess = (order: Order) => {
    setIsCheckoutOpen(false);
    setCompletedOrder(order);
  };

  return (
    <div className="min-h-screen bg-[#07130e] text-[#f6f3ed] flex flex-col selection:bg-[#d4af37] selection:text-[#091711]">
      {/* Global Restaurant Header */}
      <Header
        onOpenMenu={() => scrollToSection('menu-section')}
        onOpenReserve={() => scrollToSection('reservation-section')}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onNavigateHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        activeView={isAdminOpen ? 'admin' : 'home'}
      />

      {/* Main Content Areas */}
      <main className="flex-grow">
        {/* Hero Banner with Brand Positioning & Direct Actions */}
        <Hero
          onExploreMenu={() => scrollToSection('menu-section')}
          onOrderNow={() => scrollToSection('menu-section')}
          onReserveTable={() => scrollToSection('reservation-section')}
        />

        {/* Database-driven Menu with Live Search, Portion Selector & Filtering */}
        <MenuSection
          categories={categories}
          menuItems={menuItems}
          isLoading={isLoadingMenu}
        />

        {/* Table Reservation Module with Real Firestore Sync */}
        <ReservationSection />

        {/* Restaurant Highlights & Customer Reviews */}
        <ReviewsSection />

        {/* Verified Location, Opening Hours & Google Maps Triggers */}
        <LocationSection />
      </main>

      {/* Complete Footer */}
      <Footer
        onNavigateHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onOpenMenu={() => scrollToSection('menu-section')}
        onOpenReserve={() => scrollToSection('reservation-section')}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Floating Production-Grade WhatsApp Button */}
      <FloatingWhatsAppButton />

      {/* Persistent Mobile Bottom Navigation */}
      <MobileNav
        onOpenMenu={() => scrollToSection('menu-section')}
        onOpenReserve={() => scrollToSection('reservation-section')}
        onNavigateHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        activeView={isAdminOpen ? 'admin' : 'home'}
      />

      {/* Interactive Cart Slide-over Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Form Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Confirmation & WhatsApp Tracker Modal */}
      <OrderConfirmationModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
        onViewMenu={() => scrollToSection('menu-section')}
      />

      {/* Full Admin Management Portal (Protected with Firebase Auth) */}
      {isAdminOpen && (
        <AdminPanel
          onClose={() => {
            setIsAdminOpen(false);
            if (window.location.hash === '#admin') {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <RestaurantApp />
    </CartProvider>
  );
}
