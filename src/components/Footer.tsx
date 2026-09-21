import React from 'react';
import { UtensilsCrossed, Phone, MapPin, Clock, MessageCircle, Shield, Heart } from 'lucide-react';

interface FooterProps {
  onNavigateHome: () => void;
  onOpenMenu: () => void;
  onOpenReserve: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateHome,
  onOpenMenu,
  onOpenReserve,
  onOpenAdmin,
}) => {
  return (
    <footer id="main-footer" className="bg-[#050e0a] border-t border-[#224d3b] text-[#c8c0b2] pt-14 pb-20 md:pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#15382a] border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-lg font-bold text-[#f6f3ed] tracking-wider block">
                  HOT WOK ASIAN CUISINE
                </span>
                <span className="text-[10px] text-[#d4af37] uppercase tracking-widest font-semibold">
                  Where Flavour Meets Fusion
                </span>
              </div>
            </div>

            <p className="text-[#8ea098] leading-relaxed">
              Mumbra's premier Asian fusion destination. Bringing authentic Chinese, Korean, Malaysian, and Thai recipes together with grand celebration Kepsa platters and sizzling wok delicacies.
            </p>

            <div className="flex items-center space-x-2 text-[11px] text-[#d4af37]">
              <span>Chinese</span>
              <span>•</span>
              <span>Korean</span>
              <span>•</span>
              <span>Malaysian</span>
              <span>•</span>
              <span>Thai</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#f6f3ed] uppercase tracking-wider text-[#d4af37]">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={onNavigateHome} className="hover:text-[#d4af37] transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={onOpenMenu} className="hover:text-[#d4af37] transition-colors">
                  Explore Menu
                </button>
              </li>
              <li>
                <button onClick={onOpenReserve} className="hover:text-[#d4af37] transition-colors">
                  Reserve Table
                </button>
              </li>
              <li>
                <a href="#location-section" className="hover:text-[#d4af37] transition-colors">
                  Location & Hours
                </a>
              </li>
              <li>
                <button onClick={onOpenAdmin} className="hover:text-[#d4af37] transition-colors flex items-center space-x-1 text-[#d4af37]/80">
                  <Shield className="w-3 h-3" />
                  <span>Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Categories */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#f6f3ed] uppercase tracking-wider text-[#d4af37]">
              Signatures
            </h4>
            <ul className="space-y-1.5 text-[#8ea098]">
              <li>Hot Wok Special Chicken Kepsa</li>
              <li>Dragon Chicken Sizzler</li>
              <li>Korean Gochujang Sticky Wings</li>
              <li>Chicken Triple Schezwan Rice</li>
              <li>Malaysian Coconut Curry Laksa</li>
              <li>Thai Basil Chilli Wok Paneer</li>
            </ul>
          </div>

          {/* Col 4: Location & Direct Contact */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#f6f3ed] uppercase tracking-wider text-[#d4af37]">
              Contact & Hours
            </h4>
            <div className="space-y-2.5 text-[#8ea098]">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                <span className="text-[#f6f3ed]">
                  Shop No. A/1, Urban Empire, Mittal Ground, Opposite Sonaji Nagar, Kausar Baug, Mumbra, Thane 400612
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                <a href="tel:9987974833" className="hover:text-[#d4af37] font-semibold text-[#f6f3ed]">
                  +91 99879 74833
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                <span>Open Daily: 12:00 PM – 12:00 AM</span>
              </div>
              <div className="pt-2">
                <a
                  href="https://wa.me/919987974833"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-[#15382a] text-[#d4af37] border border-[#224d3b] hover:border-[#d4af37] text-xs font-semibold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Direct</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-[#224d3b]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#8ea098]">
          <p>© {new Date().getFullYear()} Hot Wok Asian Cuisine. All rights reserved.</p>
          <p className="flex items-center space-x-1">
            <span>Crafted with pride for food lovers in Mumbra & Thane</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
